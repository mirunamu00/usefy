/**
 * `@usefy/qr-scanner` — the React surface.
 *
 * Everything framework-free lives at `@usefy/qr-scanner/headless`, which this
 * entry re-exports in full: a consumer needs one import path, and a server
 * component or a worker gets the other one.
 */

export { QRScanner, type QRScannerProps, type QRScannerController } from "./QRScanner";
export {
  useQRScanner,
  type Decoder,
  type QRScannerState,
  type UseQRScannerOptions,
  type UseQRScannerReturn,
} from "./useQRScanner";
export { Viewfinder, type ViewfinderProps } from "./Viewfinder";

export * from "./headless";
