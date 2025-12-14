import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required]
  });

  readonly confirmation = signal<string | null>(null);
  readonly deliverySelection = signal<Record<number, 'pickup' | 'delivery'>>({});
  readonly error = signal<string | null>(null);

  constructor() {
    const current = this.auth.currentUser();
    if (current) {
      this.form.patchValue({ name: current.name, email: current.email, address: current.address ?? '' });
    }
  }

  get total() {
    return this.items.reduce((sum, item) => {
      const mode = this.deliverySelection()[item.product.id] ?? 'pickup';
      const delivery = mode === 'delivery' ? item.product.deliveryPrice || 0 : 0;
      return sum + item.quantity * item.product.price + delivery;
    }, 0);
  }

  get items() {
    return this.cart.items();
  }

  chooseMode(productId: number, mode: 'pickup' | 'delivery'): void {
    this.deliverySelection.update((current) => ({ ...current, [productId]: mode }));
  }

  defaultMode(productId: number, deliveryMode: 'pickup' | 'delivery' | 'any'): 'pickup' | 'delivery' {
    const stored = this.deliverySelection()[productId];
    if (stored) return stored;
    if (deliveryMode === 'delivery') return 'delivery';
    return 'pickup';
  }

  submit(): void {
    this.error.set(null);
    if (this.form.invalid || !this.items.length) {
      this.form.markAllAsTouched();
      return;
    }

    const buyer = this.auth.currentUser();
    if (!buyer) {
      this.error.set('Авторизуйтесь, чтобы оформить заказ.');
      return;
    }

    const itemsWithDelivery = this.items.map((item) => ({
      ...item,
      deliveryMode: this.defaultMode(item.product.id, item.product.deliveryMode)
    }));

    const order = this.orders.createOrder(buyer, itemsWithDelivery, this.form.getRawValue());
    this.cart.clear();
    this.confirmation.set(`Заказ №${order.id} оформлен. Мы отправили подтверждение на ${order.customerEmail}.`);
  }
}
