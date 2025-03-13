import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchApi, postApi } from "@/lib/api";

// 타입 정의
export interface Order {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  orderType: "one-time" | "subscription";
  status: string;
  paymentId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface PaymentResponse {
  url: string;
  sessionId: string;
}

// 결제 세션 생성 API 호출
export function useCreatePaymentSession() {
  return useMutation({
    mutationFn: async (data: {
      productId: string;
      orderType: "one-time" | "subscription";
    }) => {
      return postApi<PaymentResponse>("/api/payment", data);
    },
    onError: (error) => {
      console.error("결제 세션 생성 실패:", error);
    },
  });
}

// 주문 생성 API 호출
export function useCreateOrder() {
  return useMutation({
    mutationFn: (order: Order) => postApi<Order>("/api/orders", order),
  });
}

// 주문 목록 조회 API 호출
export function useGetOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchApi<Order[]>("/api/orders"),
  });
}

// 주문 취소 API 호출
export function useCancelOrder() {
  return useMutation({
    mutationFn: (order: Order) =>
      postApi<Order>(`/api/orders/cancel?paymentId=${order.paymentId}`, {
        paymentId: order.paymentId,
      }),
  });
}
