export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  runnerApiBaseUrl: string;
  artifactBucket: string;
}

export const loadConfig = (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV as AppConfig["nodeEnv"]) ?? "development",
  runnerApiBaseUrl: process.env.RUNNER_API_BASE_URL ?? "http://localhost:8081",
  artifactBucket: process.env.ARTIFACT_BUCKET ?? "ai-code-dojo-local"
});
