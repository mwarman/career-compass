# AGENTS.md

Career Compass is a conversational AI app that guides professionals through a multi-turn dialogue (Discovery, Goal Elicitation, Synthesis) and produces a prioritized upskilling recommendation. Product background: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md).

## Stack and packages

TypeScript npm-workspaces monorepo. Node and npm versions are pinned in `.nvmrc` and root `package.json` `engines`. Tests use Vitest in every package.

| Package           | Name                     | Responsibility                                                                          |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `packages/shared` | `@career-compass/shared` | Zod schemas and inferred types used by `api` and `web`; Bedrock tool-schema helpers     |
| `packages/api`    | `@career-compass/api`    | Lambda handler, conversation and Bedrock services, DynamoDB session repository, prompts |
| `packages/web`    | `@career-compass/web`    | React 19 SPA (Vite, Tailwind CSS 4, shadcn/ui, TanStack Query, Axios)                   |
| `packages/infra`  | `@career-compass/infra`  | AWS CDK app: Storage, Api, Frontend, Observability stacks                               |

Dependencies: `api` -> `shared`, `web` -> `shared`. `infra` uses built `api` and `web` artifacts and never imports their runtime code.

## Commands

Run from the repo root unless noted.

```bash
npm ci                                           # install (npm install when changing deps)
npm install <pkg> -w @career-compass/<workspace> # add a dependency to one workspace
npm run build                                    # build all packages (shared first matters, see Boundaries)
npm run test                                     # all tests
npm run test -w @career-compass/<workspace>      # one package's tests
npm run test:coverage                            # tests with coverage
npm run lint                                     # ESLint (lint:fix to auto-fix)
npm run format                                   # Prettier write (format:check to verify)
npm run clean                                    # remove build outputs
npm run dev -w @career-compass/web               # web dev server
npm run cdk:synth -w @career-compass/infra       # synth CDK (builds infra first)
npx shadcn@latest add <component>                # run in packages/web
```

Husky pre-commit runs `format:check` and `lint`. CI (`.github/workflows/ci.yml`) runs format check, lint, build, `test:coverage`, and CDK synth. Environment variables: see [docs/CONFIGURATION_GUIDE.md](docs/CONFIGURATION_GUIDE.md) and each package's `.env.example`.

## Boundaries

**Always**

- Rebuild `shared` (`npm run build`) after changing it; `api` and `web` resolve it from `dist/`.
- Import across packages only via `@career-compass/*`.
- Export new shared schemas or types from `packages/shared/src/index.ts`.
- Update `shared`, `api`, `web`, and their tests together when changing the phase model, session schema, or recommendation schema.

**Ask first**

- Adding a dependency (consider web bundle size and Lambda cold start).
- Changing IAM permissions, stack boundaries, or the Bedrock model (`BEDROCK_MODEL_ID` in `packages/infra/src/stacks/api-stack.ts`).
- Bumping package versions (manual; releases tagged `v{version}`).

**Never**

- Hand-edit `packages/web/src/components/shadcn/` (generated; excluded from ESLint). Wrap components instead.
- Create barrel `index.ts` files, except `packages/shared/src/index.ts`.
- Use `any`, `@ts-ignore`, or wildcard IAM permissions.
- Commit `.env.local`, secrets, or `dist/`, `coverage/`, `cdk.out/`.
- Bypass hooks (`--no-verify`).
- Add end-to-end tests (out of scope).
- Import React/web code in `api`, Lambda handler code in `web`, or `process.env`/`window`/`document` in `shared`.

## Conventions

Prettier and ESLint enforce formatting and basic lint rules; run them instead of restating them. Beyond that:

- Arrow functions for all function definitions.
- Named exports only; no default exports.
- `interface` for object shapes, `type` for unions and utilities. In `shared`, derive types with `z.infer`.
- Prefer modules and plain functions; classes only where established (services, repositories, typed errors).
- Prefix intentionally unused parameters with `_`.
- Files: kebab-case for non-components (`conversation-service.ts`), PascalCase for components (`ChatPage.tsx`), camelCase for hooks (`useSubmitTurn.ts`).
- Import order: Node builtins, third-party, `@career-compass/*`, `@/*` (web alias for `src/*`), relative.
- In `infra`, relative imports use `.js` extensions.
- Validate all external input with Zod at the point of use (env vars, request bodies, API responses, Bedrock tool output). Env validation is in `config.ts` in `api/src/utils` and `web/src/utils`, validated at module load. Handlers validate requests independently of the frontend.

### api

- Handlers return responses through `utils/apigateway-response.ts` and map typed errors (`errors/`, `repositories/repository-error.ts`) to HTTP status.
- Create AWS SDK v3 clients outside the handler.
- Bedrock uses the Converse API. Phase prompts live in `prompts/`; phase transitions come from the `<readiness>` block parsed by `utils/readiness.ts`. The synthesis turn uses forced tool use with a schema derived from `RecommendationSchema`.
- Sessions in DynamoDB are keyed by session ID and carry a `ttl` attribute.
- Log structured JSON through `utils/logger.ts`.

### web

- Server state through TanStack Query hooks in `hooks/`; HTTP through `utils/api-client.ts`; parse responses with shared schemas.
- Local state with `useState` and `context/`; no Redux-style libraries.
- Merge classes with the `cn` helper; theme colors are OKLch variables in `src/globals.css`.

### infra

- Every stack receives the `App`, `Env`, `OU`, `Owner` tags defined in `src/app.ts`; wire new stacks into that flow.
- Least-privilege IAM: specific DynamoDB actions and `InvokeModel` on specific model ARNs.
- Export key identifiers (API URL, table name) as `CfnOutput`s.

## Testing

- Co-locate tests: `foo.ts` -> `foo.test.ts`, `Foo.tsx` -> `Foo.test.tsx`.
- Use `// Arrange`, `// Act`, `// Assert` comments, `describe()` groups, and names like "should [behavior] when [condition]".
- Web: `@testing-library/react` and `user-event`; shared fixtures in `src/__fixtures__/`.
- API: mock AWS SDK clients with `vi.mock()` using realistic response shapes; assert on status code and body.
- Infra: CDK `Template.fromStack` assertions for resources, permissions, outputs, and tags.

## Definition of done

1. `npm run format:check`, `npm run lint`, and `npm run build` exit 0.
2. `npm run test` passes for every affected package; new or changed source files have co-located tests.
3. `npm run cdk:synth -w @career-compass/infra` succeeds if infra, api, or web build output changed.
4. Docs updated (`README.md` or `docs/`) when configuration, infrastructure, or developer workflow changes.
