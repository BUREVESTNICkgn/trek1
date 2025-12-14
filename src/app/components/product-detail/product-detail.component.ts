import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);

  readonly product = signal<Product | null>(null);
  get productValue(): Product | null {
    return this.product();
  }

  readonly messageForm = this.fb.nonNullable.group({
    text: ['', Validators.required]
  });

  readonly deliveryChoice = signal<'pickup' | 'delivery'>('pickup');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService.loadById(id).then((product) => this.product.set(product ?? null));
    this.messages.load();
  }

  get isOwner(): boolean {
    const current = this.auth.currentUser();
    const product = this.product();
    return !!current && !!product && product.ownerId === current.id;
  }

  get canModerate(): boolean {
    return this.isOwner || this.auth.isManager();
  }

  get canAddToCart(): boolean {
    return this.auth.isAuthenticated();
  }

  addToCart(): void {
    const product = this.product();
    if (product && this.canAddToCart) {
      this.cart.add(product);
    }
  }

  toggleVisibility(): void {
    const product = this.product();
    if (product && this.canModerate) {
      this.productService.toggleHidden(product.id, !product.hidden);
    }
  }

  sendMessage(): void {
    const product = this.product();
    if (this.messageForm.invalid || !product) return;
    const current = this.auth.currentUser();
    const receiverId = product.ownerId;
    this.messages.send({
      fromUserId: current?.id ?? null,
      toUserId: receiverId,
      productId: product.id,
      text: this.messageForm.getRawValue().text
    });
    this.messageForm.reset();
  }
}
