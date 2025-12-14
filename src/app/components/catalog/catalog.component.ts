import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly filters = this.fb.nonNullable.group({
    term: [''],
    category: ['']
  });

  constructor() {
    const queryTerm = this.route.snapshot.queryParamMap.get('term');
    if (queryTerm) {
      this.filters.patchValue({ term: queryTerm });
    }
    this.productService.reload(queryTerm ?? undefined);
    this.filters.valueChanges.subscribe(({ term, category }) =>
      this.productService.reload(term, category || undefined)
    );
  }

  get viewer(): User | null {
    return this.auth.currentUser();
  }

  get products(): Product[] {
    return this.productService.visibleProducts();
  }

  get categories(): string[] {
    return this.productService.categories();
  }
}
