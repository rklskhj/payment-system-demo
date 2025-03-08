import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 헤더 섹션 */}
      <header className="py-16 text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          결제 시스템 데모
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          안전하고 편리한 결제 시스템을 경험해보세요. 일회성 결제와 구독 모델을
          지원합니다.
        </p>
      </header>

      {/* 메인 섹션 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 상품 및 구독 섹션 */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* 일회성 결제 상품 */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">
              일회성 결제
            </h2>
            <p className="text-gray-600 mb-6">
              원하는 상품을 선택하고 간편하게 결제하세요.
            </p>
            <Link
              href="/products"
              className="block text-center bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition"
            >
              상품 보기
            </Link>
          </div>

          {/* 구독 상품 */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">
              구독 서비스
            </h2>
            <p className="text-gray-600 mb-6">
              월간 또는 연간 구독으로 더 많은 혜택을 누리세요.
            </p>
            <Link
              href="/subscriptions"
              className="block text-center bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition"
            >
              구독 플랜 보기
            </Link>
          </div>
        </div>

        {/* 사용자 대시보드 링크 */}
        {session?.user ? (
          <div className="text-center mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              내 계정 관리
            </h2>
            <Link
              href="/dashboard"
              className="inline-block bg-gray-800 text-white py-3 px-8 rounded-md hover:bg-gray-900 transition"
            >
              대시보드로 이동
            </Link>
          </div>
        ) : (
          <div className="text-center mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              계정 로그인
            </h2>
            <Link
              href="/auth/login"
              className="inline-block bg-gray-800 text-white py-3 px-8 rounded-md hover:bg-gray-900 transition"
            >
              로그인하기
            </Link>
          </div>
        )}

        {/* 기능 소개 섹션 */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">
              안전한 결제
            </h3>
            <p className="text-gray-700">
              Stripe를 통한 안전한 결제 처리로 개인 정보를 보호합니다.
            </p>
          </div>
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">
              구독 관리
            </h3>
            <p className="text-gray-700">
              언제든지 구독을 시작, 변경, 취소할 수 있는 유연한 관리 시스템을
              제공합니다.
            </p>
          </div>
          <div className="p-6 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">
              영수증 발급
            </h3>
            <p className="text-gray-700">
              모든 결제에 대한 영수증을 즉시 발급받고 이메일로 전송받을 수
              있습니다.
            </p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>© 2023 결제 시스템 데모. 모든 권리 보유.</p>
          <p className="mt-2 text-gray-400">
            이 프로젝트는 학습 및 포트폴리오 목적으로 제작되었습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
