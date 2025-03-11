import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  // 사용자 정보 가져오기
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    include: {
      orders: {
        include: { product: true },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
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

          {user.orders.length === 0 ? (
            <p className="text-gray-500">주문 내역이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {user.orders.map((order) => (
                <div key={order.id} className="border-b pb-4">
                  <p className="font-medium">{order.product.name}</p>
                  <p className="text-gray-600">
                    금액: {order.amount.toLocaleString()}원
                  </p>
                  <p className="text-gray-600">
                    상태:{" "}
                    {order.status === "completed"
                      ? "결제 완료"
                      : order.status === "pending"
                      ? "처리 중"
                      : "실패"}
                  </p>
                  <p className="text-gray-600 text-sm">
                    주문일: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 구독 정보 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">구독 정보</h2>

          {user.subscriptions.length === 0 ? (
            <p className="text-gray-500">구독 정보가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {user.subscriptions.map((subscription) => (
                <div key={subscription.id} className="border-b pb-4">
                  <p className="font-medium">
                    {subscription.planType === "monthly"
                      ? "월간 구독"
                      : "연간 구독"}
                  </p>
                  <p className="text-gray-600">
                    상태:{" "}
                    {subscription.status === "active"
                      ? "활성화"
                      : subscription.status === "canceled"
                      ? "취소됨"
                      : "만료됨"}
                  </p>
                  <p className="text-gray-600">
                    다음 결제일:{" "}
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 text-sm">
                    구독 시작일:{" "}
                    {new Date(subscription.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
