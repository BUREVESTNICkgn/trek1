import { Injectable, computed, signal } from '@angular/core';
import { DeliveryMode, Product } from '../models/product';
import { User } from '../models/user';

const STORAGE_KEY = 'computer-store-products';
const CATEGORIES = [
  'Ноутбуки',
  'ПК',
  'Процессоры',
  'Видеокарты',
  'Материнские платы',
  'Оперативная память',
  'SSD и HDD',
  'Системы охлаждения',
  'Мониторы',
  'Периферия'
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productsSignal = signal<Product[]>(this.restoreProducts());

  readonly products = computed(() => this.productsSignal());
  readonly categories = computed(() => Array.from(new Set([...CATEGORIES, ...this.productsSignal().map((p) => p.category)])));

  visibleProducts(viewer: User | null): Product[] {
    if (viewer?.role === 'admin' || viewer?.role === 'manager') return this.productsSignal();
    if (viewer?.id) {
      return this.productsSignal().filter((p) => !p.hidden || p.ownerId === viewer.id);
    }
    return this.productsSignal().filter((p) => !p.hidden);
  }

  search(term: string, category?: string, viewer?: User | null): Product[] {
    const lowered = term.toLowerCase();
    return this.visibleProducts(viewer ?? null).filter((product) => {
      const matchesText =
        product.name.toLowerCase().includes(lowered) || product.description.toLowerCase().includes(lowered);
      const matchesCategory = category ? product.category === category : true;
      return matchesText && matchesCategory;
    });
  }

  getById(id: number): Product | undefined {
    return this.productsSignal().find((product) => product.id === id);
  }

  addProduct(product: Omit<Product, 'id' | 'rating' | 'createdAt' | 'hidden'> & { rating?: number }): void {
    const nextId = Math.max(0, ...this.productsSignal().map((p) => p.id)) + 1;
    this.productsSignal.update((products) => [
      ...products,
      {
        ...product,
        id: nextId,
        createdAt: new Date().toISOString(),
        hidden: false,
        rating: product.rating ?? 4.5
      }
    ]);
    this.persist();
  }

  updateProduct(id: number, changes: Partial<Omit<Product, 'id'>>): void {
    this.productsSignal.update((products) =>
      products.map((product) => (product.id === id ? { ...product, ...changes } : product))
    );
    this.persist();
  }

  listByOwner(ownerId: number): Product[] {
    return this.productsSignal().filter((p) => p.ownerId === ownerId);
  }

  toggleHidden(id: number, hidden: boolean): void {
    this.updateProduct(id, { hidden });
  }

  setDeliveryMode(id: number, mode: DeliveryMode, deliveryPrice?: number): void {
    this.updateProduct(id, { deliveryMode: mode, deliveryPrice });
  }

  private restoreProducts(): Product[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Product[];
    const seed: Product[] = [
      {
        id: 1,
        name: 'Ноутбук Aurora Pro 15',
        category: 'Ноутбуки',
        price: 119900,
        stock: 8,
        rating: 4.8,
        photos: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80'
        ],
        description:
          'Профессиональный ноутбук для разработчиков и дизайнеров с дисплеем 2.8K и автономностью до 12 часов.',
        specs: ['Intel Core i7 14-го поколения', '32 ГБ RAM', '1 ТБ NVMe', 'RTX 4070 8 ГБ'],
        location: 'Москва, Цветной бульвар',
        deliveryMode: 'any',
        deliveryPrice: 1500,
        ownerId: 3,
        hidden: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Игровой ПК Hyperion X',
        category: 'ПК',
        price: 179900,
        stock: 5,
        rating: 4.9,
        photos: [
          'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Мощная станция для 4K-гейминга и VR с поддержкой трассировки лучей.',
        specs: ['AMD Ryzen 9 7900X', '64 ГБ RAM', '2 ТБ NVMe', 'GeForce RTX 4080 16 ГБ'],
        location: 'Санкт-Петербург, Васильевский остров',
        deliveryMode: 'delivery',
        deliveryPrice: 2500,
        ownerId: 2,
        hidden: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Ультрабук ZenLite 14',
        category: 'Ноутбуки',
        price: 82900,
        stock: 12,
        rating: 4.6,
        photos: [
          'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Легкий ультрабук для учебы и путешествий с сенсорным экраном.',
        specs: ['Intel Core i5', '16 ГБ RAM', '512 ГБ SSD', 'Вес 1.2 кг'],
        location: 'Екатеринбург, Центр',
        deliveryMode: 'any',
        deliveryPrice: 800,
        ownerId: 3,
        hidden: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'GeForce RTX 4090',
        category: 'Видеокарты',
        price: 239900,
        stock: 4,
        rating: 4.95,
        photos: [
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Флагманская видеокарта для максимальных FPS в 4K и работы с ИИ.',
        specs: ['24 ГБ GDDR6X', '3.5-слотовое охлаждение', 'Тройной вентилятор'],
        location: 'Новосибирск, Академгородок',
        deliveryMode: 'delivery',
        deliveryPrice: 2000,
        ownerId: 2,
        hidden: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Материнская плата Z790 Creator',
        category: 'Материнские платы',
        price: 45900,
        stock: 10,
        rating: 4.5,
        photos: [
          'https://images.unsplash.com/photo-1587202372775-98927b1c87e6?auto=format&fit=crop&w=1200&q=80'
        ],
        description: 'Плата для энтузиастов с поддержкой PCIe 5.0, Wi‑Fi 7 и 2.5G LAN.',
        specs: ['LGA1700', 'DDR5 7200+ МГц', '3x M.2'],
        location: 'Казань, центр',
        deliveryMode: 'pickup',
        ownerId: 1,
        hidden: false,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.productsSignal()));
  }
}
