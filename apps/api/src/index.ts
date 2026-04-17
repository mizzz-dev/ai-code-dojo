import { loadConfig } from "../../../packages/config/src/index.js";

/**
 * API entry (MVP placeholder).
 * 提出コードの実行はrunner経由で行う。APIプロセスで直接実行しない。
 */
export const createApiRuntime = () => {
  const config = loadConfig();
  return {
    service: "api",
    runnerApiBaseUrl: config.runnerApiBaseUrl
  };
};
