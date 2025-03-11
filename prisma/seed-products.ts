import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding products...");

  // 기존 상품 데이터 삭제 (선택 사항)
  // 주의: 실제 운영 환경에서는 기존 주문이 있는 상품을 삭제하면 문제가 발생할 수 있습니다
  // await prisma.product.deleteMany({});

  // 상품 데이터 생성
  const product1 = await prisma.product.create({
    data: {
      name: "기본 구독",
      description: "월간 기본 구독 서비스",
      price: 9900,
      imageUrl: "/images/basic-subscription.jpg",
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "프리미엄 구독",
      description: "월간 프리미엄 구독 서비스, 모든 기능 포함",
      price: 19900,
      imageUrl: "/images/premium-subscription.jpg",
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "일회성 결제 상품",
      description: "특별 콘텐츠 패키지",
      price: 29900,
      imageUrl: "/images/one-time-package.jpg",
    },
  });

  // 추가 상품 데이터
  const product4 = await prisma.product.create({
    data: {
      name: "연간 구독",
      description: "연간 구독 서비스, 20% 할인 적용",
      price: 95000,
      imageUrl: "/images/annual-subscription.jpg",
    },
  });

  const product5 = await prisma.product.create({
    data: {
      name: "비지니스 구독",
      description: "비지니스 구독 서비스, 월간 비지니스 기능 포함",
      price: 199000,
      imageUrl: "/images/business-subscription.jpg",
    },
  });

  console.log("Product seeding completed.");
  console.log({ product1, product2, product3, product4, product5 });
}

main()
  .catch((e) => {
    console.error("Error during product seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // 데이터베이스 연결 종료
    await prisma.$disconnect();
  });
