### useMemoryMonitor

**목적**: 브라우저 메모리 사용량을 실시간으로 모니터링하고 메모리 누수를 감지하여 애플리케이션 성능과 안정성 보장

**주요 기능**:

- 실시간 메모리 사용량 추적 (JS Heap, DOM 노드, 이벤트 리스너)
- 메모리 누수 패턴 감지 및 경고
- 임계값 기반 알림 시스템
- 메모리 스냅샷 비교 및 분석
- GC (가비지 컬렉션) 힌트 트리거
- 메모리 사용 이력 및 추세 분석
- 개발 모드 전용 상세 디버깅 정보
- 지원하지 않는 환경에서 우아한 성능 저하

**API**:

```typescript
const {
  // 현재 상태
  memory, // 현재 메모리 정보 객체
  heapUsed, // 사용 중인 JS Heap (바이트)
  heapTotal, // 전체 JS Heap 크기 (바이트)
  heapLimit, // JS Heap 제한 (바이트)
  usagePercentage, // 메모리 사용률 (0-100)

  // DOM 관련
  domNodes, // 현재 DOM 노드 개수
  eventListeners, // 등록된 이벤트 리스너 개수

  // 상태 플래그
  isSupported, // API 지원 상태
  isMonitoring, // 모니터링 활성 상태
  isLeakDetected, // 메모리 누수 감지 상태
  severity, // 심각도 수준 ('normal' | 'warning' | 'critical')

  // 지원 세부 정보
  supportLevel, // 'full' | 'partial' | 'none'
  availableMetrics, // 사용 가능한 메트릭 이름 배열

  // 분석 데이터
  history, // 메모리 이력 배열
  trend, // 메모리 추세 ('stable' | 'increasing' | 'decreasing')
  leakProbability, // 누수 가능성 (0-100)

  // 액션
  start, // 모니터링 시작
  stop, // 모니터링 중지
  takeSnapshot, // 현재 스냅샷 저장
  compareSnapshots, // 두 스냅샷 비교
  clearHistory, // 이력 지우기
  requestGC, // GC 힌트 요청 (가능한 경우)

  // 포맷팅
  formatted, // 포맷된 메모리 값 { heapUsed: '45.2 MB', ... }
} = useMemoryMonitor(options);
```

**사용 예제**:

```typescript
// 기본 사용법
const { heapUsed, usagePercentage, isLeakDetected } = useMemoryMonitor();

// 임계값 구성을 포함한 상세 모니터링
const monitor = useMemoryMonitor({
  interval: 2000,
  enableHistory: true,
  historySize: 100,
  thresholds: {
    warning: 70, // 70% 사용 시 경고
    critical: 90, // 90% 사용 시 위험
  },
  leakDetection: {
    enabled: true,
    sensitivity: "medium",
    windowSize: 10, // 최근 10개 샘플 기준
  },
  onWarning: (data) => console.warn("메모리 경고:", data),
  onCritical: (data) => captureErrorLog(data),
  onLeakDetected: (analysis) => reportToMonitoring(analysis),
});

// 개발 환경에서 디버깅
const debugMonitor = useMemoryMonitor({
  devMode: true,
  trackDOMNodes: true,
  trackEventListeners: true,
  logToConsole: true,
});

// 스냅샷 비교를 통한 메모리 누수 추적
useEffect(() => {
  monitor.takeSnapshot("before-action");

  return () => {
    monitor.takeSnapshot("after-action");
    const diff = monitor.compareSnapshots("before-action", "after-action");
    if (diff.heapDelta > 1024 * 1024) {
      // 1MB 이상 증가
      console.warn("잠재적 메모리 누수:", diff);
    }
  };
}, []);

// 지원하지 않는 환경 우아하게 처리
const monitor = useMemoryMonitor({
  onUnsupported: (info) => {
    console.info("메모리 API가 완전히 지원되지 않습니다:", info.reason);
    // 대체 모니터링 전략으로 폴백
  },
});

if (!monitor.isSupported) {
  return <div>이 브라우저에서는 메모리 모니터링을 사용할 수 없습니다</div>;
}

// 특정 메트릭 가용성 확인
if (monitor.availableMetrics.includes("heapUsed")) {
  console.log("힙 추적 가능");
}

return (
  <div>
    <p>사용 중인 힙: {monitor.formatted.heapUsed}</p>
    <p>사용률: {monitor.usagePercentage.toFixed(1)}%</p>
    <p>추세: {monitor.trend}</p>
    {monitor.isLeakDetected && (
      <Alert severity="warning">
        메모리 누수 감지! 가능성: {monitor.leakProbability}%
      </Alert>
    )}
    <MemoryChart data={monitor.history} />
  </div>
);
```

**구현 포인트**:

- `performance.measureUserAgentSpecificMemory()` 또는 `performance.memory` API 활용
- 지원하지 않는 브라우저에 대한 우아한 성능 저하
- `useRef`로 인터벌 ID 및 이력 관리
- `useEffect`로 모니터링 정리
- Web Worker 옵션 (메인 스레드 블로킹 방지)
- 메모리 추세 분석을 위한 선형 회귀 알고리즘
- 이력 메모리 효율성을 위한 순환 버퍼
- `MutationObserver`로 DOM 노드 변경 추적
- `getEventListeners()` 폴리필 (개발 환경)
- 바이트 단위 포맷팅 유틸리티 (B, KB, MB, GB)
- TypeScript 엄격한 타입 안전성
- 프로덕션 빌드에서 자동 비활성화 옵션
- `useSyncExternalStore` 고려 (동시성 모드 안정성)
- 불필요한 리렌더링 방지를 위한 메모이제이션

**옵션 인터페이스**:

```typescript
interface UseMemoryMonitorOptions {
  // 기본 설정
  interval?: number; // 모니터링 간격 (ms), 기본값: 5000
  autoStart?: boolean; // 자동 시작, 기본값: true
  enabled?: boolean; // 활성화 상태, 기본값: true

  // 이력
  enableHistory?: boolean; // 이력 저장, 기본값: false
  historySize?: number; // 최대 이력 크기, 기본값: 50

  // 임계값
  thresholds?: {
    warning?: number; // 경고 임계값 (%), 기본값: 70
    critical?: number; // 위험 임계값 (%), 기본값: 90
  };

  // 누수 감지
  leakDetection?: {
    enabled?: boolean; // 누수 감지 활성화, 기본값: false
    sensitivity?: "low" | "medium" | "high"; // 민감도, 기본값: 'medium'
    windowSize?: number; // 분석 윈도우 크기, 기본값: 10
    threshold?: number; // 증가율 임계값 (바이트/샘플)
  };

  // 추가 추적 (개발)
  devMode?: boolean; // 개발 모드, 기본값: false
  trackDOMNodes?: boolean; // DOM 노드 추적, 기본값: false
  trackEventListeners?: boolean; // 이벤트 리스너 추적, 기본값: false
  logToConsole?: boolean; // 콘솔 로깅, 기본값: false

  // 콜백
  onUpdate?: (memory: MemoryInfo) => void;
  onWarning?: (data: MemoryWarning) => void;
  onCritical?: (data: MemoryCritical) => void;
  onLeakDetected?: (analysis: LeakAnalysis) => void;
  onUnsupported?: (info: UnsupportedInfo) => void;

  // 고급 설정
  useWorker?: boolean; // Web Worker 사용, 기본값: false
  disableInProduction?: boolean; // 프로덕션에서 비활성화, 기본값: false
  fallbackStrategy?: "none" | "estimation" | "dom-only"; // 지원하지 않는 브라우저용 폴백
}
```

**반환 타입**:

```typescript
interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  timestamp: number;
}

interface MemorySnapshot {
  id: string;
  memory: MemoryInfo;
  domNodes?: number;
  eventListeners?: number;
  timestamp: number;
}

interface LeakAnalysis {
  isLeaking: boolean;
  probability: number; // 0-100
  trend: "stable" | "increasing" | "decreasing";
  averageGrowth: number; // 인터벌당 바이트
  samples: MemoryInfo[];
  recommendation?: string;
}

interface SnapshotDiff {
  heapDelta: number;
  heapPercentChange: number;
  domNodesDelta?: number;
  eventListenersDelta?: number;
  timeDelta: number;
}

interface UnsupportedInfo {
  reason: "no-api" | "server-side" | "insecure-context" | "browser-restriction";
  browser?: string;
  availableFallbacks: string[];
}
```

**브라우저 호환성**:

```typescript
// API 지원 매트릭스
┌─────────────────────────────────────────────────────────────────────────────┐
│ API                                  │ Chrome │ Firefox │ Safari │ Edge    │
├─────────────────────────────────────────────────────────────────────────────┤
│ performance.memory                   │ ✅      │ ❌       │ ❌      │ ✅      │
│ ├─ usedJSHeapSize                    │ ✅      │ ❌       │ ❌      │ ✅      │
│ ├─ totalJSHeapSize                   │ ✅      │ ❌       │ ❌      │ ✅      │
│ └─ jsHeapSizeLimit                   │ ✅      │ ❌       │ ❌      │ ✅      │
│ measureUserAgentSpecificMemory()     │ ✅ 89+  │ ❌       │ ❌      │ ✅ 89+  │
│ PerformanceObserver ('memory')       │ 🔶      │ ❌       │ ❌      │ 🔶      │
│ document.querySelectorAll (DOM count)│ ✅      │ ✅       │ ✅      │ ✅      │
│ MutationObserver                     │ ✅      │ ✅       │ ✅      │ ✅      │
│ getEventListeners() (DevTools only)  │ ✅      │ ✅       │ ✅      │ ✅      │
└─────────────────────────────────────────────────────────────────────────────┘
✅ 지원됨  🔶 부분/플래그 필요  ❌ 지원 안 됨

// 지원 수준 감지
type SupportLevel = 'full' | 'partial' | 'none';

interface BrowserSupport {
  level: SupportLevel;
  availableMetrics: AvailableMetric[];
  limitations: string[];
}

type AvailableMetric =
  | 'heapUsed'
  | 'heapTotal'
  | 'heapLimit'
  | 'domNodes'
  | 'eventListeners';

// 감지 구현
function detectSupport(): BrowserSupport {
  // 완전 지원: performance.memory가 있는 Chrome/Edge
  // 부분 지원: DOM 추적만 가능한 모든 브라우저
  // 미지원: SSR 또는 관련 API 없음
}
```

**폴백 전략**:

```typescript
// 전략 1: 'none' - 지원하지 않는 상태 반환, 모니터링 없음
// 전략 2: 'estimation' - 객체 할당 추적을 통해 메모리 추정
// 전략 3: 'dom-only' - DOM 노드 및 이벤트 리스너만 추적

interface FallbackBehavior {
  none: {
    isSupported: false;
    // 모든 메모리 값은 null 반환
    heapUsed: null;
    heapTotal: null;
    heapLimit: null;
  };
  estimation: {
    isSupported: true; // 부분
    // 추적된 객체 크기를 기반으로 대략적인 추정
    // 정확도는 떨어지지만 추세 데이터 제공
    heapUsed: number; // 추정값
    heapTotal: null;
    heapLimit: null;
  };
  "dom-only": {
    isSupported: true; // 부분
    // DOM 관련 메트릭만 사용 가능
    heapUsed: null;
    domNodes: number;
    eventListeners: number; // 수동 추적을 통해
  };
}
```

**서버 사이드 렌더링 (SSR) 호환성**:

```typescript
// SSR 감지 및 처리
const isServer = typeof window === "undefined";
const isClient = !isServer;

// SSR 안전 구현 패턴
function useMemoryMonitor(options?: UseMemoryMonitorOptions) {
  // 1. SSR에 대한 조기 반환 - 안전한 기본값 반환
  if (typeof window === "undefined") {
    return {
      isSupported: false,
      isServer: true,
      heapUsed: null,
      heapTotal: null,
      heapLimit: null,
      usagePercentage: null,
      // ... 모든 값 null/false
      start: () => {}, // no-op 함수
      stop: () => {},
      takeSnapshot: () => null,
      // ...
    };
  }

  // 2. useEffect를 사용한 클라이언트 측 초기화
  useEffect(() => {
    // 모든 브라우저 API 접근은 여기서 발생
    // SSR 하이드레이션 불일치로부터 안전
  }, []);

  // 3. 브라우저 API에 대한 지연 초기화 사용
  const memoryAPIRef = useRef<Performance["memory"] | null>(null);

  useEffect(() => {
    memoryAPIRef.current = (performance as any).memory ?? null;
  }, []);
}

// 프레임워크별 고려 사항
/*
 * Next.js:
 *   - 메모리 집약적 시각화에는 { ssr: false }로 동적 import 사용
 *   - 필요시 ClientOnly 컴포넌트로 래핑
 *
 * Remix:
 *   - 메모리 데이터에 clientLoader 사용
 *   - loader 함수에서 window 접근 없음을 보장
 *
 * Gatsby:
 *   - 모든 브라우저 API 접근에 useEffect 사용
 *   - gatsby-browser.js에서 typeof window 확인
 */

// 하이드레이션 불일치 방지
interface SSRSafeState {
  // SSR 일관성을 위해 undefined 대신 null 사용
  heapUsed: number | null;
  // 초기 상태에서 Date.now() 사용 피하기
  timestamp: number | null;
  // false로 초기화, useEffect에서 업데이트
  isMonitoring: boolean;
}
```

**보안 컨텍스트 요구사항**:

```typescript
// measureUserAgentSpecificMemory() 요구사항:
// 1. 보안 컨텍스트 (HTTPS)
// 2. 교차 출처 격리 헤더:
//    - Cross-Origin-Opener-Policy: same-origin
//    - Cross-Origin-Embedder-Policy: require-corp

function checkSecureContextRequirements(): {
  isSecureContext: boolean;
  isCrossOriginIsolated: boolean;
  canUsePreciseMemory: boolean;
  missingRequirements: string[];
} {
  const isSecureContext = window.isSecureContext ?? false;
  const isCrossOriginIsolated = window.crossOriginIsolated ?? false;

  const missing: string[] = [];
  if (!isSecureContext) missing.push("HTTPS 필요");
  if (!isCrossOriginIsolated) {
    missing.push("Cross-Origin-Opener-Policy: same-origin");
    missing.push("Cross-Origin-Embedder-Policy: require-corp");
  }

  return {
    isSecureContext,
    isCrossOriginIsolated,
    canUsePreciseMemory: isSecureContext && isCrossOriginIsolated,
    missingRequirements: missing,
  };
}
```

**고급 기능**:

- 컴포넌트별 메모리 영향 분석 (React DevTools 통합)
- 메모리 프로파일링 데이터 내보내기 (JSON, CSV)
- 실시간 메모리 차트 렌더링 최적화
- 커스텀 메모리 메트릭 확장 지원
- SSR 환경 안전 처리 (window undefined)
- React Strict Mode 호환성
- 외부 모니터링 서비스 통합 (Sentry, DataDog 등)
- 메모리 압박 하에서 자동 정리 트리거
- 백그라운드 탭 감지 및 모니터링 간격 조정
- 교차 출처 iframe 메모리 추적 옵션

**테스트 고려사항**:

- 단위 테스트용 `performance.memory` 모킹
- 메모리 누수 시뮬레이션 테스트 케이스
- 경계값 테스트 (0%, 100%, 음수 값)
- 장시간 실행 안정성 테스트
- 동시 다중 인스턴스 테스트
- SSR 환경 시뮬레이션 테스트
- 크로스 브라우저 호환성 테스트
- 보안 컨텍스트 요구사항 테스트
