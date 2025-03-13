import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

// 새로운 방식의 설정
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    const amount = session.metadata?.amount
      ? parseFloat(session.metadata.amount)
      : 0;
    const orderType = session.metadata?.orderType as
      | "one-time"
      | "subscription";

    if (userId && productId && amount > 0) {
      console.log("결제 완료 이벤트 처리123123");
      // 구독인 경우 구독 정보도 생성/업데이트
      if (orderType === "subscription") {
        const planType = session.metadata?.planType || "monthly";

        // 구독 정보 조회를 위해 Stripe API 호출
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: session.customer as string,
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];

            await prisma.subscription.upsert({
              where: {
                stripeId: subscription.id,
              },
              update: {
                status: subscription.status,
                currentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
              },
              create: {
                stripeId: subscription.id,
                userId,
                status: subscription.status,
                planType,
                currentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
              },
            });

            console.log(`구독 정보 생성/업데이트 완료: ${subscription.id}`);
          }
        } catch (error) {
          console.error("구독 정보 조회 실패:", error);
        }
      }
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

  // 결제 실패 이벤트 처리 - 주문이 생성되지 않으므로 별도 처리 필요 없음
  if (
    event.type === "checkout.session.async_payment_failed" ||
    event.type === "payment_intent.payment_failed"
  ) {
    console.log(`결제 실패: ${event.id}`);
  }

  // 결제 취소 이벤트 처리 - 주문이 생성되지 않으므로 별도 처리 필요 없음
  if (
    event.type.startsWith("checkout.session") &&
    (event.type.includes("canceled") || event.type.includes("cancelled"))
  ) {
    console.log(`결제 취소: ${event.id}`);
  }

  // 결제 세션 만료 이벤트 처리 - 주문이 생성되지 않으므로 별도 처리 필요 없음
  if (event.type === "checkout.session.expired") {
    console.log(`결제 세션 만료: ${event.id}`);
  }

  return NextResponse.json({ received: true });
}
