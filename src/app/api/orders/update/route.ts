import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentId, expiresAt } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        { message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 주문 업데이트
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "completed_subscription", // 결제 완료 상태로 업데이트
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("주문 업데이트 오류:", error);
    return NextResponse.json(
      { message: "주문 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
