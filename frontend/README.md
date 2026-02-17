# Hackathon LMS Frontend

해커톤용으로 단순화된 학습 관리 시스템(LMS) 프론트엔드입니다.

## 주요 기능

- **대시보드**: 사용자의 학습 진행 상황 및 등록된 과정 확인
- **과정 관리**: 전체 과정 목록 및 개별 과정 상세 정보
- **코드 에디터**: Monaco Editor를 활용한 인터랙티브 코딩 환경
- **간단한 UI**: Tailwind CSS를 사용한 깔끔한 인터페이스

## 기술 스택

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **에디터**: Monaco Editor
- **상태 관리**: React Hooks, Zustand (선택적)
- **쿼리 관리**: TanStack Query (선택적)

## 시작하기

### 1. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 2. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 [http://localhost:3004](http://localhost:3004)를 열어 확인하세요.

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/
│   │   ├── courses/           # 과정 관련 페이지
│   │   │   ├── [id]/         # 개별 과정 상세
│   │   │   └── page.tsx      # 전체 과정 목록
│   │   ├── editor/           # 코드 에디터 페이지
│   │   ├── layout.tsx        # 루트 레이아웃
│   │   ├── page.tsx          # 메인 대시보드
│   │   └── globals.css       # 글로벌 스타일
│   ├── components/           # 재사용 가능한 컴포넌트 (추가 예정)
│   └── lib/                  # 유틸리티 함수 (추가 예정)
├── public/                   # 정적 파일
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs

```

## 주요 페이지

- `/` - 메인 대시보드 (학습 진행 상황 및 등록 과정)
- `/courses` - 전체 과정 목록
- `/courses/[id]` - 개별 과정 상세 페이지
- `/editor` - 인터랙티브 코드 에디터

## 추가 개발 사항

해커톤에서 추가할 수 있는 기능들:

1. **백엔드 API 연동**: 실제 데이터 페칭 및 코드 실행
2. **인증 시스템**: 로그인/회원가입 기능
3. **진행 상태 저장**: 사용자별 학습 진행률 관리
4. **실시간 코드 실행**: Python 코드를 실제로 실행할 수 있는 백엔드 연동
5. **과제 제출**: 과제 업로드 및 채점 시스템
6. **댓글/질문**: 강의별 Q&A 기능

## 배포

```bash
npm run build
npm start
```

또는 Vercel, Netlify 등의 플랫폼에 배포할 수 있습니다.

## 라이선스

MIT
