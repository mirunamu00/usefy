### useInterval

**Purpose**: setInterval을 React hook으로 래핑하여 선언적이고 안전한 반복 실행을 제공

**Key Features**:

- 지정된 간격으로 콜백 반복 실행 (setInterval 래퍼)
- 컴포넌트 언마운트 시 자동 정리 (메모리 누수 방지)
- 타이밍 손실 없이 동적 간격 조정
- start/stop/reset 함수로 타이머 제어
- delay가 null일 때 인터벌 비활성화 (조건부 실행)
- 항상 최신 콜백 참조 유지 (stale closure 방지)
- isRunning 상태로 인터벌 실행 여부 확인
- 즉시 실행 옵션 (콜백 즉시 실행 후 인터벌 시작)

**API**:

```typescript
// 기본 사용 (자동 시작)
useInterval(callback, delay);

// 제어 함수와 함께 사용
const { start, stop, toggle, isRunning } = useInterval(callback, delay);

// 조건부 실행 (delay가 null이면 비활성화)
useInterval(callback, isEnabled ? 1000 : null);

// 옵션과 함께 사용
useInterval(callback, delay, { immediate: true });
```

**Return Interface**:

```typescript
interface UseIntervalReturn {
  start: () => void; // 인터벌 시작
  stop: () => void; // 인터벌 정지
  toggle: () => void; // 시작/정지 토글
  isRunning: boolean; // 인터벌 실행 중 여부
}
```

**Options Interface**:

```typescript
interface UseIntervalOptions {
  immediate?: boolean; // 시작 시 콜백 즉시 실행 (기본값: false)
  autoStart?: boolean; // 자동으로 인터벌 시작 (기본값: true)
}
```

**Usage Example**:

```typescript
// 1. 기본 폴링
const [data, setData] = useState(null);

useInterval(() => {
  fetchData().then(setData);
}, 5000); // 5초마다 폴링

// 2. 카운트다운 타이머
const [count, setCount] = useState(10);

useInterval(
  () => {
    setCount((c) => c - 1);
  },
  count > 0 ? 1000 : null // 0이 되면 정지
);

return <div>카운트다운: {count}</div>;

// 3. 수동 제어 자동 새로고침
const [isAutoRefresh, setIsAutoRefresh] = useState(true);

const { start, stop, isRunning } = useInterval(
  () => {
    refreshData();
  },
  isAutoRefresh ? 3000 : null
);

return (
  <div>
    <button onClick={() => setIsAutoRefresh(!isAutoRefresh)}>
      {isRunning ? "자동 새로고침 중지" : "자동 새로고침 시작"}
    </button>
  </div>
);

// 4. 애니메이션 프레임 카운터
const [frame, setFrame] = useState(0);

useInterval(() => {
  setFrame((f) => f + 1);
}, 16); // ~60fps

// 5. 실시간 시계
const [time, setTime] = useState(new Date());

useInterval(() => {
  setTime(new Date());
}, 1000);

return <div>{time.toLocaleTimeString()}</div>;

// 6. 즉시 실행 옵션
const [logs, setLogs] = useState<string[]>([]);

useInterval(
  () => {
    setLogs((prev) => [...prev, `로그: ${new Date().toISOString()}`]);
  },
  2000,
  { immediate: true } // 즉시 실행 후 2초마다 실행
);

// 7. 일시정지/재개 기능
const { toggle, isRunning } = useInterval(() => {
  console.log("틱!");
}, 1000);

return <button onClick={toggle}>{isRunning ? "일시정지" : "재개"}</button>;
```

**Implementation Points**:

- `useRef`로 인터벌 ID 관리 (메모리 누수 방지)
- `useRef`로 최신 콜백 참조 유지 (stale closure 문제 해결)
- `useEffect`로 cleanup 처리 (컴포넌트 언마운트 시)
- delay가 `null`이면 인터벌 설정하지 않음 (조건부 실행)
- delay 변경 시 새로운 간격으로 인터벌 재시작
- `useCallback`으로 start/stop/toggle 함수 메모이제이션
- TypeScript strict 타입 안전성
- 즉시 실행 옵션 지원

**Edge Cases & Error Handling**:

- `delay < 0`: 0으로 처리 (가능한 빠르게 실행, 권장하지 않음)
- `delay === 0`: 가능한 빠르게 실행 (주의: 성능 문제 발생 가능)
- `delay === null | undefined`: 인터벌 비활성화
- `callback` 변경: 인터벌 재시작하지 않음 (최신 참조만 유지)
- 컴포넌트 언마운트: 즉시 인터벌 정리
- 실행 중 `start()` 호출: 효과 없음 (멱등성)
- 정지 상태에서 `stop()` 호출: 효과 없음 (멱등성)

**TypeScript Types**:

```typescript
type IntervalDelay = number | null | undefined;

type UseIntervalCallback = () => void;

interface UseIntervalOptions {
  immediate?: boolean;
  autoStart?: boolean;
}

interface UseIntervalReturn {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  isRunning: boolean;
}

function useInterval(
  callback: UseIntervalCallback,
  delay: IntervalDelay,
  options?: UseIntervalOptions
): UseIntervalReturn;
```

**Testing Scenarios**:

1. 기본 동작: 콜백이 인터벌마다 반복 실행
2. 자동 정리: 언마운트 시 인터벌 정리
3. delay 변경: 새로운 delay로 인터벌 재시작
4. null delay: delay가 null일 때 인터벌 미설정
5. start 함수: 호출 시 인터벌 시작
6. stop 함수: 호출 시 인터벌 정지
7. toggle 함수: start/stop 교대 실행
8. isRunning 상태: 인터벌 상태 정확히 반영
9. 콜백 변경: 인터벌 재시작 없이 최신 콜백 실행
10. immediate 옵션: 콜백 즉시 실행 후 인터벌 시작
11. autoStart 옵션: 옵션에 따라 자동 시작/미시작
12. 중복 start 호출: 멱등성 (인터벌 중복 없음)
13. SSR 환경: 서버 사이드에서 에러 없이 동작

**Performance Considerations**:

- start/stop/toggle 함수는 `useCallback`으로 메모이제이션하여 참조 안정성 보장
- 콜백 참조를 `useRef`로 관리하여 불필요한 인터벌 재시작 방지
- isRunning 상태 업데이트 최소화
- 매우 작은 delay 값(< 10ms)에 대해 개발자 경고

**Comparison with Similar Hooks**:

| Feature           | useTimeout | useInterval | useTimer |
| ----------------- | ---------- | ----------- | -------- |
| 일회성 실행       | ✅         | ❌          | ❌       |
| 반복 실행         | ❌         | ✅          | ❌       |
| 카운트다운        | ❌         | ❌          | ✅       |
| 남은 시간 표시    | ❌         | ❌          | ✅       |
| start/stop 제어   | ❌         | ✅          | ✅       |
| reset/clear 제어  | ✅         | ❌          | ✅       |
| 조건부 실행       | ✅         | ✅          | ✅       |
| 즉시 실행         | ❌         | ✅          | ❌       |

**Dependencies**:

- 외부 의존성 없음 (React만 사용)

**Browser Support**:

- 모든 모던 브라우저 지원
- setInterval API 사용 (IE6+)
- SSR 환경에서 안전하게 동작 (typeof window 체크)
