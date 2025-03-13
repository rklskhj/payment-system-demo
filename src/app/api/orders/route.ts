import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
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

    // 사용자의 주문 목록 가져오기
    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("주문 목록 조회 오류:", error);
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      productId,
      amount,
      orderType = "one-time",
      status,
      paymentId,
      expiresAt,
    } = body;

    if (!productId || !amount) {
      return NextResponse.json(
        { message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // paymentId가 존재하면 이미 생성된 주문이 있는지 확인
    if (paymentId) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          paymentId,
        },
        include: {
          product: true,
        },
      });

      // 이미 존재하는 주문이 있으면 해당 주문 반환
      if (existingOrder) {
        console.log(`중복 주문 감지: ${paymentId} - 기존 주문 반환`);
        return NextResponse.json(existingOrder);
      }
    }

    // 주문 생성
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        productId,
        amount,
        status:
          status ||
          (orderType === "one-time" ? "pending" : "pending_subscription"),
        orderType,
        paymentId: paymentId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("주문 생성 오류:", error);
    return NextResponse.json(
      { message: "주문 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
