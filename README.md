# usefy Hooks Roadmap

## Overview

이 문서는 usefy 라이브러리에 포함될 React 커스텀 훅들의 로드맵과 상세 기능 명세를 담고 있습니다.

---

## Phase 1: 필수 유틸리티 훅 (MVP)

### 1. useDebounce

**목적**: 빈번한 함수 호출을 지연시켜 성능 최적화

**주요 기능**:

- 지정된 delay 후에만 값이 업데이트됨
- 검색창 입력, API 호출 최적화에 사용
- 이전 타이머 자동 취소

**API**:

```typescript
const debouncedValue = useDebounce(value, delay);
```

**사용 예시**:

```typescript
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  // API 호출은 입력이 멈춘 후 500ms 뒤에만 실행
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

**구현 포인트**:

- useEffect와 setTimeout 조합
- cleanup 함수로 이전 타이머 제거
- 초기 렌더링 시 즉시 실행 옵션 제공 가능

---

### 2. useLocalStorage

**목적**: localStorage를 React 상태처럼 사용

**주요 기능**:

- localStorage 읽기/쓰기를 useState처럼 사용
- JSON 자동 직렬화/역직렬화
- 타입 안전성 (TypeScript 제네릭)
- SSR 환경 대응 (window 객체 체크)
- 여러 탭 간 동기화 지원 (storage 이벤트)
- 에러 핸들링 (quota 초과, parse 에러 등)

**API**:

```typescript
const [value, setValue, removeValue] = useLocalStorage<T>(key, initialValue);
```

**사용 예시**:

```typescript
const [theme, setTheme] = useLocalStorage("theme", "light");

// 사용법은 useState와 동일
setTheme("dark");
```

**구현 포인트**:

- SSR 체크: `typeof window !== 'undefined'`
- try-catch로 JSON parse 에러 처리
- storage 이벤트 리스너로 탭 간 동기화
- removeValue 함수 제공

---

### 3. useSessionStorage

**목적**: sessionStorage를 React 상태처럼 사용

**주요 기능**:

- useLocalStorage와 동일한 API
- 탭/창 닫으면 데이터 삭제됨
- 임시 데이터 저장에 적합

**API**:

```typescript
const [value, setValue, removeValue] = useSessionStorage<T>(key, initialValue);
```

**사용 예시**:

```typescript
const [formData, setFormData] = useSessionStorage("form-draft", {});
```

---

### 4. useMediaQuery

**목적**: CSS 미디어 쿼리를 React에서 사용

**주요 기능**:

- 반응형 디자인 구현
- matchMedia API 사용
- 리사이즈 시 자동 업데이트
- SSR-safe (서버에서는 false 반환)
- cleanup으로 이벤트 리스너 제거

**API**:

```typescript
const matches = useMediaQuery(query);
```

**사용 예시**:

```typescript
const isMobile = useMediaQuery("(max-width: 768px)");
const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

return <div>{isMobile ? <MobileNav /> : <DesktopNav />}</div>;
```

**구현 포인트**:

- window.matchMedia() 사용
- change 이벤트 리스너 등록
- SSR에서 false 또는 기본값 반환

---

### 5. useToggle

**목적**: boolean 상태를 쉽게 토글

**주요 기능**:

- on/off 상태 관리
- toggle, setTrue, setFalse 함수 제공
- 모달, 드롭다운 등에 유용

**API**:

```typescript
const [value, toggle, setValue] = useToggle(initialValue);
// 또는
const [value, { toggle, setTrue, setFalse }] = useToggle(initialValue);
```

**사용 예시**:

```typescript
const [isOpen, toggle, setIsOpen] = useToggle(false);

return (
  <>
    <button onClick={toggle}>Toggle Modal</button>
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />
  </>
);
```

**구현 포인트**:

- useState 기반
- useCallback으로 함수 메모이제이션
- 명확한 API 제공

---

### 6. useCopyToClipboard

**목적**: 텍스트를 클립보드에 복사

**주요 기능**:

- Clipboard API 사용
- 복사 성공/실패 상태 관리
- 복사된 값 반환
- 타임아웃 후 상태 리셋 옵션

**API**:

```typescript
const [copiedText, copy] = useCopyToClipboard();
```

**사용 예시**:

```typescript
const [copiedText, copy] = useCopyToClipboard();

return (
  <button onClick={() => copy("Hello World")}>
    {copiedText ? "Copied!" : "Copy"}
  </button>
);
```

**구현 포인트**:

- navigator.clipboard.writeText() 사용
- 폴백: document.execCommand('copy')
- try-catch로 에러 처리
- 옵션: 2초 후 자동 리셋

---

## Phase 2: 자주 쓰이는 유틸리티 훅

### 7. useClickOutside

**목적**: 요소 외부 클릭 감지

**주요 기능**:

- 모달, 드롭다운 닫기 구현
- 여러 ref 지원 (배열)
- mousedown, touchstart 이벤트 처리
- 조건부 활성화 옵션

**API**:

```typescript
useClickOutside(ref, handler, enabled?);
// 또는
useClickOutside([ref1, ref2], handler);
```

**사용 예시**:

```typescript
const ref = useRef<HTMLDivElement>(null);
useClickOutside(ref, () => setIsOpen(false));

return <div ref={ref}>Dropdown content</div>;
```

**구현 포인트**:

- document에 이벤트 리스너 등록
- ref.current.contains()로 내부/외부 판별
- cleanup 함수로 리스너 제거
- 배열 ref 지원

---

### 8. useIntersectionObserver

**목적**: 요소의 viewport 진입/이탈 감지

**주요 기능**:

- 무한 스크롤 구현
- Lazy loading 이미지
- 스크롤 애니메이션 트리거
- threshold, root, rootMargin 옵션 지원

**API**:

```typescript
const entry = useIntersectionObserver(ref, options);
// 또는
const isIntersecting = useIntersectionObserver(ref, options);
```

**사용 예시**:

```typescript
const ref = useRef<HTMLDivElement>(null);
const isVisible = useIntersectionObserver(ref, {
  threshold: 0.5,
  rootMargin: "100px",
});

useEffect(() => {
  if (isVisible) {
    loadMoreItems();
  }
}, [isVisible]);
```

**구현 포인트**:

- IntersectionObserver API 사용
- unobserve로 cleanup
- 옵션 전달 지원

---

### 9. useWindowSize

**목적**: 브라우저 윈도우 크기 추적

**주요 기능**:

- width, height 실시간 업데이트
- 리사이즈 이벤트 리스너
- 디바운스 옵션 제공 가능
- SSR-safe

**API**:

```typescript
const { width, height } = useWindowSize();
```

**사용 예시**:

```typescript
const { width } = useWindowSize();

return (
  <div>
    현재 창 너비: {width}px
    {width < 768 ? <MobileView /> : <DesktopView />}
  </div>
);
```

**구현 포인트**:

- window.innerWidth/innerHeight 사용
- resize 이벤트 리스너
- 선택적 디바운스
- SSR에서 undefined 반환

---

### 10. usePrevious

**목적**: 이전 렌더링의 값 저장

**주요 기능**:

- 값의 변화 추적
- 애니메이션, 비교 로직에 유용
- useRef 기반으로 리렌더링 없음

**API**:

```typescript
const previousValue = usePrevious(value);
```

**사용 예시**:

```typescript
const [count, setCount] = useState(0);
const prevCount = usePrevious(count);

return (
  <div>
    현재: {count}, 이전: {prevCount}
    {count > prevCount ? "증가" : "감소"}
  </div>
);
```

**구현 포인트**:

- useRef로 값 저장
- useEffect에서 업데이트
- 초기값은 undefined

---

### 11. useTimeout

**목적**: setTimeout을 React hook으로

**주요 기능**:

- 지연 실행
- 자동 cleanup
- delay 변경 시 타이머 리셋
- pause/resume/reset 기능

**API**:

```typescript
useTimeout(callback, delay);
// 또는
const { reset, clear } = useTimeout(callback, delay);
```

**사용 예시**:

```typescript
const [show, setShow] = useState(false);

useTimeout(() => {
  setShow(false);
}, 3000);

return show && <Toast />;
```

---

### 12. useInterval

**목적**: setInterval을 React hook으로

**주요 기능**:

- 반복 실행
- 자동 cleanup
- delay 변경 시 인터벌 리셋
- pause/resume 기능

**API**:

```typescript
useInterval(callback, delay);
```

**사용 예시**:

```typescript
const [count, setCount] = useState(0);

useInterval(() => {
  setCount((c) => c + 1);
}, 1000);
```

---

## Phase 3: 특수 목적 훅

### 13. useHover

**목적**: 요소의 hover 상태 감지

**주요 기능**:

- mouseenter/mouseleave 이벤트
- ref와 isHovered 반환
- 조건부 렌더링에 유용

**API**:

```typescript
const [ref, isHovered] = useHover<T>();
```

**사용 예시**:

```typescript
const [ref, isHovered] = useHover<HTMLDivElement>();

return <div ref={ref}>{isHovered ? "Hovering!" : "Hover me"}</div>;
```

---

### 14. useAsync

**목적**: 비동기 작업 상태 관리

**주요 기능**:

- loading, error, data 상태
- 자동 에러 처리
- 재시도 기능
- 취소 가능

**API**:

```typescript
const { data, loading, error, execute } = useAsync(asyncFunction, immediate);
```

**사용 예시**:

```typescript
const { data, loading, error, execute } = useAsync(
  () => fetch("/api/users").then((r) => r.json()),
  true
);

if (loading) return <Spinner />;
if (error) return <Error />;
return <UserList users={data} />;
```

---

### 15. useKeyPress

**목적**: 키보드 입력 감지

**주요 기능**:

- 특정 키 입력 감지
- 단축키 구현
- modifier keys 지원 (ctrl, shift, alt)
- 접근성 개선

**API**:

```typescript
const isPressed = useKeyPress(targetKey, options);
```

**사용 예시**:

```typescript
const escapePressed = useKeyPress("Escape");

useEffect(() => {
  if (escapePressed) {
    closeModal();
  }
}, [escapePressed]);
```

---

### 16. useOnScreen

**목적**: 요소가 화면에 보이는지 감지

**주요 기능**:

- useIntersectionObserver 간소화 버전
- 단순 boolean 반환
- Lazy loading에 적합

**API**:

```typescript
const isVisible = useOnScreen(ref, options);
```

---

### 17. useScrollLock

**목적**: body 스크롤 잠금/해제

**주요 기능**:

- 모달 열릴 때 배경 스크롤 방지
- iOS Safari 대응
- 자동 cleanup

**API**:

```typescript
const [lockScroll, unlockScroll] = useScrollLock();
```

**사용 예시**:

```typescript
const [lockScroll, unlockScroll] = useScrollLock();

useEffect(() => {
  if (isModalOpen) {
    lockScroll();
  } else {
    unlockScroll();
  }
}, [isModalOpen]);
```

---

## 우선순위 요약

### Phase 1: 필수 유틸리티 (6개)

1. ✅ useCounter (완료)
2. ✅ useToggle (완료)
3. useDebounce (useDebounceValue)
4. useLocalStorage
5. useMediaQuery
6. useCopyToClipboard

### Phase 2: usehooks-ts 핵심 훅 (12개)

7. useBoolean
8. useClickAnyWhere (useClickOutside)
9. useEventListener
10. useInterval
11. useTimeout
12. useIsClient
13. useIsMounted
14. useDocumentTitle
15. useSessionStorage
16. useWindowSize
17. useScrollLock
18. useUnmount

### Phase 3: usehooks-ts 고급 훅 (12개)

19. useCountdown
20. useDarkMode
21. useDebounceCallback
22. useEventCallback
23. useHover
24. useIntersectionObserver
25. useIsomorphicLayoutEffect
26. useMap
27. useReadLocalStorage
28. useResizeObserver
29. useScreen
30. useScript

### Phase 4: usehooks-ts 특수 훅 (3개)

31. useStep
32. useTernaryDarkMode
33. useOnClickOutside

### Phase 5: 추가 유용한 훅 (17개)

34. useThrottle / useThrottleCallback
35. useSet
36. useQueue
37. useList
38. useGeolocation
39. useBattery
40. useNetwork
41. useIdle
42. useOrientation
43. useFullscreen
44. usePageLeave
45. useHistoryState
46. useObjectState
47. useLongPress
48. useMeasure
49. usePermission
50. useAsync
51. useKeyPress

---

## usehooks-ts 호환 목표

usehooks-ts의 모든 훅을 구현하여 완벽한 대체제를 만듭니다.

### usehooks-ts 전체 훅 리스트 (30개+)

**✅ 이미 포함된 훅:**

1. ✅ useCounter
2. ✅ useToggle (구현 완료)
3. ✅ useLocalStorage
4. ✅ useSessionStorage
5. ✅ useMediaQuery
6. ✅ useCopyToClipboard
7. ✅ useIntersectionObserver
8. ✅ useWindowSize
9. ✅ useTimeout
10. ✅ useInterval
11. ✅ useHover
12. ✅ useScrollLock

**🔜 추가 필요한 훅들 (usehooks-ts에만 있음):**

### 13. useBoolean

**목적**: boolean 상태 관리 (useToggle과 유사하지만 API가 다름)
**API**: `const { value, setValue, setTrue, setFalse, toggle } = useBoolean(false)`

### 14. useClickAnyWhere

**목적**: 문서 전체의 클릭 이벤트 감지
**API**: `useClickAnyWhere(handler)`

### 15. useCountdown

**목적**: 카운트다운 타이머 관리
**API**: `const [count, { start, stop, reset }] = useCountdown({ seconds: 60, interval: 1000 })`

### 16. useDarkMode

**목적**: 다크 모드 상태 관리 (localStorage + 시스템 설정)
**API**: `const { isDarkMode, toggle, enable, disable } = useDarkMode()`

### 17. useDebounceCallback

**목적**: 콜백 함수를 디바운스
**API**: `const debouncedFn = useDebounceCallback(callback, delay)`

### 18. useDebounceValue

**목적**: 값을 디바운스 (useDebounce와 동일)
**API**: `const debouncedValue = useDebounceValue(value, delay)`

### 19. useDocumentTitle

**목적**: 문서 제목 설정
**API**: `useDocumentTitle('Page Title')`

### 20. useEventCallback

**목적**: 안정적인 이벤트 콜백 (항상 최신 값 참조)
**API**: `const stableCallback = useEventCallback(callback)`

### 21. useEventListener

**목적**: DOM 요소에 이벤트 리스너 추가
**API**: `useEventListener('click', handler, elementRef)`

### 22. useIsClient

**목적**: 클라이언트 사이드인지 확인 (SSR 체크)
**API**: `const isClient = useIsClient()`

### 23. useIsMounted

**목적**: 컴포넌트가 마운트되었는지 확인
**API**: `const isMounted = useIsMounted()`

### 24. useIsomorphicLayoutEffect

**목적**: useLayoutEffect의 SSR-safe 버전
**API**: `useIsomorphicLayoutEffect(() => {}, deps)`

### 25. useMap

**목적**: Map 데이터 구조 상태 관리
**API**: `const [map, { set, setAll, remove, reset }] = useMap(initialMap)`

### 26. useOnClickOutside

**목적**: 요소 외부 클릭 감지 (useClickOutside와 동일)
**API**: `useOnClickOutside(ref, handler)`

### 27. useReadLocalStorage

**목적**: localStorage 읽기 전용
**API**: `const value = useReadLocalStorage('key')`

### 28. useResizeObserver

**목적**: 요소 크기 변화 감지
**API**: `const size = useResizeObserver(ref)`

### 29. useScreen

**목적**: 화면 정보 추적 (screen 객체)
**API**: `const screen = useScreen()`

### 30. useScript

**목적**: 동적 스크립트 로딩
**API**: `const status = useScript('https://example.com/script.js')`

### 31. useStep

**목적**: 다단계 프로세스 관리 (위자드, 폼 등)
**API**: `const [currentStep, { goToNextStep, goToPrevStep, reset, canGoToNextStep, canGoToPrevStep, setStep }] = useStep(maxStep)`

### 32. useTernaryDarkMode

**목적**: 3단계 다크 모드 (system, light, dark)
**API**: `const { isDarkMode, ternaryDarkMode, setTernaryDarkMode, toggleTernaryDarkMode } = useTernaryDarkMode()`

### 33. useUnmount

**목적**: 언마운트 시 클린업 함수 실행
**API**: `useUnmount(() => cleanup())`

---

## 추가 구현 목표 (Phase 4+)

위의 usehooks-ts 호환 훅들을 모두 구현한 후, 추가로 유용한 훅들:

### 34. useThrottle

**목적**: 값을 쓰로틀링
**API**: `const throttledValue = useThrottle(value, interval)`

### 35. useThrottleCallback

**목적**: 콜백 함수를 쓰로틀링
**API**: `const throttledFn = useThrottleCallback(callback, interval)`

### 36. useSet

**목적**: Set 데이터 구조 상태 관리
**API**: `const [set, { add, remove, has, clear, reset }] = useSet(initialSet)`

### 37. useQueue

**목적**: 큐 데이터 구조 상태 관리
**API**: `const { add, remove, first, last, size } = useQueue()`

### 38. useList

**목적**: 배열 상태 관리 유틸리티
**API**: `const [list, { set, push, filter, sort, clear }] = useList(initialList)`

### 39. useGeolocation

**목적**: 사용자 위치 정보 추적
**API**: `const { latitude, longitude, error } = useGeolocation()`

### 40. useBattery

**목적**: 배터리 상태 추적
**API**: `const { level, charging } = useBattery()`

### 41. useNetwork

**목적**: 네트워크 상태 추적
**API**: `const { online, downlink, effectiveType } = useNetwork()`

### 42. useIdle

**목적**: 사용자 비활성 상태 감지
**API**: `const isIdle = useIdle(3000)` // 3초 후 idle

### 43. useOrientation

**목적**: 디바이스 방향 감지
**API**: `const { angle, type } = useOrientation()`

### 44. useFullscreen

**목적**: 전체화면 모드 관리
**API**: `const { isFullscreen, toggle, enter, exit } = useFullscreen(ref)`

### 45. usePageLeave

**목적**: 페이지 이탈 감지
**API**: `usePageLeave(() => console.log('User left the page'))`

### 46. useHistoryState

**목적**: Undo/Redo 기능
**API**: `const { state, set, undo, redo, canUndo, canRedo } = useHistoryState(initialState)`

### 47. useObjectState

**목적**: 객체 상태 관리 유틸리티
**API**: `const [state, setState] = useObjectState({ name: '', age: 0 })`

### 48. useLongPress

**목적**: 길게 누르기 이벤트 감지
**API**: `const bind = useLongPress(callback, { threshold: 500 })`

### 49. useMeasure

**목적**: 요소의 크기와 위치 측정
**API**: `const [ref, bounds] = useMeasure()`

### 50. usePermission

**목적**: 브라우저 권한 상태 확인
**API**: `const permissionState = usePermission({ name: 'geolocation' })`

---

## 참고 사항

### 공통 구현 원칙

- TypeScript 완전 지원
- SSR-safe (Next.js 호환)
- 자동 cleanup
- 명확한 API
- 상세한 JSDoc 주석
- 각 훅마다 Storybook 스토리 작성
- 유닛 테스트 작성

### 네이밍 규칙

- 모든 훅은 `use`로 시작
- 명확하고 직관적인 이름
- 일관된 반환 패턴

### 문서화

- README에 각 훅의 사용 예시
- API 레퍼런스
- TypeScript 타입 정의
- 실제 사용 케이스
