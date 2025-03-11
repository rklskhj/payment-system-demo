"use client";

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

  const handleSignOut = async (options = { callbackUrl: "/" }) => {
    await signOut(options);
  };

  return {
    session,
    user: session?.user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading" || loading,
    error,
    login,
    signOut: handleSignOut,
    logout: handleSignOut, // 두 가지 이름으로 제공하여 호환성 유지
  };
}
