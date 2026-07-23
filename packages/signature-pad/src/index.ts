/**
 * `@usefy/signature-pad` — root entry: the React layer plus a re-export
 * of the full framework-free headless surface
 * (`@usefy/signature-pad/headless`).
 *
 * @example
 * ```tsx
 * import { SignaturePad, useSignaturePad } from "@usefy/signature-pad";
 *
 * // 1. Component:  <SignaturePad guideline onChange={...} />
 * // 2. Hook:       const { canvasRef, toPNG } = useSignaturePad();
 * // 3. Headless:   import { createSignatureEngine } from "@usefy/signature-pad/headless";
 * ```
 */
export * from "./headless";

export { SignaturePad } from "./SignaturePad";
export type {
  SignatureGuideline,
  SignaturePadController,
  SignaturePadProps,
} from "./SignaturePad";

export { useSignaturePad } from "./useSignaturePad";
export type { UseSignaturePadOptions, UseSignaturePadReturn } from "./useSignaturePad";
