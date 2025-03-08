import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { CheckoutRequest, CheckoutResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "인증이 필요합니다.",
        },
        { status: 401 }
      );
    }

    const { productId, successUrl, cancelUrl } =
      (await request.json()) as CheckoutRequest;

    // 상품 정보 조회
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "상품을 찾을 수 없습니다.",
        },
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
              description: product.description || "",
            },
            unit_amount: Math.round(product.price * 100), // Stripe는 최소 단위로 금액 처리 (원 -> 전)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url:
        successUrl ||
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/checkout/cancel`,
      metadata: {
        userId: session.user.id || "",
        productId: product.id,
      },
    } as Stripe.Checkout.SessionCreateParams);

    // 주문 정보 저장
    await prisma.order.create({
      data: {
        userId: session.user.id || "",
        productId: product.id,
        amount: product.price,
        status: "pending",
        paymentId: stripeSession.id,
      },
    });

    const response: CheckoutResponse = {
      url: stripeSession.url || "",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("결제 처리 중 오류:", error);
    return NextResponse.json(
      {
        error: "결제 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
