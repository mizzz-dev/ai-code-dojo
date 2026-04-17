export type RunnerStatus = "queued" | "running" | "completed" | "failed" | "timeout";

export interface RunRequest {
  submissionId: string;
  problemId: string;
  language: "javascript" | "typescript" | "python" | "sql" | "html-css";
  files: Array<{ path: string; content: string }>;
  visibleOnly?: boolean;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  message?: string;
  durationMs: number;
  visibility: "visible" | "hidden";
}

export interface RunResult {
  status: RunnerStatus;
  score: number;
  logs: string[];
  testResults: TestResult[];
}

export interface RunnerClient {
  enqueue(req: RunRequest): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<{ status: RunnerStatus }>;
  getResult(jobId: string): Promise<RunResult>;
}
