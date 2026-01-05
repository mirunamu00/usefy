# usefy Hooks Roadmap

## Overview

이 문서는 usefy 라이브러리에 포함될 React 커스텀 훅들의 로드맵과 상세 기능 명세를 담고 있습니다.

---

## Hooks List

### 1. useCounter

**목적**: 숫자 값의 증가/감소/리셋을 관리

**주요 기능**:

- increment, decrement, reset 함수 제공
- 최소값/최대값 범위 제한 옵션
- 단계(step) 설정 가능
- 순환(circular) 옵션 - 최대값에서 최소값으로 순환

**API**:

```typescript
const [count, { increment, decrement, reset, set }] = useCounter(initialValue, {
  min,
  max,
  step,
});
```

**사용 예시**:

```typescript
const [count, { increment, decrement, reset }] = useCounter(0, {
  min: 0,
  max: 10,
  step: 2,
});

return (
  <div>
    <p>Count: {count}</p>
    <button onClick={increment}>+2</button>
    <button onClick={decrement}>-2</button>
    <button onClick={reset}>Reset</button>
  </div>
);
```

**구현 포인트**:

- useState 기반
- useCallback으로 함수 메모이제이션
- 범위 검증 로직 포함
- 순환 모드 지원

---

### 2. useToggle

**목적**: boolean 상태를 쉽게 토글

**주요 기능**:

- on/off 상태 관리
- toggle, setTrue, setFalse 함수 제공
- 모달, 드롭다운 등에 유용
- 초기값 지원

**API**:

```typescript
const [value, toggle, setValue] = useToggle(initialValue);
// 또는
const [value, { toggle, setTrue, setFalse, setValue }] =
  useToggle(initialValue);
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
- 명확하고 직관적인 API 제공
- TypeScript 타입 안전성 보장

---

### 3. useDebounce (useDebounceValue)

**목적**: 빈번한 값 변경을 지연시켜 성능 최적화

**주요 기능**:

- 지정된 delay 후에만 값이 업데이트됨
- 검색창 입력, API 호출 최적화에 사용
- 이전 타이머 자동 취소
- leading/trailing 옵션
- maxWait 옵션으로 최대 대기 시간 제한

**API**:

```typescript
const debouncedValue = useDebounce(value, delay, options);
```

**사용 예시**:

```typescript
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  // API 호출은 입력이 멈춘 후 500ms 뒤에만 실행
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

**구현 포인트**:

- useEffect와 setTimeout 조합
- cleanup 함수로 이전 타이머 제거
- leading 옵션: 첫 호출 즉시 실행
- trailing 옵션: 마지막 호출 후 실행
- maxWait으로 강제 실행 보장

---

### 4. useDebounceCallback

**목적**: 콜백 함수를 디바운스

**주요 기능**:

- 함수 호출을 지연시킴
- 연속 호출 시 마지막 호출만 실행
- 이벤트 핸들러 최적화
- cancel 함수로 대기 중인 호출 취소
- flush 함수로 즉시 실행

**API**:

```typescript
const debouncedCallback = useDebounceCallback(callback, delay, options);
```

**사용 예시**:

```typescript
const handleSearch = useDebounceCallback((term: string) => {
  api.search(term);
}, 500);

return <input onChange={(e) => handleSearch(e.target.value)} />;
```

**구현 포인트**:

- useRef로 타이머 참조 저장
- useCallback으로 함수 메모이제이션
- cancel/flush 메서드 제공
- 인자 전달 지원

---

### 5. useThrottle (useThrottleValue)

**목적**: 값 변경을 일정 간격으로 제한

**주요 기능**:

- 지정된 interval 동안 최대 한 번만 업데이트
- 스크롤, 리사이즈 이벤트 최적화
- leading/trailing 옵션
- 무한 스크롤 구현에 유용

**API**:

```typescript
const throttledValue = useThrottle(value, interval, options);
```

**사용 예시**:

```typescript
const [scrollY, setScrollY] = useState(0);
const throttledScrollY = useThrottle(scrollY, 100);

useEffect(() => {
  const handleScroll = () => setScrollY(window.scrollY);
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

**구현 포인트**:

- 타임스탬프 기반 제한
- leading: 첫 호출 즉시 실행
- trailing: 마지막 값 보장
- 정확한 간격 유지

---

### 6. useThrottleCallback

**목적**: 콜백 함수를 쓰로틀링

**주요 기능**:

- 함수 호출을 일정 간격으로 제한
- 스크롤/리사이즈 핸들러 최적화
- cancel 함수 제공
- 인자 전달 지원

**API**:

```typescript
const throttledCallback = useThrottleCallback(callback, interval, options);
```

**사용 예시**:

```typescript
const handleScroll = useThrottleCallback(() => {
  console.log("Scroll position:", window.scrollY);
}, 100);

useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, [handleScroll]);
```

**구현 포인트**:

- 마지막 호출 시간 추적
- 남은 시간 계산
- cleanup 함수 지원

---

### 7. useLocalStorage

**목적**: localStorage를 React 상태처럼 사용

**주요 기능**:

- localStorage 읽기/쓰기를 useState처럼 사용
- JSON 자동 직렬화/역직렬화
- 타입 안전성 (TypeScript 제네릭)
- SSR 환경 대응 (window 객체 체크)
- 여러 탭 간 동기화 지원 (storage 이벤트)
- 에러 핸들링 (quota 초과, parse 에러 등)
- removeValue 함수 제공

**API**:

```typescript
const [value, setValue, removeValue] = useLocalStorage<T>(key, initialValue);
```

**사용 예시**:

```typescript
const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");

// 사용법은 useState와 동일
setTheme("dark");

// 저장소에서 제거
removeTheme();
```

**구현 포인트**:

- SSR 체크: `typeof window !== 'undefined'`
- try-catch로 JSON parse 에러 처리
- storage 이벤트 리스너로 탭 간 동기화
- serializer/deserializer 커스터마이징 옵션
- quota 초과 시 graceful 처리

---

### 8. useSessionStorage

**목적**: sessionStorage를 React 상태처럼 사용

**주요 기능**:

- useLocalStorage와 동일한 API
- 탭/창 닫으면 데이터 삭제됨
- 임시 데이터 저장에 적합
- 폼 초안, 임시 설정 저장에 유용

**API**:

```typescript
const [value, setValue, removeValue] = useSessionStorage<T>(key, initialValue);
```

**사용 예시**:

```typescript
const [formData, setFormData] = useSessionStorage("form-draft", {
  name: "",
  email: "",
});

return (
  <form>
    <input
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    />
  </form>
);
```

**구현 포인트**:

- localStorage와 동일한 구현 패턴
- sessionStorage API 사용
- SSR-safe
- 에러 핸들링

---

### 11. useCopyToClipboard

**목적**: 텍스트를 클립보드에 복사

**주요 기능**:

- Clipboard API 사용
- 복사 성공/실패 상태 관리
- 복사된 값 반환
- 타임아웃 후 상태 리셋 옵션
- 폴백 지원 (구형 브라우저)

**API**:

```typescript
const [copiedText, copy] = useCopyToClipboard(options);
```

**사용 예시**:

```typescript
const [copiedText, copy] = useCopyToClipboard();

return (
  <div>
    <button onClick={() => copy("Hello World")}>
      {copiedText ? "Copied!" : "Copy"}
    </button>
    <input value="Hello World" readOnly />
  </div>
);
```

**구현 포인트**:

- navigator.clipboard.writeText() 사용
- 폴백: document.execCommand('copy')
- try-catch로 에러 처리
- 자동 리셋 타이머 (옵션)
- 권한 체크

---

### 13. useClickAnyWhere

**목적**: 문서 전체의 클릭 이벤트 감지

**주요 기능**:

- document 레벨 클릭 감지
- 전역 클릭 핸들러
- 조건부 활성화
- 이벤트 옵션 커스터마이징

**API**:

```typescript
useClickAnyWhere(handler, options);
```

**사용 예시**:

```typescript
useClickAnyWhere((event) => {
  console.log("Clicked at:", event.clientX, event.clientY);
});
```

**구현 포인트**:

- document 이벤트 리스너
- useEffect cleanup
- 이벤트 옵션 지원
- 조건부 활성화

---

### 14. useClickOutside (useOnClickOutside)

**목적**: 요소 외부 클릭 감지

**주요 기능**:

- 모달, 드롭다운 닫기 구현
- 여러 ref 지원 (배열)
- mousedown, touchstart 이벤트 처리
- 조건부 활성화 옵션
- 특정 요소 제외 옵션

**API**:

```typescript
useClickOutside(ref, handler, options);
// 또는
useClickOutside([ref1, ref2], handler);
```

**사용 예시**:

```typescript
const ref = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

useClickOutside([ref, buttonRef], () => setIsOpen(false), { enabled: isOpen });

return (
  <>
    <button ref={buttonRef}>Open</button>
    {isOpen && <div ref={ref}>Dropdown content</div>}
  </>
);
```

**구현 포인트**:

- document에 이벤트 리스너 등록
- ref.current.contains()로 내부/외부 판별
- cleanup 함수로 리스너 제거
- 배열 ref 지원
- mousedown 사용 (click보다 빠름)

---

### 15. useEventListener

**목적**: DOM 요소에 이벤트 리스너 추가

**주요 기능**:

- 자동 cleanup
- window, document, element 지원
- TypeScript 이벤트 타입 추론
- 여러 이벤트 동시 추가 가능
- 옵션 전달 지원

**API**:

```typescript
useEventListener(eventName, handler, element, options);
```

**사용 예시**:

```typescript
// window 이벤트
useEventListener("resize", () => {
  console.log("Window resized");
});

// element 이벤트
const ref = useRef<HTMLDivElement>(null);
useEventListener("click", handleClick, ref);

// document 이벤트
useEventListener("keydown", handleKeyDown, document);
```

**구현 포인트**:

- addEventListener/removeEventListener
- cleanup 함수
- element ref 지원
- 이벤트 옵션 전달
- TypeScript 제네릭으로 타입 안전성

---

### 16. useIntersectionObserver

**목적**: 요소의 viewport 진입/이탈 감지

**주요 기능**:

- 무한 스크롤 구현
- Lazy loading 이미지
- 스크롤 애니메이션 트리거
- threshold, root, rootMargin 옵션 지원
- 단일/다중 요소 관찰

**API**:

```typescript
const entry = useIntersectionObserver(ref, options);
// 또는
const isIntersecting = useIntersectionObserver(ref, options);
```

**사용 예시**:

```typescript
const ref = useRef<HTMLDivElement>(null);
const entry = useIntersectionObserver(ref, {
  threshold: 0.5,
  rootMargin: "100px",
});

useEffect(() => {
  if (entry?.isIntersecting) {
    loadMoreItems();
  }
}, [entry?.isIntersecting]);

return <div ref={ref}>Load more trigger</div>;
```

**구현 포인트**:

- IntersectionObserver API 사용
- unobserve로 cleanup
- 옵션 전달 지원
- 브라우저 호환성 체크

---

### 17. useResizeObserver

**목적**: 요소 크기 변화 감지

**주요 기능**:

- 요소 크기 실시간 추적
- width, height, contentRect 제공
- 반응형 컴포넌트 구현
- 차트, 그리드 레이아웃에 유용

**API**:

```typescript
const size = useResizeObserver(ref, options);
```

**사용 예시**:

```typescript
const ref = useRef<HTMLDivElement>(null);
const size = useResizeObserver(ref);

return (
  <div ref={ref}>
    Width: {size?.width}px, Height: {size?.height}px
  </div>
);
```

**구현 포인트**:

- ResizeObserver API 사용
- disconnect로 cleanup
- 브라우저 호환성 체크
- 디바운스 옵션 제공 가능

---

### 18. useWindowSize

**목적**: 브라우저 윈도우 크기 추적

**주요 기능**:

- width, height 실시간 업데이트
- 리사이즈 이벤트 리스너
- 디바운스/쓰로틀 옵션
- SSR-safe
- 초기 크기 즉시 반환

**API**:

```typescript
const { width, height } = useWindowSize(options);
```

**사용 예시**:

```typescript
const { width, height } = useWindowSize();

return (
  <div>
    현재 창 크기: {width}px × {height}px
    {width < 768 ? <MobileView /> : <DesktopView />}
  </div>
);
```

**구현 포인트**:

- window.innerWidth/innerHeight 사용
- resize 이벤트 리스너
- 선택적 디바운스/쓰로틀
- SSR에서 undefined 반환
- 초기값 설정 옵션

---

### 19. useScreen

**목적**: 화면 정보 추적 (screen 객체)

**주요 기능**:

- screen.width, screen.height
- screen.orientation
- availWidth, availHeight
- 디바이스 화면 정보 제공

**API**:

```typescript
const screen = useScreen();
```

**사용 예시**:

```typescript
const screen = useScreen();

return (
  <div>
    화면 해상도: {screen?.width}×{screen?.height}
    사용 가능 영역: {screen?.availWidth}×{screen?.availHeight}
  </div>
);
```

**구현 포인트**:

- window.screen 객체 사용
- orientationchange 이벤트
- SSR-safe
- 화면 정보 객체 반환

---

### 20. useTimeout

**목적**: setTimeout을 React hook으로

**주요 기능**:

- 지연 실행
- 자동 cleanup
- delay 변경 시 타이머 리셋
- reset, clear 함수 제공
- 조건부 실행

**API**:

```typescript
useTimeout(callback, delay);
// 또는
const { reset, clear } = useTimeout(callback, delay);
```

**사용 예시**:

```typescript
const [show, setShow] = useState(true);

useTimeout(() => {
  setShow(false);
}, 3000);

return show && <Toast message="자동으로 사라집니다" />;
```

**구현 포인트**:

- useEffect + setTimeout
- cleanup 함수
- delay null 처리 (비활성화)
- 콜백 최신 값 참조

---

### 21. useInterval

**목적**: setInterval을 React hook으로

**주요 기능**:

- 반복 실행
- 자동 cleanup
- delay 변경 시 인터벌 리셋
- pause/resume/reset 기능
- 즉시 실행 옵션

**API**:

```typescript
useInterval(callback, delay, options);
// 또는
const { pause, resume, reset } = useInterval(callback, delay);
```

**사용 예시**:

```typescript
const [count, setCount] = useState(0);
const { pause, resume } = useInterval(() => {
  setCount((c) => c + 1);
}, 1000);

return (
  <div>
    <p>카운트: {count}</p>
    <button onClick={pause}>일시정지</button>
    <button onClick={resume}>재개</button>
  </div>
);
```

**구현 포인트**:

- useEffect + setInterval
- cleanup 함수
- delay null 처리
- immediate 옵션

---

### 23. useIsClient

**목적**: 클라이언트 사이드인지 확인 (SSR 체크)

**주요 기능**:

- SSR/CSR 구분
- hydration 완료 감지
- 클라이언트 전용 코드 실행
- 간단한 boolean 반환

**API**:

```typescript
const isClient = useIsClient();
```

**사용 예시**:

```typescript
const isClient = useIsClient();

return <div>{isClient ? <ClientOnlyComponent /> : <ServerFallback />}</div>;
```

**구현 포인트**:

- useEffect로 클라이언트 감지
- 초기값 false
- hydration 이후 true

---

### 24. useIsMounted

**목적**: 컴포넌트가 마운트되었는지 확인

**주요 기능**:

- 마운트 상태 추적
- 비동기 작업 취소에 유용
- 메모리 누수 방지
- cleanup 함수에서 사용

**API**:

```typescript
const isMounted = useIsMounted();
```

**사용 예시**:

```typescript
const isMounted = useIsMounted();

const fetchData = async () => {
  const data = await api.getData();
  if (isMounted()) {
    setState(data);
  }
};
```

**구현 포인트**:

- useRef로 마운트 상태 저장
- useEffect cleanup에서 false 설정
- 함수 반환 (최신 값 참조)

---

### 25. useIsomorphicLayoutEffect

**목적**: useLayoutEffect의 SSR-safe 버전

**주요 기능**:

- SSR에서는 useEffect
- 클라이언트에서는 useLayoutEffect
- Next.js, Gatsby 호환
- 경고 메시지 제거

**API**:

```typescript
useIsomorphicLayoutEffect(() => {
  // effect
}, deps);
```

**사용 예시**:

```typescript
useIsomorphicLayoutEffect(() => {
  // DOM 측정 또는 동기 업데이트
  const rect = elementRef.current?.getBoundingClientRect();
  setDimensions(rect);
}, []);
```

**구현 포인트**:

- typeof window 체크
- 조건부 export
- useEffect/useLayoutEffect 선택

---

### 26. useDocumentTitle

**목적**: 문서 제목 설정

**주요 기능**:

- document.title 업데이트
- 이전 제목 복원 옵션
- 동적 제목 변경
- SSR-safe

**API**:

```typescript
useDocumentTitle(title, options);
```

**사용 예시**:

```typescript
const [count, setCount] = useState(0);
useDocumentTitle(`Count: ${count}`, {
  restoreOnUnmount: true,
});
```

**구현 포인트**:

- document.title 설정
- 이전 제목 저장
- cleanup 시 복원
- SSR 체크

---

### 27. useEventCallback

**목적**: 안정적인 이벤트 콜백 (항상 최신 값 참조)

**주요 기능**:

- 의존성 배열 없이 최신 값 참조
- 함수 참조 안정성 유지
- 불필요한 리렌더링 방지
- useCallback 대안

**API**:

```typescript
const stableCallback = useEventCallback(callback);
```

**사용 예시**:

```typescript
const [count, setCount] = useState(0);

const handleClick = useEventCallback(() => {
  // 항상 최신 count 값 참조
  console.log(count);
});

// handleClick 참조는 변하지 않음
useEffect(() => {
  element.addEventListener("click", handleClick);
}, [handleClick]);
```

**구현 포인트**:

- useRef로 콜백 저장
- useLayoutEffect로 업데이트
- 안정적인 참조 반환

---

### 28. usePrevious

**목적**: 이전 렌더링의 값 저장

**주요 기능**:

- 값의 변화 추적
- 애니메이션, 비교 로직에 유용
- useRef 기반으로 리렌더링 없음
- 커스텀 비교 함수 지원

**API**:

```typescript
const previousValue = usePrevious(value, compareFn);
```

**사용 예시**:

```typescript
const [count, setCount] = useState(0);
const prevCount = usePrevious(count);

return (
  <div>
    현재: {count}, 이전: {prevCount}
    <p>{count > prevCount ? "증가 ↑" : "감소 ↓"}</p>
  </div>
);
```

**구현 포인트**:

- useRef로 값 저장
- useEffect에서 업데이트
- 초기값은 undefined
- 비교 함수 옵션

---

### 29. useHover

**목적**: 요소의 hover 상태 감지

**주요 기능**:

- mouseenter/mouseleave 이벤트
- ref와 isHovered 반환
- 조건부 렌더링에 유용
- 딜레이 옵션

**API**:

```typescript
const [ref, isHovered] = useHover<T>(options);
```

**사용 예시**:

```typescript
const [ref, isHovered] = useHover<HTMLDivElement>();

return (
  <div
    ref={ref}
    style={{
      background: isHovered ? "lightblue" : "white",
    }}
  >
    {isHovered ? "Hovering! 🎯" : "Hover me"}
  </div>
);
```

**구현 포인트**:

- mouseenter/mouseleave 이벤트
- useState로 hover 상태 관리
- 이벤트 리스너 cleanup
- 딜레이 옵션 (debounce)

---

### 30. useDarkMode

**목적**: 다크 모드 상태 관리

**주요 기능**:

- localStorage 저장
- 시스템 설정 감지
- toggle, enable, disable 함수
- class 또는 attribute 적용
- prefers-color-scheme 지원

**API**:

```typescript
const { isDarkMode, toggle, enable, disable } = useDarkMode(options);
```

**사용 예시**:

```typescript
const { isDarkMode, toggle } = useDarkMode({
  defaultValue: false,
  localStorageKey: "theme",
});

return <button onClick={toggle}>{isDarkMode ? "🌙 다크" : "☀️ 라이트"}</button>;
```

**구현 포인트**:

- useLocalStorage 활용
- useMediaQuery로 시스템 설정
- document.documentElement에 class 추가
- 초기값 결정 로직

---

### 31. useTernaryDarkMode

**목적**: 3단계 다크 모드 (system, light, dark)

**주요 기능**:

- system/light/dark 3가지 모드
- 시스템 설정 자동 반영
- localStorage 저장
- 토글 기능

**API**:

```typescript
const {
  isDarkMode,
  ternaryDarkMode,
  setTernaryDarkMode,
  toggleTernaryDarkMode,
} = useTernaryDarkMode();
```

**사용 예시**:

```typescript
const { ternaryDarkMode, setTernaryDarkMode } = useTernaryDarkMode();

return (
  <select
    value={ternaryDarkMode}
    onChange={(e) => setTernaryDarkMode(e.target.value)}
  >
    <option value="system">시스템 설정</option>
    <option value="light">라이트</option>
    <option value="dark">다크</option>
  </select>
);
```

**구현 포인트**:

- 3가지 모드 관리
- system일 때 prefers-color-scheme 적용
- localStorage 저장
- 실제 다크 모드 여부 계산

---

### 32. useScrollLock

**목적**: body 스크롤 잠금/해제

**주요 기능**:

- 모달 열릴 때 배경 스크롤 방지
- iOS Safari 대응
- 자동 cleanup
- 중첩 락 지원 (카운터)
- 원래 스크롤 위치 복원

**API**:

```typescript
const [lockScroll, unlockScroll] = useScrollLock();
// 또는
const { lock, unlock, isLocked } = useScrollLock();
```

**사용 예시**:

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const { lock, unlock } = useScrollLock();

useEffect(() => {
  if (isModalOpen) {
    lock();
  } else {
    unlock();
  }
  return () => unlock();
}, [isModalOpen]);

return (
  <>
    <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
    {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}
  </>
);
```

**구현 포인트**:

- body에 overflow: hidden
- iOS Safari: position: fixed + top
- 스크롤 위치 저장/복원
- 중첩 락 카운터

---

### 33. useUnmount

**목적**: 언마운트 시 클린업 함수 실행

**주요 기능**:

- componentWillUnmount와 동일
- 간단한 API
- 의존성 배열 없음
- 항상 최신 함수 실행

**API**:

```typescript
useUnmount(() => cleanup());
```

**사용 예시**:

```typescript
useUnmount(() => {
  // WebSocket 연결 종료
  socket.disconnect();
  // 타이머 정리
  clearInterval(timerId);
  // 이벤트 리스너 제거
  element.removeEventListener("click", handler);
});
```

**구현 포인트**:

- useEffect cleanup 활용
- 빈 의존성 배열
- useRef로 최신 함수 참조

---

### 34. useOnScreen (useIsVisible)

**목적**: 요소가 화면에 보이는지 감지

**주요 기능**:

- useIntersectionObserver 간소화 버전
- 단순 boolean 반환
- Lazy loading에 적합
- once 옵션 (한 번만 감지)

**API**:

```typescript
const isVisible = useOnScreen(ref, options);
```

**사용 예시**:

```typescript
const ref = useRef<HTMLImageElement>(null);
const isVisible = useOnScreen(ref, {
  threshold: 0.1,
  once: true,
});

return (
  <img ref={ref} src={isVisible ? actualSrc : placeholder} alt="Lazy loaded" />
);
```

**구현 포인트**:

- IntersectionObserver 사용
- boolean으로 단순화
- once 옵션으로 성능 최적화
- threshold 기본값 0

---

### 35. useAsync

**목적**: 비동기 작업 상태 관리

**주요 기능**:

- loading, error, data 상태
- 자동 에러 처리
- 재시도 기능
- 취소 가능 (AbortController)
- 즉시 실행 또는 수동 실행

**API**:

```typescript
const { data, loading, error, execute, reset } = useAsync(
  asyncFunction,
  options
);
```

**사용 예시**:

```typescript
const { data, loading, error, execute } = useAsync(
  async () => {
    const response = await fetch("/api/users");
    return response.json();
  },
  { immediate: true }
);

if (loading) return <Spinner />;
if (error) return <Error message={error.message} />;
if (!data) return null;

return <UserList users={data} />;
```

**구현 포인트**:

- loading/error/data 상태 관리
- try-catch 에러 처리
- AbortController로 취소
- immediate 옵션
- reset 함수

---

### 36. useKeyPress

**목적**: 키보드 입력 감지

**주요 기능**:

- 특정 키 입력 감지
- 단축키 구현
- modifier keys 지원 (ctrl, shift, alt, meta)
- 키 조합 지원
- 접근성 개선

**API**:

```typescript
const isPressed = useKeyPress(targetKey, options);
// 또는
const isPressed = useKeyPress(["ctrl", "k"]);
```

**사용 예시**:

```typescript
const escapePressed = useKeyPress("Escape");
const saveShortcut = useKeyPress(["ctrl", "s"]);

useEffect(() => {
  if (escapePressed) {
    closeModal();
  }
}, [escapePressed]);

useEffect(() => {
  if (saveShortcut) {
    event.preventDefault();
    saveData();
  }
}, [saveShortcut]);
```

**구현 포인트**:

- keydown/keyup 이벤트
- event.key 비교
- modifier keys 체크
- 배열로 조합 키 지원

---

### 37. useMap

**목적**: Map 데이터 구조 상태 관리

**주요 기능**:

- Map 객체를 React 상태로
- set, setAll, remove, reset 함수
- 불변성 유지
- TypeScript 제네릭 지원

**API**:

```typescript
const [map, { set, setAll, remove, reset, clear }] = useMap<K, V>(initialMap);
```

**사용 예시**:

```typescript
const [users, { set, remove }] = useMap<string, User>(
  new Map([
    ["1", { id: "1", name: "Alice" }],
    ["2", { id: "2", name: "Bob" }],
  ])
);

const addUser = (user: User) => {
  set(user.id, user);
};

const removeUser = (id: string) => {
  remove(id);
};
```

**구현 포인트**:

- useState로 Map 관리
- 불변성 유지 (new Map 생성)
- 유틸리티 함수들 제공
- TypeScript 제네릭

---

### 38. useSet

**목적**: Set 데이터 구조 상태 관리

**주요 기능**:

- Set 객체를 React 상태로
- add, remove, has, clear, reset 함수
- 불변성 유지
- toggle 함수

**API**:

```typescript
const [set, { add, remove, has, toggle, clear, reset }] = useSet<T>(initialSet);
```

**사용 예시**:

```typescript
const [selectedIds, { add, remove, has, toggle }] = useSet<string>(
  new Set(["1", "2"])
);

return (
  <div>
    {items.map((item) => (
      <Checkbox
        key={item.id}
        checked={has(item.id)}
        onChange={() => toggle(item.id)}
      />
    ))}
  </div>
);
```

**구현 포인트**:

- useState로 Set 관리
- 불변성 유지 (new Set 생성)
- has로 포함 여부 확인
- toggle 함수 편의성

---

### 39. useList

**목적**: 배열 상태 관리 유틸리티

**주요 기능**:

- 배열 조작 함수들
- push, filter, sort, clear, set
- insert, remove, update
- 불변성 자동 유지

**API**:

```typescript
const [list, { set, push, filter, sort, clear, removeAt, insertAt, updateAt }] =
  useList<T>(initialList);
```

**사용 예시**:

```typescript
const [todos, { push, removeAt, updateAt }] = useList<Todo>([]);

const addTodo = (text: string) => {
  push({ id: Date.now(), text, completed: false });
};

const toggleTodo = (index: number) => {
  const todo = todos[index];
  updateAt(index, { ...todo, completed: !todo.completed });
};
```

**구현 포인트**:

- useState 기반
- 불변성 유지
- 유용한 배열 메서드들
- 인덱스 기반 조작

---

### 40. useQueue

**목적**: 큐 데이터 구조 상태 관리

**주요 기능**:

- FIFO 큐 구현
- add (enqueue), remove (dequeue)
- first, last, size
- clear 함수

**API**:

```typescript
const { queue, add, remove, first, last, size, clear } =
  useQueue<T>(initialQueue);
```

**사용 예시**:

```typescript
const { queue, add, remove, first } = useQueue<Task>([]);

const processNext = () => {
  const task = first;
  if (task) {
    processTask(task);
    remove();
  }
};

return (
  <div>
    <button onClick={() => add(newTask)}>Add Task</button>
    <button onClick={processNext}>Process Next</button>
    <p>Queue size: {queue.length}</p>
  </div>
);
```

**구현 포인트**:

- 배열 기반 구현
- shift/unshift 사용
- 유틸리티 함수들
- 불변성 유지

---

### 41. useHistoryState (useUndo)

**목적**: Undo/Redo 기능

**주요 기능**:

- 상태 히스토리 관리
- undo, redo 함수
- canUndo, canRedo 플래그
- 최대 히스토리 크기 제한
- reset 함수

**API**:

```typescript
const { state, set, undo, redo, canUndo, canRedo, reset, history } =
  useHistoryState<T>(initialState, options);
```

**사용 예시**:

```typescript
const {
  state: canvas,
  set: setCanvas,
  undo,
  redo,
  canUndo,
  canRedo,
} = useHistoryState(initialCanvas, { limit: 50 });

return (
  <div>
    <Canvas data={canvas} onChange={setCanvas} />
    <button onClick={undo} disabled={!canUndo}>
      ⟲ Undo
    </button>
    <button onClick={redo} disabled={!canRedo}>
      ⟳ Redo
    </button>
  </div>
);
```

**구현 포인트**:

- 히스토리 배열 관리
- 현재 인덱스 추적
- 최대 크기 제한
- 새 상태 시 이후 히스토리 삭제

---

### 42. useStep

**목적**: 다단계 프로세스 관리 (위자드, 폼 등)

**주요 기능**:

- 현재 단계 추적
- goToNextStep, goToPrevStep
- canGoToNextStep, canGoToPrevStep
- setStep으로 특정 단계 이동
- reset 함수

**API**:

```typescript
const [
  currentStep,
  {
    goToNextStep,
    goToPrevStep,
    canGoToNextStep,
    canGoToPrevStep,
    setStep,
    reset,
  },
] = useStep(maxStep, initialStep);
```

**사용 예시**:

```typescript
const [currentStep, { goToNextStep, goToPrevStep, canGoToNextStep }] =
  useStep(4);

return (
  <div>
    <Steps current={currentStep}>
      <Step title="정보 입력" />
      <Step title="확인" />
      <Step title="결제" />
      <Step title="완료" />
    </Steps>

    {currentStep === 0 && <InfoForm />}
    {currentStep === 1 && <ConfirmForm />}
    {currentStep === 2 && <PaymentForm />}
    {currentStep === 3 && <CompleteMessage />}

    <button onClick={goToPrevStep} disabled={currentStep === 0}>
      이전
    </button>
    <button onClick={goToNextStep} disabled={!canGoToNextStep}>
      다음
    </button>
  </div>
);
```

**구현 포인트**:

- useState로 단계 관리
- 범위 검증
- 유틸리티 함수들
- 0-based 인덱스

---

### 43. useScript

**목적**: 동적 스크립트 로딩

**주요 기능**:

- 외부 스크립트 동적 로드
- loading, ready, error 상태
- 중복 로드 방지
- 자동 cleanup
- async/defer 옵션

**API**:

```typescript
const status = useScript(src, options);
// status: 'idle' | 'loading' | 'ready' | 'error'
```

**사용 예시**:

```typescript
const status = useScript(
  "https://maps.googleapis.com/maps/api/js?key=YOUR_KEY"
);

if (status === "loading") return <div>Loading map...</div>;
if (status === "error") return <div>Failed to load map</div>;
if (status === "ready") return <GoogleMap />;
```

**구현 포인트**:

- script 태그 동적 생성
- load/error 이벤트 리스너
- 이미 로드된 스크립트 체크
- cleanup 시 제거
- 전역 캐시로 중복 방지

---

### 44. useMeasure

**목적**: 요소의 크기와 위치 측정

**주요 기능**:

- getBoundingClientRect 값 제공
- width, height, top, left 등
- ResizeObserver 기반
- 실시간 업데이트

**API**:

```typescript
const [ref, bounds] = useMeasure<T>();
// bounds: { x, y, width, height, top, right, bottom, left }
```

**사용 예시**:

```typescript
const [ref, bounds] = useMeasure<HTMLDivElement>();

return (
  <div>
    <div ref={ref} style={{ width: "50%" }}>
      Measure me
    </div>
    <p>
      Width: {Math.round(bounds.width)}px
      <br />
      Height: {Math.round(bounds.height)}px
    </p>
  </div>
);
```

**구현 포인트**:

- ResizeObserver 사용
- getBoundingClientRect 호출
- 상태로 bounds 저장
- 리사이즈 시 자동 업데이트

---

### 45. useLongPress

**목적**: 길게 누르기 이벤트 감지

**주요 기능**:

- 길게 누르기 감지
- threshold (지속 시간) 설정
- onStart, onFinish, onCancel 콜백
- 터치/마우스 이벤트 모두 지원
- 이동 시 취소

**API**:

```typescript
const bind = useLongPress(callback, options);
// bind: { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd }
```

**사용 예시**:

```typescript
const bind = useLongPress(
  () => {
    console.log("Long pressed!");
    showContextMenu();
  },
  {
    threshold: 500,
    onStart: () => console.log("Press started"),
    onCancel: () => console.log("Cancelled"),
  }
);

return <button {...bind}>길게 눌러서 메뉴 열기</button>;
```

**구현 포인트**:

- setTimeout으로 지속 시간 체크
- mousedown/touchstart 시작
- mouseup/touchend 종료
- mouseleave/touchcancel 취소
- 이동 거리 체크

---

### 46. useGeolocation

**목적**: 사용자 위치 정보 추적

**주요 기능**:

- Geolocation API 사용
- latitude, longitude, accuracy
- loading, error 상태
- 실시간 위치 추적 (watchPosition)
- 권한 요청

**API**:

```typescript
const { latitude, longitude, accuracy, loading, error } =
  useGeolocation(options);
```

**사용 예시**:

```typescript
const { latitude, longitude, loading, error } = useGeolocation();

if (loading) return <div>위치 정보 로딩 중...</div>;
if (error) return <div>오류: {error.message}</div>;

return (
  <div>
    현재 위치: {latitude}, {longitude}
  </div>
);
```

**구현 포인트**:

- navigator.geolocation 사용
- getCurrentPosition 또는 watchPosition
- 권한 체크
- 에러 처리
- cleanup 시 clearWatch

---

### 47. useBattery

**목적**: 배터리 상태 추적

**주요 기능**:

- 배터리 레벨
- 충전 상태
- 충전 시간, 방전 시간
- Battery Status API

**API**:

```typescript
const { level, charging, chargingTime, dischargingTime, loading } =
  useBattery();
```

**사용 예시**:

```typescript
const { level, charging } = useBattery();

return (
  <div>
    배터리: {Math.round(level * 100)}%{charging ? " (충전 중)" : ""}
  </div>
);
```

**구현 포인트**:

- navigator.getBattery() 사용
- 이벤트 리스너 등록
- 브라우저 호환성 체크
- cleanup

---

### 48. useNetwork

**목적**: 네트워크 상태 추적

**주요 기능**:

- 온라인/오프라인 상태
- 연결 타입 (4g, wifi 등)
- 다운링크 속도
- Network Information API

**API**:

```typescript
const { online, downlink, effectiveType, rtt, saveData } = useNetwork();
```

**사용 예시**:

```typescript
const { online, effectiveType } = useNetwork();

return (
  <div>
    {!online && <Alert>오프라인 상태입니다</Alert>}
    연결: {effectiveType}
  </div>
);
```

**구현 포인트**:

- navigator.onLine
- navigator.connection
- online/offline 이벤트
- connection change 이벤트

---

### 49. useIdle

**목적**: 사용자 비활성 상태 감지

**주요 기능**:

- 일정 시간 동안 활동 없으면 idle
- 마우스, 키보드, 터치 활동 감지
- 자동 로그아웃, 알림에 유용
- 타임아웃 설정

**API**:

```typescript
const isIdle = useIdle(timeout, options);
```

**사용 예시**:

```typescript
const isIdle = useIdle(5 * 60 * 1000); // 5분

useEffect(() => {
  if (isIdle) {
    showInactivityWarning();
  }
}, [isIdle]);
```

**구현 포인트**:

- 여러 이벤트 리스너
- 마지막 활동 시간 추적
- 타이머로 idle 체크
- throttle 적용

---

### 50. useOrientation

**목적**: 디바이스 방향 감지

**주요 기능**:

- portrait/landscape 감지
- 각도 정보
- Screen Orientation API
- orientationchange 이벤트

**API**:

```typescript
const { angle, type } = useOrientation();
// type: 'portrait' | 'landscape'
```

**사용 예시**:

```typescript
const { type } = useOrientation();

return (
  <div>{type === "portrait" ? <PortraitLayout /> : <LandscapeLayout />}</div>
);
```

**구현 포인트**:

- screen.orientation
- orientationchange 이벤트
- 폴백: window.orientation
- SSR-safe

---

### 51. useFullscreen

**목적**: 전체화면 모드 관리

**주요 기능**:

- 전체화면 진입/해제
- 현재 상태 추적
- Fullscreen API
- toggle 함수

**API**:

```typescript
const { isFullscreen, toggle, enter, exit, isSupported } = useFullscreen(ref);
```

**사용 예시**:

```typescript
const videoRef = useRef<HTMLVideoElement>(null);
const { isFullscreen, toggle } = useFullscreen(videoRef);

return (
  <div>
    <video ref={videoRef} src="video.mp4" />
    <button onClick={toggle}>
      {isFullscreen ? "전체화면 해제" : "전체화면"}
    </button>
  </div>
);
```

**구현 포인트**:

- requestFullscreen/exitFullscreen
- fullscreenchange 이벤트
- 브라우저 prefix 처리
- document.fullscreenElement 체크

---

### 52. usePageLeave

**목적**: 페이지 이탈 감지

**주요 기능**:

- 마우스가 viewport 벗어남 감지
- 페이지 나가기 전 경고
- 저장 안 된 변경사항 알림
- beforeunload 이벤트 대안

**API**:

```typescript
usePageLeave(callback, options);
```

**사용 예시**:

```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

usePageLeave(() => {
  if (hasUnsavedChanges) {
    const confirm = window.confirm("저장하지 않은 변경사항이 있습니다.");
    if (confirm) {
      saveChanges();
    }
  }
});
```

**구현 포인트**:

- mouseleave 이벤트 (document)
- clientY < 0 체크
- beforeunload와 차이점 이해

---

### 53. useObjectState

**목적**: 객체 상태 관리 유틸리티

**주요 기능**:

- 객체 상태를 편리하게 업데이트
- 부분 업데이트 지원
- reset 함수
- 불변성 자동 유지

**API**:

```typescript
const [state, setState, reset] = useObjectState<T>(initialState);
```

**사용 예시**:

```typescript
const [form, setForm, resetForm] = useObjectState({
  name: "",
  email: "",
  age: 0,
});

const handleChange = (field: string, value: any) => {
  setForm({ [field]: value }); // 부분 업데이트
};

return (
  <form>
    <input
      value={form.name}
      onChange={(e) => handleChange("name", e.target.value)}
    />
    <button onClick={resetForm}>초기화</button>
  </form>
);
```

**구현 포인트**:

- useState 기반
- 부분 업데이트 (spread)
- reset 함수로 초기 상태 복원
- TypeScript 제네릭

---

### 54. usePermission

**목적**: 브라우저 권한 상태 확인

**주요 기능**:

- Permissions API 사용
- granted/denied/prompt 상태
- 권한 변경 감지
- 다양한 권한 지원 (geolocation, camera 등)

**API**:

```typescript
const permissionState = usePermission({ name: "geolocation" });
// 'granted' | 'denied' | 'prompt' | 'unsupported'
```

**사용 예시**:

```typescript
const cameraPermission = usePermission({ name: "camera" });
const micPermission = usePermission({ name: "microphone" });

return (
  <div>
    카메라: {cameraPermission}
    마이크: {micPermission}
    {cameraPermission === "denied" && <Alert>카메라 권한이 필요합니다</Alert>}
  </div>
);
```
