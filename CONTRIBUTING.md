# 기여 가이드 (Contributing Guide)

## 목차

- [개발 환경 설정](#개발-환경-설정)
- [새로운 훅 추가하기](#새로운-훅-추가하기)
- [기존 훅 수정하기](#기존-훅-수정하기)
- [배포하기](#배포하기)

---

## 개발 환경 설정

### 요구 사항

- Node.js >= 18
- pnpm 9.x

### 설치

```bash
# 저장소 클론
git clone https://github.com/geon0529/usefy.git
cd usefy

# 의존성 설치
pnpm install

# 빌드
pnpm build
```

### 개발 명령어

```bash
pnpm dev          # 모든 패키지 watch 모드
pnpm test         # 테스트 실행
pnpm test:ui      # 테스트 UI 모드
pnpm typecheck    # 타입 체크
pnpm storybook    # 스토리북 실행
```

---

## 새로운 훅 추가하기

### 1. 패키지 폴더 생성

```bash
# packages 폴더에 새 훅 폴더 생성
mkdir packages/use-my-hook
cd packages/use-my-hook
```

### 2. package.json 생성

```json
{
  "name": "@usefy/use-my-hook",
  "version": "0.0.1",
  "description": "A React hook for ...",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^16.3.1",
    "@types/react": "^19.0.0",
    "jsdom": "^27.3.0",
    "rimraf": "^6.0.1",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^4.0.16"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/geon0529/usefy.git",
    "directory": "packages/use-my-hook"
  },
  "license": "MIT",
  "keywords": ["react", "hooks"]
}
```

### 3. 필요한 설정 파일 생성

**tsconfig.json:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**tsup.config.ts:**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

**vitest.config.ts:**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

**vitest.setup.ts:**

```ts
import "@testing-library/jest-dom/vitest";
```

### 4. 훅 구현

**src/index.ts:**

```ts
export { useMyHook } from "./useMyHook";
```

**src/useMyHook.ts:**

```ts
import { useState } from "react";

export function useMyHook() {
  // 훅 구현
}
```

**src/useMyHook.test.ts:**

```ts
import { renderHook } from "@testing-library/react";
import { useMyHook } from "./useMyHook";

describe("useMyHook", () => {
  it("should work", () => {
    const { result } = renderHook(() => useMyHook());
    // 테스트 작성
  });
});
```

### 5. 통합 패키지에 추가

**packages/usefy/package.json:**

```json
{
  "dependencies": {
    "@usefy/use-my-hook": "workspace:*"
  }
}
```

**packages/usefy/src/index.ts:**

```ts
export { useMyHook } from "@usefy/use-my-hook";
```

### 6. 스토리북 스토리 추가 (선택)

**apps/storybook/src/stories/useMyHook.stories.tsx**

### 7. 의존성 설치 & 빌드

```bash
pnpm install
pnpm build
```

---

## 기존 훅 수정하기

### 1. 코드 수정

```bash
# 해당 패키지로 이동
cd packages/use-counter

# 코드 수정...
```

### 2. 테스트 실행

```bash
pnpm test
```

### 3. 타입 체크

```bash
pnpm typecheck
```

---

## 배포하기

### 전체 흐름

```
코드 수정 → changeset → version → release
```

### 1. Changeset 생성 (변경사항 기록)

```bash
pnpm changeset
```

**프롬프트 안내:**

1. **Which packages?** → 변경된 패키지 선택 (스페이스바)
2. **Major bump?** → Breaking change면 선택, 아니면 Enter
3. **Minor bump?** → 새 기능이면 선택, 아니면 Enter
4. **Summary** → 변경 내용 입력 (예: "Add new feature")

**버전 타입:**

- `patch` (0.0.1 → 0.0.2): 버그 수정, 문서 수정
- `minor` (0.1.0 → 0.2.0): 새 기능 추가 (하위 호환)
- `major` (1.0.0 → 2.0.0): Breaking changes

### 2. 버전 업데이트

```bash
pnpm run version
```

이 명령어가 수행하는 작업:

- `package.json` 버전 업데이트
- `CHANGELOG.md` 생성/업데이트
- `.changeset/` 폴더의 changeset 파일 삭제

### 3. 커밋 & 푸시

```bash
git add .
git commit -m "chore: release"
git push
```

### 4. 배포

```bash
pnpm release
```

이 명령어가 수행하는 작업:

- 모든 패키지 빌드 (`pnpm build`)
- npm에 배포 (`changeset publish`)

---

## 버전 관리 정책

이 프로젝트는 **고정 버전(Fixed Versioning)** 정책을 사용합니다.

- 모든 `@usefy/*` 패키지가 **동일한 버전**을 공유
- 하나의 패키지가 변경되면 모든 패키지의 버전이 함께 올라감

---

## 문제 해결

### npm 배포 권한 오류

```
403 Forbidden - Two-factor authentication required
```

**해결:** npm에서 Granular Access Token 생성 시 "Bypass 2FA" 옵션 체크

### Changeset 오류

```
The package "@usefy/root" is specified in ignore but not found
```

**해결:** private 패키지는 자동으로 무시되므로 `ignore`에서 제거

---

## 유용한 명령어

| 명령어             | 설명             |
| ------------------ | ---------------- |
| `pnpm build`       | 모든 패키지 빌드 |
| `pnpm test`        | 모든 테스트 실행 |
| `pnpm changeset`   | 변경사항 기록    |
| `pnpm run version` | 버전 업데이트    |
| `pnpm release`     | 빌드 & 배포      |
| `pnpm storybook`   | 스토리북 실행    |
