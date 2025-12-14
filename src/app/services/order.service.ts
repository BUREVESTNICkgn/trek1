import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from './cart.service';
import { Order, OrderStatus } from '../models/order';
import { User } from '../models/user';

const ORDERS_KEY = 'computer-store-orders';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersSignal = signal<Order[]>(this.restoreOrders());

  readonly orders = computed(() => this.ordersSignal());
  readonly totalRevenue = computed(() => this.ordersSignal().reduce((sum, order) => sum + order.total, 0));

  createOrder(
    buyer: User,
    items: (CartItem & { deliveryMode: 'pickup' | 'delivery' })[],
    contact: { name: string; email: string; address: string }
  ): Order {
    const id = Math.max(0, ...this.ordersSignal().map((o) => o.id)) + 1;
    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity + (item.deliveryMode === 'delivery' ? item.product.deliveryPrice || 0 : 0),
      0
    );
    const newOrder: Order = {
      id,
      buyerId: buyer.id,
      customerName: contact.name,
      customerEmail: contact.email,
      address: contact.address,
      total,
      createdAt: new Date().toISOString(),
      status: 'created',
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        deliveryMode: item.deliveryMode,
        deliveryPrice: item.deliveryMode === 'delivery' ? item.product.deliveryPrice || 0 : 0
      }))
    };

    this.ordersSignal.update((orders) => [...orders, newOrder]);
    this.persist();
    return newOrder;
  }

  updateStatus(id: number, status: OrderStatus): void {
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

  ordersForUser(user: User): Order[] {
    if (user.role === 'admin' || user.role === 'manager') return this.ordersSignal();
    return this.ordersSignal().filter((order) => order.buyerId === user.id);
  }

  private restoreOrders(): Order[] {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? (JSON.parse(stored) as Order[]) : [];
  }

  private persist(): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(this.ordersSignal()));
  }
}
