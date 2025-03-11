"use client";

import { Product } from "@prisma/client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface SubscriptionCardProps {
  product: Product;
}

export default function SubscriptionCard({ product }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubscribe = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || "구독 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("구독 오류:", error);
      alert("구독 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 월간 또는 연간 구독 여부 확인
  const isMonthly =
    product.name.includes("월간") || !product.name.includes("연간");
  const period = isMonthly ? "월" : "년";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-indigo-100">
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
          <div>
            <span className="text-lg font-bold">
              {product.price.toLocaleString()}원
            </span>
            <span className="text-gray-500 text-sm ml-1">/ {period}</span>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {loading ? "처리 중..." : "구독하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
