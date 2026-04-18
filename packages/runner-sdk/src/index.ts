export type RunnerStatus = "queued" | "preparing" | "running" | "completed" | "failed" | "timeout";

export type TestVisibility = "visible" | "hidden";

export interface RunRequest {
  submissionId: string;
  problemSlug: string;
  language: "javascript" | "typescript" | "python" | "sql" | "html-css";
  files: Array<{ path: string; content: string }>;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  message?: string;
  durationMs: number;
  visibility: TestVisibility;
}

export interface Artifact {
  path: string;
  type: "log" | "coverage" | "report";
  content: string;
}

export interface NormalizedRunResult {
  status: RunnerStatus;
  score: number;
  logs: string[];
  testResults: TestResult[];
  artifacts: Artifact[];
}

export interface RunnerExecutionContext {
  jobId: string;
  request: RunRequest;
  workingDirectory: string;
}

export interface RunnerAdapter {
  prepare(context: RunnerExecutionContext): Promise<void>;
  executeVisibleTests(context: RunnerExecutionContext): Promise<TestResult[]>;
  executeHiddenTests(context: RunnerExecutionContext): Promise<TestResult[]>;
  collectArtifacts(context: RunnerExecutionContext): Promise<Artifact[]>;
  normalizeResult(input: {
    visible: TestResult[];
    hidden: TestResult[];
    artifacts: Artifact[];
  }): Promise<NormalizedRunResult>;
}

export interface RunnerClient {
  enqueue(req: RunRequest): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<{ status: RunnerStatus }>;
  getResult(jobId: string): Promise<NormalizedRunResult>;
}

export class InMemoryRunnerAdapter implements RunnerAdapter {
  async prepare(): Promise<void> {
    // TODO: 実運用では分離実行環境のワークディレクトリ展開を行う。
  }

  async executeVisibleTests(): Promise<TestResult[]> {
    return [];
  }

  async executeHiddenTests(): Promise<TestResult[]> {
    return [];
  }

  async collectArtifacts(): Promise<Artifact[]> {
    return [];
  }

  async normalizeResult(input: {
    visible: TestResult[];
    hidden: TestResult[];
    artifacts: Artifact[];
  }): Promise<NormalizedRunResult> {
    const testResults = [...input.visible, ...input.hidden];
    const passedCount = testResults.filter((test) => test.passed).length;
    const score = testResults.length === 0 ? 0 : Math.round((passedCount / testResults.length) * 100);

    return {
      status: "completed",
      score,
      logs: ["normalized by InMemoryRunnerAdapter"],
      testResults,
      artifacts: input.artifacts
    };
  }
}
