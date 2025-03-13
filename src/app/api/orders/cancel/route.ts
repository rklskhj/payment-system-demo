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
        OR: [
          { status: "pending" },
          { status: "pending_subscription" },
          { status: "completed_subscription" },
        ],
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

    // 구독인 경우 Stripe 구독 취소 처리
    if (
      order.orderType === "subscription" &&
      order.status === "completed_subscription"
    ) {
      try {
        // 해당 주문과 연결된 구독 정보 조회
        const subscriptions = await stripe.subscriptions.list({
          limit: 10,
        });

        // 취소할 구독 찾기 (메타데이터에 userId, productId가 일치하는 구독)
        let subscriptionToCancel = null;
        for (const sub of subscriptions.data) {
          if (
            sub.metadata.userId === user.id &&
            sub.metadata.productId === order.productId
          ) {
            subscriptionToCancel = sub;
            break;
          }
        }

        if (subscriptionToCancel) {
          // Stripe 구독 취소
          await stripe.subscriptions.cancel(subscriptionToCancel.id);
          console.log(`Stripe 구독 취소 완료: ${subscriptionToCancel.id}`);

          // 구독 정보 업데이트
          await prisma.subscription.updateMany({
            where: {
              userId: user.id,
              stripeId: subscriptionToCancel.id,
            },
            data: { status: "canceled" },
          });
        } else {
          console.log("취소할 Stripe 구독을 찾을 수 없습니다");
        }
      } catch (stripeError) {
        console.error("Stripe 구독 취소 오류:", stripeError);
        // Stripe 오류는 무시하고 계속 진행
      }
    } else {
      // 일반 주문인 경우 Stripe 세션 취소 시도
      try {
        await stripe.checkout.sessions.expire(paymentId);
      } catch (stripeError) {
        console.error("Stripe 세션 취소 오류:", stripeError);
        // Stripe 오류는 무시하고 계속 진행
      }
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
