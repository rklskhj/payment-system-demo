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

    // 1. 구독 ID 확인 및 유효성 검사
    if (!paymentId.startsWith("sub_")) {
      return NextResponse.json(
        { message: "유효한 구독 ID가 아닙니다." },
        { status: 400 }
      );
    }

    // 2. Stripe에서 구독 상태 확인
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(paymentId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // 구독 조회 실패
      return NextResponse.json(
        { message: "구독 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 3. 이미 취소된 구독인지 확인
    if (subscription.status === "canceled") {
      // 주문이 있다면 상태 업데이트 (DB 일관성 유지)
      const order = await prisma.order.findFirst({
        where: {
          paymentId,
          userId: user.id,
        },
      });

      if (order && order.status !== "canceled") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "canceled" },
        });
      }

      return NextResponse.json({
        message: "구독이 이미 취소되었습니다.",
      });
    }

    // 4. 구독이 활성 상태가 아니면 오류 반환
    if (subscription.status !== "active") {
      return NextResponse.json(
        {
          message: `구독이 취소할 수 있는 상태가 아닙니다. (현재 상태: ${subscription.status})`,
        },
        { status: 400 }
      );
    }

    // 5. 주문 상태 업데이트
    const order = await prisma.order.findFirst({
      where: {
        paymentId,
        userId: user.id,
      },
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "canceled" },
      });
    }

    // 6. 구독 취소 실행
    try {
      const canceledSubscription = await stripe.subscriptions.cancel(paymentId);

      return NextResponse.json({
        message: "구독이 성공적으로 취소되었습니다.",
        status: canceledSubscription.status,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      return NextResponse.json(
        {
          message: "구독 취소 처리 중 오류가 발생했습니다.",
          error: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        error:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
