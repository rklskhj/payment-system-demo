import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { z } from "zod";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

// 입력 유효성 검사 스키마
const subscribeSchema = z.object({
  productId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(); //현재 로그인한 사용자의 세션 가져오기

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 입력 유효성 검사
    const validation = subscribeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { productId } = validation.data;

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

    // 구독 주기 결정 (월간 또는 연간)
    const isMonthly =
      product.name.includes("월간") || !product.name.includes("연간");
    const interval = isMonthly ? "month" : "year";
    const intervalCount = 1;

    // Stripe 가격 생성 (동적으로 생성)
    const price = await stripe.prices.create({
      currency: "krw",
      unit_amount: product.price,
      recurring: {
        interval,
        interval_count: intervalCount,
      },
      product_data: {
        name: product.name,
        ...(product.description ? { description: product.description } : {}),
        ...(product.imageUrl && process.env.NEXTAUTH_URL
          ? {
              images: [`${process.env.NEXTAUTH_URL}${product.imageUrl}`],
            }
          : {}),
      },
    });

    // Stripe 구독 세션 생성
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription_success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscriptions?subscription_canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        productId: product.id,
        planType: isMonthly ? "monthly" : "yearly",
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("구독 처리 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
