export { useNetworkState } from "./useNetworkState";
export type {
  NetworkState,
  UseNetworkStateReturn,
  EffectiveConnectionType,
  ConnectionType,
  NetworkInformationLike,
} from "./types";
export {
  getNetworkState,
  getConnection,
  isNavigatorAvailable,
  isNetworkInformationSupported,
  areNetworkStatesEqual,
  SERVER_NETWORK_STATE,
} from "./utils";
