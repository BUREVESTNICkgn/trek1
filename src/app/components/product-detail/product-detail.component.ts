import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);

  readonly product: Product | undefined = this.productService.getById(
    Number(this.route.snapshot.paramMap.get('id'))
  );

  addToCart(): void {
    if (this.product) {
      this.cart.add(this.product);
    }
  }
}
