# 🌏 Payment System Demo

Next.js와 Stripe를 활용한 결제 시스템 데모 프로젝트입니다. 안전하고 효율적인 글로벌 결제 처리를 구현한 풀스택 애플리케이션입니다.

👨‍🔧지속적인 업데이트 예정입니다.

## 🌐 URL

https://payment-system-demo.vercel.app/

## 🎙️ Next.js 선택 이유

- `App Router`를 활용한 서버 컴포넌트와 클라이언트 컴포넌트의 효율적인 관리
- `서버 사이드 렌더링(SSR)`을 통한 초기 로딩 성능 최적화
- `TypeScript`와의 완벽한 통합으로 타입 안정성 확보
- `Vercel` 배포 플랫폼과의 원활한 통합 및 자동화된 배포 프로세스

## 🛠️ Tech Stack

| Area                 | Tech Stack                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=Next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=Tailwind-CSS&logoColor=white) |
| **Backend/DB**       | ![Next.js](https://img.shields.io/badge/Next.js_API-000000?style=for-the-badge&logo=Next.js&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=Prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=PostgreSQL&logoColor=white)               |
| **Auth**             | ![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=NextAuth.js&logoColor=white) ![Bcrypt](https://img.shields.io/badge/Bcrypt-003A70?style=for-the-badge&logo=Lock&logoColor=white)                                                                                                                           |
| **Payment**          | ![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=Stripe&logoColor=white)                                                                                                                                                                                                                                              |
| **State Management** | ![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=React-Query&logoColor=white) ![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=React&logoColor=white)                                                                                                                        |
| **Deployment**       | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=Vercel&logoColor=white)                                                                                                                                                                                                                                              |

## 🖼️ 주요 기능

- `일회성 결제` 및 `구독 결제` 처리
- `Webhook` 이벤트 기반 결제 상태 관리
- `중복 결제 방지` 시스템
- `결제 완료 시에만 데이터 생성`하는 효율적인 설계
- `다양한 결제 수단` 지원
- `환불 및 부분 환불` 처리

## 📦 Project Structure

```
📦 src
├── 📂 app
│   ├── 📂 api              # API 라우트
│   │   ├── 📂 auth         # 인증 관련 API
│   │   ├── 📂 payments     # 결제 관련 API
│   │   └── 📂 webhooks     # Webhook 핸들러
│   ├── 📂 checkout         # 결제 페이지
│   ├── 📂 dashboard        # 사용자 대시보드
│   └── 📂 subscription     # 구독 관리 페이지
├── 📂 components          # 재사용 가능한 컴포넌트
├── 📂 lib                # 유틸리티 및 헬퍼 함수
│   ├── 📂 stripe         # Stripe 관련 유틸리티
│   └── 📂 db             # 데이터베이스 유틸리티
├── 📂 prisma             # Prisma 스키마 및 마이그레이션
└── 📂 public             # 정적 파일
```

## 🚀 Getting Started

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 데이터베이스 마이그레이션
npx prisma migrate dev
```

## 📝 주요 업무 및 성과

- **Stripe 결제 게이트웨이 통합**

  - 일회성 결제 및 구독 기반 결제 프로세스 개발
  - Webhook을 활용한 비동기 결제 이벤트 처리 구현

- **Next.js 14와 Prisma ORM 활용**

  - 타입 안전성이 보장된 데이터베이스 인터페이스 구축
  - 서버리스 API 엔드포인트 설계 및 구현

- **Vercel 플랫폼 CI/CD 최적화**

  - GitHub 저장소 연동을 통한 자동 배포 환경 구성
  - 테스트 및 빌드 과정 자동화로 배포 안정성 향상

- **TypeScript와 Zod를 활용한 타입 안정성**
  - 클라이언트-서버 간 데이터 유효성 검증 일관성 유지
  - 개발 초기 단계에서 오류 감지 및 해결

## 🔧 문제 해결 사례

- **Stripe Webhook 연동 문제 해결**

  - 로컬 개발 환경에서 Stripe CLI를 활용한 webhook 테스트 환경 구축
  - 서명 검증 로직 개선으로 결제 이벤트 처리 신뢰성 확보

- **CI/CD 파이프라인 최적화**

  - GitHub Actions 워크플로우 최적화로 불필요한 테스트 단계 제거
  - 안정적인 자동 배포 환경 구축

- **애플리케이션 빌드 성능 최적화**
  - 빌드 시간 36% 단축 (55초 → 35초)
  - 코드 분할 및 번들 크기 최적화로 효율적인 자산 관리

## 📚 프로젝트 성과 및 배운 점

- 현대적인 결제 시스템 아키텍처에 대한 이해 및 구현 경험 습득
- Vercel 및 GitHub 연동을 통한 효율적인 CI/CD 파이프라인 구축 역량 강화
- Stripe API 및 Webhook을 활용한 안전한 결제 처리 노하우 획득
- 서버리스 아키텍처 기반의 확장 가능한 애플리케이션 설계 경험
