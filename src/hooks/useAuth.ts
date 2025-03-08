import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      console.error("로그인 중 오류가 발생하였습니다.", err);
      setError("로그인 중 오류가 발생하였습니다.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
  };

  return {
    user: session?.user, // 세션이 있으면 user 객체, 없으면 undefined
    isAuthenticated: !!session?.user, // 세션이 있으면 true, 없으면 false
    isLoading: status === "loading" || loading, // 로딩 상태
    error, // 오류 메시지
    login, // 로그인 함수
    logout, // 로그아웃 함수
  };
}
