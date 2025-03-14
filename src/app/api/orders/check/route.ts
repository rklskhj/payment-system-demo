import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // URL 쿼리에서 session_id 가져오기
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { message: "세션 ID가 필요합니다." },
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

    // 주문 확인 - sessionId 또는 sessionId로 시작하는 paymentId를 가진 주문 찾기
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        OR: [
          { paymentId: sessionId },
          { paymentId: { startsWith: sessionId } }, // sessionId로 시작하는 경우도 확인
        ],
      },
    });

    if (order) {
      return NextResponse.json({
        exists: true,
        order: {
          id: order.id,
          status: order.status,
          paymentId: order.paymentId,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("주문 확인 오류:", error);
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
