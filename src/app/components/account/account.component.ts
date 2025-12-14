import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { User } from '../../models/user';
import { DeliveryMode, Product } from '../../models/product';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatSlideToggleModule,
    DatePipe
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly products = inject(ProductService);
  private readonly orders = inject(OrderService);

  readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    address: ['']
  });

  readonly listingForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    price: [0, Validators.required],
    stock: [1, Validators.required],
    photos: [''],
    description: ['', Validators.required],
    specs: ['', Validators.required],
    location: ['', Validators.required],
    deliveryMode: ['any' as DeliveryMode, Validators.required],
    deliveryPrice: [0]
  });

  readonly availableCategories = computed(() => this.products.categories());

  constructor() {
    const current = this.auth.currentUser();
    if (current) {
      this.profileForm.patchValue({ name: current.name, address: current.address ?? '' });
    }
  }

  get currentUser(): User | null {
    return this.auth.currentUser();
  }

  get myProducts(): Product[] {
    const user = this.currentUser;
    if (!user) return [];
    return this.products.listByOwner(user.id);
  }

  get myOrders() {
    const user = this.currentUser;
    if (!user) return [];
    return this.orders.ordersForUser(user);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.auth.updateProfile(this.profileForm.getRawValue());
  }

  addListing(): void {
    if (this.listingForm.invalid || !this.currentUser) {
      this.listingForm.markAllAsTouched();
      return;
    }
    const { photos, specs, deliveryMode, deliveryPrice, ...rest } = this.listingForm.getRawValue();
    const parsedPhotos = photos
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p);
    const parsedSpecs = specs
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);

    this.products.addProduct({
      ...rest,
      specs: parsedSpecs,
      photos: parsedPhotos.length ? parsedPhotos : ['https://source.unsplash.com/random/800x600?computer'],
      deliveryMode,
      deliveryPrice: deliveryMode === 'pickup' ? undefined : deliveryPrice ?? 0,
      ownerId: this.currentUser.id,
      rating: 4.7
    });
    this.listingForm.reset({ price: 0, stock: 1, deliveryMode: 'any', deliveryPrice: 0 });
  }

  toggleListing(product: Product, hidden: boolean): void {
    this.products.toggleHidden(product.id, hidden);
  }

  bumpStock(product: Product, delta: number): void {
    const next = Math.max(0, product.stock + delta);
    this.products.updateProduct(product.id, { stock: next });
  }

  updateDelivery(product: Product, mode: DeliveryMode): void {
    this.products.setDeliveryMode(product.id, mode, product.deliveryPrice);
  }
}
