export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p>© 2023 결제 시스템 데모. All rights reserved.</p>
        <p className="mt-2 text-gray-400">
          Next.js, Prisma, PostgreSQL, Stripe를 활용한 결제 시스템 데모 프로젝트
        </p>
      </div>
    </footer>
  );
}
