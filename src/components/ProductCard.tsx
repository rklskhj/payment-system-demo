"use client";

import { Product } from "@prisma/client";
import Image from "next/image";
import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOrderStore } from "@/store/useOrderStore";
import { useCreatePaymentSession } from "@/hooks/queries/useOrderQueries";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { setTempOrder, clearTempOrder } = useOrderStore();
  const createPaymentSession = useCreatePaymentSession();

  // useCallback을 사용하여 함수 메모이제이션
  const handlePurchase = useCallback(async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      // 임시 주문 정보 저장
      setTempOrder({
        productId: product.id,
        productName: product.name,
        productType: "one-time",
        amount: product.price,
        imageUrl: product.imageUrl || undefined,
      });

      // 결제 세션 생성
      const result = await createPaymentSession.mutateAsync({
        productId: product.id,
        orderType: "one-time",
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("결제 URL을 받지 못했습니다.");
      }
    } catch (error) {
      console.error("결제 오류:", error);
      alert("결제 처리 중 오류가 발생했습니다.");
      // 오류 발생 시 임시 주문 정보 삭제
      clearTempOrder();
    } finally {
      setLoading(false);
    }
  }, [
    session,
    router,
    product,
    setTempOrder,
    clearTempOrder,
    createPaymentSession,
  ]);

  // 로딩 상태 또는 결제 진행 중 상태 계산 - 렌더링 최적화
  const isProcessing = loading || createPaymentSession.isPending;

  // 이미지 렌더링 조건부 처리를 변수로 추출하여 가독성 향상
  const imageContent = product.imageUrl ? (
    <div className="relative h-48 w-full">
      <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false} // 화면 밖 이미지는 지연 로드
      />
    </div>
  ) : (
    <div className="bg-gray-200 h-48 flex items-center justify-center">
      <span className="text-gray-500">이미지 없음</span>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {imageContent}

      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-4 h-20 overflow-hidden">
          {product.description || "설명이 없습니다."}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">
            {product.price.toLocaleString()}원
          </span>
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isProcessing ? "처리 중..." : "구매하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
export default memo(ProductCard);
