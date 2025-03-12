"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const paymentCanceled = searchParams.get("payment_canceled");
  const { clearTempOrder } = useOrderStore();

  // 상품 데이터 가져오기
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?type=one-time");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("상품 데이터 가져오기 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // 결제 취소 시 임시 주문 정보 삭제 및 알림 표시
    if (paymentCanceled === "true") {
      clearTempOrder();
      toast.warning("결제가 취소되었습니다.", {
        toastId: "payment-canceled",
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
      });
    }
  }, [paymentCanceled, clearTempOrder]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          일회성 결제 상품
        </h1>

        <div className="flex justify-between items-center mb-6">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← 대시보드로 돌아가기
          </Link>
          <Link
            href="/subscriptions"
            className="text-indigo-600 hover:text-indigo-800"
          >
            구독 서비스 보기 →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
