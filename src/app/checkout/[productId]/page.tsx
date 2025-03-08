"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/types";

export default function CheckoutPage({
  params,
}: {
  params: { productId: string };
}) {
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?callbackUrl=/checkout/${productId}`);
      return;
    }

    // 상품 정보 가져오기
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error("상품을 불러오는데 실패했습니다.");
        }
        const data = await response.json();
        setProduct(data);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, isAuthenticated, router]);

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
        }),
      });

      if (!response.ok) {
        throw new Error("결제 처리 중 오류가 발생했습니다.");
      }

      const { url } = await response.json();

      // Stripe 결제 페이지로 리다이렉트
      window.location.href = url;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!product) {
    return <div className="p-8 text-center">상품을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">결제하기</h1>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold">{product.name}</h2>
        <p className="text-gray-600 mb-2">{product.description}</p>
        <p className="text-lg font-bold">{product.price.toLocaleString()}원</p>
      </div>

      <button
        onClick={handleCheckout}
        disabled={processing}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {processing ? "처리 중..." : "결제 진행하기"}
      </button>
    </div>
  );
}
