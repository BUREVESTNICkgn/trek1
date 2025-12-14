import { Product } from './product';

export interface OrderItem {
  product: Product;
  quantity: number;
  deliveryMode: 'pickup' | 'delivery';
  deliveryPrice: number;
}

export type OrderStatus = 'created' | 'processing' | 'shipped' | 'done' | 'cancelled';

export interface Order {
  id: number;
  buyerId: number;
  customerName: string;
  customerEmail: string;
  address: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  status: OrderStatus;
}
