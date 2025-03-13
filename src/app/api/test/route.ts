import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 환경 변수 확인
    const dbUrl = process.env.DATABASE_URL ? "설정됨" : "설정되지 않음";

    // 데이터베이스 연결 테스트
    let dbConnection = "실패";
    let productCount = 0;

    try {
      await prisma.$connect();
      dbConnection = "성공";

      // 간단한 쿼리 실행
      const count = await prisma.product.count();
      productCount = count;
    } catch (dbError) {
      console.error("DB 연결 테스트 오류:", dbError);
      dbConnection = `실패: ${
        dbError instanceof Error ? dbError.message : String(dbError)
      }`;
    }

    // 응답 반환
    return NextResponse.json({
      status: "정상",
      environment: process.env.NODE_ENV,
      databaseUrl: dbUrl,
      databaseConnection: dbConnection,
      productCount: productCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("테스트 API 오류:", error);
    return NextResponse.json(
      {
        status: "오류",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
