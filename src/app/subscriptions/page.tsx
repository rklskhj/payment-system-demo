"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useOrderStore } from "@/store/useOrderStore";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  productType: string;
}

// 검색 파라미터를 사용하는 컴포넌트
function SubscriptionContent() {
  const [subscriptions, setSubscriptions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const subscriptionCanceled = searchParams.get("subscription_canceled");
  const { clearTempOrder } = useOrderStore();

  // 구독 상품 데이터 가져오기
  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/products?type=subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error("구독 상품 데이터 가져오기 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();

    // 구독 취소 시 임시 주문 정보 삭제 및 알림 표시
    if (subscriptionCanceled === "true") {
      clearTempOrder();
      toast.warning("구독이 취소되었습니다.", {
        toastId: "subscription-canceled",
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
      });
    }
  }, [subscriptionCanceled, clearTempOrder]);

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-center">구독 서비스</h1>

      <div className="flex justify-between items-center mb-6">
        <Link
          href="/dashboard"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 대시보드로 돌아가기
        </Link>
        <Link
          href="/products"
          className="text-indigo-600 hover:text-indigo-800"
        >
          일회성 결제 상품 보기 →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">구독 서비스가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.id} product={subscription} />
          ))}
        </div>
      )}
    </>
  );
}

// 로딩 상태를 표시할 폴백 컴포넌트
function SubscriptionsLoading() {
  return (
    <div className="text-center py-10">
      <p className="text-gray-500">페이지 로딩 중...</p>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<SubscriptionsLoading />}>
          <SubscriptionContent />
        </Suspense>
      </div>
    </div>
  );
}
