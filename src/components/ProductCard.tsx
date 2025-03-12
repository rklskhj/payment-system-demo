"use client";

import { Product } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOrderStore } from "@/store/useOrderStore";
import { useCreatePaymentSession } from "@/hooks/queries/useOrderQueries";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { setTempOrder } = useOrderStore();
  const createPaymentSession = useCreatePaymentSession();

  const handlePurchase = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {product.imageUrl ? (
        <div className="relative h-48 w-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="bg-gray-200 h-48 flex items-center justify-center">
          <span className="text-gray-500">이미지 없음</span>
        </div>
      )}

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
            disabled={loading || createPaymentSession.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {loading || createPaymentSession.isPending
              ? "처리 중..."
              : "구매하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
