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
git clone https://github.com/mirunamu00/usefy.git
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
# packages/hooks 폴더에 새 훅 폴더 생성
mkdir packages/hooks/use-my-hook
cd packages/hooks/use-my-hook
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
    "url": "https://github.com/mirunamu00/usefy.git",
    "directory": "packages/hooks/use-my-hook"
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

**packages/hooks/package.json:**

```json
{
  "dependencies": {
    "@usefy/use-my-hook": "workspace:*"
  }
}
```

**packages/hooks/src/index.ts:**

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

### CI/CD 자동 배포 프로세스

이 프로젝트는 **GitHub Actions**를 통한 자동 배포 시스템을 사용합니다.

### 전체 흐름

```
개발 → changeset 작성 → PR 생성 → 머지 → 자동 배포
```

### 1. 피처 브랜치에서 개발

```bash
# 새 브랜치 생성
git checkout -b feat/add-new-feature

# 코드 작성 및 테스트
# ...
```

### 2. Changeset 생성 (중요!)

변경사항을 기록하는 단계입니다. **이 단계를 건너뛰면 배포되지 않습니다.**

```bash
pnpm changeset
```

**프롬프트 안내:**

1. **Which packages would you like to include?**

   - 변경된 패키지를 스페이스바로 선택
   - Enter로 다음 단계

2. **Which packages should have a major bump?**

   - Breaking changes가 있으면 선택
   - 없으면 Enter

3. **Which packages should have a minor bump?**

   - 새로운 기능 추가면 선택
   - 없으면 Enter (patch로 진행)

4. **Please enter a summary for this change:**
   - 변경 내용을 명확하게 작성
   - 이 내용이 CHANGELOG.md와 릴리즈 노트에 표시됩니다
   - 예시: "feat: add timeout option to useCopyToClipboard"

**버전 타입:**

- `patch` (0.0.1 → 0.0.2): 버그 수정, 문서 수정, 작은 개선
- `minor` (0.1.0 → 0.2.0): 새 기능 추가 (하위 호환 유지)
- `major` (1.0.0 → 2.0.0): Breaking changes (기존 API 변경)

**Changeset Summary 작성 팁:**

```bash
# ✅ 좋은 예시
"feat: add timeout option for auto-reset"
"fix: clipboard fallback for legacy browsers"
"docs: update installation guide"

# ❌ 나쁜 예시
"update"
"fix bug"
"change"
```

### 3. 커밋 & 푸시

```bash
# changeset 파일 포함하여 커밋
git add .
git commit -m "feat: add new feature"
git push origin feat/add-new-feature
```

### 4. Pull Request 생성

```
1. GitHub 저장소로 이동
2. "Compare & pull request" 버튼 클릭
3. PR 제목과 설명 작성
4. "Create pull request" 클릭
```

### 5. PR 리뷰 및 머지

```
1. 코드 리뷰 진행
2. 승인 후 "Merge pull request" 클릭
3. "Confirm merge" 클릭
```

### 6. 자동 배포 프로세스 시작

**master 브랜치에 머지되면 자동으로:**

```
1. GitHub Actions 실행
2. Changeset 파일 감지
3. "Version Packages" PR 자동 생성
   - 모든 package.json 버전 업데이트
   - CHANGELOG.md 생성/업데이트
   - changeset 파일 삭제
```

### 7. Version Packages PR 확인 및 머지

```
1. Pull requests 탭에서 "chore: release packages" PR 확인
2. Files changed 탭에서 버전 변경사항 확인
   - package.json 버전 업데이트
   - CHANGELOG.md 업데이트
3. 확인 후 "Merge pull request" 클릭
```

### 8. 자동 배포 완료

**Version Packages PR이 머지되면 자동으로:**

```
1. GitHub Actions 실행
2. 모든 패키지 빌드
3. npm에 배포
4. Git tags 생성
5. 배포 완료! 🚀
```

### 배포 확인

**npm에서 확인:**

```bash
# 특정 패키지 버전 확인
npm view @usefy/use-copy-to-clipboard version

# 또는 웹에서
# https://www.npmjs.com/package/@usefy/use-copy-to-clipboard
```

**로컬에서 태그 확인:**

```bash
git checkout master
git pull
git fetch --tags
git tag
```

---

## 버전 관리 정책

이 프로젝트는 **고정 버전(Fixed Versioning)** 정책을 사용합니다.

### 특징

- 모든 `@usefy/*` 패키지가 **동일한 버전**을 공유
- 하나의 패키지가 변경되면 모든 패키지의 버전이 함께 올라감
- 사용자가 여러 훅을 함께 사용할 때 버전 호환성 보장

### 예시

```
현재 버전: 모든 패키지 0.1.0

use-counter 패키지만 수정 (patch)
→ 모든 패키지가 0.1.1로 업데이트

use-debounce에 새 기능 추가 (minor)
→ 모든 패키지가 0.2.0으로 업데이트
```

---

## 중요 사항

### ⚠️ Changeset 없이 머지하면?

- "Version Packages" PR이 생성되지 않음
- 배포가 진행되지 않음
- 의도적으로 배포하지 않을 경우 (문서 수정, CI 설정 변경 등)에만 사용

### 💡 여러 PR을 한번에 배포

여러 개의 PR을 연속으로 머지하면:

```
1. feat/hook-a 머지 (changeset 포함)
   → "Version Packages" PR 생성

2. feat/hook-b 머지 (changeset 포함)
   → 기존 "Version Packages" PR에 변경사항 추가

3. feat/hook-c 머지 (changeset 포함)
   → 기존 "Version Packages" PR에 또 추가

4. "Version Packages" PR 머지
   → 모든 변경사항 한번에 배포!
```

### 🔄 배포 브랜치 관리

- `changeset-release/master` 브랜치가 임시로 생성됩니다
- PR 머지 후 자동 삭제 권장
- **Settings → General → "Automatically delete head branches" 체크**

---

## 문제 해결

### GitHub Actions 권한 오류

```
Error: GitHub Actions is not permitted to create or approve pull requests.
```

**해결:**

```
1. Settings → Actions → General
2. "Workflow permissions" 섹션
3. ✅ "Read and write permissions" 선택
4. ✅ "Allow GitHub Actions to create and approve pull requests" 체크
5. "Save" 클릭
```

### pnpm 버전 불일치

```
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile"
```

**해결:**

```bash
# 로컬 pnpm 버전 확인
pnpm --version

# 루트 package.json에 명시
{
  "packageManager": "pnpm@9.15.0"
}

# lock 파일 재생성
rm pnpm-lock.yaml
pnpm install
```

### npm 배포 권한 오류

```
403 Forbidden - You do not have permission to publish
```

**해결:**

1. npmjs.com에서 Access Token 생성
   - Classic Token 또는 Granular Access Token (Read and write 권한)
2. GitHub Repository Secrets에 `NPM_TOKEN` 등록

---

## 유용한 명령어

| 명령어             | 설명                             |
| ------------------ | -------------------------------- |
| `pnpm build`       | 모든 패키지 빌드                 |
| `pnpm test`        | 모든 테스트 실행                 |
| `pnpm changeset`   | 변경사항 기록 (배포 전 필수!)    |
| `pnpm storybook`   | 스토리북 실행                    |
| `git fetch --tags` | 배포 후 생성된 Git tags 가져오기 |

---

## 참고 자료

- [Changesets 공식 문서](https://github.com/changesets/changesets)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [npm 배포 가이드](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
