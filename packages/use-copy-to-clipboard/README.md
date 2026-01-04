<p align="center">
  <img src="https://raw.githubusercontent.com/geon0529/usefy/master/assets/logo.png" alt="usefy logo" width="120" />
</p>

<h1 align="center">@usefy/use-copy-to-clipboard</h1>

<p align="center">
  <strong>A robust React hook for copying text to clipboard with fallback support</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@usefy/use-copy-to-clipboard">
    <img src="https://img.shields.io/npm/v/@usefy/use-copy-to-clipboard.svg?style=flat-square&color=007acc" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@usefy/use-copy-to-clipboard">
    <img src="https://img.shields.io/npm/dm/@usefy/use-copy-to-clipboard.svg?style=flat-square&color=007acc" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@usefy/use-copy-to-clipboard">
    <img src="https://img.shields.io/bundlephobia/minzip/@usefy/use-copy-to-clipboard?style=flat-square&color=007acc" alt="bundle size" />
  </a>
  <a href="https://github.com/geon0529/usefy/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/@usefy/use-copy-to-clipboard.svg?style=flat-square&color=007acc" alt="license" />
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

`@usefy/use-copy-to-clipboard` provides a simple way to copy text to the clipboard using the modern Clipboard API with automatic fallback for older browsers. Features include auto-reset timeout, success/error callbacks, and copy state tracking.

**Part of the [@usefy](https://www.npmjs.com/org/usefy) ecosystem** — a collection of production-ready React hooks designed for modern applications.

### Why use-copy-to-clipboard?

- **Zero Dependencies** — Pure React implementation with no external dependencies
- **TypeScript First** — Full type safety with exported interfaces
- **Modern + Fallback** — Uses Clipboard API with automatic `execCommand` fallback
- **Auto Reset** — Copied state automatically resets after configurable timeout
- **Callbacks** — `onSuccess` and `onError` callbacks for custom handling
- **Async/Await** — Returns promise with boolean success indicator
- **SSR Compatible** — Works seamlessly with Next.js, Remix, and other SSR frameworks
- **Stable References** — Memoized copy function for optimal performance
- **Well Tested** — Comprehensive test coverage with Vitest

---

## Installation

```bash
# npm
npm install @usefy/use-copy-to-clipboard

# yarn
yarn add @usefy/use-copy-to-clipboard

# pnpm
pnpm add @usefy/use-copy-to-clipboard
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
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function CopyButton() {
  const [copiedText, copy] = useCopyToClipboard();

  return (
    <button onClick={() => copy("Hello World!")}>
      {copiedText ? "Copied!" : "Copy"}
    </button>
  );
}
```

---

## API Reference

### `useCopyToClipboard(options?)`

A hook that provides clipboard copy functionality with state tracking.

#### Parameters

| Parameter | Type                        | Description           |
| --------- | --------------------------- | --------------------- |
| `options` | `UseCopyToClipboardOptions` | Configuration options |

#### Options

| Option      | Type                     | Default | Description                                                           |
| ----------- | ------------------------ | ------- | --------------------------------------------------------------------- |
| `timeout`   | `number`                 | `2000`  | Time in ms before `copiedText` resets to null. Set to `0` to disable. |
| `onSuccess` | `(text: string) => void` | —       | Callback called when copy succeeds                                    |
| `onError`   | `(error: Error) => void` | —       | Callback called when copy fails                                       |

#### Returns `[copiedText, copy]`

| Index | Type                                 | Description                                  |
| ----- | ------------------------------------ | -------------------------------------------- |
| `[0]` | `string \| null`                     | The last successfully copied text, or `null` |
| `[1]` | `(text: string) => Promise<boolean>` | Async function to copy text                  |

---

## Examples

### Basic Copy Button

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function CopyButton({ text }: { text: string }) {
  const [copiedText, copy] = useCopyToClipboard();

  return (
    <button onClick={() => copy(text)}>
      {copiedText === text ? "Copied!" : "Copy to Clipboard"}
    </button>
  );
}
```

### Copy with Visual Feedback

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function CopyWithIcon({ text }: { text: string }) {
  const [copiedText, copy] = useCopyToClipboard();
  const isCopied = copiedText === text;

  return (
    <button onClick={() => copy(text)} className={isCopied ? "copied" : ""}>
      {isCopied ? (
        <CheckIcon className="icon" />
      ) : (
        <CopyIcon className="icon" />
      )}
      {isCopied ? "Copied!" : "Copy"}
    </button>
  );
}
```

### Code Block with Copy

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copiedText, copy] = useCopyToClipboard();

  return (
    <div className="code-block">
      <div className="code-header">
        <span>{language}</span>
        <button onClick={() => copy(code)}>
          {copiedText === code ? "Copied!" : "Copy Code"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
```

### Custom Timeout

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function LongFeedbackCopy() {
  // Show "Copied!" for 5 seconds
  const [copiedText, copy] = useCopyToClipboard({ timeout: 5000 });

  return (
    <button onClick={() => copy("Long feedback!")}>
      {copiedText ? "Copied!" : "Copy"}
    </button>
  );
}
```

### Persistent Copied State

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function PersistentCopy() {
  // Never auto-reset the copied state
  const [copiedText, copy] = useCopyToClipboard({ timeout: 0 });

  return (
    <div>
      <button onClick={() => copy("Persistent!")}>
        {copiedText ? "Copied!" : "Copy"}
      </button>
      {copiedText && <span>Copied text: {copiedText}</span>}
    </div>
  );
}
```

### With Callbacks

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { toast } from "your-toast-library";

function CopyWithToast({ text }: { text: string }) {
  const [, copy] = useCopyToClipboard({
    onSuccess: (copiedText) => {
      toast.success(`Copied: ${copiedText}`);
    },
    onError: (error) => {
      toast.error(`Failed to copy: ${error.message}`);
    },
  });

  return <button onClick={() => copy(text)}>Copy</button>;
}
```

### Async Handling

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function AsyncCopy({ text }: { text: string }) {
  const [, copy] = useCopyToClipboard();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleCopy = async () => {
    const success = await copy(text);
    setStatus(success ? "success" : "error");
  };

  return (
    <div>
      <button onClick={handleCopy}>Copy</button>
      {status === "success" && (
        <span className="success">Copied successfully!</span>
      )}
      {status === "error" && <span className="error">Failed to copy</span>}
    </div>
  );
}
```

### Share URL Button

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function ShareButton() {
  const [copiedText, copy] = useCopyToClipboard();

  const handleShare = () => {
    copy(window.location.href);
  };

  return (
    <button onClick={handleShare}>
      {copiedText ? "Link Copied!" : "Share Link"}
    </button>
  );
}
```

### Copy Multiple Items

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function CopyList({ items }: { items: string[] }) {
  const [copiedText, copy] = useCopyToClipboard();

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <span>{item}</span>
          <button onClick={() => copy(item)}>
            {copiedText === item ? "Copied!" : "Copy"}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### API Key Display

```tsx
import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";

function ApiKeyDisplay({ apiKey }: { apiKey: string }) {
  const [copiedText, copy] = useCopyToClipboard();

  const maskedKey = `${apiKey.slice(0, 4)}${"*".repeat(20)}${apiKey.slice(-4)}`;

  return (
    <div className="api-key">
      <code>{maskedKey}</code>
      <button onClick={() => copy(apiKey)}>
        {copiedText === apiKey ? "Copied!" : "Copy Key"}
      </button>
    </div>
  );
}
```

---

## TypeScript

This hook is written in TypeScript with exported types.

```tsx
import {
  useCopyToClipboard,
  type UseCopyToClipboardOptions,
  type UseCopyToClipboardReturn,
  type CopyFn,
} from "@usefy/use-copy-to-clipboard";

// Return type
const [copiedText, copy]: UseCopyToClipboardReturn = useCopyToClipboard();

// copiedText: string | null
// copy: (text: string) => Promise<boolean>

// Options type
const options: UseCopyToClipboardOptions = {
  timeout: 3000,
  onSuccess: (text) => console.log("Copied:", text),
  onError: (error) => console.error("Error:", error),
};
```

---

## Browser Support

This hook uses the modern [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) when available, with automatic fallback to `document.execCommand('copy')` for older browsers.

| Browser        | Clipboard API | Fallback |
| -------------- | ------------- | -------- |
| Chrome 66+     | Yes           | -        |
| Firefox 63+    | Yes           | -        |
| Safari 13.1+   | Yes           | -        |
| Edge 79+       | Yes           | -        |
| IE 11          | No            | Yes      |
| Older browsers | No            | Yes      |

---

## Testing

This package maintains comprehensive test coverage to ensure reliability and stability.

### Test Coverage

📊 <a href="https://geon0529.github.io/usefy/coverage/use-copy-to-clipboard/src/index.html" target="_blank" rel="noopener noreferrer"><strong>View Detailed Coverage Report</strong></a> (GitHub Pages)

### Test Categories

<details>
<summary><strong>Copy Functionality Tests</strong></summary>

- Copy text successfully using Clipboard API
- Update copiedText after successful copy
- Return true on successful copy
- Handle empty string
- Handle special characters

</details>

<details>
<summary><strong>Timeout Tests</strong></summary>

- Reset copiedText after default timeout (2000ms)
- Reset after custom timeout
- Not reset when timeout is 0
- Reset timer on consecutive copies

</details>

<details>
<summary><strong>Fallback Tests</strong></summary>

- Use fallback when Clipboard API is not available
- Try fallback when Clipboard API throws error

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
