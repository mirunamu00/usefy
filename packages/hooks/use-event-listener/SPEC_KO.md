### useEventListener

**목적**: DOM 요소에 이벤트 리스너를 추가하고 자동으로 정리(cleanup)

**주요 기능**:

- window, document, HTMLElement, RefObject 대상 지원
- TypeScript 이벤트 타입 추론 (MouseEvent, KeyboardEvent 등)
- 언마운트 시 자동 정리
- 핸들러 안정성 (핸들러 변경 시 리스너 재등록 방지)
- enabled 옵션을 통한 조건부 활성화
- 이벤트 리스너 옵션 지원 (capture, passive, once)
- SSR 호환

**API**:

```typescript
useEventListener(eventName, handler, element?, options?);
```

**파라미터**:

| 파라미터    | 타입                      | 설명                                  |
| ----------- | ------------------------- | ------------------------------------- |
| `eventName` | `string`                  | 수신할 이벤트 타입                    |
| `handler`   | `(event: Event) => void`  | 이벤트 발생 시 호출되는 콜백 함수     |
| `element`   | `EventTargetType`         | 대상 요소 (기본값: window)            |
| `options`   | `UseEventListenerOptions` | 설정 옵션                             |

**사용 예시**:

```typescript
// Window 이벤트 (기본 대상)
useEventListener("resize", () => {
  console.log("윈도우 크기 변경:", window.innerWidth);
});

// Document 이벤트
useEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape") closeModal();
  },
  document
);

// HTMLElement 이벤트
const button = document.getElementById("myButton");
useEventListener("click", handleClick, button);

// RefObject 이벤트
const ref = useRef<HTMLDivElement>(null);
useEventListener("scroll", handleScroll, ref);

// 옵션 사용
useEventListener("scroll", handleScroll, window, {
  passive: true,
  capture: false,
});

// 조건부 활성화
useEventListener("mousemove", handleMouseMove, document, {
  enabled: isTracking,
});

// 일회성 이벤트
useEventListener("click", handleFirstClick, document, {
  once: true,
});
```

**구현 포인트**:

- `useRef`에 핸들러 저장하여 이벤트 리스너 재등록 방지
- `typeof window === "undefined"`로 SSR 체크
- `useEffect`의 cleanup 함수에서 리스너 제거
- `null` (리스너 없음)과 `undefined` (window 기본값) 구분 지원
- RefObject에서 `target.current`로 요소 추출
- add와 remove에 동일한 `capture` 옵션 전달
- `passive` 옵션은 명시적으로 제공될 때만 설정 (브라우저 기본값 존중)

**옵션 인터페이스**:

```typescript
interface UseEventListenerOptions {
  /**
   * 이벤트 리스너 활성화 여부
   * @default true
   */
  enabled?: boolean;

  /**
   * 이벤트 캡처 단계 사용 여부
   * @default false
   */
  capture?: boolean;

  /**
   * 성능 최적화를 위한 passive 이벤트 리스너 사용 여부
   * scroll/touch 이벤트에 유용
   * @default undefined (브라우저 기본값)
   */
  passive?: boolean;

  /**
   * 핸들러가 한 번만 호출되고 제거될지 여부
   * @default false
   */
  once?: boolean;
}
```

**대상 타입**:

```typescript
type EventTargetType<T extends HTMLElement = HTMLElement> =
  | Window // window 객체
  | Document // document 객체
  | HTMLElement // 모든 HTML 요소
  | React.RefObject<T> // React ref
  | null // 리스너 없음
  | undefined; // window 기본값
```

**타입 오버로드**:

```typescript
// Window 이벤트
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window | null,
  options?: UseEventListenerOptions
): void;

// Document 이벤트
function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: Document,
  options?: UseEventListenerOptions
): void;

// HTMLElement 이벤트
function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: HTMLElement | null,
  options?: UseEventListenerOptions
): void;

// RefObject 이벤트
function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement
>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: React.RefObject<T | null>,
  options?: UseEventListenerOptions
): void;

// 커스텀 이벤트 (폴백)
function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventTargetType,
  options?: UseEventListenerOptions
): void;
```

**이벤트 타입 추론 예시**:

```typescript
// MouseEvent 자동 추론
useEventListener("click", (e) => {
  console.log(e.clientX, e.clientY);
});

// KeyboardEvent 자동 추론
useEventListener(
  "keydown",
  (e) => {
    console.log(e.key, e.code);
  },
  document
);

// FocusEvent 자동 추론
useEventListener(
  "focus",
  (e) => {
    console.log(e.relatedTarget);
  },
  inputRef
);

// ScrollEvent
useEventListener(
  "scroll",
  (e) => {
    console.log(window.scrollY);
  },
  window,
  { passive: true }
);
```

**일반적인 사용 사례**:

1. **윈도우 리사이즈 처리**

   ```typescript
   useEventListener("resize", () => {
     setWindowSize({ width: window.innerWidth, height: window.innerHeight });
   });
   ```

2. **키보드 단축키**

   ```typescript
   useEventListener(
     "keydown",
     (e) => {
       if (e.ctrlKey && e.key === "s") {
         e.preventDefault();
         saveDocument();
       }
     },
     document
   );
   ```

3. **passive 리스너로 스크롤 추적**

   ```typescript
   useEventListener(
     "scroll",
     () => {
       setScrollY(window.scrollY);
     },
     window,
     { passive: true }
   );
   ```

4. **네트워크 상태 감지**

   ```typescript
   useEventListener("online", () => setIsOnline(true));
   useEventListener("offline", () => setIsOnline(false));
   ```

5. **요소별 마우스 추적**

   ```typescript
   const boxRef = useRef<HTMLDivElement>(null);
   useEventListener(
     "mousemove",
     (e) => {
       const rect = boxRef.current?.getBoundingClientRect();
       if (rect) {
         setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
       }
     },
     boxRef
   );
   ```

6. **가시성 변경 감지**
   ```typescript
   useEventListener(
     "visibilitychange",
     () => {
       if (document.hidden) {
         pauseVideo();
       } else {
         resumeVideo();
       }
     },
     document
   );
   ```

**의존성 배열**:

```typescript
// deps: [eventName, element, enabled, capture, passive, once]
//
// - eventName: 이벤트 타입 변경 시 재등록
// - element: 대상 요소 변경 시 재등록
// - enabled: 토글 시 리스너 추가/제거
// - capture: 캡처 모드 변경 시 재등록
// - passive: passive 옵션 변경 시 재등록
// - once: once 옵션 변경 시 재등록
//
// handler는 ref에 저장되어 재등록 방지를 위해 deps에서 제외
```

**엣지 케이스**:

- `element = null`: 리스너가 추가되지 않음
- `element = undefined`: window를 기본값으로 사용
- `RefObject.current = null`: 리스너가 추가되지 않음
- 핸들러 변경: 리스너는 재등록되지 않고, 새 핸들러가 호출됨
- 빠른 enabled 토글: cleanup을 통해 올바르게 처리됨
- SSR 환경: 아무것도 하지 않고 조기 반환
