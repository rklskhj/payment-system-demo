import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// 이 라우트가 동적임을 Next.js에 알립니다
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession();

    // 환경 변수에서 민감한 정보 제외하고 반환
    const safeEnvVars = {
      NODE_ENV: process.env.NODE_ENV || "undefined",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "undefined",
      VERCEL_URL: process.env.VERCEL_URL || "undefined",
      VERCEL_ENV: process.env.VERCEL_ENV || "undefined",
      VERCEL: process.env.VERCEL || "undefined",
    };

    return NextResponse.json({
      env: safeEnvVars,
      session: session
        ? {
            // 민감한 정보 제외
            user: session.user
              ? {
                  name: session.user.name,
                  email: session.user.email,
                }
              : null,
            expires: session.expires,
          }
        : null,
    });
  } catch (error) {
    console.error("디버그 API 오류:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
