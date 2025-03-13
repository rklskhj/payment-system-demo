# 결제 시스템 데모

Next.js와 Stripe를 활용한 결제 시스템 데모 프로젝트입니다.

## 주요 기능

- 일회성 결제 처리
- 구독 결제 처리
- Webhook 이벤트 기반 결제 상태 관리
- 중복 결제 방지
- 결제 완료 시에만 데이터 생성하는 효율적인 설계

## 기술 스택

- Next.js 14
- TypeScript
- Prisma ORM
- PostgreSQL
- Stripe API
- NextAuth.js
- TailwindCSS

## 시작하기

### 환경 설정

1. `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```
DATABASE_URL="데이터베이스-URL"
NEXTAUTH_SECRET="인증-시크릿-키"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="스트라이프-시크릿-키"
STRIPE_WEBHOOK_SECRET="스트라이프-웹훅-시크릿"
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

5. 브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속

## Stripe Webhook 설정

로컬 개발 환경에서 Stripe webhook을 테스트하려면:

1. [Stripe CLI](https://stripe.com/docs/stripe-cli)를 설치합니다
2. 다음 명령어로 webhook을 로컬 환경으로 포워딩합니다:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

3. Stripe CLI에서 제공하는 webhook 시크릿을 `.env.local` 파일의 `STRIPE_WEBHOOK_SECRET`에 설정합니다

## 배포

Vercel을 통해 쉽게 배포할 수 있습니다:

1. GitHub 저장소에 프로젝트 업로드
2. Vercel 계정과 연결
3. 환경 변수 설정
4. 자동 배포 설정

## 개발자 가이드

자세한 개발 및 유지보수 가이드는 [개발자 가이드](./docs/DEVELOPER_GUIDE.md)를 참조하세요.
