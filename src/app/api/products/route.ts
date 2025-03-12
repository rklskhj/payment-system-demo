import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");

    let whereClause = {};

    // 타입별 필터링
    if (type === "one-time") {
      whereClause = {
        name: {
          contains: "일회성",
        },
      };
    } else if (type === "subscription") {
      whereClause = {
        name: {
          contains: "구독",
        },
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("상품 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "상품 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
