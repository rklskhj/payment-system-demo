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

  const token = await getToken({ req: request });
  const origin = request.nextUrl.origin;

  console.log("미들웨어 토큰 검증:", {
    path,
    hasToken: !!token,
    tokenDetails: token ? "Token exists" : "No token",
    currentOrigin: origin,
  });

  if (isProtectedPath) {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!token) {
      console.log("인증 실패: 토큰이 없습니다.");

      // 현재 origin 사용
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("callbackUrl", path);

      // 로그에 더 많은 정보 추가
      console.log(`리디렉션 생성: ${loginUrl.toString()}`, {
        origin,
        path,
        fullUrl: loginUrl.toString(),
      });

      // 쿠키가 제대로 전송되었는지 확인
      console.log("쿠키 확인:", request.cookies.getAll());

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: ["/dashboard/:path*", "/checkout/:path*", "/subscriptions/:path*"],
};
