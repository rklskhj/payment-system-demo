# 결제 시스템 개발자 가이드

이 문서는 결제 시스템의 개발 및 유지보수를 위한 가이드입니다.

## 아키텍처 개요

결제 시스템은 다음과 같은 구성 요소로 이루어져 있습니다:

1. **결제 API**: 사용자의 결제 요청을 처리하고 Stripe 결제 세션을 생성합니다.
2. **웹훅 처리기**: Stripe에서 발생하는 이벤트(결제 완료, 실패 등)를 처리합니다.
3. **주문 관리**: 주문 상태를 관리하고 만료된 주문을 처리합니다.
4. **구독 관리**: 구독 상태를 관리하고 갱신 처리를 합니다.

## 개발 환경 설정

1. 의존성 설치:

   ```bash
   npm install
   ```

2. 환경 변수 설정:
   `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

   ```
   DATABASE_URL="your-database-url"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   CRON_API_KEY="your-cron-api-key"
   ```

3. 데이터베이스 마이그레이션:

   ```bash
   npm run prisma:migrate
   ```

4. Prisma 클라이언트 생성:

   ```bash
   npm run prisma:generate
   ```

5. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## 스키마 변경 시 주의사항

데이터베이스 스키마를 변경할 때는 다음 단계를 따라야 합니다:

1. `prisma/schema.prisma` 파일 수정
2. 마이그레이션 생성: `npm run prisma:migrate`
3. Prisma 클라이언트 재생성: `npm run prisma:generate`
4. 타입 정의 업데이트: `src/types/index.ts` 파일 수정
5. 관련 API 및 컴포넌트 업데이트

만약 Prisma 클라이언트 생성 중 오류가 발생하면:

```bash
npm run prisma:reset
```

## 결제 프로세스 흐름

1. 사용자가 결제 요청 (`/api/checkout`)
2. 기존 pending 주문 확인
   - 유효한 주문이 있으면 재사용
   - 만료된 주문이면 상태 업데이트 후 새 주문 생성
3. Stripe 결제 세션 생성 및 사용자 리다이렉트
4. 결제 완료/실패 시 Stripe 웹훅을 통해 주문 상태 업데이트
5. 주문 만료 처리 API를 통해 오래된 pending 주문 정리

## 배포

배포 전 체크리스트:

1. 환경 변수 설정 확인
2. Stripe 웹훅 URL 설정 확인
3. 주문 만료 처리 cron job 설정 확인

## 문제 해결

### Prisma 관련 문제

1. 타입 오류가 발생하는 경우:

   ```bash
   npm run prisma:generate
   ```

2. 권한 오류가 발생하는 경우:
   ```bash
   npm run prisma:reset
   ```

### Stripe 관련 문제

1. 웹훅이 동작하지 않는 경우:

   - Stripe 대시보드에서 웹훅 설정 확인
   - 웹훅 시크릿 키 확인
   - 로그 확인

2. 결제가 완료되지 않는 경우:
   - Stripe 대시보드에서 결제 세션 상태 확인
   - 로그 확인

## 모니터링

주요 모니터링 포인트:

1. 결제 성공/실패율
2. 주문 상태 분포 (pending, completed, failed, expired)
3. 만료된 주문 수
4. API 응답 시간
5. 오류 발생 빈도
