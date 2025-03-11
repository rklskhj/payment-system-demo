import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const prisma = new PrismaClient();

export default async function ProductsPage() {
  // 일회성 결제 상품만 필터링 (이름에 '일회성'이 포함된 상품)
  const products = await prisma.product.findMany({
    where: {
      name: {
        contains: "일회성",
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">일회성 결제 상품</h1>

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

      {products.length === 0 ? (
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
  );
}
