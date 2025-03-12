import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// bcrypt를 사용한 비밀번호 해싱
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function main() {
  // 기존 데이터 삭제 (선택 사항)
  // 참조하는 테이블부터 먼저 삭제
  await prisma.order.deleteMany();
  // 그 다음 User 테이블 삭제
  await prisma.user.deleteMany();
  await prisma.product.deleteMany({});

  console.log("Seeding database...");

  // 초기 사용자 데이터 생성
  const user1 = await prisma.user.create({
    data: {
      email: "user1@example.com",
      name: "사용자1",
      password: await hashPassword("password123"),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@example.com",
      name: "사용자2",
      password: await hashPassword("password123"),
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "관리자",
      password: await hashPassword("admin123"),
    },
  });

  // 상품 데이터 생성
  const product1 = await prisma.product.create({
    data: {
      name: "기본 구독",
      description: "월간 기본 구독 서비스",
      price: 9900,
      imageUrl: "/images/basic-subscription.png",
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "프리미엄 구독",
      description: "월간 프리미엄 구독 서비스, 모든 기능 포함",
      price: 19900,
      imageUrl: "/images/premium-subscription.png",
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "일회성 결제 상품",
      description: "특별 콘텐츠 패키지",
      price: 29900,
      imageUrl: "/images/one-time-package.png",
    },
  });

  console.log("Database seeding completed.");
  console.log({ user1, user2, admin });
  console.log({ product1, product2, product3 });
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // 데이터베이스 연결 종료
    await prisma.$disconnect();
  });
