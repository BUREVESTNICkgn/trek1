export interface Message {
  id: number;
  fromUserId: number | null;
  toUserId: number;
  productId?: number;
  orderId?: number;
  text: string;
  createdAt: string;
}
