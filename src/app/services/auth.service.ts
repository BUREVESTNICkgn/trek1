import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, UserRole } from '../models/user';

const SESSION_KEY = 'computer-store-session-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api';

  private readonly tokenSignal = signal<string | null>(localStorage.getItem(SESSION_KEY));
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly usersSignal = signal<User[]>([]);

  readonly users = computed(() => this.usersSignal());
  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly role = computed<UserRole | 'notauth'>(() => this.currentUserSignal()?.role ?? 'notauth');
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isManager = computed(
    () => this.currentUserSignal()?.role === 'manager' || this.currentUserSignal()?.role === 'admin'
  );

  constructor() {
    this.restoreSession();
  }

  private authOptions() {
    const token = this.tokenSignal();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  private async restoreSession() {
    if (!this.tokenSignal()) return;
    try {
      const user = await firstValueFrom(this.http.get<User>(`${this.api}/auth/me`, this.authOptions()));
      this.currentUserSignal.set(user);
      if (user.role === 'admin') this.loadUsers();
    } catch (e) {
      this.logout();
    }
  }

  async register(user: Omit<User, 'id' | 'role'> & { role?: UserRole }): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ user: User; token: string }>(`${this.api}/auth/register`, user)
    );
    this.persistSession(res.user, res.token);
  }

  async addUser(fromAdmin: User, user: Omit<User, 'id'>): Promise<void> {
    if (fromAdmin.role !== 'admin') throw new Error('Недостаточно прав');
    const added = await firstValueFrom(
      this.http.post<User>(`${this.api}/users`, user, this.authOptions())
    );
    this.usersSignal.update((list) => [...list, added]);
  }

  async updateProfile(changes: Partial<Pick<User, 'name' | 'address'>>): Promise<void> {
    const updated = await firstValueFrom(
      this.http.put<User>(`${this.api}/auth/profile`, changes, this.authOptions())
    );
    this.currentUserSignal.set(updated);
    localStorage.setItem(SESSION_KEY, this.tokenSignal() ?? '');
  }

  async updateRole(userId: number, role: UserRole): Promise<void> {
    const updated = await firstValueFrom(
      this.http.patch<User>(`${this.api}/users/${userId}/role`, { role }, this.authOptions())
    );
    this.usersSignal.update((users) => users.map((u) => (u.id === userId ? updated : u)));
    if (this.currentUserSignal()?.id === userId) {
      this.currentUserSignal.set(updated);
      localStorage.setItem(SESSION_KEY, this.tokenSignal() ?? '');
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<{ user: User; token: string }>(`${this.api}/auth/login`, { email, password })
    );
    this.persistSession(res.user, res.token);
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private persistSession(user: User, token: string): void {
    this.currentUserSignal.set(user);
    this.tokenSignal.set(token);
    localStorage.setItem(SESSION_KEY, token);
    if (user.role === 'admin') this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    const list = await firstValueFrom(this.http.get<User[]>(`${this.api}/users`, this.authOptions()));
    this.usersSignal.set(list);
  }
}
