import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DeliveryMode, Product } from '../models/product';
import { User } from '../models/user';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api';

  private readonly productsSignal = signal<Product[]>([]);
  private readonly categoriesSignal = signal<string[]>([]);

  readonly products = computed(() => this.productsSignal());
  readonly categories = computed(() => this.categoriesSignal());

  constructor() {
    this.reload();
    this.loadCategories();
  }

  visibleProducts(): Product[] {
    return this.productsSignal();
  }

  async reload(term?: string, category?: string): Promise<void> {
    const params: Record<string, string> = {};
    if (term) params['term'] = term;
    if (category) params['category'] = category;
    const list = await firstValueFrom(this.http.get<Product[]>(`${this.api}/products`, { params }));
    this.productsSignal.set(list);
  }

  async search(term: string, category?: string): Promise<Product[]> {
    await this.reload(term, category);
    return this.productsSignal();
  }

  getById(id: number): Product | undefined {
    return this.productsSignal().find((product) => product.id === id);
  }

  async loadById(id: number): Promise<Product | undefined> {
    const product = await firstValueFrom(this.http.get<Product>(`${this.api}/products/${id}`));
    const updated = this.productsSignal().filter((p) => p.id !== id);
    this.productsSignal.set([product, ...updated]);
    return product;
  }

  async addProduct(product: Omit<Product, 'id' | 'rating' | 'createdAt' | 'hidden' | 'photos'> & { photos: string[] }): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<Product>(`${this.api}/products`, { ...product, hidden: 0 })
    );
    this.productsSignal.update((list) => [created, ...list]);
  }

  async updateProduct(id: number, changes: Partial<Omit<Product, 'id'>>): Promise<void> {
    const updated = await firstValueFrom(
      this.http.put<Product>(`${this.api}/products/${id}`, changes)
    );
    this.productsSignal.update((products) => products.map((product) => (product.id === id ? updated : product)));
  }

  listByOwner(ownerId: number): Product[] {
    return this.productsSignal().filter((p) => p.ownerId === ownerId);
  }

  async toggleHidden(id: number, hidden: boolean): Promise<void> {
    const updated = await firstValueFrom(
      this.http.post<Product>(`${this.api}/products/${id}/visibility`, { hidden })
    );
    this.productsSignal.update((products) => products.map((p) => (p.id === id ? updated : p)));
  }

  async setDeliveryMode(id: number, mode: DeliveryMode, deliveryPrice?: number): Promise<void> {
    await this.updateProduct(id, { deliveryMode: mode, deliveryPrice });
  }

  private async loadCategories(): Promise<void> {
    const cats = await firstValueFrom(this.http.get<string[]>(`${this.api}/categories`));
    this.categoriesSignal.set(cats);
  }
}
