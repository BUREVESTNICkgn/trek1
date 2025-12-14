import { Injectable, computed, signal } from '@angular/core';
import { User, UserRole } from '../models/user';

const STORAGE_KEY = 'computer-store-users';
const SESSION_KEY = 'computer-store-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersSignal = signal<User[]>(this.restoreUsers());
  private readonly currentUserSignal = signal<User | null>(this.restoreSession());

  readonly users = computed(() => this.usersSignal());
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly role = computed<UserRole | 'notauth'>(() => this.currentUserSignal()?.role ?? 'notauth');
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isManager = computed(
    () => this.currentUserSignal()?.role === 'manager' || this.currentUserSignal()?.role === 'admin'
  );

  register(user: Omit<User, 'id' | 'role'> & { role?: UserRole }): void {
    const emailExists = this.usersSignal().some((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (emailExists) {
      throw new Error('Пользователь с такой почтой уже существует');
    }
    const id = Math.max(0, ...this.usersSignal().map((u) => u.id)) + 1;
    const newUser: User = { id, role: user.role ?? 'user', ...user };
    this.usersSignal.update((users) => [...users, newUser]);
    this.persistUsers();
    this.login(user.email, user.password);
  }

  addUser(fromAdmin: User, user: Omit<User, 'id'>): void {
    if (fromAdmin.role !== 'admin') throw new Error('Недостаточно прав');
    const emailExists = this.usersSignal().some((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (emailExists) {
      throw new Error('Пользователь с такой почтой уже существует');
    }
    const id = Math.max(0, ...this.usersSignal().map((u) => u.id)) + 1;
    this.usersSignal.update((users) => [...users, { ...user, id }]);
    this.persistUsers();
  }

  updateProfile(changes: Partial<Pick<User, 'name' | 'address'>>): void {
    const current = this.currentUserSignal();
    if (!current) return;
    this.usersSignal.update((users) => users.map((u) => (u.id === current.id ? { ...u, ...changes } : u)));
    const updated = { ...current, ...changes } as User;
    this.currentUserSignal.set(updated);
    this.persistUsers();
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }

  updateRole(userId: number, role: UserRole): void {
    this.usersSignal.update((users) => users.map((u) => (u.id === userId ? { ...u, role } : u)));
    if (this.currentUserSignal()?.id === userId) {
      const updated = { ...this.currentUserSignal()!, role } as User;
      this.currentUserSignal.set(updated);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
    this.persistUsers();
  }

  login(email: string, password: string): void {
    const user = this.usersSignal().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      throw new Error('Неверный логин или пароль');
    }
    this.currentUserSignal.set(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private restoreUsers(): User[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as User[];
    const demoUsers: User[] = [
      {
        id: 1,
        name: 'Администратор',
        email: 'admin@computer.store',
        password: 'admin',
        role: 'admin',
        address: 'Москва, Цветной бульвар'
      },
      {
        id: 2,
        name: 'Менеджер',
        email: 'manager@computer.store',
        password: 'manager',
        role: 'manager',
        address: 'Санкт-Петербург, Невский проспект'
      },
      {
        id: 3,
        name: 'Антон',
        email: 'user@computer.store',
        password: 'user',
        role: 'user',
        address: 'Екатеринбург, Малышева 20'
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUsers));
    return demoUsers;
  }

  private restoreSession(): User | null {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  }

  private persistUsers(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.usersSignal()));
  }
}
