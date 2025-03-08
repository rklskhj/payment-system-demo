import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany(); // 모든 상품 조회
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("상품 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "상품 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
