import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product';

export interface CartItem {
  product: Product;
  quantity: number;
}

const CART_KEY = 'computer-store-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.restoreCart());

  readonly items = computed(() => this.itemsSignal());
  readonly total = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.quantity * item.product.price, 0)
  );

  add(product: Product, quantity = 1): void {
    this.itemsSignal.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...items, { product, quantity }];
    });
    this.persist();
  }

  updateQuantity(productId: number, quantity: number): void {
    this.itemsSignal.update((items) =>
      items
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: Math.max(quantity, 1) } : item
        )
        .filter((item) => item.quantity > 0)
    );
    this.persist();
  }

  remove(productId: number): void {
    this.itemsSignal.update((items) => items.filter((item) => item.product.id !== productId));
    this.persist();
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.persist();
  }

  private restoreCart(): CartItem[] {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  }

  private persist(): void {
    localStorage.setItem(CART_KEY, JSON.stringify(this.itemsSignal()));
  }
}
