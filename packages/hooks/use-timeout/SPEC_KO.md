### useTimeout

**Purpose**: setTimeout을 React hook으로 래핑하여 선언적이고 안전한 지연 실행을 제공

**Key Features**:

- 지연된 콜백 실행 (setTimeout 래핑)
- 컴포넌트 언마운트 시 자동 정리 (메모리 누수 방지)
- delay 변경 시 타이머 자동 리셋
- reset/clear 함수로 타이머 제어
- delay가 null일 때 타이머 비활성화 (조건부 실행)
- 항상 최신 콜백 참조 유지 (stale closure 방지)
- isPending 상태로 타이머 실행 여부 확인

**API**:

```typescript
// 기본 사용 (반환값 없이)
useTimeout(callback, delay);

// 제어 함수와 함께 사용
const { reset, clear, isPending } = useTimeout(callback, delay);

// 조건부 실행 (delay가 null이면 비활성화)
useTimeout(callback, isEnabled ? 3000 : null);
```

**Return Interface**:

```typescript
interface UseTimeoutReturn {
  reset: () => void; // 타이머 리셋 (처음부터 다시 시작)
  clear: () => void; // 타이머 취소 (콜백 실행 안 함)
  isPending: boolean; // 타이머가 대기 중인지 여부
}
```

**Usage Example**:

```typescript
// 1. 자동 사라지는 Toast 메시지
const [show, setShow] = useState(true);

useTimeout(() => {
  setShow(false);
}, 3000);

return show && <Toast message="3초 후 자동으로 사라집니다" />;

// 2. 디바운스된 자동 저장
const [content, setContent] = useState("");
const [isSaving, setIsSaving] = useState(false);

const { reset } = useTimeout(() => {
  saveToServer(content);
  setIsSaving(false);
}, 2000);

const handleChange = (value: string) => {
  setContent(value);
  setIsSaving(true);
  reset(); // 타이핑할 때마다 타이머 리셋
};

// 3. 조건부 타이머
const [isLoggedIn, setIsLoggedIn] = useState(true);

useTimeout(
  () => {
    logout();
    alert("세션이 만료되었습니다");
  },
  isLoggedIn ? 30 * 60 * 1000 : null // 로그인 상태일 때만 30분 후 자동 로그아웃
);

// 4. 지연된 리다이렉트
const [countdown, setCountdown] = useState(5);
const { clear } = useTimeout(() => {
  navigate("/home");
}, 5000);

return (
  <div>
    <p>{countdown}초 후 홈으로 이동합니다</p>
    <button onClick={clear}>취소</button>
  </div>
);

// 5. 타이머 상태 확인
const { isPending, reset, clear } = useTimeout(() => {
  console.log("실행됨!");
}, 5000);

return (
  <div>
    <p>상태: {isPending ? "대기 중..." : "완료 또는 취소됨"}</p>
    <button onClick={reset} disabled={isPending}>
      다시 시작
    </button>
    <button onClick={clear} disabled={!isPending}>
      취소
    </button>
  </div>
);
```

**Implementation Points**:

- `useRef`로 타이머 ID 관리 (메모리 누수 방지)
- `useRef`로 최신 콜백 참조 유지 (stale closure 문제 해결)
- `useEffect`로 cleanup 처리 (컴포넌트 언마운트 시)
- delay가 `null`이면 타이머 설정하지 않음 (조건부 실행)
- delay 변경 시 기존 타이머 취소 후 새 타이머 설정
- `useCallback`으로 reset/clear 함수 메모이제이션
- TypeScript strict 타입 안전성

**Options Interface**:

```typescript
// 현재는 단순한 API 유지 (options 객체 없음)
// 향후 확장 가능한 구조:
interface UseTimeoutOptions {
  immediate?: boolean; // true면 즉시 실행 후 delay 후 다시 실행
  onClear?: () => void; // 타이머 취소 시 콜백
  onReset?: () => void; // 타이머 리셋 시 콜백
}
```

**Edge Cases & Error Handling**:

- `delay < 0`: 0으로 처리 (즉시 실행)
- `delay === 0`: 즉시 실행 (다음 이벤트 루프)
- `delay === null | undefined`: 타이머 비활성화
- `callback`이 변경되어도 타이머 리셋하지 않음 (최신 참조만 유지)
- 컴포넌트 언마운트 시 콜백 실행하지 않음

**TypeScript Types**:

```typescript
type TimeoutDelay = number | null | undefined;

type UseTimeoutCallback = () => void;

interface UseTimeoutReturn {
  reset: () => void;
  clear: () => void;
  isPending: boolean;
}

function useTimeout(
  callback: UseTimeoutCallback,
  delay: TimeoutDelay
): UseTimeoutReturn;
```

**Testing Scenarios**:

1. 기본 동작: delay 후 콜백이 실행되는지
2. 자동 정리: 언마운트 시 콜백이 실행되지 않는지
3. delay 변경: delay 변경 시 타이머가 리셋되는지
4. null delay: delay가 null일 때 타이머가 설정되지 않는지
5. reset 함수: reset 호출 시 타이머가 처음부터 다시 시작하는지
6. clear 함수: clear 호출 시 타이머가 취소되는지
7. isPending 상태: 타이머 상태가 정확히 반영되는지
8. 콜백 변경: 콜백 변경 시 타이머 리셋 없이 최신 콜백이 실행되는지
9. 음수 delay: 0으로 처리되는지
10. SSR 환경: 서버 사이드에서 에러 없이 동작하는지

**Performance Considerations**:

- reset/clear 함수는 `useCallback`으로 메모이제이션하여 참조 안정성 보장
- 콜백 참조를 `useRef`로 관리하여 불필요한 타이머 재설정 방지
- isPending 상태 업데이트 최소화

**Comparison with Similar Hooks**:

| Feature          | useTimeout | useInterval | useTimer |
| ---------------- | ---------- | ----------- | -------- |
| 일회성 실행      | ✅         | ❌          | ❌       |
| 반복 실행        | ❌         | ✅          | ❌       |
| 카운트다운       | ❌         | ❌          | ✅       |
| 남은 시간 표시   | ❌         | ❌          | ✅       |
| reset/clear 제어 | ✅         | ✅          | ✅       |
| 조건부 실행      | ✅         | ✅          | ✅       |

**Dependencies**:

- 외부 의존성 없음 (React만 사용)

**Browser Support**:

- 모든 모던 브라우저 지원
- setTimeout API 사용 (IE6+)
- SSR 환경에서 안전하게 동작 (타이머 예약이 `useEffect` 내부에서만 일어나며, 서버에서는 effect가 실행되지 않으므로 서버 렌더링 중에는 타이머가 생성되지 않음)
