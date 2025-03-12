"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useOrderStore } from "@/store/useOrderStore";
import {
  useGetOrders,
  useUpdateLatestOrder,
} from "@/hooks/queries/useOrderQueries";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface Order {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  product: Product;
}

interface Subscription {
  id: string;
  planType: string;
  status: string;
  currentPeriodEnd: Date;
  createdAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  orders: Order[];
  subscriptions: Subscription[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment_success");
  const subscriptionSuccess = searchParams.get("subscription_success");
  const { clearTempOrder } = useOrderStore();
  const updateLatestOrder = useUpdateLatestOrder();
  const { refetch: refetchOrders } = useGetOrders();

  // 사용자 정보 가져오기
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        throw new Error("사용자 정보를 가져오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 정보 가져오기 오류:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // 초기 데이터 로드
    fetchUserData();

    // 결제 성공 또는 구독 성공 시 주문 상태 업데이트
    const updateOrderIfNeeded = async () => {
      if (paymentSuccess === "true" || subscriptionSuccess === "true") {
        try {
          // 임시 주문 정보 삭제
          clearTempOrder();

          // 주문 상태 업데이트
          await updateLatestOrder.mutateAsync();

          // 주문 목록 갱신
          await refetchOrders();

          // 사용자 정보 다시 가져오기
          await fetchUserData();

          // 적절한 성공 메시지 표시
          if (paymentSuccess === "true") {
            toast.success("결제가 성공적으로 완료되었습니다.", {
              toastId: "payment-success",
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: true,
            });
          } else {
            toast.success("구독이 성공적으로 시작되었습니다.", {
              toastId: "subscription-success",
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: true,
            });
          }
        } catch (error) {
          console.error("주문 상태 업데이트 오류:", error);
        }
      }
    };

    updateOrderIfNeeded();
  }, [
    session,
    status,
    router,
    paymentSuccess,
    subscriptionSuccess,
    fetchUserData,
    clearTempOrder,
    updateLatestOrder,
    refetchOrders,
  ]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">마이 페이지</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          환영합니다, {user.name}님!
        </h2>
        <p className="text-gray-600 mb-4">이메일: {user.email}</p>
        <p className="text-gray-600 mb-4">
          가입일: {new Date(user.createdAt).toLocaleDateString()}
        </p>

        <div className="flex space-x-4 mt-6">
          <Link
            href="/products"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            상품 구매하기
          </Link>
          <Link
            href="/subscriptions"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            구독 서비스 보기
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 주문 내역 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">최근 주문 내역</h2>

          {user.orders.length === 0 ? (
            <p className="text-gray-500">주문 내역이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {user.orders.map((order) => (
                <div key={order.id} className="border-b pb-4">
                  <p className="font-medium">{order.product.name}</p>
                  <p className="text-gray-600">
                    금액: {order.amount.toLocaleString()}원
                  </p>
                  <p className="text-gray-600">
                    상태:{" "}
                    {order.status === "completed" ||
                    order.status === "completed_subscription"
                      ? "결제 완료"
                      : order.status === "pending_payment"
                      ? "결제 처리 중"
                      : order.status === "pending_subscription"
                      ? "구독 처리 중"
                      : order.status === "expired"
                      ? "만료됨"
                      : order.status === "canceled"
                      ? "취소됨"
                      : "실패"}
                  </p>
                  <p className="text-gray-600 text-sm">
                    주문일: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 구독 정보 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">구독 정보</h2>

          {user.subscriptions.length === 0 ? (
            <p className="text-gray-500">구독 정보가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {user.subscriptions.map((subscription) => (
                <div key={subscription.id} className="border-b pb-4">
                  <p className="font-medium">
                    {subscription.planType === "monthly"
                      ? "월간 구독"
                      : "연간 구독"}
                  </p>
                  <p className="text-gray-600">
                    상태:{" "}
                    {subscription.status === "active"
                      ? "활성화"
                      : subscription.status === "canceled"
                      ? "취소됨"
                      : "만료됨"}
                  </p>
                  <p className="text-gray-600">
                    다음 결제일:{" "}
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 text-sm">
                    구독 시작일:{" "}
                    {new Date(subscription.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
