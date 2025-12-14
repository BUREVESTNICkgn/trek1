import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);

  readonly brand = signal('Компьютер');
  readonly cartSize = computed(() => this.cart.items().reduce((sum, item) => sum + item.quantity, 0));

  get isAuthenticated() {
    return this.auth.isAuthenticated();
  }

  get isAdmin() {
    return this.auth.isAdmin();
  }

  logout(): void {
    this.auth.logout();
  }
}
