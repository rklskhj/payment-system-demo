import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import stripe from "@/lib/stripe";

// 새로운 방식의 설정
export const dynamic = "force-dynamic";

// 이 API는 cron job으로 주기적으로 호출되어 만료된 주문을 처리합니다
export async function POST(request: NextRequest) {
  try {
    // API 키 검증 (보안을 위해)
    const authHeader = request.headers.get("authorization");
    if (
      !authHeader ||
      !process.env.CRON_API_KEY ||
      authHeader !== `Bearer ${process.env.CRON_API_KEY}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 만료 시간이 지났지만 아직 pending 상태인 주문 찾기
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "pending",
        expiresAt: {
          lt: new Date(), // 현재 시간보다 이전인 만료 시간
        },
      },
      select: {
        id: true,
        paymentId: true,
      },
    });

    // 만료된 주문 상태 업데이트
    if (expiredOrders.length > 0) {
      // 주문 상태 업데이트
      const updateResult = await prisma.order.updateMany({
        where: {
          id: {
            in: expiredOrders.map((order) => order.id),
          },
        },
        data: {
          status: "expired",
        },
      });

      // Stripe 세션도 만료 처리 (필요한 경우)
      for (const order of expiredOrders) {
        if (order.paymentId) {
          try {
            // Stripe 세션 상태 확인
            const session = await stripe.checkout.sessions.retrieve(
              order.paymentId
            );

            // 아직 만료되지 않은 세션이면 만료 처리
            if (session.status !== "expired" && session.status !== "complete") {
              await stripe.checkout.sessions.expire(order.paymentId);
              console.log(`Stripe 세션 만료 처리: ${order.paymentId}`);
            }
          } catch (error) {
            console.error(
              `Stripe 세션 처리 오류 (ID: ${order.paymentId}):`,
              error
            );
          }
        }
      }

      console.log(`만료된 주문 처리 완료: ${updateResult.count}개`);
    }

    return NextResponse.json({
      success: true,
      processed: expiredOrders.length,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("주문 정리 오류:", error);
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
