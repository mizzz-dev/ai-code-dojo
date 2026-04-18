export const SupportedLanguages = ["javascript", "typescript", "python", "sql", "html-css"] as const;

export type SupportedLanguage = (typeof SupportedLanguages)[number];

export interface ProblemDefinition {
  metadata: {
    title: string;
    slug: string;
    difficulty: "easy" | "medium" | "hard";
    category: "bugfix" | "feature" | "sql" | "refactor";
    supportedLanguages: SupportedLanguage[];
    framework: "vanilla" | "react" | "node" | "fastapi" | "sql";
    tags: string[];
  };
  statement: {
    background: string;
    issue: string;
    acceptanceCriteria: string[];
    outOfScope: string[];
  };
  learningPoints: string[];
  starterCode: Array<{ path: string; readonly: boolean }>;
  visibleTests: string[];
  hiddenTests: string[];
  runnerConfig: {
    buildCommand: string;
    testCommand: string;
    runCommand: string;
    timeoutSeconds: number;
    networkAccess: "disabled" | "restricted" | "enabled";
  };
  reviewConfig: {
    prTitleRule: string;
    prBodyRule: string;
    commentStyle: "business" | "friendly" | "strict";
    language: "ja" | "en";
  };
}

export const problemDefinitionSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: [
    "metadata",
    "statement",
    "learningPoints",
    "starterCode",
    "visibleTests",
    "hiddenTests",
    "runnerConfig",
    "reviewConfig"
  ],
  properties: {
    metadata: {
      type: "object",
      additionalProperties: false,
      required: ["title", "slug", "difficulty", "category", "supportedLanguages", "framework", "tags"],
      properties: {
        title: { type: "string", minLength: 1 },
        slug: { type: "string", pattern: "^[a-z0-9-]+$" },
        difficulty: { enum: ["easy", "medium", "hard"] },
        category: { enum: ["bugfix", "feature", "sql", "refactor"] },
        supportedLanguages: {
          type: "array",
          minItems: 1,
          items: { enum: [...SupportedLanguages] }
        },
        framework: { enum: ["vanilla", "react", "node", "fastapi", "sql"] },
        tags: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 1 }
        }
      }
    },
    statement: {
      type: "object",
      additionalProperties: false,
      required: ["background", "issue", "acceptanceCriteria", "outOfScope"],
      properties: {
        background: { type: "string", minLength: 10 },
        issue: { type: "string", minLength: 10 },
        acceptanceCriteria: {
          type: "array",
          minItems: 1,
          items: { type: "string", minLength: 3 }
        },
        outOfScope: {
          type: "array",
          items: { type: "string", minLength: 3 }
        }
      }
    },
    learningPoints: {
      type: "array",
      minItems: 1,
      items: { type: "string", minLength: 3 }
    },
    starterCode: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "readonly"],
        properties: {
          path: { type: "string", minLength: 1 },
          readonly: { type: "boolean" }
        }
      }
    },
    visibleTests: {
      type: "array",
      minItems: 1,
      items: { type: "string", minLength: 1 }
    },
    hiddenTests: {
      type: "array",
      minItems: 1,
      items: { type: "string", minLength: 1 }
    },
    runnerConfig: {
      type: "object",
      additionalProperties: false,
      required: ["buildCommand", "testCommand", "runCommand", "timeoutSeconds", "networkAccess"],
      properties: {
        buildCommand: { type: "string", minLength: 1 },
        testCommand: { type: "string", minLength: 1 },
        runCommand: { type: "string", minLength: 1 },
        timeoutSeconds: { type: "integer", minimum: 1, maximum: 120 },
        networkAccess: { enum: ["disabled", "restricted", "enabled"] }
      }
    },
    reviewConfig: {
      type: "object",
      additionalProperties: false,
      required: ["prTitleRule", "prBodyRule", "commentStyle", "language"],
      properties: {
        prTitleRule: { type: "string", minLength: 3 },
        prBodyRule: { type: "string", minLength: 3 },
        commentStyle: { enum: ["business", "friendly", "strict"] },
        language: { enum: ["ja", "en"] }
      }
    }
  }
} as const;
