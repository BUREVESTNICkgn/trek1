import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { Product } from '../../models/product';

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

  readonly newProductForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    price: [0, Validators.required],
    stock: [1, Validators.required],
    image: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'],
    description: ['', Validators.required],
    specs: ['', Validators.required]
  });

  get productList(): Product[] {
    return this.products.products();
  }

  get orderList() {
    return this.orders.orders();
  }

  get forecast() {
    return this.orders.forecastNextMonth();
  }

  addProduct(): void {
    if (this.newProductForm.invalid) {
      this.newProductForm.markAllAsTouched();
      return;
    }

    const { specs, ...rest } = this.newProductForm.getRawValue();
    this.products.addProduct({ ...rest, specs: specs.split(',').map((s) => s.trim()), rating: 4.7 });
    this.newProductForm.reset({ price: 0, stock: 1 });
  }

  updateStatus(id: number, status: 'pending' | 'confirmed' | 'shipped'): void {
    this.orders.updateStatus(id, status);
  }
}
