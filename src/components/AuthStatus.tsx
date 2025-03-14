"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
export default function AuthStatus() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  if (isAuthenticated) {
    return (
      <div className="flex space-x-4">
        <Link
          href="/dashboard"
          className="text-indigo-600 hover:text-indigo-800"
        >
          마이페이지
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-gray-600 hover:text-gray-800"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <>
      {!pathname?.includes("/login") ? (
        <div className="flex space-x-4">
          <Link href="/login" className="text-indigo-600 hover:text-indigo-800">
            로그인
          </Link>
          <Link href="/register" className="text-gray-600 hover:text-gray-800">
            회원가입
          </Link>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
