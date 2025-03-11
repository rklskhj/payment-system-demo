import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import SubscriptionCard from "@/components/SubscriptionCard";

const prisma = new PrismaClient();

export default async function SubscriptionsPage() {
  // 구독 상품만 필터링 (이름에 '구독'이 포함된 상품)
  const subscriptions = await prisma.product.findMany({
    where: {
      name: {
        contains: "구독",
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
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

      {subscriptions.length === 0 ? (
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
    </div>
  );
}
