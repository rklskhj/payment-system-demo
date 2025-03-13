import { PrismaClient } from "@prisma/client";

// PrismaClient 인스턴스화 시 로그 레벨 설정
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["query", "error", "warn"],
  });
};

// 글로벌 객체에 prisma 인스턴스 저장
const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

// 개발 환경에서는 핫 리로딩 시 여러 인스턴스가 생성되는 것을 방지
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
