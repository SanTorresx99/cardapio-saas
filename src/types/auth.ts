export interface User {
  id: string;
  email: string;
  name: string;
  role: 'restaurant' | 'admin';
  tenantId?: string;
  tenantSlug?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: 'restaurant' | 'admin';
  tenantId?: string;
  tenantSlug?: string;
  exp?: number;
  iat?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  restaurantName: string;
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}
