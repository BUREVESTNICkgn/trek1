import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CartItem } from './cart.service';
import { Order, OrderStatus } from '../models/order';
import { User } from '../models/user';

const SESSION_KEY = 'computer-store-session-token';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = '/api';
  private readonly http = inject(HttpClient);

  private readonly ordersSignal = signal<Order[]>([]);

  readonly orders = computed(() => this.ordersSignal());
  readonly totalRevenue = computed(() => this.ordersSignal().reduce((sum, order) => sum + order.total, 0));

  constructor() {
    this.refresh();
  }

  private authOptions() {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  async refresh(): Promise<void> {
    try {
      const list = await firstValueFrom(this.http.get<Order[]>(`${this.api}/orders`, this.authOptions()));
      this.ordersSignal.set(list);
    } catch (e) {
      this.ordersSignal.set([]);
    }
  }

  async createOrder(
    buyer: User,
    items: (CartItem & { deliveryMode: 'pickup' | 'delivery' })[],
    contact: { name: string; email: string; address: string }
  ): Promise<Order> {
    const payload = {
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
    };
    const order = await firstValueFrom(
      this.http.post<Order>(`${this.api}/orders`, payload, this.authOptions())
    );
    this.ordersSignal.update((orders) => [order, ...orders]);
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<void> {
    const updated = await firstValueFrom(
      this.http.patch<Order>(`${this.api}/orders/${id}/status`, { status }, this.authOptions())
    );
    this.ordersSignal.update((orders) => orders.map((order) => (order.id === id ? updated : order)));
  }

  forecastNextMonth(): { expectedOrders: number; projectedRevenue: number } {
    const lastOrders = this.ordersSignal().slice(-5);
    const average = lastOrders.reduce((sum, order) => sum + order.total, 0) / (lastOrders.length || 1);
    return {
      expectedOrders: Math.max(5, lastOrders.length * 2),
      projectedRevenue: Math.round(average * Math.max(5, lastOrders.length * 2))
    };
  }

  ordersForUser(user: User): Order[] {
    if (user.role === 'admin' || user.role === 'manager') return this.ordersSignal();
    return this.ordersSignal().filter((order) => order.buyerId === user.id);
  }
}
