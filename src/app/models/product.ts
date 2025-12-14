export type DeliveryMode = 'pickup' | 'delivery' | 'any';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  photos: string[];
  description: string;
  specs: string[];
  location: string;
  deliveryMode: DeliveryMode;
  deliveryPrice?: number;
  ownerId: number;
  hidden: boolean;
  createdAt: string;
}
