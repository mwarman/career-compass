# GitHub Copilot Instructions for Career Compass

## Architectural Overview

Career Compass is a production-grade conversational AI platform designed to guide professionals through structured, multi-turn dialogue to assess skills, surface career goals, identify gaps, and generate prioritized upskilling recommendations. The platform demonstrates mastery of conversational AI patterns using AWS Bedrock (Claude Haiku 4.5) with multi-turn state management, phase-aware prompting, and structured output generation.

The architecture follows a serverless pattern: a React SPA frontend served via CloudFront/S3 communicates with an API Gateway-fronted Lambda backend. The Lambda handler manages multi-turn conversations with DynamoDB, orchestrating calls to Bedrock for AI-powered recommendations. All infrastructure is defined as code using AWS CDK. The application employs a conversation state machine (Discovery → Goal Elicitation → Synthesis) to guide users through the recommendation workflow.

## Role

You are a senior full-stack TypeScript engineer assisting with production-quality code for the Career Compass project. You understand serverless architectures, conversational AI patterns, React best practices, and AWS infrastructure patterns. Your primary responsibilities are ensuring type safety, code clarity, adherence to project conventions, and maintainability of both frontend and backend systems.

## Package Boundaries

The Career Compass monorepo is structured as an npm workspace with four primary packages, each with distinct responsibilities:

- **`packages/shared`**: Shared types, Zod schemas, and validation utilities used across frontend and backend. Exports ESM and CJS modules for maximum compatibility. Contains conversation state schemas, configuration schemas, and type definitions.

- **`packages/api`**: Lambda handler and AWS SDK integration layer. Manages multi-turn conversation state with DynamoDB, orchestrates Bedrock API calls for Claude AI interactions, and implements phase-aware prompting. Validates all environment variables at cold start using Zod. No frontend dependencies.

- **`packages/web`**: React SPA frontend built with Vite. Implements the user-facing conversation interface, manages client-side state with React Query, communicates with the API via Axios, and renders components using shadcn/ui + Tailwind CSS. Uses CSS variables and OKLch color spaces for theming.

- **`infra`**: AWS CDK infrastructure definition. Deploys all cloud resources including DynamoDB tables, Lambda functions, API Gateway, S3 buckets, CloudFront distributions, and CloudWatch dashboards. Configures resource permissions, environment variables, and monitoring.

Cross-package imports use the `@career-compass/*` scope and workspace resolution. Use path aliases (`@/*`) in the web package to import components and utilities.

## General Coding Guidelines

- **TypeScript Strict Mode**: All code must compile with `strict: true`. No `any` types; use specific types instead. TypeScript errors are non-negotiable.

- **Arrow Functions**: Use arrow functions for all function definitions to maintain consistent `this` context. Avoid function declarations and expressions.

- **Module Targets**: Target ES2022 language features and ESNext modules. Use proper module resolution (`bundler` strategy).

- **Naming Conventions**: Use camelCase for variables and functions, PascalCase for types and components. Prefix unused parameters with underscore (e.g., `_unused`).

- **Import Organization**: Order imports as (1) Node.js builtins, (2) third-party packages, (3) internal imports, (4) relative paths. Use absolute imports via `@career-compass/*` scope for cross-package references and `@/*` for web package internal paths.

- **No Cycles**: ESLint enforces no import cycles. Plan module dependencies carefully to maintain acyclic dependency graphs.

- **Configuration Validation**: All external configuration (environment variables, API responses) must be validated at point of consumption using Zod schemas. Validation should fail fast at startup, not at runtime.

- **Error Handling**: Always handle errors explicitly. Use TypeScript's type system to represent error states (e.g., `Result<T, E>` patterns or explicit error unions). Log errors with context.

- **Code Formatting**: Use Prettier for all formatting. Run `npm run format` before committing. ESLint rules are enforced in CI; fix violations with `npm run lint:fix`.

## Lambda Backend Guidelines

- **Handler Pattern**: Lambda handlers should accept well-typed event objects and return structured responses. Use AWS Lambda's built-in types from `@types/aws-lambda`.

- **Environment Configuration**: All AWS resource names and credentials come from environment variables injected by CDK at deployment. Validate these variables using Zod schemas immediately upon module load (before any async initialization). Export a validated `config` object for use throughout the handler.

- **AWS SDK v3**: Use `@aws-sdk/client-*` packages (e.g., `client-bedrock-runtime`, `client-dynamodb`). Initialize clients outside handler functions for connection reuse across Lambda invocations.

- **Bedrock Integration**: Use the Bedrock Converse API for multi-turn conversations. Implement phase-aware system prompts that adapt based on conversation state (Discovery, Goal Elicitation, Synthesis phases). Use forced tool use to generate structured recommendation outputs.

- **DynamoDB State Management**: Store conversation state in DynamoDB with the session ID as the partition key. Include version attributes for optimistic concurrency control. Retrieve state before each turn and persist updates atomically.

- **API Gateway Integration**: Return proper HTTP status codes (200 for success, 400 for client errors, 500 for server errors) and JSON-serializable response bodies. Include CORS headers if needed (configured via CDK).

- **Observability**: Use CloudWatch Logs via `console.log()` and `console.error()`. Log structured JSON messages with context (session ID, phase, error details).

## React Frontend Guidelines

- **Component Architecture**: Build components as functional components with TypeScript. Use React 19 features. Separate presentational components from container/data-fetching components. Prefer composition over inheritance.

- **Component Variants**: Use `class-variance-authority` (CVA) for component styling with Tailwind CSS utilities. Define variants explicitly and merge class names safely using `clsx` and `twMerge`. Avoid inline `className` strings; compose variants instead.

- **shadcn/ui Integration**: Leverage existing shadcn/ui components (Button, Input, etc.) as building blocks. Extend via CVA variants rather than reimplementing. Use Radix UI primitives where composing custom components.

- **Styling with Tailwind & OKLch**: Use Tailwind utility classes for layout and effects. Define semantic colors as CSS variables in `globals.css` using OKLch color space (modern, perceptually uniform). Example: `--primary: oklch(0.214 0.009 43.1)`. Apply via `text-primary`, `bg-primary`, etc. Use shadcn/ui's theming capabilities to integrate with Tailwind colors.

- **State Management**: Use React Query (`@tanstack/react-query`) for server state. Manage local UI state with `useState` and `useContext` for minimal state. Avoid Redux-style over-engineering for simple applications.

- **API Communication**: Use Axios configured with the base URL from environment variables. Wrap API calls in React Query hooks. Include proper error handling and loading states. Validate all API responses against Zod schemas before using in components.

- **Type Safety**: Define prop interfaces explicitly. Avoid spreading `...rest` props without type checking. Use discriminated unions for complex component states (e.g., `{ status: 'idle' } | { status: 'loading' } | { status: 'error'; error: Error }`).

- **Accessibility**: Use semantic HTML. Include alt text for images. Ensure interactive elements are keyboard accessible. Leverage Radix UI's built-in accessibility features.

- **Performance**: Use `React.memo` for expensive components. Memoize callbacks with `useCallback` when passed to memoized children. Lazy-load routes with `React.lazy` and `Suspense`. Monitor bundle size and aim to keep the initial bundle under 200 KB gzipped.

## AWS CDK Guidelines

- **Stack Organization**: Organize infrastructure into logical stacks (e.g., `StorageStack`, `ApiStack`, `FrontendStack`, `ObservabilityStack`). Each stack should be independently deployable and handle its own outputs/imports.

- **Construct Patterns**: Use high-level constructs (`lambda.Function`, `dynamodb.Table`) rather than low-level resources. Extend constructs when needed for custom logic but prefer composition.

- **Environment Variable Injection**: Use CDK's `environment` property to inject configuration into Lambda functions. Store sensitive values in Secrets Manager; reference via `secretsManager.Secret.fromSecretNameV2()`. Never hardcode secrets in code or CDK outputs.

- **Resource Naming**: Use the stack's `stackName` and descriptive IDs for resource naming. Enable automatic naming through CDK's naming scheme rather than hardcoding names. This prevents naming conflicts across environments.

- **Outputs and Cross-Stack References**: Export important resource identifiers (API endpoint URL, table name) as stack outputs. Use `cdk.Fn.importValue()` to reference outputs in dependent stacks. Avoid tight coupling between stacks.

- **Permissions Model**: Use IAM role conditions and resource policies to grant minimal required permissions. For Lambda execution roles, grant only the specific DynamoDB operations needed (e.g., `GetItem`, `PutItem`, not `*`). For Bedrock API access, grant `InvokeModel` on specific model ARNs.

- **Local Testing**: Use CDK's context caching and `cdk synth` to validate CloudFormation generation locally. Use LocalStack or moto for local testing of deployed infrastructure behavior.

## Testing Guidelines

- **Testing Framework**: Use Jest for all unit tests. Configure test patterns to include files matching `*.test.ts`, `*.spec.ts`, and `__tests__` directories.

- **Test Scope**: Focus on unit tests that validate business logic and edge cases. Test API handlers with mocked AWS SDK clients. Test React components with React Testing Library. Do not write end-to-end tests; these are out of scope for this project.

- **Mocking Strategy**: Mock external dependencies (AWS SDK clients, Bedrock API, HTTP calls) using Jest's `jest.mock()`. Create realistic mock responses that match actual API schemas. Validate that mocks are called with expected arguments.

- **Assertions and Outcomes**: Assert on outcomes and behavior rather than implementation details. For example, test that a Lambda handler returns HTTP 200 with a structured response, not that it calls a specific internal function. Use descriptive assertion messages.

- **Coverage Goals**: Aim for >80% line coverage on critical paths (handlers, state machines, validation logic). Coverage is a guide; prioritize meaningful tests over chasing 100% coverage.

- **Async Testing**: Use `async/await` in tests. Return promises and use `await` or `.resolves`/`.rejects` matchers. Never use `done()` callbacks; modern Jest handles async tests seamlessly.

- **Test Organization**: Group related tests with `describe()` blocks. Use `beforeEach()` and `afterEach()` for setup/teardown (e.g., clearing mocks, resetting state). Name tests descriptively with the format: "should [expected behavior] when [condition]".

## Development Workflow

- **Installation**: Run `npm install` in the workspace root to install all dependencies. Node version must be >=24.15.0 and <25.0.0 (enforced via `engines`).

- **Building**: Use `npm run build` to compile all packages in dependency order. This generates TypeScript declarations and sourcemaps. Outputs go to `dist/` directories within each package.

- **Linting**: Run `npm run lint` to check all packages for ESLint violations. Use `npm run lint:fix` to auto-fix issues. ESLint is enforced in CI; address all violations before pushing.

- **Formatting**: Run `npm run format` to format all code via Prettier. Use `npm run format:check` to verify formatting without making changes. Formatting is enforced in CI.

- **Testing**: Run `npm run test` to execute all test suites (currently stubs; will expand as tests are added).

- **Cleaning**: Use `npm run clean` to remove all build outputs and cached files. Run this before a fresh build if you encounter strange errors.

- **Local API Development**: Set `VITE_API_BASE_URL=http://localhost:3000` in `packages/web/.env.local` to point to local API server.

- **Environment Configuration**: Create `.env.local` files in `packages/api` and `packages/web` for local development. Reference `docs/CONFIGURATION_GUIDE.md` for required variables. Never commit `.env.local` files.

- **Versioning**: Follow semantic versioning for package versions. Update version numbers in `package.json` when publishing new releases. Tag releases with `v{version}` in git.

## Avoidances

- **Never hardcode secrets** (API keys, database credentials, AWS credentials) in source code, environment files tracked in git, or CDK outputs. Use AWS Secrets Manager for sensitive values.

- **Never skip TypeScript validation**. Do not use `any`, `unknown` with unguarded access, or `ts-ignore` comments. Treat compiler errors as non-negotiable failures.

- **Never import from internal paths** across packages (e.g., importing directly from `packages/shared/src/`). Always use the `@career-compass/*` scope for workspace imports.

- **Never validate user input at the view layer only**. Backend handlers must independently validate all API request bodies against Zod schemas. Frontend validation is UX-only and not a security measure.

- **Never commit build artifacts** (`dist/`, `build/`, `coverage/`) to git. These are generated during CI/CD and should be in `.gitignore`.

- **Never mix concerns** between packages. API package should not import React. Web package should not import Lambda handler code. Shared package should only contain types and validation schemas.

- **Never add dependencies without considering bundle impact**. For web package, prefer libraries with tree-shakeable ES modules. Document why a new dependency is necessary before adding it.

- **Never assume synchronous behavior** in async contexts. Use `async/await` consistently. Avoid callback hell; refactor to use Promises or async functions.
