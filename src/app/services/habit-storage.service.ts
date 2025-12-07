import { Injectable, signal } from '@angular/core';
import { Habit } from '../models/habit';

@Injectable({ providedIn: 'root' })
export class HabitStorageService {
  private readonly storageKey = 'habit-tracker-habits';
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

  private readonly habitsSignal = signal<Habit[]>(this.load());
  readonly habits = this.habitsSignal.asReadonly();

  addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'completedToday'>): void {
    const newHabit: Habit = {
      ...habit,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      completedToday: false
    };
    this.updateHabits([...this.habitsSignal(), newHabit]);
  }

  updateHabit(id: number, changes: Partial<Habit>): void {
    const updated = this.habitsSignal().map((habit) =>
      habit.id === id ? { ...habit, ...changes } : habit
    );
    this.updateHabits(updated);
  }

  removeHabit(id: number): void {
    this.updateHabits(this.habitsSignal().filter((habit) => habit.id !== id));
  }

  toggleCompleted(id: number): void {
    this.updateHabit(
      id,
      { completedToday: !this.habitsSignal().find((habit) => habit.id === id)?.completedToday }
    );
  }

  resetCompletion(): void {
    this.updateHabits(this.habitsSignal().map((habit) => ({ ...habit, completedToday: false })));
  }

  private updateHabits(habits: Habit[]): void {
    this.habitsSignal.set(habits);
    this.save(habits);
  }

  private load(): Habit[] {
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

  private generateId(): number {
    const maxId = this.habitsSignal().reduce((max, habit) => Math.max(max, habit.id), 0);
    return maxId + 1;
  }
}
