import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Message } from '../models/message';

const SESSION_KEY = 'computer-store-session-token';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly api = '/api';
  private readonly http = inject(HttpClient);

  private readonly messagesSignal = signal<Message[]>([]);

  readonly messages = computed(() => this.messagesSignal());

  private authOptions() {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  async load(): Promise<void> {
    try {
      const list = await firstValueFrom(this.http.get<Message[]>(`${this.api}/messages`, this.authOptions()));
      this.messagesSignal.set(list);
    } catch (e) {
      this.messagesSignal.set([]);
    }
  }

  async send(message: Omit<Message, 'id' | 'createdAt'>): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<Message>(`${this.api}/messages`, message, this.authOptions())
    );
    this.messagesSignal.update((list) => [created, ...list]);
  }

  forProduct(productId: number): Message[] {
    return this.messagesSignal().filter((m) => m.productId === productId);
  }

  forOrder(orderId: number): Message[] {
    return this.messagesSignal().filter((m) => m.orderId === orderId);
  }
}
