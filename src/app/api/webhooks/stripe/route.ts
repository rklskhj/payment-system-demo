import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook 서명 검증 실패: ${errorMessage}`);
    return NextResponse.json(
      { error: "Webhook 서명 검증 실패" },
      { status: 400 }
    );
  }

  // 결제 완료 이벤트 처리
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // 메타 데이터에서 주문 정보 가져오기
    const userId = session.metadata?.userId;
    const productId = session.metadata?.productId;

    if (userId && productId) {
      // 주문 상태 업데이트
      await prisma.order.updateMany({
        where: {
          paymentId: session.id,
          userId,
          productId,
        },
        data: {
          status: "completed",
        },
      });
    }
  }

  // 구독 관련 이벤트 처리
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;

    const userId = subscription.metadata?.userId;

    if (userId) {
      // 구독 정보 업데이트 또는 생성
      await prisma.subscription.upsert({
        where: {
          stripeId: subscription.id,
        },
        update: {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
        create: {
          stripeId: subscription.id,
          userId: userId,
          status: subscription.status,
          planType: subscription.metadata?.planType || "monthly",
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
