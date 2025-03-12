import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // URL 쿼리에서 paymentId 가져오기
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { message: "결제 ID가 필요합니다." },
        { status: 400 }
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

    // 해당 사용자의 주문 찾기
    const order = await prisma.order.findFirst({
      where: {
        paymentId,
        userId: user.id,
        status: "pending",
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "취소할 주문을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 주문 상태 업데이트
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "canceled" },
    });

    // Stripe 세션 취소 시도 (선택적)
    try {
      await stripe.checkout.sessions.expire(paymentId);
    } catch (stripeError) {
      console.error("Stripe 세션 취소 오류:", stripeError);
      // Stripe 오류는 무시하고 계속 진행
    }

    return NextResponse.json({ message: "주문이 취소되었습니다." });
  } catch (error) {
    console.error("주문 취소 오류:", error);
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
