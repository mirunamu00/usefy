# usefy Hooks Roadmap

## Overview

이 문서는 usefy 라이브러리에 포함될 React 커스텀 훅들의 로드맵과 상세 기능 명세를 담고 있습니다.

---

## Hooks List

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
