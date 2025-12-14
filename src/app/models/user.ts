export type UserRole = 'user' | 'manager' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  address?: string;
}
