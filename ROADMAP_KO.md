# usefy Hooks Roadmap

> 2026년 7월, 현재의 React 19 생태계 · 이미 구현된 훅 · 주요 훅 라이브러리
> (usehooks-ts, ahooks, @mantine/hooks, react-use, @react-hookz/web)의 실제
> 수요를 반영해 **처음부터 다시 작성**했습니다. 이 문서는 앞으로 무엇을 만들지,
> 그리고 그만큼 중요하게 **무엇을 만들지 않을지**에 대한 기준(source of truth)입니다.

## 비전

usefy는 **개별 버전으로 배포되는 프로덕션급 React 훅** 모음입니다. 모든 훅은 진지한
애플리케이션이나 디자인 시스템이 의존할 수 있는 빌딩 블록입니다 — 타입 안전하고,
테스트되고, SSR-safe하며, tree-shakeable합니다. 기준은 "데모에서 동작함"이 아니라
**"컴포넌트 라이브러리가 이대로 배포해도 되는 수준"**입니다.

## 설계 원칙 (엔터프라이즈 기준선)

우리가 배포하는 모든 훅은 아래를 전부 만족해야 합니다.

1. **TypeScript 우선** — 완전한 추론, 옵션/반환 타입 export, 공개 표면에 `any` 노출
   금지. 가변 컬렉션이 foot-gun이 될 곳은 읽기 전용 반환 타입(`ReadonlyMap`,
   `readonly T[]`).
2. **SSR-safe** — `window`/`document` 가드, 서버에서는 결정적인 inert 값 반환,
   hydration mismatch 유발 금지(초기값 허용).
3. **안정적 참조** — 반환 함수는 `useCallback` 메모이제이션, 액션 묶음은 `useMemo`로
   안정화해 effect 의존성으로 안전하게 사용 가능.
4. **불필요한 리렌더 없음** — 값이 안 바뀌는 상태 업데이트는 스킵(`Object.is` /
   구조적 no-op skipping).
5. **latest-callback 패턴** — 사용자 콜백은 ref로 읽어, 핸들러가 바뀌어도 리스너를
   재등록하지 않음.
6. **React를 보완, 대체하지 않음** — React 19가 이미 제공하는 것은 재구현하지 않음
   (아래 범위 경계 참고).
7. **테스트 커버리지 ~100%**, `play` 테스트가 있는 Storybook 스토리, README 3종,
   changeset. 이 전부가 갖춰져야 훅이 "완료"된 것.

## 범위 경계 — usefy가 만들지 "않는" 것

판단(judgment)도 제품의 일부입니다. 아래 카테고리는 통째로 제외합니다.

**React 19 빌트인 (절대 재구현 금지):**
`use`, `useActionState`, `useFormStatus`, `useOptimistic`, `useId`,
`useTransition`, `useDeferredValue`, `useSyncExternalStore`, `useLayoutEffect`.
이들을 감싸는 얇은 편의 헬퍼는 가능하지만, 클론은 만들지 않습니다.

**전용 라이브러리 영역 (우리는 프리미티브만 제공, 완제품은 아님):**

| 필요 | 대신 사용 | usefy가 제공하는 것 |
| ---- | -------- | ------------------- |
| 서버 상태 / 캐싱 | TanStack Query, SWR | 단순 로컬 async용 `useAsync` |
| 폼 & 검증 | react-hook-form, TanStack Form | `useControllableState`, 필드 프리미티브 |
| 가상화 | TanStack Virtual | `useIntersectionObserver` (구현됨) |
| 애니메이션 | Framer Motion, react-spring | `useRafState`, `useReducedMotion` |
| 전역 상태 | Zustand, Jotai, Redux | `useSignal` (구현됨), 로컬 컬렉션 |
| 라우팅 / i18n / DnD | 전용 라이브러리 | — |

---

## 구현 완료 (v0.9.x)

아래 로드맵은 이들이 이미 존재한다고 가정합니다. 다시 제안하지 마세요.

- **상태 & 자료구조** — `useToggle`, `useCounter`, `useMap`, `useSet`,
  `useList`, `useQueue`, `useHistoryState`, `useLocalStorage`,
  `useSessionStorage`, `useSignal`
- **타이밍** — `useDebounce`, `useDebounceCallback`, `useThrottle`,
  `useThrottleCallback`, `useTimeout`, `useInterval`, `useTimer`
- **DOM & 이벤트** — `useEventListener`, `useOnClickOutside`,
  `useClickAnyWhere`, `useHover`, `useKeyPress`, `useIntersectionObserver`,
  `useResizeObserver`, `useWindowSize`
- **브라우저 & 디바이스** — `useCopyToClipboard`, `useGeolocation`,
  `useMemoryMonitor`
- **라이프사이클 & 흐름** — `useUnmount`, `useInit`, `useStep`

---

## 로드맵

**우선순위 범례**
- **P0** — 수요 최상 / 디자인 시스템 구축의 토대. 다음으로 구현.
- **P1** — 강하고 넓은 수요. P0 다음.
- **P2** — 가치 있으나 니치하거나 플랫폼 종속. 기회 되는 대로.

### 1. SSR & 라이프사이클

| 훅 | 우선 | 목적 & API 스케치 |
| -- | --- | ----------------- |
| `useIsClient` | **P0** | hydration 이후 클라이언트 렌더 감지. `const isClient = useIsClient()`. 클라이언트 전용 UI의 표준 SSR 가드. |
| `useIsomorphicLayoutEffect` | **P0** | 클라이언트는 `useLayoutEffect`, 서버는 `useEffect` — SSR 경고 제거. 다른 훅의 빌딩 블록. |
| `usePrevious` | **P0** | 직전 렌더의 값. `const prev = usePrevious(value)`. 비교자 옵션, ref 기반(추가 렌더 없음). |
| `useEventCallback` | **P0** | 항상 최신 props/state를 보는 안정적 콜백(커뮤니티 `useEffectEvent`). `const fn = useEventCallback(cb)`. |
| `useUpdateEffect` | **P1** | 첫 실행을 건너뛰는 `useEffect`. `useEffectOnce`/`useMount`와 짝. |
| `useMount` / `useIsFirstRender` | **P1** | `useMount(fn)`은 마운트 시 1회; `useIsFirstRender()`는 boolean 반환. 작고 매우 흔함. |
| `useIsMounted` | **P2** | 마운트 ref 가드: `const isMounted = useIsMounted()`. 탈출구(escape hatch)로 문서화 — React는 `AbortController`를 선호. 가이드와 함께 제공. |
| `useForceUpdate` | **P2** | 명령형 리렌더 트리거(interop/레거시). `const rerender = useForceUpdate()`. |
| `useLatest` | **P1** | 최신 값을 미러링하는 ref. 안정적 콜백 안에서 최신 상태를 읽을 때. `const ref = useLatest(value)`. |

### 2. 상태 & 자료구조

| 훅 | 우선 | 목적 & API 스케치 |
| -- | --- | ----------------- |
| `useControllableState` | **P0** | 모든 컴포넌트 라이브러리가 필요로 하는 제어/비제어 프리미티브. `const [v, setV] = useControllableState({ value, defaultValue, onChange })`. Radix/Mantine 패턴. |
| `useDisclosure` | **P0** | 모달·드로어·팝오버용 open/close/toggle 상태. `const [opened, { open, close, toggle }] = useDisclosure(false)`. |
| `useObjectState` | **P1** | 불변성 + reset을 갖춘 객체 부분 업데이트. `const [state, patch, reset] = useObjectState(init)`; `patch({ field })`. |
| `useStack` | **P1** | `useQueue`의 LIFO 짝. `[stack, { push, pop, peek, clear, reset }]`, `readonly T[]`, 불변, no-op skipping. |
| `useSelection` | **P1** | 리스트·테이블용 다중/단일 선택 상태. `{ selected, isSelected, toggle, selectAll, clear, isAllSelected }`. `Set` 기반. |
| `useCookie` | **P1** | 쿠키 값을 상태처럼, SSR 인지. `const [value, setValue, remove] = useCookie(key, opts)`. 스토리지 3종(local/session/cookie) 완성. |
| `useDefault` | **P2** | `null`/`undefined`로 설정 시 기본값으로 돌아가는 상태. |

### 3. 반응형 · 테마 · 접근성

| 훅 | 우선 | 목적 & API 스케치 |
| -- | --- | ----------------- |
| `useMediaQuery` | **P0** | 가장 시급한 미구현 훅. `const isWide = useMediaQuery('(min-width: 1024px)', { defaultValue, initializeWithValue })`. `matchMedia`, SSR 기본값, 리스너 정리. |
| `useReducedMotion` | **P0** | `prefers-reduced-motion`을 boolean으로. 애니메이션이 있는 모든 곳에서 접근성 필수. |
| `useDarkMode` | **P0** | 시스템 감지 + 영속화 + DOM class/attribute를 갖춘 테마 상태. `{ mode, isDark, setMode, toggle }`, `mode: 'system' \| 'light' \| 'dark'` (기존 `useTernaryDarkMode` 흡수). |
| `usePreferredColorScheme` | **P1** | 원시 `prefers-color-scheme`(`'light' \| 'dark'`). `useDarkMode`의 하부 프리미티브. |
| `useDocumentTitle` | **P0** | `document.title` 설정 + 언마운트 시 복원. `useDocumentTitle(title, { restoreOnUnmount })`. |
| `useFavicon` | **P2** | 파비콘 동적 교체. |
| `usePreferredLanguage` | **P2** | `navigator.language`/`languages` 변경에 반응. |

### 4. DOM · Ref · Observer

| 훅 | 우선 | 목적 & API 스케치 |
| -- | --- | ----------------- |
| `useMergedRefs` | **P0** | 여러 콜백/객체 ref를 한 노드로 병합 — `forwardRef` 컴포넌트에 필수. `const ref = useMergedRefs(localRef, forwardedRef)`. |
| `useMeasure` | **P1** | `ResizeObserver`로 요소 bounds(`x, y, width, height, top…`). `const [ref, bounds] = useMeasure()`. 구현된 `useResizeObserver` 위의 편의 계층. |
| `useMutationObserver` | **P1** | DOM 하위 트리 변경 관찰 — observer 3종(intersection/resize/mutation) 완성. `useMutationObserver(ref, cb, options)`. |
| `useScrollPosition` | **P1** | window/요소의 throttle된 스크롤 오프셋. `const { x, y } = useScrollPosition({ element, throttleMs })`. |
| `useScrollLock` | **P1** | body 스크롤 잠금(iOS 대응, 중첩 카운터, 위치 복원) — 모달용. `const { lock, unlock, isLocked } = useScrollLock()`. |
| `useScrollIntoView` | **P2** | 정렬 옵션과 함께 대상으로 부드럽게 스크롤. |
| `useTextSelection` | **P2** | 하위 트리 내 현재 선택된 텍스트/range. |

### 5. 인터랙션 · 제스처 · 포커스(A11y)

| 훅 | 우선 | 목적 & API 스케치 |
| -- | --- | ----------------- |
| `useHotkeys` | **P0** | `useKeyPress` 위의 고수준 단축키: 스코프, 시퀀스, `mod` 별칭, 입력 필드 가드. `useHotkeys('mod+k', handler, { enabled })`. |
| `useFocusTrap` | **P1** | 하위 트리 안에 포커스 가둠(모달/다이얼로그) — 접근성 필수. `const ref = useFocusTrap(active)`. |
| `useFocusWithin` | **P1** | 하위 트리 어딘가에 포커스가 있는지 추적. `const [ref, focused] = useFocusWithin()`. |
| `useLongPress` | **P1** | threshold + 이동 취소를 갖춘 롱프레스 제스처, 마우스 + 터치. `const bind = useLongPress(cb, { threshold })`. |
| `useInfiniteScroll` | **P1** | `IntersectionObserver` 기반 sentinel 무한 로딩. `const ref = useInfiniteScroll(loadMore, { hasMore, loading })`. |
| `usePagination` | **P1** | 페이지네이션 상태 머신. `{ page, pageCount, next, prev, setPage, range }`. |
| `usePageLeave` | **P2** | 커서가 뷰포트를 벗어남 감지(exit-intent). |

### 6. 비동기 & 데이터

| 훅 | 우선 | 목적 & API 스케치 |
| -- | --- | ----------------- |
| `useAsync` | **P0** | 단일 비동기 작업의 라이프사이클: `{ data, error, status, isLoading, execute, reset }`, `AbortController` 취소, `immediate` 옵션. 의도적으로 쿼리 캐시가 아님 — 그건 TanStack Query의 역할. |
| `useAsyncFn` | **P1** | 수동 트리거 변형, `[state, run]` 반환(이벤트 기반 호출용). |
| `usePolling` | **P1** | 비동기 fn을 인터벌로 폴링, pause/resume 및 backoff. |
| `useDebouncedState` / `useThrottledState` | **P1** | 상태 + 구현된 debounce/throttle을 짝지은 `[value, debouncedValue, setValue]` 편의 훅. |
| `useRafState` | **P1** | 업데이트를 `requestAnimationFrame`으로 배칭하는 상태 — 스크롤/리사이즈/포인터 UI에 부드러움. |
| `useAnimationFrame` | **P2** | delta time을 주는 rAF 루프, start/stop. `useAnimationFrame(({ delta }) => …)`. |

### 7. 브라우저 & 디바이스 API

| 훅 | 우선 | 목적 & API 스케치 |
| -- | --- | ----------------- |
| `useNetworkState` | **P1** | 온라인/오프라인 + Network Information(`effectiveType`, `downlink`, `saveData`). `const { online, effectiveType } = useNetworkState()`. |
| `usePageVisibility` | **P1** | Page Visibility API 기반 문서 가시성(탭 focus/blur). `const visible = usePageVisibility()`. |
| `useIdle` | **P1** | 타임아웃 후 사용자 비활성, throttle된 활동 리스너. `const idle = useIdle(60_000)`. |
| `usePermission` | **P1** | Permissions API 상태 + 실시간 갱신. `const state = usePermission({ name: 'camera' })`. |
| `useScript` | **P1** | 외부 스크립트 로드, `idle/loading/ready/error` 상태, 중복 제거, 정리. `const status = useScript(src)`. |
| `useClipboardRead` | **P2** | 클립보드 읽기/붙여넣기(구현된 `useCopyToClipboard` 확장). |
| `useShare` | **P2** | Web Share API + 지원 감지. `const { share, canShare } = useShare()`. |
| `useFullscreen` | **P2** | 요소 대상 Fullscreen API. `{ isFullscreen, enter, exit, toggle, isSupported }`. |
| `useOrientation` | **P2** | 화면 방향(`angle`, `type`). |
| `useScreen` | **P2** | `screen` 객체 정보(가용 크기, 방향). 낮은 우선순위 — `useMediaQuery`/`useWindowSize`로 대부분 커버됨. |
| `useBattery` | **P2** | Battery Status API(`level`, `charging`). |
| `useWakeLock` | **P2** | Screen Wake Lock API — 화면을 깨어 있게 유지. |
| `useMediaDevices` | **P2** | 카메라/마이크/스피커 열거. |
| `useNotification` | **P2** | Web Notifications + 권한 플로우. |
| `useBroadcastChannel` | **P2** | BroadcastChannel 기반 탭 간 메시징. |
| `useStyleTag` | **P2** | `<style>` 태그 주입/관리. |
| `useEyeDropper` | **P2** | EyeDropper API 색상 추출. |

---

## 이전 로드맵에서 제거 / 병합

| 기존 항목 | 결정 | 근거 |
| -------- | ---- | ---- |
| `useCountdown` (#22) | **제거** | 구현된 `useTimer`가 커버. |
| `useOnScreen` (#34) | **제거** | `useIntersectionObserver`와 중복. boolean 전용 편의가 필요하면 새 패키지 대신 거기에 `boolean` 반환 모드를 추가. |
| `useTernaryDarkMode` (#31) | **병합** | `useDarkMode`의 `mode: 'system' \| 'light' \| 'dark'`로 흡수. 훅 두 개가 아니라 하나. |
| `useMeasure` (#44) vs `useResizeObserver` | **유지, 재정의** | `useMeasure`는 구현된 `useResizeObserver` 위의 bounds 반환 편의 계층으로 유지. 문서에서 중복 회피. |
| `useIsMounted` (#24) | **유지(주의)** | 유지(P2)하되 탈출구로 문서화. 비동기 취소는 `AbortController` 선호. |

## 이번 로드맵의 신규 항목 (이전엔 없던 것)

현재 수요 & React 19 기반: `useMediaQuery`, `useReducedMotion`,
`useControllableState`, `useMergedRefs`, `useDisclosure`, `useHotkeys`,
`useFocusTrap`, `useFocusWithin`, `useMutationObserver`, `useScrollPosition`,
`useNetworkState`, `usePageVisibility`, `useSelection`, `useStack`, `useCookie`,
`useRafState`, `usePagination`, `useInfiniteScroll`, `usePolling`,
`useAsync`/`useAsyncFn`, `usePreferredColorScheme`, `useShare`, `useWakeLock`,
`useBroadcastChannel` 등.

---

## 권장 구현 순서 (배치)

관련 훅이 설계 결정을 공유하고 함께 배포되도록 응집된 배치로 진행합니다.

1. **SSR & 라이프사이클 코어** — `useIsClient`, `useIsomorphicLayoutEffect`,
   `usePrevious`, `useEventCallback`, `useLatest`, `useUpdateEffect`, `useMount`.
   *(작고 근본적이며 다른 훅의 선행)*
2. **반응형 & 테마** — `useMediaQuery`, `usePreferredColorScheme`,
   `useReducedMotion`, `useDarkMode`, `useDocumentTitle`.
3. **디자인 시스템 프리미티브** — `useControllableState`, `useMergedRefs`,
   `useDisclosure`.
4. **DOM & Observer** — `useMeasure`, `useMutationObserver`,
   `useScrollPosition`, `useScrollLock`.
5. **인터랙션 & 접근성** — `useHotkeys`, `useFocusTrap`, `useFocusWithin`,
   `useLongPress`.
6. **비동기 & 데이터** — `useAsync`, `useAsyncFn`, `usePolling`, `useRafState`.
7. **상태 추가** — `useObjectState`, `useStack`, `useSelection`, `useCookie`.
8. **인터랙션/데이터 패턴** — `useInfiniteScroll`, `usePagination`.
9. **브라우저/디바이스** — `useNetworkState`, `usePageVisibility`, `useIdle`,
   `usePermission`, `useScript`, 이후 수요에 따라 P2 플랫폼 훅.

각 훅은 `add-usefy-hook` 워크플로우를 따릅니다: 스캐폴드 → 구현 → 테스트(~100%) →
엄브렐라 연결 → Storybook 스토리 → 커버리지 배지 → README 3종 → changeset.
