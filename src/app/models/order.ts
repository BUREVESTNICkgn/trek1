import { Product } from './product';

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  address: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'shipped';
}
