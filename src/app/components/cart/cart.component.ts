import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  private readonly cart = inject(CartService);

  readonly displayedColumns = ['name', 'price', 'quantity', 'total', 'actions'];

  get items() {
    return this.cart.items();
  }

  get total() {
    return this.cart.total();
  }

  updateQuantity(id: number, value: string): void {
    const qty = Number(value);
    if (!isNaN(qty)) {
      this.cart.updateQuantity(id, qty);
    }
  }

  remove(id: number): void {
    this.cart.remove(id);
  }
}
