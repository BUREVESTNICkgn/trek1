import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

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
    MatIconModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required]
  });

  readonly confirmation = signal<string | null>(null);

  get total() {
    return this.cart.total();
  }

  get items() {
    return this.cart.items();
  }

  submit(): void {
    if (this.form.invalid || !this.items.length) {
      this.form.markAllAsTouched();
      return;
    }

    const order = this.orders.createOrder(this.form.getRawValue(), this.items);
    this.cart.clear();
    this.confirmation.set(`Заказ №${order.id} оформлен. Мы отправили подтверждение на ${order.customerEmail}.`);
  }
}
