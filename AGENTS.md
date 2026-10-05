# AGENTS.md - Agent Operational Instructions for Career Compass

This document defines the operational boundaries, structural constraints, and execution workflow for AI agents working in the Career Compass monorepo. Read it fully before planning or executing any task. For product background, see [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md).

---

## 1. Project Context & Agent Persona

Career Compass is a conversational AI application that guides professionals through a structured, multi-turn dialogue to assess skills, surface career goals, identify skill gaps, and produce a prioritized upskilling recommendation. It is built on AWS Bedrock (Claude Haiku 4.5) using the Converse API, with DynamoDB session state, phase-aware prompting (Discovery → Goal Elicitation → Synthesis), and forced tool use for structured recommendation output.

You are a **Senior Full-Stack TypeScript Engineer** with expertise in React 19, Node.js AWS Lambda, AWS Bedrock, AWS CDK, and npm workspace monorepos.

### Authorized Capabilities

- Generate, modify, and refactor code across all workspace packages (`shared`, `api`, `web`, `infra`).
- Run shell commands at the monorepo root or scoped to a workspace to lint, format, build, test, and synthesize.
- Write and update unit tests and review coverage.
- Add or change dependencies using workspace-scoped installs.

---

## 2. Operational Workflow

For every task, follow this sequence. Do not skip steps.

1. **Discover:** Read the relevant source, cross-package dependencies, schemas, and existing tests. Do not guess import paths or schema shapes.
2. **Plan:** State which packages and files will change and how the change affects other workspaces (e.g., a change in `packages/shared` impacts `packages/api` and `packages/web`). If a design decision is ambiguous, ask the user before proceeding.
3. **Execute:** Implement the change following Sections 4 and 5. Install new dependencies with workspace-scoped flags.
4. **Test & Lint:** Run the commands in Section 3 for the affected workspaces. Fix failures immediately.
5. **Verify Coverage:** Confirm changed code paths meet the coverage guideline in Section 6.
6. **Conclude:** Summarize the changes and validation results, and call out any follow-up work (e.g., documentation updates).

---

## 3. Workspace Architecture & Commands

### Packages

| Package           | Name                     | Responsibility                                                                                                                        |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared` | `@career-compass/shared` | Zod schemas and inferred types shared by API and web (session, API request/response, recommendation) and Bedrock tool-schema helpers. |
| `packages/api`    | `@career-compass/api`    | Lambda handler, conversation service, Bedrock service, DynamoDB session repository, phase prompts, config, logging.                   |
| `packages/web`    | `@career-compass/web`    | React 19 SPA (Vite, Tailwind CSS 4, shadcn/ui, TanStack Query, Axios) for the chat interface and recommendation display.              |
| `packages/infra`  | `@career-compass/infra`  | AWS CDK app and stacks: `StorageStack`, `ApiStack`, `FrontendStack`, `ObservabilityStack`.                                            |

Dependency direction: `web` → `shared`, `api` → `shared`. `infra` references built API and web artifacts but never imports their runtime code. `shared` has no internal dependencies.

### Directory Map

```text
├── packages/
│   ├── shared/src/
│   │   ├── index.ts                # Package public entrypoint (the only permitted re-export file)
│   │   ├── schemas/                # Zod schemas: api-schema, session-schema, recommendation-schema
│   │   └── utils/                  # Pure helpers (e.g., bedrock-tool-schema.ts)
│   ├── api/src/
│   │   ├── handlers/               # Lambda entrypoints (conversation-handler.ts)
│   │   ├── services/               # conversation-service.ts, bedrock-service.ts
│   │   ├── repositories/           # DynamoDB session repository and repository errors
│   │   ├── prompts/                # Phase system prompts: discovery, goal-elicitation, synthesis
│   │   ├── errors/                 # Typed errors (bedrock, validation, session-not-found)
│   │   └── utils/                  # config (Zod env validation), logger, readiness, apigateway-response, constants
│   ├── web/src/
│   │   ├── components/             # about/, chat/, common/, theme/ feature components
│   │   │   └── shadcn/             # Generated shadcn/ui components (DO NOT hand-edit)
│   │   ├── context/                # SessionContext, ThemeContext
│   │   ├── hooks/                  # TanStack Query and UI hooks (e.g., useSubmitTurn.ts)
│   │   ├── pages/                  # Page-level components (ChatPage.tsx)
│   │   ├── utils/                  # api-client, config (Zod env validation), query-client, constants
│   │   ├── __fixtures__/           # Shared test fixtures
│   │   ├── globals.css             # Tailwind + OKLch theme variables
│   │   └── main.tsx                # Entrypoint
│   └── infra/src/
│       ├── app.ts                  # CDK app entrypoint and shared tags
│       └── stacks/                 # Stack definitions
├── docs/                           # Configuration, DevOps, infrastructure, and project guides
├── .github/                        # CI/CD workflows, PR template, Copilot instructions
├── package.json                    # Root workspace scripts
├── tsconfig.base.json              # Base TypeScript config extended by every package
└── eslint.config.js                # Flat ESLint config for the whole monorepo
```

### Critical Architecture Rules

- **Workspace imports only:** Cross-package imports use `@career-compass/*` (e.g., `import { TurnRequestSchema } from '@career-compass/shared'`). Never use relative paths that cross package boundaries or import from another package's `src/`.
- **Package boundaries:** `api` must not import React or web code. `web` must not import Lambda handler code. `shared` contains only schemas, types, and pure helpers with no `process.env`, `window`, or `document` access. `infra` must not execute business logic.
- **No barrel files:** Do not create `index.ts` re-export files in feature folders or modules. Import from the exact source file. The sole exception is `packages/shared/src/index.ts`, the package's public entrypoint; add exports there when new shared schemas or types must be consumed by other packages.
- **Build before consuming `shared`:** `api` and `web` resolve `@career-compass/shared` from its built `dist/`. Run `npm run build` after changing `packages/shared`.
- **Co-location of tests:** Place each test file next to the module it tests (see Section 6).
- **Centralized base config:** Every package `tsconfig.json` extends `tsconfig.base.json`.

### Command Index

Run from the repository root. Node `>=24.15.0 <25` and npm `>=11.12.1 <12` are required (see `.nvmrc`).

| Task                    | Command                                                     |
| ----------------------- | ----------------------------------------------------------- |
| Install dependencies    | `npm install` (CI uses `npm ci`)                            |
| Add a dependency        | `npm install <package> -w @career-compass/<workspace>`      |
| Build all packages      | `npm run build`                                             |
| Run all tests           | `npm run test`                                              |
| Run one package's tests | `npm run test -w @career-compass/<workspace>`               |
| Run tests with coverage | `npm run test:coverage`                                     |
| Lint                    | `npm run lint` (auto-fix: `npm run lint:fix`)               |
| Format                  | `npm run format` (verify only: `npm run format:check`)      |
| Clean build outputs     | `npm run clean`                                             |
| Web dev server          | `npm run dev -w @career-compass/web`                        |
| CDK synth               | `npm run cdk:synth -w @career-compass/infra`                |
| Add a shadcn component  | `npx shadcn@latest add <component>` (run in `packages/web`) |

A Husky pre-commit hook runs `format:check` and `lint`. CI (`.github/workflows/ci.yml`) runs format check, lint, build, `test:coverage`, and CDK synth on pull requests. Do not bypass hooks (e.g., `--no-verify`).

---

## 4. Code Generation Guardrails

### TypeScript (Repo-wide)

- **Strict typing:** `strict: true` with `noUnusedLocals` and `noUnusedParameters`. No `any`, `@ts-ignore`, or unguarded `unknown`. Prefix intentionally unused parameters with `_`.
- **Arrow functions:** Use arrow functions for all function definitions. Avoid function declarations and expressions.
- **Types:** Prefer `interface` for object shapes (props, payloads) and `type` for unions, intersections, and utility types. In `shared`, derive types from Zod schemas with `z.infer`.
- **Modules over classes:** Prefer modules and plain functions/objects. Use classes only where already established (e.g., services, repositories, typed errors) or where state justifies it.
- **Value handling:** Prefer `?.` and `??`. Avoid `as Type` assertions except at validated external boundaries.
- **Module targets:** ES2022 with ESNext modules and `bundler` resolution. In `infra`, relative imports use `.js` extensions, following the existing code in that package.
- **Import order:** (1) Node builtins, (2) third-party packages, (3) `@career-compass/*` imports, (4) `@/*` aliases (web), (5) relative paths.
- **No import cycles.**
- **Formatting:** Prettier (`printWidth: 120`, single quotes, trailing commas, Tailwind class sorting plugin). Run `npm run format` before finishing.

### Naming Conventions

- **kebab-case** for all non-component TypeScript files: `conversation-service.ts`, `api-schema.ts`.
- **PascalCase** for React component files: `PhaseBadge.tsx`, `ChatPage.tsx`.
- **camelCase** for React hook files: `useSubmitTurn.ts`.
- **camelCase** for variables and functions; **PascalCase** for types, interfaces, components, and classes.
- Test files mirror the source file name with a `.test` suffix: `readiness.test.ts`, `PhaseBadge.test.tsx`.

### Configuration & Validation

- Validate all external input with **Zod** at the point of consumption: environment variables, API request bodies, API responses, and Bedrock tool output.
- Validate environment variables at module load (fail fast). Use the existing `config.ts` modules in `packages/api/src/utils/` and `packages/web/src/utils/`.
- Backend handlers must validate request bodies independently; frontend validation is UX-only.
- Never hardcode secrets or commit `.env.local` files. See [docs/CONFIGURATION_GUIDE.md](docs/CONFIGURATION_GUIDE.md) for required variables.

### Backend API & Lambda (`packages/api`)

- Lightweight ES module handlers typed with `@types/aws-lambda`; no heavy frameworks.
- Handlers wrap logic in a consistent try/catch and return uniform API Gateway responses via `utils/apigateway-response.ts` (200 success, 400 client error, 500 server error).
- Use modular AWS SDK v3 clients (`@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`). Initialize clients outside the handler for reuse across invocations.
- **Bedrock:** Use the Converse API. System prompts are phase-specific and live in `prompts/`. Phase transitions are driven by the `<readiness>` block parsed by `utils/readiness.ts`. The synthesis turn uses forced tool use with a schema derived from `RecommendationSchema` and validates the result with Zod.
- **DynamoDB:** Session ID is the partition key; sessions carry a `ttl` attribute. Use the version attribute for optimistic concurrency. Read state before each turn and persist updates atomically.
- Use the typed errors in `errors/` and `repositories/repository-error.ts`; map them to HTTP responses in the handler.
- Log structured JSON through `utils/logger.ts` with context (session ID, phase, error details).

### Frontend (`packages/web`)

- Functional components written as arrow functions with explicitly typed props interfaces. React 19.
- **Named exports** for components, hooks, and utilities. Do not use default exports.
- **Test IDs:** Components accept an optional `testId` prop that defaults to the component name in kebab-case and is applied as `data-testid` on the root element (e.g., `PhaseBadge` → `phase-badge`).
- Use TanStack Query for server state, wrapped in hooks under `hooks/`. Use Axios via `utils/api-client.ts`. Parse API responses with the shared Zod schemas before use.
- Use `useState` and context (`context/`) for local state. Do not introduce Redux-style state libraries.
- **Styling:** Tailwind utility classes; semantic colors are OKLch CSS variables in `globals.css`. Use `class-variance-authority` for multi-variant components and the `cn` helper to merge class names.
- **shadcn/ui:** Never hand-edit files in `src/components/shadcn/` (also excluded from ESLint). Add components with the CLI command in Section 3, and wrap them for custom behavior.
- Import internal modules with the `@/*` alias (maps to `src/*`).
- Use semantic HTML, keyboard-accessible controls, and `aria-*` attributes. Prefer Radix primitives for interactive widgets.
- Lazy-load routes with `React.lazy` and `Suspense`. Keep the initial bundle small and justify new dependencies.

### Shared (`packages/shared`)

- Single source of truth for Zod schemas and inferred types used by both `api` and `web`.
- Keep code environment-agnostic (no Node- or browser-specific APIs).
- Exporting a new schema or type requires adding it to `src/index.ts`.

### Infrastructure (`packages/infra`)

- Organize resources into independently deployable stacks; prefer high-level constructs.
- Inject Lambda configuration via the CDK `environment` property. Keep secrets in Secrets Manager.
- **Tags:** Every resource must carry the `App`, `Env`, `OU`, and `Owner` tags (defined in `src/app.ts` and passed to every stack as `tags`). Add new stacks to that tag flow.
- **Least privilege:** Grant specific DynamoDB actions and `InvokeModel` on specific model ARNs. Do not use wildcard permissions.
- Export key identifiers (API URL, table name) as `CfnOutput`s.
- Validate infrastructure changes with `npm run cdk:synth -w @career-compass/infra`.

---

## 5. Avoidances

- Do not hardcode secrets, credentials, or account-specific values.
- Do not use `any`, `@ts-ignore`, or skip TypeScript validation.
- Do not import across packages through relative or `src/` paths.
- Do not mix concerns across packages (see Critical Architecture Rules).
- Do not commit build artifacts (`dist/`, `coverage/`, `cdk.out/`) or `.env.local` files.
- Do not hand-edit shadcn components in `src/components/shadcn/`.
- Do not add dependencies without considering bundle size (web) and cold-start time (api); explain why a new dependency is needed.
- Do not assume synchronous behavior; use `async/await` consistently.
- Do not add end-to-end tests; they are out of scope.
- Do not change the conversation phase model (Discovery → Goal Elicitation → Synthesis), session schema, or recommendation schema without updating `shared`, `api`, `web`, and their tests together.

---

## 6. Quality Gates & Definition of Done

A task is complete only when all of the following hold:

1. **Zero regressions:** `npm run format:check`, `npm run lint`, and `npm run build` exit with code `0`.
2. **Tests pass:** `npm run test` passes for every affected package.
3. **Co-located tests:** Every new or modified source file has a partner test file in the same directory (`foo.ts` → `foo.test.ts`, `Foo.tsx` → `Foo.test.tsx`). Existing tests under `__tests__/` directories in `api`, `shared`, and `infra` are legacy; when you modify tests for a module, move them next to its source.
4. **AAA structure:** Tests use explicit `// Arrange`, `// Act`, and `// Assert` comments, are grouped in `describe()` blocks, and are named "should [expected behavior] when [condition]".
5. **Testing standards:**
   - **Framework:** Vitest for all packages.
   - **Frontend:** Use `render` and `screen` from `@testing-library/react` and simulate interactions with `@testing-library/user-event`. Query by `data-testid` as the default approach; use role or text queries where the JSX structure makes them more appropriate.
   - **Backend:** Mock AWS SDK clients (Bedrock, DynamoDB) with `vi.mock()` and realistic response shapes so tests are isolated and deterministic. Assert on handler outcomes (status code, response body), not internals.
   - **Infra:** Use CDK `assertions` (`Template.fromStack`) to verify resources, permissions, outputs, and tags.
6. **Coverage guideline:** Aim for at least 80% line coverage on changed code paths, prioritizing handlers, services, state-machine logic, and validation. Check with `npm run test:coverage`.
7. **Dependency integrity:** Add dependencies to the owning workspace with `-w`, use pinned versions consistent with existing `package.json` files, and keep the lockfile updated.
8. **Documentation:** Update the relevant `README.md` or file in `docs/` when you change configuration, infrastructure, or developer workflow.
9. **Versioning:** Follow semantic versioning. Version bumps are manual in `package.json`, and releases are tagged `v{version}`. Do not bump versions unless asked.
