# Implementation Plan: career-compass

**Version:** 1.0  
**Date:** 2026-05-05  
**Source Document:** Project Overview Draft 2

---

## Milestone Summary

| #  | Milestone                        | Description                                                              | Issues | Depends On |
|----|----------------------------------|--------------------------------------------------------------------------|--------|------------|
| M1 | Monorepo Foundation              | Workspace root, package scaffolding, shared tooling, CI skeleton         | 5      | —          |
| M2 | Shared Schema Package            | Zod schemas for recommendation output and API contracts; shared types    | 3      | M1         |
| M3 | Storage Stack                    | DynamoDB table, TTL config, CDK StorageStack                             | 2      | M1         |
| M4 | Conversation Handler — Core      | Lambda handler: session init, turn routing, DynamoDB read/write          | 4      | M2, M3     |
| M5 | Bedrock Integration              | Converse API turns, phase-aware prompt selection, synthesis forced tool use | 5   | M4         |
| M6 | API Stack                        | CDK ApiStack: API Gateway, Lambda, IAM/Bedrock permissions               | 3      | M5         |
| M7 | Frontend — Conversation UI       | React chat interface, session state, turn submission, phase display       | 5      | M6         |
| M8 | Frontend — Recommendation Artifact | Structured recommendation rendering, synthesis trigger UX              | 3      | M7         |
| M9 | Frontend Stack                   | CDK FrontendStack: S3, CloudFront, bucket deployment                     | 2      | M8         |
| M10 | Observability Stack             | CDK ObservabilityStack: CloudWatch dashboard, alarms, log groups         | 3      | M6         |
| M11 | CI/CD Workflows                 | GitHub Actions: CI, Deploy, Teardown workflows                           | 3      | M9, M10    |
| M12 | Prompt Tuning & Integration QA  | Iterative prompt refinement across phases; end-to-end conversation QA    | 3      | M11        |

---

## Milestone M1: Monorepo Foundation

**Goal:** A working npm workspace monorepo with all packages scaffolded, shared tooling configured, and a CI skeleton in place. Any developer (or evaluator) can clone, install, and run `npm run build` from the root successfully.

**Deliverables:** Workspace root with `package.json`, four packages at correct paths, TypeScript + ESLint + Prettier configured root-level, `.github/workflows/ci.yml` skeleton passing.

---

### Issue M1-01: Initialize workspace root and npm workspaces

**Description:**  
Create the monorepo root with a bare `package.json` defining npm workspaces pointing to all four packages. Establish the directory structure matching the agreed layout:

```
infra/
packages/
  api/
  shared/
  web/
```

Configure root-level scripts for `build`, `lint`, `test`, and `clean` that delegate to workspaces. No package-level code yet — structure and plumbing only.

**Acceptance Criteria:**

- AC-01: Root `package.json` declares `"workspaces": ["infra", "packages/*"]`
- AC-02: `npm install` from root resolves without errors across all four packages
- AC-03: Root `build`, `lint`, `test`, and `clean` scripts are defined and delegate to workspace packages via `--workspaces` flag
- AC-04: `.nvmrc` or `engines` field pins Node.js version
- AC-05: `.gitignore` excludes `node_modules`, `dist`, `cdk.out`, `.env*`

**Effort:** S

---

### Issue M1-02: Configure root-level TypeScript, ESLint, and Prettier

**Description:**  
Establish shared TypeScript, ESLint, and Prettier configuration at the root so all packages inherit consistent tooling. Each package will extend the root configs with package-specific overrides (e.g., `lib` vs `dom` for API vs web).

Use a `tsconfig.base.json` at root with strict settings. Each package's `tsconfig.json` extends it. ESLint flat config or `.eslintrc` at root with TypeScript and import rules. Prettier config at root with no per-package overrides unless necessary.

**Acceptance Criteria:**

- AC-01: `tsconfig.base.json` at root with `strict: true`, `esModuleInterop: true`, `skipLibCheck: true`
- AC-02: Each package has a `tsconfig.json` extending `../../tsconfig.base.json` (or `../tsconfig.base.json` for `infra/`)
- AC-03: ESLint config at root; `npm run lint` from root lints all packages without errors on empty stubs
- AC-04: Prettier config at root; `npm run format` applies formatting across all packages
- AC-05: `packages/api` tsconfig excludes `lib: ["dom"]`; `packages/web` tsconfig includes it

**Effort:** S

---

### Issue M1-03: Scaffold package-level package.json files and build tooling

**Description:**  
Create a `package.json` for each of the four packages (`infra/`, `packages/api/`, `packages/shared/`, `packages/web/`) with the appropriate dependencies, scripts, and entry points.

- `infra/`: CDK entry, `aws-cdk-lib`, `constructs`; `cdk synth` and `cdk deploy` scripts
- `packages/api/`: Lambda handler entry; `esbuild` for bundling; `aws-sdk` v3 clients as needed
- `packages/shared/`: Library package; `zod`; compiled to `dist/` consumed by api and web
- `packages/web/`: Vite + React; `vite`, `react`, `react-dom`, TailwindCSS, shadcn/ui, TanStack Query, Axios, Zod

No application code yet — just the package manifests and build scripts so the workspace resolves correctly.

**Acceptance Criteria:**

- AC-01: `packages/shared` builds to `dist/` with `npm run build` and exports are importable by `packages/api` and `packages/web` via workspace reference
- AC-02: `packages/api` builds with esbuild producing a Lambda-compatible bundle
- AC-03: `packages/web` runs `vite build` without errors on an empty `src/main.tsx`
- AC-04: `infra` runs `cdk synth` without errors on an empty CDK app entry
- AC-05: Cross-package imports (`@career-compass/shared`) resolve correctly in TypeScript and at build time

**Effort:** M

---

### Issue M1-04: Configure environment variable strategy

**Description:**  
Define how environment variables flow through each layer without leaking secrets into source control or CDK outputs.

- `packages/api/`: Lambda env vars injected by CDK (DynamoDB table name, Bedrock region, model ID); read via `process.env` with typed accessor module
- `packages/web/`: Vite env vars (`VITE_API_BASE_URL`) via `.env.local` for local dev; injected at build time by CDK FrontendStack for deployed builds
- `infra/`: CDK context or SSM for any deployment-time config; no secrets in CDK code

Document the strategy in `docs/environment-variables.md`.

**Acceptance Criteria:**

- AC-01: `packages/api/src/config.ts` (or equivalent) provides typed accessors for all expected env vars with fail-fast validation on cold start
- AC-02: `.env.example` at repo root documents all required env vars with placeholder values
- AC-03: `.env.local` and `.env*.local` are in `.gitignore`
- AC-04: `docs/environment-variables.md` describes the strategy for local dev vs. deployed environments
- AC-05: No hardcoded region strings, table names, or model IDs in application code

**Effort:** S

---

### Issue M1-05: Establish GitHub repository and branch strategy

**Description:**  
Initialize the GitHub repository, configure branch protection on `main`, and define the branching convention used throughout development. Create GitHub Milestones and labels matching this implementation plan so issues can be filed against them.

Branch strategy: `main` is protected (require PR + CI pass); feature branches named `feat/<issue-id>-<slug>`; no direct commits to `main`.

Create GitHub Milestones M1–M12. Create labels: `effort:S`, `effort:M`, `effort:L`, and one label per milestone (e.g., `milestone:M1`).

**Acceptance Criteria:**

- AC-01: `main` branch protection enabled: require status checks, require PR, no force push
- AC-02: GitHub Milestones M1–M12 created matching this plan
- AC-03: Effort labels (`effort:S`, `effort:M`, `effort:L`) and milestone labels created
- AC-04: `README.md` at repo root with project summary, stack overview, local dev setup, and deploy instructions (stubs acceptable at this stage)
- AC-05: `.github/PULL_REQUEST_TEMPLATE.md` with checklist: description, AC references, tested locally

**Effort:** S

---

## Milestone M2: Shared Schema Package

**Goal:** `packages/shared` contains the Zod schemas that are the single source of truth for the recommendation output structure and the API request/response contracts. Both `packages/api` and `packages/web` import from here, eliminating schema drift.

**Deliverables:** Published (workspace-local) `@career-compass/shared` package with Zod schemas, inferred TypeScript types, and derived Bedrock tool schema utility.

---

### Issue M2-01: Define recommendation output Zod schema

**Description:**  
Design and implement the Zod schema for the `generate_recommendation` tool output. This schema is the authoritative definition — the Bedrock tool input schema will be derived from it, and the frontend will type-check against its inferred TypeScript type.

Schema must capture:
- Inferred profile summary (string)
- Identified skill gaps (prioritized array: gap name, severity, rationale)
- Recommended learning areas (array: area name, rationale tied to a goal, suggested resource/cert categories, estimated effort, estimated timeline)

Keep field names explicit and descriptive — this JSON will be rendered directly in the UI and read by portfolio evaluators.

**Acceptance Criteria:**

- AC-01: `packages/shared/src/schemas/recommendation.schema.ts` exports `RecommendationSchema` (Zod) and `Recommendation` (inferred TypeScript type)
- AC-02: Schema includes at minimum: `profileSummary`, `skillGaps` (array with `name`, `severity: enum`, `rationale`), `recommendations` (array with `area`, `rationale`, `resourceCategories`, `estimatedEffort`, `estimatedTimeline`)
- AC-03: `packages/shared` builds and `Recommendation` type is importable in both `packages/api` and `packages/web` without TypeScript errors
- AC-04: At least 5 unit tests covering valid input, missing required fields, and invalid enum values

**Effort:** M

---

### Issue M2-02: Define API request/response Zod schemas

**Description:**  
Define Zod schemas for the conversation API's single endpoint:

**Request:** `POST /conversation/turn`
```typescript
{
  sessionId?: string;      // absent on first turn
  userMessage: string;
}
```

**Response (conversational turn):**
```typescript
{
  sessionId: string;
  assistantMessage: string;
  phase: 'discovery' | 'goalElicitation' | 'synthesis';
  turnCount: number;
  synthesisReady: boolean;
}
```

**Response (synthesis turn):**
```typescript
{
  sessionId: string;
  phase: 'synthesis';
  turnCount: number;
  recommendation: Recommendation;  // from M2-01
}
```

Use a discriminated union on `phase` or a `type` field to distinguish the two response shapes.

**Acceptance Criteria:**

- AC-01: `packages/shared/src/schemas/api.schema.ts` exports `TurnRequestSchema`, `ConversationalResponseSchema`, `SynthesisResponseSchema`, and their inferred types
- AC-02: A `TurnResponseSchema` union type covers both response shapes and is importable in `packages/web`
- AC-03: `packages/api` uses `TurnRequestSchema.parse()` for request validation on the handler entry point
- AC-04: All schemas include `.describe()` annotations on fields used in Bedrock tool schema derivation

**Effort:** S

---

### Issue M2-03: Implement Bedrock tool schema derivation utility

**Description:**  
Write a utility function in `packages/shared` that derives a Bedrock-compatible JSON Schema object from `RecommendationSchema`. The Bedrock `toolSpec.inputSchema.json` field expects a JSON Schema object — this utility eliminates hand-maintaining a parallel schema definition.

Use `zod-to-json-schema` or equivalent. The output of this function is what gets passed as `inputSchema.json` when constructing the `generate_recommendation` tool spec in the Lambda handler.

**Acceptance Criteria:**

- AC-01: `packages/shared/src/utils/bedrock-tool-schema.ts` exports `getRecommendationToolSchema()` returning a JSON Schema object
- AC-02: The returned schema is structurally valid against the Bedrock `toolSpec.inputSchema.json` contract (object with `type: "object"`, `properties`, `required`)
- AC-03: Unit test confirms the derived schema matches the shape of a valid `Recommendation` object
- AC-04: `packages/api` imports and uses this utility when constructing the Bedrock tool spec — no inline schema duplication

**Effort:** S

---

## Milestone M3: Storage Stack

**Goal:** DynamoDB session state table deployed via CDK with TTL configured and correct IAM export for use by ApiStack.

**Deliverables:** `StorageStack` deployed to AWS; table name exported as CDK output; session item structure documented.

---

### Issue M3-01: Define session state data model and implement StorageStack CDK construct

**Description:**  
Design the DynamoDB session item structure and implement the `StorageStack` CDK construct.

**Session item shape:**
```typescript
{
  sessionId: string;        // PK (partition key)
  phase: ConversationPhase;
  turnCount: number;
  history: BedrockMessage[]; // full Converse API message history
  createdAt: number;        // epoch ms
  ttl: number;              // epoch seconds, 24hr from last update
}
```

CDK construct: on-demand capacity, TTL attribute `ttl`, table name as CDK CfnOutput. Use `RemovalPolicy.DESTROY` for non-production (portfolio context).

**Acceptance Criteria:**

- AC-01: `infra/lib/stacks/storage-stack.ts` defines `StorageStack` extending `cdk.Stack`
- AC-02: Table uses `sessionId` as partition key (string), no sort key
- AC-03: TTL enabled on `ttl` attribute
- AC-04: On-demand (PAY_PER_REQUEST) billing mode
- AC-05: Table name exported as `CfnOutput` with export name consumable by `ApiStack`
- AC-06: `RemovalPolicy.DESTROY` set explicitly with a comment noting portfolio context
- AC-07: `cdk deploy StorageStack` succeeds and table is visible in AWS console

**Effort:** M

---

### Issue M3-02: Implement DynamoDB session repository in packages/api

**Description:**  
Implement a typed `SessionRepository` class (or module) in `packages/api` encapsulating all DynamoDB operations: get session, create session, update session (append turn + advance phase), and the TTL refresh logic.

Use `@aws-sdk/client-dynamodb` with `@aws-sdk/lib-dynamodb` (DynamoDB DocumentClient). Typed against the session item shape defined in M3-01. No raw `AttributeValue` marshalling exposed outside this module.

**Acceptance Criteria:**

- AC-01: `packages/api/src/repositories/session.repository.ts` exports `SessionRepository` with methods: `getSession(sessionId)`, `createSession(seed)`, `updateSession(sessionId, updates)`
- AC-02: TTL is set to 24 hours from current time on every write (create and update)
- AC-03: `getSession` returns `null` for missing sessions (not throws) — caller handles not-found
- AC-04: All DynamoDB calls are wrapped in try/catch; errors are re-thrown as typed `RepositoryError`
- AC-05: Table name is read from environment variable (not hardcoded); fails fast on missing config
- AC-06: Unit tests (with DynamoDB client mocked) cover: create, get existing, get missing, update, TTL calculation

**Effort:** M

---

## Milestone M4: Conversation Handler — Core

**Goal:** Lambda handler is wired up with request validation, session lifecycle management, and the routing logic that distinguishes first-turn session creation from subsequent turn processing. Bedrock is not yet called — the handler returns a stub assistant message.

**Deliverables:** Lambda handler deployable and testable via API Gateway; session creation and retrieval working against real DynamoDB; phase and turn-count logic correct.

---

### Issue M4-01: Implement Lambda handler entry point and request routing

**Description:**  
Implement the Lambda handler (`packages/api/src/handlers/conversation.handler.ts`) as the entry point for `POST /conversation/turn`. 

Routing logic:
- Parse and validate request body using `TurnRequestSchema` (from M2-02); return 400 on validation failure
- If `sessionId` absent → first turn: create new session, proceed with seed processing
- If `sessionId` present → subsequent turn: load session from DynamoDB; return 404 if not found
- Delegate to a `ConversationService` for the actual turn processing (stub in this milestone)
- Return `TurnResponse` shaped response

Keep the handler thin — validation, routing, error serialization only. All business logic in service layer.

**Acceptance Criteria:**

- AC-01: Handler validates request body with Zod; returns `{ statusCode: 400, body: { error, details } }` on invalid input
- AC-02: Absent `sessionId` triggers session creation path; present `sessionId` triggers session load path
- AC-03: Missing session (valid `sessionId` but not in DDB) returns `{ statusCode: 404 }`
- AC-04: Handler returns `{ statusCode: 200, body: TurnResponse }` with CORS headers
- AC-05: All unhandled errors caught at handler boundary; return `{ statusCode: 500 }` with no internal detail leaked
- AC-06: Unit tests cover: valid first turn, valid subsequent turn, missing session, invalid body, internal error

**Effort:** M

---

### Issue M4-02: Implement ConversationService and phase transition logic

**Description:**  
Implement `packages/api/src/services/conversation.service.ts`. This service orchestrates a conversation turn: loads session state, determines the active phase, calls Bedrock (stubbed in this milestone), evaluates synthesis readiness, advances phase if appropriate, persists updated state, and returns the response payload.

**Phase transition rules:**
- `discovery` → `goalElicitation`: when turn count reaches a threshold (configurable, default 3) AND system self-evaluation deems skill context sufficient (evaluated by Bedrock — stub returns false in this milestone)
- `goalElicitation` → `synthesis`: user message contains synthesis trigger phrase OR turn count reaches max (10) OR Bedrock self-eval returns ready
- Any phase → `synthesis`: user sends trigger phrase

Synthesis readiness self-evaluation is a separate Bedrock call (implemented in M5). In this milestone, stub it to always return `false`.

**Acceptance Criteria:**

- AC-01: `ConversationService.processTurn(sessionId | null, userMessage)` is the primary method
- AC-02: Phase transition thresholds are constants in a `config.ts` file, not magic numbers in service logic
- AC-03: Synthesis trigger phrase detection is case-insensitive substring match on a configurable phrase (default: "i'm ready for recommendations")
- AC-04: `turnCount` increments on every turn including synthesis
- AC-05: After turn processing, updated session (new history entry, phase, turnCount, refreshed TTL) is persisted to DynamoDB
- AC-06: Unit tests cover: phase remains discovery (early turns), phase advances to goalElicitation, synthesis triggered by phrase, synthesis triggered by max turns

**Effort:** M

---

### Issue M4-03: Implement error handling and logging strategy

**Description:**  
Establish the cross-cutting error handling and structured logging patterns used throughout `packages/api`. This is a cross-cutting concern — define it before Bedrock integration to avoid retrofitting.

Define typed error classes: `ValidationError`, `SessionNotFoundError`, `BedrockError`, `RepositoryError`. Each maps to an HTTP status code in the handler.

Structured logging: use `console.log` with JSON-serialized log entries (avoids logger library dependency for Lambda). Log shape: `{ level, message, sessionId?, turnCount?, durationMs?, error? }`. Log at entry, Bedrock call, and exit of each turn.

**Acceptance Criteria:**

- AC-01: `packages/api/src/errors/` defines typed error classes; each has a `statusCode` property
- AC-02: Handler maps typed errors to correct HTTP status codes without a sprawling if/else
- AC-03: `packages/api/src/utils/logger.ts` exports a `log(level, message, context?)` function producing JSON log entries
- AC-04: Handler logs entry (with sessionId if present), turn duration, and exit on every invocation
- AC-05: No `console.error` raw stack traces in production paths — errors are serialized via logger

**Effort:** S

---

### Issue M4-04: End-to-end smoke test of handler with stubbed Bedrock

**Description:**  
With handler, service, session repository, and DynamoDB live, perform a manual end-to-end smoke test of the conversation turn flow before Bedrock is wired in. Deploy the Lambda + DynamoDB (storage stack must be deployed from M3; Lambda deployed manually or via a temporary CDK construct) and drive a simulated multi-turn conversation via curl or Postman.

Document the smoke test results and any issues found. Fix any integration issues before proceeding to Bedrock integration.

**Acceptance Criteria:**

- AC-01: First turn (no `sessionId`) creates a DynamoDB session item; `sessionId` returned in response
- AC-02: Second turn with returned `sessionId` loads and updates the existing session; `turnCount` is 2
- AC-03: Session item in DynamoDB shows correct `history` array with two entries after two turns
- AC-04: Sending the synthesis trigger phrase on turn 3 returns `phase: 'synthesis'` in response
- AC-05: Smoke test results documented in `docs/smoke-test-m4.md`

**Effort:** S

---

## Milestone M5: Bedrock Integration

**Goal:** Lambda handler makes real Bedrock Converse API calls for conversational turns and switches to forced tool use for synthesis. Phase-aware prompt selection is live. System self-evaluation after each turn is implemented.

**Deliverables:** Full Bedrock integration end-to-end; all three phase prompts authored and selectable; synthesis produces schema-valid JSON validated by Zod.

---

### Issue M5-01: Implement BedrockService — Converse API turns

**Description:**  
Implement `packages/api/src/services/bedrock.service.ts` wrapping the AWS Bedrock Runtime `ConverseCommand`. Responsible for:

- Constructing the `ConverseCommand` input: `modelId`, `system` (active phase prompt), `messages` (full history from session), `inferenceConfig`
- Extracting the assistant text response from the `ConverseCommandOutput`
- Returning the assistant message string to `ConversationService`

Model ID, region, and inference parameters (temperature, maxTokens) are read from environment config. The service has no knowledge of phase logic — it receives a pre-selected system prompt string and the message history.

**Acceptance Criteria:**

- AC-01: `BedrockService.converse(systemPrompt, messages)` calls `ConverseCommand` and returns assistant text
- AC-02: `modelId` and inference parameters are sourced from environment config, not hardcoded
- AC-03: Non-200 Bedrock responses throw a typed `BedrockError` with the upstream error detail
- AC-04: Unit test with mocked Bedrock client covers: successful response extraction, Bedrock error propagation
- AC-05: Response extraction handles the `content[0].text` path correctly with a guard against unexpected output structures

**Effort:** M

---

### Issue M5-02: Author phase-aware system prompts

**Description:**  
Write the three system prompts used across the conversation phases. These are the primary prompt engineering deliverable and a key portfolio signal.

**Discovery prompt:** Elicit current role, tech stack, years of experience, and self-assessed strengths. Ask one focused question per turn. Acknowledge and incorporate anything the user volunteers without re-asking. Signal internally when sufficient context has been gathered.

**Goal Elicitation prompt:** Build on surfaced skills. Probe career direction, target role or technology, and motivation. One question per turn. Adapt to volunteered information.

**Synthesis prompt:** Not used for conversational turns — this is the forced tool use turn. May include a brief preamble, but the tool spec constrains the output.

Store prompts as exported string constants in `packages/api/src/prompts/`. Each file is independently editable for tuning.

Self-evaluation instruction (appended to Discovery and GoalElicitation prompts): instructs the model to append a structured XML block `<readiness>true|false</readiness>` to its response, which the service strips before sending the assistant message to the frontend.

**Acceptance Criteria:**

- AC-01: `packages/api/src/prompts/discovery.prompt.ts`, `goal-elicitation.prompt.ts`, `synthesis.prompt.ts` exist as exported string constants
- AC-02: Discovery and GoalElicitation prompts include the self-evaluation instruction producing a parseable `<readiness>` block
- AC-03: Prompts are wired into `ConversationService` — correct prompt selected based on session phase
- AC-04: Self-evaluation block is stripped from assistant message before persistence and response
- AC-05: Manual test confirms model produces `<readiness>true</readiness>` after sufficient context in a simulated conversation

**Effort:** M

---

### Issue M5-03: Implement synthesis turn — forced tool use

**Description:**  
Implement the synthesis turn path in `BedrockService`. When the phase is `synthesis`, switch from `ConverseCommand` to a `ConverseCommand` with:

- `toolConfig.tools`: the `generate_recommendation` tool spec (using `getRecommendationToolSchema()` from M2-03)
- `toolConfig.toolChoice`: `{ tool: { name: 'generate_recommendation' } }` (forced tool use)

Extract the `toolUse` block from the response, parse `toolUse.input` as the recommendation payload, and validate against `RecommendationSchema` using Zod. Return the validated `Recommendation` object.

**Acceptance Criteria:**

- AC-01: `BedrockService.synthesize(systemPrompt, messages)` sends `ConverseCommand` with forced `generate_recommendation` tool
- AC-02: Tool spec `inputSchema.json` is sourced from `getRecommendationToolSchema()` — no inline schema
- AC-03: Response extraction locates the `toolUse` block by `name: 'generate_recommendation'`
- AC-04: `RecommendationSchema.parse(toolUse.input)` validates the output; Zod errors throw a typed `ValidationError`
- AC-05: A live synthesis call with a seeded conversation history produces a `Recommendation` object that passes schema validation
- AC-06: Unit test with mocked Bedrock covers: successful extraction and validation, missing toolUse block, Zod validation failure

**Effort:** M

---

### Issue M5-04: Implement system self-evaluation and phase transition integration

**Description:**  
Wire the `<readiness>` self-evaluation mechanism into `ConversationService`. After each conversational turn response:

1. Parse the `<readiness>` block from the raw assistant response
2. Strip it from the message stored in history and returned to the frontend
3. If `true` AND phase transition conditions are met (see M4-02), advance the phase

The self-evaluation is one signal among several (turn count thresholds, user trigger phrase). The phase transition logic from M4-02 is updated to use the real readiness signal instead of the stub.

**Acceptance Criteria:**

- AC-01: `parseReadiness(rawResponse: string): { cleanedMessage: string; ready: boolean }` utility parses and strips the `<readiness>` block
- AC-02: `parseReadiness` returns `ready: false` if no `<readiness>` block is present (defensive)
- AC-03: `cleanedMessage` stored in DynamoDB history and returned to frontend contains no `<readiness>` XML
- AC-04: Phase advances from `discovery` → `goalElicitation` when `ready: true` AND minimum turn threshold met
- AC-05: Phase advances to `synthesis` when `ready: true` in `goalElicitation` phase
- AC-06: Unit tests cover: parse present block (true), parse present block (false), missing block (defaults false)

**Effort:** S

---

### Issue M5-05: Bedrock integration end-to-end test

**Description:**  
Drive a complete multi-turn conversation against the live Lambda + DynamoDB + Bedrock stack. Test both the natural phase progression path and the user-triggered synthesis path. Verify the recommendation artifact output is schema-valid.

Capture one complete conversation log (anonymized seed input acceptable) as a reference fixture for the portfolio README.

**Acceptance Criteria:**

- AC-01: A 5+ turn conversation naturally progresses from `discovery` → `goalElicitation` → `synthesis`
- AC-02: Synthesis produces a `Recommendation` object that passes `RecommendationSchema.parse()` without errors
- AC-03: User trigger phrase ("i'm ready for recommendations") on turn 3 skips to synthesis; valid recommendation returned
- AC-04: Max turn enforcement: 10th turn forces synthesis regardless of phase or user input
- AC-05: Complete test session log saved to `docs/integration-test-m5.md`

**Effort:** M

---

## Milestone M6: API Stack

**Goal:** `ApiStack` CDK construct deployed to AWS. API Gateway REST endpoint live, Lambda wired and invocable via HTTPS, IAM permissions for DynamoDB and Bedrock granted.

**Deliverables:** `POST /conversation/turn` endpoint reachable from browser (CORS configured); API URL exported as CDK output for FrontendStack consumption.

---

### Issue M6-01: Implement ApiStack CDK construct

**Description:**  
Implement `infra/lib/stacks/api-stack.ts`. The stack receives the DynamoDB table name as a prop (cross-stack reference from `StorageStack` output).

CDK construct includes:
- Lambda function pointing to `packages/api` bundle output; env vars: `TABLE_NAME`, `BEDROCK_REGION`, `MODEL_ID`, `MAX_TURNS`
- API Gateway REST API with `POST /conversation/turn` resource
- Lambda integration on the POST method
- CORS enabled on the resource (allow origin `*` for portfolio demo; restrict in production)
- API URL as `CfnOutput`

**Acceptance Criteria:**

- AC-01: `ApiStack` accepts `tableArn` and `tableName` as stack props; no hardcoded ARN/name in stack code
- AC-02: Lambda memory and timeout configured appropriately for Bedrock latency (suggest 512MB, 30s timeout)
- AC-03: `POST /conversation/turn` returns 200 from API Gateway when Lambda returns 200
- AC-04: CORS headers present in response (verified via curl with `Origin` header)
- AC-05: API URL exported as `CfnOutput` named `ConversationApiUrl`
- AC-06: `cdk deploy ApiStack` succeeds without manual console intervention

**Effort:** M

---

### Issue M6-02: Configure IAM permissions for Lambda

**Description:**  
Grant the Lambda execution role least-privilege permissions for DynamoDB and Bedrock.

- DynamoDB: `GetItem`, `PutItem`, `UpdateItem` on the session table ARN only
- Bedrock: `bedrock:InvokeModel` on the Haiku 4.5 model ARN in the configured region

Use CDK grant methods where available (`table.grantReadWriteData(fn)`). For Bedrock, add an inline policy — CDK does not have a native Bedrock grant construct at time of writing.

**Acceptance Criteria:**

- AC-01: Lambda execution role has DynamoDB permissions scoped to the session table ARN (not `*`)
- AC-02: Lambda execution role has `bedrock:InvokeModel` scoped to the Haiku 4.5 model ARN (not `*`)
- AC-03: Lambda has no other AWS permissions beyond DynamoDB, Bedrock, and default Lambda execution role policies
- AC-04: IAM policy verified by deploying and successfully invoking a complete synthesis turn

**Effort:** S

---

### Issue M6-03: API Gateway request/response configuration

**Description:**  
Configure API Gateway request validation, response models, and stage settings.

- Enable request body validation at the API Gateway level using a JSON Schema model matching `TurnRequestSchema` shape (belt-and-suspenders with Lambda-level Zod validation)
- Configure default 4XX and 5XX gateway responses with consistent JSON error shape
- Deploy to a `prod` stage with access logging to CloudWatch

**Acceptance Criteria:**

- AC-01: API Gateway request validator rejects malformed JSON bodies before Lambda invocation (verified by sending invalid body)
- AC-02: Gateway-level 4XX responses return JSON `{ error: string }` not HTML
- AC-03: `prod` stage deployed with access logging enabled pointing to a CloudWatch log group
- AC-04: Stage URL matches the `CfnOutput` export

**Effort:** S

---

## Milestone M7: Frontend — Conversation UI

**Goal:** React SPA drives a multi-turn conversation: seeds the session, submits turns, displays the chat history, and reflects phase state. Session state managed without cross-session persistence.

**Deliverables:** Working chat UI deployable locally via Vite dev server, connecting to the live API.

---

### Issue M7-01: Initialize Vite + React + Tailwind + shadcn/ui

**Description:**  
Bootstrap `packages/web/src` with the minimal application shell: `main.tsx`, `App.tsx`, Tailwind configured, shadcn/ui initialized, TanStack Query `QueryClient` and `QueryClientProvider` at the root.

No application-specific components yet. The shell renders a placeholder heading to confirm the build pipeline works end-to-end.

**Acceptance Criteria:**

- AC-01: `vite dev` serves the app at `localhost:5173` with hot reload
- AC-02: Tailwind utility classes apply correctly (verified by adding a test `bg-blue-500` div)
- AC-03: At least one shadcn/ui component (`Button`) importable and rendering without errors
- AC-04: TanStack Query `QueryClient` initialized at app root
- AC-05: `vite build` produces a `dist/` artifact with no TypeScript errors

**Effort:** S

---

### Issue M7-02: Implement session state management

**Description:**  
Implement the client-side session state using React Context (or Zustand if preferred — Context is sufficient for this scope). State tracks:

```typescript
{
  sessionId: string | null;
  phase: ConversationPhase;
  turnCount: number;
  synthesisReady: boolean;
  messages: { role: 'user' | 'assistant'; content: string }[];
  recommendation: Recommendation | null;
}
```

`sessionId: null` signals first-turn state. After first turn response, `sessionId` is populated and persisted in component state (not `localStorage` — fresh session on every visit is the intended behavior).

Expose a `resetSession()` action that clears all state back to initial values.

**Acceptance Criteria:**

- AC-01: `SessionContext` (or equivalent) provides session state and dispatch/actions to child components
- AC-02: `sessionId` starts as `null`; populated from first-turn API response
- AC-03: `resetSession()` resets all state fields to initial values
- AC-04: `phase`, `turnCount`, `synthesisReady` update correctly from API responses
- AC-05: Session state is NOT persisted to `localStorage` or `sessionStorage` — page refresh starts a new session

**Effort:** S

---

### Issue M7-03: Implement API client and turn submission hook

**Description:**  
Implement the Axios-based API client and a `useSubmitTurn` TanStack Query mutation hook.

API client: Axios instance configured with `baseURL` from `VITE_API_BASE_URL`, default headers, and a response interceptor that maps HTTP error codes to typed application errors.

`useSubmitTurn` mutation:
- Reads `sessionId` from session context (null on first turn)
- Posts `{ sessionId?, userMessage }` to `POST /conversation/turn`
- On success: updates session context with returned `sessionId`, `phase`, `turnCount`, `synthesisReady`, and appends messages
- On synthesis response: stores `recommendation` in session context

**Acceptance Criteria:**

- AC-01: `packages/web/src/api/client.ts` exports a configured Axios instance
- AC-02: `useSubmitTurn` hook posts the correct request body (no `sessionId` on first call, present on subsequent)
- AC-03: On success, session context is updated atomically (not partial updates that could cause render inconsistency)
- AC-04: Network and 4XX/5XX errors surface as typed errors catchable by the component
- AC-05: Hook exposes `isPending` state used to disable the submit button and show a loading indicator

**Effort:** M

---

### Issue M7-04: Implement chat interface component

**Description:**  
Implement the primary chat UI: message history display, user input field, submit button, and phase indicator.

Layout: full-height chat panel with scrollable message history, fixed input area at bottom. Messages rendered as chat bubbles (user right-aligned, assistant left-aligned). Phase indicator in the header area shows current phase label.

Use shadcn/ui components where appropriate (`Button`, `Input`, `ScrollArea`, `Badge` for phase indicator). Tailwind for layout.

Accessibility: input has a label, submit button has an accessible name, message list has appropriate ARIA role. Not production-grade but not embarrassing.

**Acceptance Criteria:**

- AC-01: Message history scrolls; new messages auto-scroll to bottom
- AC-02: User and assistant messages are visually distinct
- AC-03: Submit button disabled and shows loading state while `isPending` is true
- AC-04: Phase badge updates when `phase` changes in session context
- AC-05: `Enter` key in the input field triggers submission (in addition to button click)
- AC-06: Input clears after successful submission

**Effort:** M

---

### Issue M7-05: Implement seed input and conversation reset

**Description:**  
Implement the seed input experience for first-turn session cold-start, and the conversation reset flow.

**Seed input:** On initial load (`sessionId === null`), display a brief prompt explaining the app and a textarea for the user's seed context (current role, tech stack, goals). Submitting the seed fires the first turn. Transition to the chat interface after first response.

**Reset:** A "Start Over" button visible during an active session. Clicking it calls `resetSession()` (clears all state) and returns to the seed input view. No server-side action required — new session will be created on next seed submission.

**Acceptance Criteria:**

- AC-01: Seed input view rendered when `sessionId === null`
- AC-02: Chat view rendered when `sessionId` is populated
- AC-03: Seed textarea has placeholder text describing expected input (role, stack, goals)
- AC-04: "Start Over" button visible in chat view; triggers `resetSession()` and returns to seed view
- AC-05: Seed input is pre-populated in the message history as the first user message after transition to chat view

**Effort:** S

---

## Milestone M8: Frontend — Recommendation Artifact

**Goal:** When synthesis completes, the recommendation artifact is rendered as a structured, readable panel — not raw JSON. This is the primary portfolio-visible output of the application.

**Deliverables:** `RecommendationPanel` component rendering all `Recommendation` fields; synthesis trigger button visible at appropriate times.

---

### Issue M8-01: Implement RecommendationPanel component

**Description:**  
Implement `packages/web/src/components/RecommendationPanel.tsx`. Renders the full `Recommendation` object in a structured, readable layout.

Sections:
1. **Profile Summary** — prose paragraph
2. **Skill Gaps** — prioritized list with severity badge per gap and rationale
3. **Recommendations** — card-per-recommendation layout showing: area name, rationale, resource categories, estimated effort, estimated timeline

Use shadcn/ui `Card`, `Badge`, `Separator`. Keep visual hierarchy clear — this panel will be screenshot-reviewed by portfolio evaluators.

**Acceptance Criteria:**

- AC-01: `RecommendationPanel` accepts `recommendation: Recommendation` prop and renders all fields
- AC-02: Skill gaps are rendered in order with severity visually encoded (e.g., `Badge` variant: destructive/warning/default)
- AC-03: Each recommendation is rendered in its own `Card` with labeled fields
- AC-04: `RecommendationPanel` is only rendered when `recommendation !== null` in session context
- AC-05: Panel is visually distinct from the chat history — clear separation in the layout
- AC-06: Component renders without errors when given the output of a live synthesis call

**Effort:** M

---

### Issue M8-02: Implement synthesis trigger UX

**Description:**  
Implement the "I'm ready for recommendations" trigger button. This button is the user-facing synthesis trigger, complementing the natural synthesis detection.

Display conditions: visible after turn 3 (configurable constant matching backend threshold), hidden once synthesis is complete or in progress. Clicking it submits the trigger phrase as the user's next message (consistent with the backend's phrase detection).

Also display a turn counter (`Turn N of 10`) in the chat header so users understand the conversation boundaries.

**Acceptance Criteria:**

- AC-01: Trigger button appears after `turnCount >= MIN_TURNS_FOR_SYNTHESIS` (constant matching backend config)
- AC-02: Clicking trigger button submits the trigger phrase via `useSubmitTurn` (same path as manual typing)
- AC-03: Trigger button hidden once `phase === 'synthesis'` or `recommendation !== null`
- AC-04: Turn counter (`Turn N of 10`) displayed in chat header, updating on each turn
- AC-05: `synthesisReady: true` in API response optionally surfaces a visual hint (e.g., pulsing badge) prompting the user to trigger synthesis

**Effort:** S

---

### Issue M8-03: Frontend integration test — full conversation to recommendation

**Description:**  
Manually drive a complete conversation in the browser against the live API stack: seed → multi-turn conversation → synthesis → recommendation artifact displayed. Verify the UI handles all expected states correctly.

Also test edge cases: page refresh (new session), Start Over mid-conversation, max turns auto-synthesis.

**Acceptance Criteria:**

- AC-01: Full happy path completes — seed to recommendation rendered — without console errors
- AC-02: Page refresh during active conversation starts a fresh session (no stale state)
- AC-03: "Start Over" mid-conversation resets to seed view; new session created on next seed submission
- AC-04: On turn 10, synthesis fires automatically; recommendation renders without user triggering
- AC-05: Network error during a turn shows an error state in the UI; retry is possible without page refresh

**Effort:** S

---

## Milestone M9: Frontend Stack

**Goal:** `FrontendStack` CDK construct deployed. React SPA served via CloudFront backed by S3. Production build pipeline integrated.

**Deliverables:** `FrontendStack` deployed; CloudFront distribution URL serving the live application.

---

### Issue M9-01: Implement FrontendStack CDK construct

**Description:**  
Implement `infra/lib/stacks/frontend-stack.ts`. The stack receives the API Gateway URL as a prop (from `ApiStack` `CfnOutput`).

CDK construct:
- S3 bucket (private, no static website hosting — CloudFront OAC access only)
- CloudFront distribution with S3 origin using Origin Access Control (OAC, not legacy OAI)
- Default root object: `index.html`
- Custom error response: 403/404 → `index.html` with 200 (SPA routing)
- `BucketDeployment` construct deploying `packages/web/dist/` to S3, invalidating CloudFront on deploy
- The `VITE_API_BASE_URL` env var injected into the Vite build before `BucketDeployment` runs

**Acceptance Criteria:**

- AC-01: CloudFront distribution serves `index.html` at the distribution URL
- AC-02: 403 and 404 responses return `index.html` with status 200 (required for SPA client-side routing)
- AC-03: S3 bucket is private; direct S3 URL returns 403
- AC-04: `BucketDeployment` invalidates the CloudFront distribution on every CDK deploy
- AC-05: `VITE_API_BASE_URL` in the deployed frontend points to the live API Gateway URL
- AC-06: `cdk deploy FrontendStack` completes and the app is accessible at the CloudFront URL

**Effort:** M

---

### Issue M9-02: Validate full-stack deployment end-to-end

**Description:**  
With all four CDK stacks deployed (Storage, Api, Frontend, Observability), run a complete end-to-end validation via the CloudFront URL. This is the first test of the fully integrated system with no localhost components.

**Acceptance Criteria:**

- AC-01: Application loads from CloudFront URL with no mixed-content or CORS errors
- AC-02: Complete conversation (seed → turns → synthesis) completes successfully against the live API
- AC-03: CloudWatch logs show Lambda invocations for each turn
- AC-04: DynamoDB console shows session item with correct structure after a complete conversation
- AC-05: Validation results documented in `docs/e2e-validation-m9.md`

**Effort:** S

---

## Milestone M10: Observability Stack

**Goal:** `ObservabilityStack` deployed with a CloudWatch dashboard showing the cost-bearing and operational metrics meaningful to a portfolio evaluator, plus alarms for budget protection.

**Deliverables:** `ObservabilityStack` deployed; dashboard visible in AWS console; billing alarm active.

---

### Issue M10-01: Implement ObservabilityStack CDK construct

**Description:**  
Implement `infra/lib/stacks/observability-stack.ts`. Dashboard widgets:

- Lambda: invocation count, error rate, duration (p50/p95), throttle count
- API Gateway: request count, 4XX rate, 5XX rate, latency (p50/p95)
- DynamoDB: consumed read/write capacity units, throttled requests
- Bedrock: model invocation count (via CloudWatch metrics if available), input/output token counts

Group widgets by concern: API health, AI inference, storage, cost indicators.

**Acceptance Criteria:**

- AC-01: Dashboard named `career-compass` visible in CloudWatch console
- AC-02: Dashboard includes widgets for all four service categories listed above
- AC-03: Dashboard time range defaults to last 24 hours
- AC-04: `cdk deploy ObservabilityStack` succeeds without errors
- AC-05: All widget metric namespaces and dimension names verified against live metrics (no "no data" widgets after a test invocation)

**Effort:** M

---

### Issue M10-02: Configure CloudWatch alarms for budget protection

**Description:**  
Create CloudWatch alarms that fire on cost-bearing anomalies. For a portfolio project, these are budget protection signals, not SLOs.

Alarms:
- Lambda error rate > 10% over 5 minutes → SNS notification (email)
- Lambda invocation count > 500/day → SNS notification (unusual usage volume for a portfolio demo)
- Bedrock invocation count > 200/day → SNS notification

SNS topic with email subscription. Email address sourced from CDK context, not hardcoded.

**Acceptance Criteria:**

- AC-01: SNS topic created; email subscription confirmed (manual step documented)
- AC-02: Lambda error rate alarm configured with correct namespace, metric, and threshold
- AC-03: Lambda invocation count alarm configured
- AC-04: Bedrock invocation alarm configured (if Bedrock publishes invocation count metric; document if unavailable and use a proxy metric)
- AC-05: Test alarm fires correctly by triggering a Lambda error intentionally (documented test, then alarm reset)

**Effort:** S

---

### Issue M10-03: Add structured log queries to dashboard

**Description:**  
Add CloudWatch Logs Insights query widgets to the dashboard to surface conversation-level observability from the structured logs implemented in M4-03.

Queries:
- Average turn duration (ms) over last 24 hours
- Count of synthesis turns (phase = synthesis completions)
- Error count by error type over last 24 hours
- Sessions started (first-turn count) over last 24 hours

**Acceptance Criteria:**

- AC-01: Four Logs Insights query widgets added to the `career-compass` dashboard
- AC-02: Each query targets the Lambda log group and uses the structured JSON log format from M4-03
- AC-03: Queries return results after a test conversation (not "no results" due to incorrect field references)
- AC-04: Widget titles clearly describe what each query measures

**Effort:** S

---

## Milestone M11: CI/CD Workflows

**Goal:** Three GitHub Actions workflows operational: CI (lint + build + test on every PR), Deploy (full CDK deploy on merge to main), Teardown (full CDK destroy on demand).

**Deliverables:** All three workflows passing; deploy workflow successfully deploys all four stacks from CI.

---

### Issue M11-01: Implement CI workflow

**Description:**  
Implement `.github/workflows/ci.yml`. Triggers on pull requests to `main`.

Steps: checkout, Node.js setup (version from `.nvmrc`), `npm ci`, `npm run lint`, `npm run build` (all workspaces), `npm run test` (all workspaces). Use GitHub Actions cache for `node_modules` keyed on `package-lock.json`.

**Acceptance Criteria:**

- AC-01: CI workflow triggers on PR open, synchronize, and reopen
- AC-02: Workflow fails fast on lint errors, build failures, or test failures
- AC-03: `node_modules` cache hit on subsequent runs (verified in Actions log)
- AC-04: Workflow completes in under 5 minutes on a cold cache
- AC-05: Status check registered in GitHub; branch protection on `main` requires this check to pass

**Effort:** S

---

### Issue M11-02: Implement Deploy workflow

**Description:**  
Implement `.github/workflows/deploy.yml`. Triggers on push to `main` (i.e., PR merge).

Steps: checkout, Node.js setup, `npm ci`, `npm run build`, CDK deploy all four stacks in dependency order (`StorageStack` → `ApiStack` → `FrontendStack` → `ObservabilityStack`) using `cdk deploy --all --require-approval never`.

AWS credentials via GitHub Actions OIDC (not long-lived access keys). IAM role in the portfolio AWS account trusts the GitHub Actions OIDC provider scoped to this repository.

**Acceptance Criteria:**

- AC-01: Workflow triggers on push to `main`
- AC-02: AWS credentials sourced from OIDC role (no `AWS_ACCESS_KEY_ID` secret in GitHub)
- AC-03: CDK deploys all four stacks in correct order without manual approval
- AC-04: Workflow fails and notifies if any stack deploy fails
- AC-05: Successful deploy verified by accessing CloudFront URL post-deploy

**Effort:** M

---

### Issue M11-03: Implement Teardown workflow

**Description:**  
Implement `.github/workflows/teardown.yml`. Manual trigger only (`workflow_dispatch`). Destroys all four CDK stacks in reverse dependency order.

Include a confirmation input parameter (`confirm: 'destroy'`) — the workflow proceeds only if the input matches exactly. This prevents accidental teardown.

**Acceptance Criteria:**

- AC-01: Workflow is `workflow_dispatch` only — not triggered by push or PR events
- AC-02: Requires input `confirm: 'destroy'` to proceed; any other value causes the workflow to exit early with a logged message
- AC-03: Destroys stacks in reverse order: `ObservabilityStack` → `FrontendStack` → `ApiStack` → `StorageStack`
- AC-04: Uses same OIDC role as Deploy workflow
- AC-05: Teardown verified: all four stacks absent from CloudFormation console after workflow completes

**Effort:** S

---

## Milestone M12: Prompt Tuning & Integration QA

**Goal:** Conversation quality is sufficient for portfolio demonstration. Phase transitions feel natural, questions are well-targeted, and the recommendation output is coherent and professional. Known rough edges documented for V2.

**Deliverables:** Tuned prompts committed; QA test log documenting representative conversations; README complete.

---

### Issue M12-01: Iterative prompt tuning

**Description:**  
Run structured prompt evaluation sessions covering representative user profiles (e.g., mid-career Java developer targeting cloud architecture, early-career developer targeting full-stack TypeScript). Evaluate each phase prompt against criteria:

- Discovery: Does the model ask focused, non-redundant questions? Does it correctly surface `<readiness>true</readiness>` when sufficient context is gathered?
- Goal Elicitation: Does it build naturally on discovered skills? Does it avoid re-asking covered ground?
- Synthesis: Does the recommendation output reflect the conversation content, or is it generic?

Time-box to 3 iterations per prompt. Capture before/after prompt diff in the commit history.

**Acceptance Criteria:**

- AC-01: At least 3 representative conversation profiles tested end-to-end with each prompt version
- AC-02: Discovery phase asks no more than one question per turn and does not re-ask previously answered topics
- AC-03: Synthesis output references specific skills and goals mentioned during the conversation (not boilerplate)
- AC-04: `<readiness>` signal fires at a reasonable point (not turn 1, not withheld until turn 10 on adequate input)
- AC-05: Final prompt versions committed with a comment block documenting the tuning rationale

**Effort:** L

---

### Issue M12-02: End-to-end QA and edge case testing

**Description:**  
Systematic QA pass covering happy paths and edge cases against the fully deployed stack:

- Happy path: natural progression through all phases to synthesis
- Early trigger: user triggers synthesis on turn 2 (minimal context — verify recommendation still structurally valid)
- Max turns: reach turn 10 without triggering synthesis — verify auto-synthesis fires
- Terse user: user gives one-word answers — verify model adapts
- Verbose user: user volunteers all information in turn 1 — verify model doesn't re-ask and advances phase quickly
- Reset: Start Over mid-conversation — verify new session behaves correctly

Document each scenario result in `docs/qa-results-m12.md`.

**Acceptance Criteria:**

- AC-01: All six scenarios above executed and results documented
- AC-02: No scenario produces an unhandled error or blank/null response
- AC-03: Early synthesis (turn 2) returns a valid `Recommendation` object (content quality secondary to structural validity)
- AC-04: Max turn auto-synthesis fires on turn 10 regardless of user input content
- AC-05: Reset scenario confirms new session ID is issued and conversation history is clean

**Effort:** M

---

### Issue M12-03: Finalize README and portfolio documentation

**Description:**  
Write the final `README.md` at the repo root. Target audience: portfolio evaluators and potential clients reviewing the GitHub repository.

Sections:
- Project summary (2-3 sentences)
- Architecture diagram (embed Mermaid or PNG export)
- Technology stack table
- Key design decisions (summarized — link to Project Overview for full detail)
- Local development setup (prerequisites, env var setup, `npm install`, `npm run dev`)
- Deployment guide (CDK bootstrap, GitHub OIDC setup, deploy workflow)
- Representative conversation example (excerpted from M5-05 integration test log)
- V2 roadmap (brief — reference the Project Overview)

**Acceptance Criteria:**

- AC-01: README renders correctly on GitHub (no broken Mermaid, no broken relative links)
- AC-02: Local dev setup instructions verified by a clean-checkout follow-through
- AC-03: Representative conversation example included (minimum: seed input + 3 turns + recommendation artifact excerpt)
- AC-04: Architecture diagram present and matches the deployed system
- AC-05: Project Overview document (`docs/project-overview.md`) committed to the repository and linked from README

**Effort:** M

---

## Appendix: Monorepo Directory Structure

```
career-compass/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy.yml
│   │   └── teardown.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── environment-variables.md
│   ├── smoke-test-m4.md
│   ├── integration-test-m5.md
│   ├── e2e-validation-m9.md
│   ├── qa-results-m12.md
│   └── project-overview.md
├── infra/
│   ├── bin/
│   │   └── app.ts                    # CDK app entry; stack instantiation and dependency wiring
│   ├── lib/
│   │   └── stacks/
│   │       ├── storage-stack.ts
│   │       ├── api-stack.ts
│   │       ├── frontend-stack.ts
│   │       └── observability-stack.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
├── packages/
│   ├── api/
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   └── conversation.handler.ts
│   │   │   ├── services/
│   │   │   │   ├── conversation.service.ts
│   │   │   │   └── bedrock.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── session.repository.ts
│   │   │   ├── prompts/
│   │   │   │   ├── discovery.prompt.ts
│   │   │   │   ├── goal-elicitation.prompt.ts
│   │   │   │   └── synthesis.prompt.ts
│   │   │   ├── errors/
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       ├── logger.ts
│   │   │       └── config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared/
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   │   ├── recommendation.schema.ts
│   │   │   │   └── api.schema.ts
│   │   │   └── utils/
│   │   │       └── bedrock-tool-schema.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── api/
│       │   │   └── client.ts
│       │   ├── components/
│       │   │   ├── ChatInterface.tsx
│       │   │   ├── RecommendationPanel.tsx
│       │   │   ├── SeedInput.tsx
│       │   │   └── MessageBubble.tsx
│       │   ├── context/
│       │   │   └── SessionContext.tsx
│       │   ├── hooks/
│       │   │   └── useSubmitTurn.ts
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── package.json                      # Workspace root
├── tsconfig.base.json
├── .eslintrc.js (or eslint.config.js)
├── .prettierrc
├── .nvmrc
├── .gitignore
└── README.md
```

---

## Appendix: CDK Stack Deploy Order

```
StorageStack  ──►  ApiStack  ──►  FrontendStack
                                  ObservabilityStack (parallel with FrontendStack; depends on ApiStack)
```

Teardown order (reverse): `ObservabilityStack` → `FrontendStack` → `ApiStack` → `StorageStack`