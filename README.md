This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 결제 시스템 데모

이 프로젝트는 Next.js와 Stripe를 사용한 결제 시스템 데모입니다.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 환경 설정

1. `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
CRON_API_KEY="your-cron-api-key"
```

2. 의존성 설치:

```bash
npm install
```

3. 데이터베이스 마이그레이션:

```bash
npx prisma migrate dev
```

4. 개발 서버 실행:

```bash
npm run dev
```

## 주문 만료 처리 설정

주문 만료 처리를 위해 cron job을 설정해야 합니다. 다음과 같은 방법으로 설정할 수 있습니다:

### 클라우드 서비스 사용 (권장)

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [GitHub Actions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [AWS Lambda with EventBridge](https://aws.amazon.com/eventbridge/)

### 수동 설정 예시 (Linux/Unix)

crontab에 다음 항목을 추가합니다:

```
*/10 * * * * curl -X POST https://your-domain.com/api/orders/cleanup -H "Authorization: Bearer your-cron-api-key"
```

이 설정은 10분마다 만료된 주문을 처리합니다.

## 주요 기능

- 일회성 결제 처리
- 구독 결제 처리
- 결제 상태 관리 (pending, completed, failed, expired)
- 중복 결제 방지
- 주문 만료 자동 처리

## 기술 스택

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- Stripe API
- NextAuth.js

## 개발자 가이드

자세한 개발 및 유지보수 가이드는 [개발자 가이드](./docs/DEVELOPER_GUIDE.md)를 참조하세요.
