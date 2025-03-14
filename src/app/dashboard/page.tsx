"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useOrderStore } from "@/store/useOrderStore";
import {
  useGetOrders,
  useCancelOrder,
  useCreateOrder,
  Order as BaseOrder,
} from "@/hooks/queries/useOrderQueries";
import { usePaymentProcessing } from "@/hooks/usePaymentProcessing";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  productType: string;
}

interface Subscription {
  id: string;
  planType: string;
  status: string;
  currentPeriodEnd: Date;
  createdAt: Date;
}

interface OrderWithProduct extends BaseOrder {
  product: Product;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  orders: OrderWithProduct[];
  subscriptions: Subscription[];
}

// 검색 파라미터를 사용하는 컴포넌트
function DashboardContent() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { clearTempOrder } = useOrderStore();
  const { refetch: refetchOrders } = useGetOrders();
  const [cancellingSubscription, setCancellingSubscription] = useState<
    string | null
  >(null);
  const { mutate: cancelOrder } = useCancelOrder();
  const { mutate: createOrderMutation } = useCreateOrder();

  // createOrder 함수를 유형 호환성을 위해 래핑
  const createOrder = useCallback(
    (order: {
      id: string;
      userId: string;
      productId: string;
      amount: number;
      orderType: string;
      status: string;
      paymentId: string;
      createdAt: string;
      updatedAt: string;
    }) => {
      // 주문 타입을 변환하여 mutate 함수에 전달
      createOrderMutation({
        ...order,
        orderType: order.orderType as "one-time" | "subscription",
      });
    },
    [createOrderMutation]
  );

  // 사용자 정보 가져오기
  const fetchUserDataCallback = useCallback(async () => {
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

  // 결제 처리 커스텀 훅 사용
  const { handlePaymentSuccess } = usePaymentProcessing({
    session,
    createOrder,
    clearTempOrder,
    refetchOrders,
    fetchUserData: fetchUserDataCallback,
  });

  // 구독 취소 핸들러
  const handleCancelSubscription = useCallback(
    async (order: OrderWithProduct) => {
      // 이미 취소 중인 경우 중복 실행 방지
      if (cancellingSubscription) {
        return;
      }

      if (!confirm("정말로 구독을 취소하시겠습니까?")) {
        return;
      }

      // 취소 버튼 비활성화를 위해 상태 설정
      setCancellingSubscription(order.id);

      const toastId = toast.loading("구독 취소 중...", {
        position: "top-center",
      });

      try {
        console.log(
          `구독 취소 요청: 주문 ID=${order.id}, 결제 ID=${order.paymentId}`
        );

        // API 호출
        console.log(
          `API 호출: /api/orders/cancel?paymentId=${order.paymentId}`
        );
        const response = await fetch(
          `/api/orders/cancel?paymentId=${order.paymentId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // 응답 상태 로깅
        console.log(`API 응답 상태: ${response.status} ${response.statusText}`);

        // 응답 본문 로깅
        const data = await response.json();
        console.log("API 응답 데이터:", data);

        if (!response.ok) {
          // 404 에러인 경우 (주문을 찾을 수 없음)
          if (response.status === 404) {
            const stripeUrl = `https://dashboard.stripe.com/test/subscriptions/${order.paymentId}`;

            const errorMessage = `데이터베이스에서 주문을 찾을 수 없습니다. Stripe 대시보드에서 직접 취소해 보세요: 
              <a href="${stripeUrl}" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline;">
                Stripe 대시보드에서 취소
              </a>`;

            toast.update(toastId, {
              render: () => (
                <div dangerouslySetInnerHTML={{ __html: errorMessage }} />
              ),
              type: "warning",
              isLoading: false,
              autoClose: 10000,
              closeOnClick: false,
            });

            // 주문 상태를 취소로 변경 시도
            try {
              console.log("주문을 직접 취소 상태로 업데이트 시도");
              cancelOrder(order, {
                onSuccess: () => {
                  console.log("주문 상태 업데이트 성공");
                  fetchUserDataCallback();
                },
                onError: (updateErr) => {
                  console.error("주문 상태 업데이트 실패:", updateErr);
                },
              });
            } catch (updateErr) {
              console.error("주문 상태 업데이트 시도 중 오류:", updateErr);
            }

            // 취소 상태 해제
            setCancellingSubscription(null);
            return;
          }

          throw new Error(data.message || "구독 취소 중 오류가 발생했습니다.");
        }

        // 응답이 성공한 경우
        console.log("구독 취소 성공:", data);
        toast.update(toastId, {
          render:
            typeof data === "object" && data && "message" in data
              ? (data.message as string)
              : "구독이 성공적으로 취소되었습니다.",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });

        // 주문 상태 업데이트
        cancelOrder(order, {
          onSuccess: () => {
            console.log("주문 상태 업데이트 성공");
            fetchUserDataCallback();
          },
          onError: (updateErr) => {
            console.error("주문 상태 업데이트 실패:", updateErr);
          },
          onSettled: () => {
            // 취소 상태 해제 - onSettled에서만 상태 해제
            setCancellingSubscription(null);
          },
        });
      } catch (error) {
        console.error("구독 취소 오류:", error);
        toast.update(toastId, {
          render:
            error instanceof Error
              ? error.message
              : "구독 취소 중 예기치 않은 오류가 발생했습니다.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        // 오류 발생 시 취소 상태 해제
        setCancellingSubscription(null);
      }
    },
    [cancelOrder, fetchUserDataCallback, cancellingSubscription]
  );

  // 주문 목록 메모이제이션 - 항상 호출되도록 if 문 앞으로 이동
  const ordersContent = useMemo(() => {
    if (!user) return null;

    if (user.orders.length === 0) {
      return <p className="text-gray-500">주문 내역이 없습니다.</p>;
    }

    return (
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
    );
  }, [user]);

  // 활성 구독 목록 메모이제이션 - 항상 호출되도록 if 문 앞으로 이동
  const activeSubscriptions = useMemo(() => {
    if (!user) return null;

    const subscriptionOrders = user.orders.filter(
      (order) =>
        order.orderType === "subscription" &&
        order.status === "completed_subscription"
    );

    if (subscriptionOrders.length === 0) {
      return <p className="text-gray-500">활성화된 구독이 없습니다.</p>;
    }

    return (
      <div className="space-y-4">
        {subscriptionOrders.map((order) => (
          <div key={order.id} className="border-b pb-4">
            <p className="font-medium">{order.product.name}</p>
            <p className="text-gray-600">
              구독 금액: {order.amount.toLocaleString()}원
            </p>
            <p className="text-gray-600">상태: 구독 중</p>
            <p className="text-gray-600 text-sm">
              구독 시작일: {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => handleCancelSubscription(order)}
              disabled={cancellingSubscription === order.id}
              className={`mt-2 px-4 py-2 rounded ${
                cancellingSubscription === order.id
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {cancellingSubscription === order.id
                ? "취소 처리 중..."
                : "구독 취소"}
            </button>
          </div>
        ))}
      </div>
    );
  }, [user, cancellingSubscription, handleCancelSubscription]);

  // 세션 상태에 따른 초기 데이터 로드
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status !== "authenticated" || !session) {
      return;
    }

    // 초기 데이터 로드
    fetchUserDataCallback();
  }, [session, status, router, fetchUserDataCallback]);

  // URL 파라미터로 결제 성공 처리
  useEffect(() => {
    if (
      searchParams.has("payment_success") ||
      searchParams.has("subscription_success")
    ) {
      handlePaymentSuccess(searchParams);
    }
  }, [searchParams, handlePaymentSuccess]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p>사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
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
          {ordersContent}
        </div>

        {/* 구독 정보 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">활성 구독 정보</h2>
          {activeSubscriptions}
        </div>
      </div>
    </>
  );
}

// 로딩 상태를 표시할 폴백 컴포넌트
function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <p>페이지 로딩 중...</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
