export const SupportedLanguages = ["javascript", "typescript", "python", "sql", "html-css"] as const;

export type SupportedLanguage = (typeof SupportedLanguages)[number];

export interface ProblemDefinition {
  id: string;
  title: string;
  type: "bugfix" | "feature" | "sql";
  difficulty: "easy" | "medium" | "hard";
  language: SupportedLanguage;
  tags: string[];
  description: string;
  starterFiles: Array<{ path: string; readonly: boolean }>;
  visibleTests: string[];
  hiddenTests: string[];
  runner: {
    image: string;
    entrypoint: string;
    timeoutMs: number;
    memoryMb: number;
  };
}

export const problemDefinitionSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "title",
    "type",
    "difficulty",
    "language",
    "tags",
    "description",
    "starterFiles",
    "visibleTests",
    "hiddenTests",
    "runner"
  ],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    title: { type: "string", minLength: 1 },
    type: { enum: ["bugfix", "feature", "sql"] },
    difficulty: { enum: ["easy", "medium", "hard"] },
    language: { enum: [...SupportedLanguages] },
    tags: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 1
    },
    description: { type: "string", minLength: 10 },
    starterFiles: {
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
    runner: {
      type: "object",
      additionalProperties: false,
      required: ["image", "entrypoint", "timeoutMs", "memoryMb"],
      properties: {
        image: { type: "string", minLength: 1 },
        entrypoint: { type: "string", minLength: 1 },
        timeoutMs: { type: "integer", minimum: 100, maximum: 120000 },
        memoryMb: { type: "integer", minimum: 64, maximum: 4096 }
      }
    }
  }
} as const;
