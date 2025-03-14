import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("등록되지 않은 이메일입니다.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("리디렉션 콜백 호출됨:", { url, baseUrl });

      // baseUrl을 현재 호스트 기반으로 동적으로 설정
      const currentHost =
        process.env.VERCEL_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";

      console.log("현재 호스트:", currentHost);

      // 상대 경로(/로 시작)인 경우 완전한 URL로 변환
      if (url.startsWith("/")) {
        const fullUrl = `${
          currentHost.startsWith("http")
            ? currentHost
            : `https://${currentHost}`
        }${url}`;
        console.log("상대 경로를 절대 경로로 변환:", fullUrl);
        return fullUrl;
      }

      // URL이 유효하면 그대로 사용
      try {
        new URL(url);
        console.log("유효한 URL 그대로 사용:", url);
        return url;
      } catch (error) {
        // URL이 유효하지 않으면 기본 URL + 대시보드로 리디렉션
        console.log("유효하지 않은 URL, 기본값으로 대체:", error);
        const fallbackUrl = `${
          currentHost.startsWith("http")
            ? currentHost
            : `https://${currentHost}`
        }/dashboard`;
        console.log("유효하지 않은 URL, 기본값으로 대체:", fallbackUrl);
        return fallbackUrl;
      }
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
