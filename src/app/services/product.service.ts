import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productsSignal = signal<Product[]>([
    {
      id: 1,
      name: 'Ноутбук Aurora Pro 15',
      category: 'Ноутбуки',
      price: 119900,
      stock: 8,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      description:
        'Профессиональный ноутбук для разработчиков и дизайнеров с дисплеем 2.8K и автономностью до 12 часов.',
      specs: ['Intel Core i7 14-го поколения', '32 ГБ RAM', '1 ТБ NVMe', 'RTX 4070 8 ГБ']
    },
    {
      id: 2,
      name: 'Игровой ПК Hyperion X',
      category: 'Десктопы',
      price: 179900,
      stock: 5,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
      description: 'Мощная станция для 4K-гейминга и VR с поддержкой трассировки лучей.',
      specs: ['AMD Ryzen 9 7900X', '64 ГБ RAM', '2 ТБ NVMe', 'GeForce RTX 4080 16 ГБ']
    },
    {
      id: 3,
      name: 'Ультрабук ZenLite 14',
      category: 'Ноутбуки',
      price: 82900,
      stock: 12,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
      description: 'Легкий ультрабук для учебы и путешествий с сенсорным экраном.',
      specs: ['Intel Core i5', '16 ГБ RAM', '512 ГБ SSD', 'Вес 1.2 кг']
    },
    {
      id: 4,
      name: 'Рабочая станция Creator Studio',
      category: 'Десктопы',
      price: 209000,
      stock: 3,
      rating: 4.95,
      image: 'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80',
      description: 'Собран для профессионального 3D и монтажа 8K. Максимальная надежность.',
      specs: ['Intel Xeon W7', '128 ГБ ECC', '2x2 ТБ NVMe RAID', 'RTX 6000 Ada']
    },
    {
      id: 5,
      name: 'Моноблок Vision 27',
      category: 'Моноблоки',
      price: 99900,
      stock: 10,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1200&q=80',
      description: 'Изящный моноблок с 5K дисплеем и системой шумоподавления для видеозвонков.',
      specs: ['Intel Core i7', '32 ГБ RAM', '1 ТБ SSD', '27" Retina 5K']
    }
  ]);

  readonly products = computed(() => this.productsSignal());
  readonly categories = computed(() => [...new Set(this.productsSignal().map((p) => p.category))]);

  search(term: string, category?: string): Product[] {
    const lowered = term.toLowerCase();
    return this.productsSignal().filter((product) => {
      const matchesText =
        product.name.toLowerCase().includes(lowered) || product.description.toLowerCase().includes(lowered);
      const matchesCategory = category ? product.category === category : true;
      return matchesText && matchesCategory;
    });
  }

  getById(id: number): Product | undefined {
    return this.productsSignal().find((product) => product.id === id);
  }

  addProduct(product: Omit<Product, 'id' | 'rating'> & { rating?: number }): void {
    const nextId = Math.max(...this.productsSignal().map((p) => p.id)) + 1;
    this.productsSignal.update((products) => [
      ...products,
      {
        ...product,
        id: nextId,
        rating: product.rating ?? 4.5
      }
    ]);
  }

  updateStock(id: number, stock: number): void {
    this.productsSignal.update((products) =>
      products.map((product) => (product.id === id ? { ...product, stock: Math.max(stock, 0) } : product))
    );
  }
}
