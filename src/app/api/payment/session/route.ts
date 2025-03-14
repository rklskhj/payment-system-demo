import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";

// Stripe 인스턴스 생성
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET(request: NextRequest) {
  try {
    // 세션 유효성 검사 (선택적)
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    // 쿼리 파라미터에서 session_id 가져오기
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { message: "session_id가 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    try {
      // Stripe에서 세션 정보 가져오기
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        sessionId,
        {
          expand: ["payment_intent", "subscription"], // payment_intent와 subscription 정보도 함께 가져오기
        }
      );

      // 세션의 mode에 따라 다른 ID 사용
      let paymentId = sessionId; // 기본값은 세션 ID

      if (
        checkoutSession.mode === "payment" &&
        checkoutSession.payment_intent
      ) {
        // 일회성 결제인 경우 payment_intent ID 사용
        paymentId =
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent.id;
      } else if (
        checkoutSession.mode === "subscription" &&
        checkoutSession.subscription
      ) {
        // 구독 결제인 경우 subscription ID 사용
        paymentId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id;
      }

      // 응답 데이터 구성
      const responseData = {
        id: checkoutSession.id,
        mode: checkoutSession.mode,
        payment_intent: checkoutSession.payment_intent
          ? typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent.id
          : null,
        subscription: checkoutSession.subscription
          ? typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id
          : null,
        payment_id: paymentId, // 결제 유형에 따른 적절한 ID
        status: checkoutSession.status,
        customer: checkoutSession.customer,
        metadata: checkoutSession.metadata,
      };

      return NextResponse.json(responseData);
    } catch (stripeError) {
      console.error("Stripe 세션 조회 오류:", stripeError);
      return NextResponse.json(
        { message: "Stripe 세션 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("서버 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
