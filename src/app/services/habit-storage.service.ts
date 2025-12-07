import { Injectable, signal } from '@angular/core';
import { Habit } from '../models/habit';

type WebSqlDatabase = {
  transaction(callback: (tx: WebSqlTransaction) => void): void;
};

type WebSqlTransaction = {
  executeSql(
    sql: string,
    params: (string | number | null | undefined)[],
    successCallback: (tx: WebSqlTransaction, result: WebSqlResultSet) => void,
    errorCallback?: (tx: WebSqlTransaction, error: SQLError) => boolean | void
  ): void;
};

type WebSqlResultSet = {
  insertId?: number;
  rowsAffected: number;
  rows: {
    length: number;
    item: (index: number) => unknown;
  };
};

type SQLError = { code: number; message: string };

type HabitRow = {
  id: number;
  title: string;
  description: string;
  frequency: string;
  createdAt: string;
  completedToday: number;
};

declare function openDatabase(
  name: string,
  version: string,
  displayName: string,
  estimatedSize: number
): WebSqlDatabase;

@Injectable({ providedIn: 'root' })
export class HabitStorageService {
  private readonly storageKey = 'habit-tracker-habits';
  private readonly dbName = 'habit-tracker-db';
  private readonly fallbackHabits: Habit[] = [
    {
      id: 1,
      title: 'Не сплетничайте с коллегами на работе',
      description: 'Фокусируйтесь на конструктивном общении и обсуждении задач.',
      frequency: 'Каждый день',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 2,
      title: 'Сделайте одно действие по текущей задаче',
      description: 'Каждый день продвигайте ключевую задачу хотя бы на один шаг.',
      frequency: 'Каждый день',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 3,
      title: 'Уборка рабочего места в конце дня',
      description: 'Приводите стол в порядок и готовьте пространство к следующему дню.',
      frequency: 'По будням',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 4,
      title: 'Сделайте несколько деловых звонков',
      description: 'Запланируйте и выполните созвоны по проектам и партнёрам.',
      frequency: '2-3 раза в неделю',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 5,
      title: 'Ответьте на деловые письма',
      description: 'Разберите входящие и отправьте ответы на важные письма.',
      frequency: 'Каждый день',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 6,
      title: 'Сходите на встречу',
      description: 'Выделите время на встречи с командой или заказчиками.',
      frequency: 'По расписанию',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 7,
      title: 'Просматривайте заметки и повторяйте информацию',
      description: 'Освежайте знания, возвращаясь к заметкам и конспектам.',
      frequency: 'Каждый день',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 8,
      title: 'Представьте идею на встрече',
      description: 'Поделитесь улучшением или предложением с командой.',
      frequency: 'Раз в неделю',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 9,
      title: 'Выделите пять минут на улучшения процессов',
      description: 'Короткая рефлексия о том, что можно сделать лучше.',
      frequency: 'Каждый день',
      createdAt: new Date().toISOString(),
      completedToday: false
    },
    {
      id: 10,
      title: 'Напишите аннотации к обучающим видео',
      description: 'Составьте конспект после просмотра профессиональных видео.',
      frequency: 'После каждого просмотра',
      createdAt: new Date().toISOString(),
      completedToday: false
    }
  ];

  private readonly habitsSignal = signal<Habit[]>([]);
  readonly habits = this.habitsSignal.asReadonly();

  private readonly webSqlDb = this.openWebSqlDatabase();

  constructor() {
    if (this.webSqlDb) {
      this.initializeWebSql();
    } else {
      this.habitsSignal.set(this.loadFromLocalStorage());
    }
  }

  addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'completedToday'>): void {
    if (this.webSqlDb) {
      const createdAt = new Date().toISOString();
      this.executeSql(
        'INSERT INTO habits (title, description, frequency, createdAt, completedToday) VALUES (?, ?, ?, ?, 0)',
        [habit.title, habit.description, habit.frequency, createdAt]
      ).then(() => this.refreshFromDb());
      return;
    }

    const newHabit: Habit = {
      ...habit,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      completedToday: false
    };
    this.updateHabits([...this.habitsSignal(), newHabit]);
  }

  updateHabit(id: number, changes: Partial<Habit>): void {
    if (this.webSqlDb) {
      this.executeSql(
        'UPDATE habits SET title = ?, description = ?, frequency = ? WHERE id = ?',
        [changes.title, changes.description, changes.frequency, id]
      ).then(() => this.refreshFromDb());
      return;
    }

    const updated = this.habitsSignal().map((habit) =>
      habit.id === id ? { ...habit, ...changes } : habit
    );
    this.updateHabits(updated);
  }

  removeHabit(id: number): void {
    if (this.webSqlDb) {
      this.executeSql('DELETE FROM habits WHERE id = ?', [id]).then(() => this.refreshFromDb());
      return;
    }

    this.updateHabits(this.habitsSignal().filter((habit) => habit.id !== id));
  }

  toggleCompleted(id: number): void {
    if (this.webSqlDb) {
      this.executeSql(
        'UPDATE habits SET completedToday = CASE completedToday WHEN 1 THEN 0 ELSE 1 END WHERE id = ?',
        [id]
      ).then(() => this.refreshFromDb());
      return;
    }

    this.updateHabit(
      id,
      { completedToday: !this.habitsSignal().find((habit) => habit.id === id)?.completedToday }
    );
  }

  resetCompletion(): void {
    if (this.webSqlDb) {
      this.executeSql('UPDATE habits SET completedToday = 0').then(() => this.refreshFromDb());
      return;
    }

    this.updateHabits(this.habitsSignal().map((habit) => ({ ...habit, completedToday: false })));
  }

  private updateHabits(habits: Habit[]): void {
    this.habitsSignal.set(habits);
    this.save(habits);
  }

  private loadFromLocalStorage(): Habit[] {
    const stored = this.readFromStorage();
    return stored.length ? stored : this.fallbackHabits;
  }

  private readFromStorage(): Habit[] {
    try {
      const raw = globalThis.localStorage?.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Habit[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Не удалось загрузить данные из localStorage', error);
      return [];
    }
  }

  private save(habits: Habit[]): void {
    try {
      globalThis.localStorage?.setItem(this.storageKey, JSON.stringify(habits));
    } catch (error) {
      console.warn('Не удалось сохранить данные в localStorage', error);
    }
  }

  private openWebSqlDatabase(): WebSqlDatabase | null {
    if (typeof openDatabase !== 'function') {
      return null;
    }

    try {
      return openDatabase(this.dbName, '1.0', 'База данных привычек', 2 * 1024 * 1024);
    } catch (error) {
      console.warn('WebSQL недоступен, используется localStorage', error);
      return null;
    }
  }

  private initializeWebSql(): void {
    if (!this.webSqlDb) return;

    this.executeSql(
      'CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL, frequency TEXT NOT NULL, createdAt TEXT NOT NULL, completedToday INTEGER NOT NULL DEFAULT 0)'
    )
      .then(() => this.ensureSeeds())
      .then(() => this.refreshFromDb())
      .catch((error) => console.warn('Ошибка инициализации WebSQL', error));
  }

  private async ensureSeeds(): Promise<void> {
    if (!this.webSqlDb) return;

    const countResult = await this.executeSql('SELECT COUNT(*) as total FROM habits');
    const total = (countResult.rows.item(0) as { total: number }).total;
    if (total > 0) return;

    for (const habit of this.fallbackHabits) {
      await this.executeSql(
        'INSERT INTO habits (title, description, frequency, createdAt, completedToday) VALUES (?, ?, ?, ?, 0)',
        [habit.title, habit.description, habit.frequency, habit.createdAt]
      );
    }
  }

  private async refreshFromDb(): Promise<void> {
    if (!this.webSqlDb) return;

    const result = await this.executeSql(
      'SELECT id, title, description, frequency, createdAt, completedToday FROM habits ORDER BY id ASC'
    );
    const habits: Habit[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i) as HabitRow;
      habits.push({
        id: row.id,
        title: row.title,
        description: row.description,
        frequency: row.frequency,
        createdAt: row.createdAt,
        completedToday: Boolean(row.completedToday)
      });
    }
    this.habitsSignal.set(habits);
  }

  private executeSql(query: string, params: (string | number | null | undefined)[] = []): Promise<WebSqlResultSet> {
    return new Promise((resolve, reject) => {
      this.webSqlDb?.transaction((tx: WebSqlTransaction) => {
        tx.executeSql(
          query,
          params,
          (_tx: WebSqlTransaction, result: WebSqlResultSet) => resolve(result),
          (_tx: WebSqlTransaction, error: SQLError) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  private generateId(): number {
    const maxId = this.habitsSignal().reduce((max, habit) => Math.max(max, habit.id), 0);
    return maxId + 1;
  }
}
