<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-session-storage</h1>

<p align="center">
  <strong>A lightweight React hook for persisting state in sessionStorage</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-session-storage">
    <img src="https://img.shields.io/npm/v/@usefy/use-session-storage.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-session-storage">
    <img src="https://img.shields.io/npm/dm/@usefy/use-session-storage.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-session-storage">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-session-storage?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-session-storage.svg?style=flat-square&color=007acc" alt="license" />
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#examples">Examples</a> •
  <a href="#license">License</a>
</p>

---

## Overview

`@usefy/use-session-storage` provides a `useState`-like API for persisting data in sessionStorage. Data persists during the browser session (tab lifetime) but clears when the tab is closed. Each tab has isolated storage, making it perfect for temporary form data, wizard steps, and session-specific state.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-session-storage?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with generics and exported interfaces
- **useState-like API** — Familiar tuple return: `[value, setValue, removeValue]`
- **Tab Isolation** — Each browser tab has its own session storage
- **Auto-Cleanup** — Data cleared automatically when tab closes
- **Custom Serialization** — Support for Date, Map, Set, or any custom type
- **Lazy Initialization** — Function initializer support for expensive defaults
- **Error Handling** — `onError` callback for graceful error recovery
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Stable References** — Memoized functions for optimal performance
- **Well Tested** — Comprehensive test coverage with Vitest

### localStorage vs sessionStorage

| Feature          | localStorage             | sessionStorage            |
| ---------------- | ------------------------ | ------------------------- |
| Data persistence | Until explicitly cleared | Until tab closes          |
| Tab sharing      | Shared across all tabs   | Isolated per tab          |
| Best for         | User preferences, themes | Form drafts, wizard steps |

---

## Installation

```bash
# npm
npm install @usefy/use-session-storage

# yarn
yarn add @usefy/use-session-storage

# pnpm
pnpm add @usefy/use-session-storage
```

### Peer Dependencies

This package requires React 18 or 19:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Quick Start

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

function CheckoutForm() {
  const [formData, setFormData, clearForm] = useSessionStorage(
    "checkout-form",
    {
      name: "",
      email: "",
      address: "",
    }
  );

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, name: e.target.value }))
        }
        placeholder="Name"
      />
      <input
        value={formData.email}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, email: e.target.value }))
        }
        placeholder="Email"
      />
      <button type="button" onClick={clearForm}>
        Clear Form
      </button>
    </form>
  );
}
```

---

## API Reference

### `useSessionStorage<T>(key, initialValue, options?)`

A hook that persists state in sessionStorage for the duration of the browser session.

#### Parameters

| Parameter      | Type                          | Description                                |
| -------------- | ----------------------------- | ------------------------------------------ |
| `key`          | `string`                      | The sessionStorage key                     |
| `initialValue` | `T \| () => T`                | Initial value or lazy initializer function |
| `options`      | `UseSessionStorageOptions<T>` | Configuration options                      |

#### Options

| Option         | Type                     | Default          | Description                  |
| -------------- | ------------------------ | ---------------- | ---------------------------- |
| `serializer`   | `(value: T) => string`   | `JSON.stringify` | Custom serializer function   |
| `deserializer` | `(value: string) => T`   | `JSON.parse`     | Custom deserializer function |
| `onError`      | `(error: Error) => void` | —                | Callback for error handling  |

#### Returns `[T, SetValue<T>, RemoveValue]`

| Index | Type                          | Description                                   |
| ----- | ----------------------------- | --------------------------------------------- |
| `[0]` | `T`                           | Current stored value                          |
| `[1]` | `Dispatch<SetStateAction<T>>` | Function to update value (same as useState)   |
| `[2]` | `() => void`                  | Function to remove value and reset to initial |

---

## Examples

### Multi-Step Wizard

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

function SignupWizard() {
  const [step, setStep] = useSessionStorage("signup-step", 1);
  const [formData, setFormData, resetForm] = useSessionStorage("signup-data", {
    email: "",
    password: "",
    profile: {},
  });

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleComplete = async () => {
    await submitSignup(formData);
    resetForm();
    setStep(1);
  };

  return (
    <div>
      <p>Step {step} of 3</p>

      {step === 1 && (
        <EmailStep
          value={formData.email}
          onChange={(email) => setFormData((prev) => ({ ...prev, email }))}
          onNext={handleNext}
        />
      )}

      {step === 2 && (
        <PasswordStep
          value={formData.password}
          onChange={(password) =>
            setFormData((prev) => ({ ...prev, password }))
          }
          onBack={handleBack}
          onNext={handleNext}
        />
      )}

      {step === 3 && (
        <ProfileStep
          value={formData.profile}
          onChange={(profile) => setFormData((prev) => ({ ...prev, profile }))}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
```

### Form Draft (Auto-Restore)

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

function ContactForm() {
  const [draft, setDraft, clearDraft] = useSessionStorage("contact-draft", {
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(draft);
    clearDraft(); // Clear after successful submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={draft.subject}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, subject: e.target.value }))
        }
        placeholder="Subject"
      />
      <textarea
        value={draft.message}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, message: e.target.value }))
        }
        placeholder="Message"
      />
      <p className="hint">Your draft is auto-saved in this tab</p>
      <button type="submit">Send</button>
      <button type="button" onClick={clearDraft}>
        Discard
      </button>
    </form>
  );
}
```

### Shopping Cart (Per-Tab)

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

function TabCart() {
  const [cart, setCart, clearCart] = useSessionStorage<CartItem[]>(
    "tab-cart",
    []
  );

  const addItem = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: product.id, name: product.name, quantity: 1 }];
    });
  };

  return (
    <div>
      <p>Cart items: {cart.length}</p>
      <p className="hint">This cart is specific to this tab only</p>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  );
}
```

### Temporary Auth Token

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

function ProtectedPage() {
  const [token, setToken, clearToken] = useSessionStorage<string | null>(
    "auth-token",
    null
  );

  const login = async (credentials: Credentials) => {
    const response = await authenticate(credentials);
    setToken(response.token);
  };

  const logout = () => {
    clearToken();
    // Token is automatically cleared when tab closes
  };

  if (!token) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div>
      <p>You are logged in (this session only)</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Custom Serialization (Date)

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

function SessionTimer() {
  const [sessionStart] = useSessionStorage<Date>("session-start", new Date(), {
    serializer: (date) => date.toISOString(),
    deserializer: (str) => new Date(str),
  });

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  return <div>Session duration: {elapsed} seconds</div>;
}
```

### Error Handling

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

function RobustSessionStorage() {
  const [data, setData] = useSessionStorage(
    "session-data",
    { items: [] },
    {
      onError: (error) => {
        console.error("Session storage error:", error.message);
        toast.error("Failed to save session data");
      },
    }
  );

  return <DataEditor data={data} onChange={setData} />;
}
```

### Lazy Initialization

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

function ExpensiveDefaultDemo() {
  // Expensive computation only runs if no stored value exists
  const [cache, setCache] = useSessionStorage("session-cache", () => {
    console.log("Building initial cache...");
    return buildExpensiveCache();
  });

  return <CacheViewer cache={cache} />;
}
```

### Quiz Progress

```tsx
import { useSessionStorage } from "@usefy/use-session-storage";

interface QuizState {
  currentQuestion: number;
  answers: Record<number, string>;
  startTime: number;
}

function Quiz() {
  const [quiz, setQuiz, resetQuiz] = useSessionStorage<QuizState>(
    "quiz-progress",
    {
      currentQuestion: 0,
      answers: {},
      startTime: Date.now(),
    }
  );

  const submitAnswer = (answer: string) => {
    setQuiz((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentQuestion]: answer },
      currentQuestion: prev.currentQuestion + 1,
    }));
  };

  const handleComplete = async () => {
    await submitQuiz(quiz.answers);
    resetQuiz();
  };

  return (
    <div>
      <p>Question {quiz.currentQuestion + 1} of 10</p>
      <QuestionCard
        question={questions[quiz.currentQuestion]}
        onAnswer={submitAnswer}
      />
      <button onClick={resetQuiz}>Restart Quiz</button>
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript with full generic support.

```tsx
import {
  useSessionStorage,
  type UseSessionStorageOptions,
  type UseSessionStorageReturn,
  type InitialValue,
} from "@usefy/use-session-storage";

// Generic type inference
const [name, setName] = useSessionStorage("name", "Guest"); // string
const [step, setStep] = useSessionStorage("step", 1); // number
const [items, setItems] = useSessionStorage("items", ["a"]); // string[]

// Explicit generic type
interface FormData {
  email: string;
  message: string;
}
const [form, setForm] = useSessionStorage<FormData>("form", {
  email: "",
  message: "",
});
```

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

| Category   | Coverage       |
| ---------- | -------------- |
| Statements | 93.75% (45/48) |
| Branches   | 78.94% (15/19) |
| Functions  | 100% (6/6)     |
| Lines      | 93.75% (45/48) |

### Test Categories

<details>
<summary><strong>Initialization Tests</strong></summary>

- Return initial value when sessionStorage is empty
- Return stored value when sessionStorage has data
- Support lazy initialization with function
- Not call initializer when sessionStorage has data
- Fallback to initial value when JSON parse fails
- Call onError when sessionStorage read fails

</details>

<details>
<summary><strong>setValue Tests</strong></summary>

- Update value and sessionStorage
- Support functional updates
- Handle object values
- Handle array values
- Call onError when write fails

</details>

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test --coverage
```

---

## License

MIT © [mirunamu](https://github.com/geon0529)

This package is part of the [usefy](https://github.com/geon0529/usefy) monorepo.

---

<p align="center">
  <sub>Built with care by the usefy team</sub>
</p>
