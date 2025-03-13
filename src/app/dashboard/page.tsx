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

  // 쿼리 파라미터 읽기 - useMemo로 최적화
  const queryParams = useMemo(
    () => ({
      paymentSuccess: searchParams.get("payment_success"),
      subscriptionSuccess: searchParams.get("subscription_success"),
      sessionId: searchParams.get("session_id"),
    }),
    [searchParams]
  );

  const { clearTempOrder } = useOrderStore();
  const { refetch: refetchOrders } = useGetOrders();
  const [cancellingSubscription, setCancellingSubscription] = useState<
    string | null
  >(null);
  const { mutate: cancelOrder } = useCancelOrder();
  const { mutate: createOrder } = useCreateOrder();

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

  // 구독 취소 핸들러
  const handleCancelSubscription = useCallback(
    async (order: OrderWithProduct) => {
      if (!confirm("정말로 구독을 취소하시겠습니까?")) {
        return;
      }

      setCancellingSubscription(order.id);
      try {
        cancelOrder(order, {
          onSuccess: () => {
            toast.success("구독이 성공적으로 취소되었습니다.", {
              position: "top-center",
              autoClose: 2000,
            });
            fetchUserDataCallback();
          },
          onError: () => {
            toast.error("구독 취소 중 오류가 발생했습니다.", {
              position: "top-center",
              autoClose: 2000,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: true,
            });
          },
          onSettled: () => {
            setCancellingSubscription(null);
          },
        });
      } catch (error) {
        console.error("구독 취소 오류:", error);
        setCancellingSubscription(null);
      }
    },
    [cancelOrder, fetchUserDataCallback]
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

  // 결제 성공 처리를 위한 별도의 useEffect
  useEffect(() => {
    // 이미 처리된 세션인지 확인하기 위한 로컬 스토리지 키 생성 함수
    const getProcessedSessionKey = (sessionId: string) =>
      `payment_processed_${sessionId}`;

    const processPayment = async () => {
      console.log("결제 상태 확인:", {
        paymentSuccess: queryParams.paymentSuccess,
        subscriptionSuccess: queryParams.subscriptionSuccess,
        sessionId: queryParams.sessionId,
        tempOrder: useOrderStore.getState().tempOrder,
      });

      if (
        queryParams.paymentSuccess !== "true" &&
        queryParams.subscriptionSuccess !== "true"
      ) {
        console.log("결제 성공 파라미터가 없어 처리 중단");
        return;
      }

      const sessionId = queryParams.sessionId;
      if (!sessionId) {
        console.error("세션 ID가 없어 처리 중단");
        return;
      }

      // 이미 처리된 세션인지 확인
      const processedKey = getProcessedSessionKey(sessionId);
      if (localStorage.getItem(processedKey)) {
        console.log("이미 처리된 세션입니다:", sessionId);

        // URL에서 쿼리 파라미터 제거
        const url = new URL(window.location.href);
        url.search = "";
        window.history.replaceState({}, "", url.toString());

        return;
      }

      try {
        console.log("결제 성공 처리 시작...");

        // tempOrder 상태 가져오기
        const orderDetails = useOrderStore.getState().tempOrder;
        console.log("주문 상세 정보:", orderDetails);

        if (!orderDetails) {
          console.error("주문 정보가 없습니다");
          toast.error("주문 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
          return;
        }

        // 주문 생성 API 호출 - 클라이언트가 주문 생성의 주체
        console.log("주문 생성 중...");
        try {
          // 주문 생성 요청
          createOrder({
            id: "", // 서버에서 생성됨
            userId: session?.user?.id || "",
            productId: orderDetails.productId,
            amount: orderDetails.amount,
            orderType: orderDetails.productType,
            status:
              orderDetails.productType === "one-time"
                ? "completed"
                : "completed_subscription",
            paymentId: sessionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log("주문 생성 요청 완료");

          // 세션 처리 완료 표시 - 중복 처리 방지
          localStorage.setItem(processedKey, "true");

          // 임시 주문 정보 삭제
          clearTempOrder();

          // 주문 목록 갱신
          await refetchOrders();

          // 사용자 정보 다시 가져오기
          await fetchUserDataCallback();

          // 성공 메시지 표시
          const successMessage =
            queryParams.paymentSuccess === "true"
              ? "결제가 성공적으로 완료되었습니다."
              : "구독이 성공적으로 시작되었습니다.";

          toast.success(successMessage, {
            position: "top-center",
            autoClose: 3000,
          });
        } catch (error) {
          console.error("주문 생성 실패:", error);
          toast.error(
            "주문 처리 중 오류가 발생했습니다. 관리자에게 문의하세요."
          );
        }

        // URL에서 쿼리 파라미터 제거
        const url = new URL(window.location.href);
        url.search = "";
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("결제 처리 오류:", error);
        toast.error("결제 처리 중 오류가 발생했습니다.");
      }
    };

    processPayment();
  }, [
    clearTempOrder,
    refetchOrders,
    fetchUserDataCallback,
    queryParams,
    createOrder,
    session,
  ]);

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
