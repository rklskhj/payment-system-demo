"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";

// SearchParams를 사용하는 컴포넌트
function LoginForm({ defaultCallbackUrl = "/dashboard" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || defaultCallbackUrl;
  const { session } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (session && isMounted && !isLoggingIn) {
      // 로그인 중이 아니고 이미 세션이 있는 경우
      // 콜백 URL이 있는 경우 해당 URL로 리디렉션
      const redirectUrl = searchParams?.get("callbackUrl") || "/dashboard";

      // 로그인 페이지로 다시 리디렉션되는 경우를 방지
      const finalPath = redirectUrl.includes("/login")
        ? "/dashboard"
        : redirectUrl;

      // 절대 경로 구성
      const origin = window.location.origin;
      const fullRedirectUrl = `${origin}${
        finalPath.startsWith("/") ? finalPath : `/${finalPath}`
      }`;

      console.log("이미 로그인됨, 리디렉션:", fullRedirectUrl);

      toast.info("이미 로그인 상태입니다.", {
        toastId: "already-logged-in",
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
      });

      // window.location.href를 사용하여 안정적인 리디렉션
      window.location.href = fullRedirectUrl;
    }
    return () => {
      isMounted = false;
    };
  }, [session, isLoggingIn, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsLoggingIn(true);
    setError("");

    try {
      // 로그인 시도하기 전에 콜백 URL 로깅
      console.log("로그인 시도, 콜백 URL:", callbackUrl);

      // redirect: false로 설정하여 NextAuth가 자동 리디렉션하지 않도록 함
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      console.log("로그인 결과:", result);

      if (result?.error) {
        setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
        setLoading(false);
        setIsLoggingIn(false);
        return;
      }

      // 페이지 이동 전에 토스트 메시지 표시
      toast.success("로그인 성공! 이동 중...", {
        autoClose: 1500,
        position: "top-center",
      });

      // result.url이 있으면 그대로 사용 (절대 경로)
      if (result?.url) {
        console.log("결과 URL로 리디렉션:", result.url);
        window.location.href = result.url;
        return;
      }

      // result.url이 없는 경우 수동으로 URL 구성
      const origin = window.location.origin;
      // URL이 /login을 포함하면 대시보드로 리디렉션
      const path = callbackUrl.includes("/login") ? "/dashboard" : callbackUrl;
      const fullRedirectUrl = `${origin}${
        path.startsWith("/") ? path : `/${path}`
      }`;

      console.log("최종 리디렉션 URL (수동 구성):", fullRedirectUrl);
      window.location.href = fullRedirectUrl;
    } catch (error) {
      console.error("로그인 오류:", error);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              회원가입
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                이메일 주소
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>

          <div className="text-sm text-center">
            <button
              type="button"
              className="font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => {
                setEmail("user1@example.com");
                setPassword("password123");
              }}
            >
              테스트 계정으로 로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Suspense로 감싸진 메인 컴포넌트
export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex justify-center p-6">로딩 중...</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
