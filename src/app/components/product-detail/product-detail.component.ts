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

  readonly product: Product | undefined = this.productService.getById(
    Number(this.route.snapshot.paramMap.get('id'))
  );

  readonly messageForm = this.fb.nonNullable.group({
    text: ['', Validators.required]
  });

  readonly deliveryChoice = signal<'pickup' | 'delivery'>('pickup');

  get isOwner(): boolean {
    const current = this.auth.currentUser();
    return !!current && !!this.product && this.product.ownerId === current.id;
  }

  get canModerate(): boolean {
    return this.isOwner || this.auth.isManager();
  }

  get canAddToCart(): boolean {
    return this.auth.isAuthenticated();
  }

  addToCart(): void {
    if (this.product && this.canAddToCart) {
      this.cart.add(this.product);
    }
  }

  toggleVisibility(): void {
    if (this.product && this.canModerate) {
      this.productService.toggleHidden(this.product.id, !this.product.hidden);
    }
  }

  sendMessage(): void {
    if (this.messageForm.invalid || !this.product) return;
    const current = this.auth.currentUser();
    const receiverId = this.product.ownerId;
    this.messages.send({
      fromUserId: current?.id ?? null,
      toUserId: receiverId,
      productId: this.product.id,
      text: this.messageForm.getRawValue().text
    });
    this.messageForm.reset();
  }
}
