// 상품 관련 타입
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

// 주문 관련 타입
export interface Order {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  paymentId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 구독 관련 타입
export interface Subscription {
  id: string;
  userId: string;
  stripeId: string;
  status: "active" | "canceled" | "past_due";
  planType: "monthly" | "yearly";
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 관련 타입
export interface User {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// 결제 요청 타입
export interface CheckoutRequest {
  productId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// 결제 응답 타입
export interface CheckoutResponse {
  url: string;
}
