import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

// 입력 유효성 검사 스키마
const paymentSchema = z.object({
  productId: z.string(),
  orderType: z.enum(["one-time", "subscription"]),
});

// 주문 만료 시간 설정 (현재 시간으로부터 30분)
const getExpirationTime = () => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);
  return expiresAt;
};

// URL 설정을 위한 함수 추가
const getBaseUrl = () => {
  // 환경변수 NEXTAUTH_URL이 있으면 사용
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Vercel 배포 환경에서는 VERCEL_URL 환경변수를 사용
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 개발 환경이면 localhost 사용
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // 기본값
  return "https://your-production-domain.com"; // 실제 도메인으로 변경하세요
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 입력 유효성 검사
    const validation = paymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId, orderType } = validation.data;
    const isSubscription = orderType === "subscription";

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

    // 상품 정보 가져오기
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { message: "상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    try {
      let stripeSession = null;

      if (isSubscription) {
        // 구독 결제 처리
        // 구독 주기 결정 (월간 또는 연간)
        const isMonthly =
          product.name.includes("월간") || !product.name.includes("연간");
        const interval = isMonthly ? "month" : "year";
        const intervalCount = 1;

        // Stripe 제품 생성
        const stripeProduct = await stripe.products.create({
          name: product.name,
          ...(product.description ? { description: product.description } : {}),
          ...(product.imageUrl && getBaseUrl()
            ? {
                images: [`${getBaseUrl()}${product.imageUrl}`],
              }
            : {}),
        });

        // Stripe 가격 생성
        const price = await stripe.prices.create({
          currency: "krw",
          unit_amount: product.price,
          recurring: {
            interval,
            interval_count: intervalCount,
          },
          product: stripeProduct.id,
        });

        // Stripe 구독 세션 생성
        stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${getBaseUrl()}/dashboard?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${getBaseUrl()}/subscriptions?subscription_canceled=true`,
          customer_email: user.email,
          metadata: {
            userId: user.id,
            productId: product.id,
            productName: product.name,
            amount: product.price.toString(),
            orderType: "subscription",
            planType: isMonthly ? "monthly" : "yearly",
            imageUrl: product.imageUrl || "",
          },
        });
      } else {
        // 일회성 결제 처리
        stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "krw",
                product_data: {
                  name: product.name,
                  ...(product.description
                    ? { description: product.description }
                    : {}),
                  ...(product.imageUrl && getBaseUrl()
                    ? {
                        images: [`${getBaseUrl()}${product.imageUrl}`],
                      }
                    : {}),
                },
                unit_amount: product.price,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${getBaseUrl()}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${getBaseUrl()}/products?payment_canceled=true`,
          customer_email: user.email,
          metadata: {
            userId: user.id,
            productId: product.id,
            productName: product.name,
            amount: product.price.toString(),
            orderType: "one-time",
            imageUrl: product.imageUrl || "",
          },
          expires_at: Math.floor(getExpirationTime().getTime() / 1000), // Unix timestamp (초 단위)
        });
      }

      return NextResponse.json({
        url: stripeSession.url,
        sessionId: stripeSession.id,
      });
    } catch (dbError) {
      console.error("데이터베이스 또는 Stripe 처리 오류:", dbError);
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);
      return NextResponse.json(
        {
          message: "결제 처리 중 오류가 발생했습니다.",
          details:
            process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("결제 처리 오류:", error);
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
