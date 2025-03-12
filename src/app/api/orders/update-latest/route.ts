import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 가장 최근의 pending 상태 주문 찾기
    const latestPendingOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        OR: [{ status: "pending_payment" }, { status: "pending_subscription" }],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!latestPendingOrder) {
      return NextResponse.json(
        { message: "업데이트할 주문이 없습니다." },
        { status: 404 }
      );
    }

    // 주문 상태 업데이트 (구독인지 일회성 결제인지에 따라 다른 상태로 업데이트)
    const newStatus =
      latestPendingOrder.status === "pending_subscription"
        ? "completed_subscription"
        : "completed";

    const updatedOrder = await prisma.order.update({
      where: { id: latestPendingOrder.id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      message: "주문 상태가 업데이트되었습니다.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("주문 상태 업데이트 오류:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
