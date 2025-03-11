import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* 메인 콘텐츠 */}
      <main className="flex-grow">
        {/* 히어로 섹션 */}
        <section className="bg-indigo-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Next.js와 Stripe로 구현한 결제 시스템
            </h2>
            <p className="text-xl mb-8">
              일회성 결제와 구독 서비스를 지원하는 완벽한 결제 시스템 데모
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/products"
                className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100"
              >
                상품 둘러보기
              </Link>
              <Link
                href="/subscriptions"
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-600"
              >
                구독 서비스 보기
              </Link>
            </div>
          </div>
        </section>

        {/* 기능 소개 섹션 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">일회성 결제</h3>
                <p className="text-gray-600 mb-4">
                  Stripe를 통한 안전한 일회성 결제 처리. 신용카드, 체크카드 등
                  다양한 결제 수단 지원.
                </p>
                <Link
                  href="/products"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  상품 보기 →
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">구독 서비스</h3>
                <p className="text-gray-600 mb-4">
                  월간, 연간 구독 서비스 지원. 자동 결제 및 구독 관리 기능 제공.
                </p>
                <Link
                  href="/subscriptions"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  구독 서비스 보기 →
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">사용자 대시보드</h3>
                <p className="text-gray-600 mb-4">
                  결제 내역 및 구독 정보 확인. 구독 취소 및 관리 기능 제공.
                </p>
                <Link
                  href="/dashboard"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  대시보드 보기 →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}
