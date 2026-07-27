/**
 * `@usefy/qr-code` — the React surface.
 *
 * Everything from `@usefy/qr-code/headless` is re-exported here, so a React
 * app needs a single import path. Server components should import from
 * `/headless` instead: that entry carries no `"use client"` banner and no
 * React, and `toSVGProps()` renders a complete QR code with zero client JS.
 */

export { QRCode } from "./QRCode";
export type { QRCodeController, QRCodeProps } from "./QRCode";
export { useQRCode } from "./useQRCode";
export type { UseQRCodeOptions, UseQRCodeReturn } from "./useQRCode";
export { clearCache, encodeCached } from "./cache";

export * from "./headless";
