import { Injectable, computed, signal } from '@angular/core';
import { Message } from '../models/message';

const STORAGE_KEY = 'computer-store-messages';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly messagesSignal = signal<Message[]>(this.restore());

  readonly messages = computed(() => this.messagesSignal());

  send(message: Omit<Message, 'id' | 'createdAt'>): void {
    const id = Math.max(0, ...this.messagesSignal().map((m) => m.id)) + 1;
    const newMessage: Message = { ...message, id, createdAt: new Date().toISOString() };
    this.messagesSignal.update((list) => [...list, newMessage]);
    this.persist();
  }

  forProduct(productId: number): Message[] {
    return this.messagesSignal().filter((m) => m.productId === productId);
  }

  forOrder(orderId: number): Message[] {
    return this.messagesSignal().filter((m) => m.orderId === orderId);
  }

  private restore(): Message[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Message[]) : [];
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messagesSignal()));
  }
}
