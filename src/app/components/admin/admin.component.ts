import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/product';
import { User, UserRole } from '../../models/user';
import { OrderStatus } from '../../models/order';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatTabsModule,
    DatePipe
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly products = inject(ProductService);
  private readonly orders = inject(OrderService);

  readonly userForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: ['manager' as UserRole],
    address: ['']
  });

  readonly statusList: OrderStatus[] = ['created', 'processing', 'shipped', 'done', 'cancelled'];

  readonly productList = computed(() => this.products.products());
  readonly orderList = computed(() => this.orders.orders());

  get currentUser(): User | null {
    return this.auth.currentUser();
  }

  get forecast() {
    return this.orders.forecastNextMonth();
  }

  toggleHidden(product: Product): void {
    this.products.toggleHidden(product.id, !product.hidden);
  }

  updateStatus(id: number, status: OrderStatus): void {
    this.orders.updateStatus(id, status);
  }

  async addUser(): Promise<void> {
    if (this.userForm.invalid || !this.currentUser) {
      this.userForm.markAllAsTouched();
      return;
    }
    await this.auth.addUser(this.currentUser, this.userForm.getRawValue());
    this.userForm.reset({ role: 'manager' });
  }

  changeRole(user: User, role: UserRole): void {
    this.auth.updateRole(user.id, role);
  }
}
