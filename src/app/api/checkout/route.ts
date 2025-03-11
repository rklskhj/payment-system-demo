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
const checkoutSchema = z.object({
  productId: z.string(),
});

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
    const validation = checkoutSchema.safeParse(body);
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

    // Stripe 결제 세션 생성
    const stripeSession = await stripe.checkout.sessions.create({
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
              ...(product.imageUrl && process.env.NEXTAUTH_URL
                ? {
                    images: [`${process.env.NEXTAUTH_URL}${product.imageUrl}`],
                  }
                : {}),
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?payment_success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/products?payment_canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        productId: product.id,
      },
    });

    // 주문 생성
    await prisma.order.create({
      data: {
        userId: user.id,
        productId: product.id,
        amount: product.price,
        status: "pending",
        paymentId: stripeSession.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("결제 처리 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
