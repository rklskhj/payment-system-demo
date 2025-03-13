import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // 보호된 경로 설정
  const protectedPaths = ["/dashboard", "/checkout"];

  // 현재 경로 확인
  const path = request.nextUrl.pathname;

  // 보호된 경로인지 확인
  const isProtectedPath = protectedPaths.some((prefix) =>
    path.startsWith(prefix)
  );

  if (isProtectedPath) {
    // JWT 토큰 확인
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: ["/dashboard/:path*", "/checkout/:path*", "/subscriptions/:path*"],
};
