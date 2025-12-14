import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from './cart.service';
import { Order } from '../models/order';

const ORDERS_KEY = 'computer-store-orders';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersSignal = signal<Order[]>(this.restoreOrders());

  readonly orders = computed(() => this.ordersSignal());
  readonly totalRevenue = computed(() => this.ordersSignal().reduce((sum, order) => sum + order.total, 0));

  createOrder(customer: { name: string; email: string; address: string }, items: CartItem[]): Order {
    const id = Math.max(0, ...this.ordersSignal().map((o) => o.id)) + 1;
    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const newOrder: Order = {
      id,
      customerName: customer.name,
      customerEmail: customer.email,
      address: customer.address,
      total,
      createdAt: new Date().toISOString(),
      status: 'pending',
      items: items.map((item) => ({ product: item.product, quantity: item.quantity }))
    };

    this.ordersSignal.update((orders) => [...orders, newOrder]);
    this.persist();
    return newOrder;
  }

  updateStatus(id: number, status: Order['status']): void {
    this.ordersSignal.update((orders) => orders.map((order) => (order.id === id ? { ...order, status } : order)));
    this.persist();
  }

  forecastNextMonth(): { expectedOrders: number; projectedRevenue: number } {
    const lastOrders = this.ordersSignal().slice(-5);
    const average = lastOrders.reduce((sum, order) => sum + order.total, 0) / (lastOrders.length || 1);
    return {
      expectedOrders: Math.max(5, lastOrders.length * 2),
      projectedRevenue: Math.round(average * Math.max(5, lastOrders.length * 2))
    };
  }

  private restoreOrders(): Order[] {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? (JSON.parse(stored) as Order[]) : [];
  }

  private persist(): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(this.ordersSignal()));
  }
}
