# DevOps Guide

This guide describes the deployment, continuous integration, and operational practices for the Career Compass project. Intended for senior SREs and senior software engineers.

## Table of Contents

- [Overview](#overview)
- [CI/CD Pipeline](#cicd-pipeline)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Branching Strategy](#branching-strategy)
- [Deployment](#deployment)
- [Monitoring and Observability](#monitoring-and-observability)
- [Troubleshooting](#troubleshooting)

## Overview

Career Compass is deployed as a serverless application on AWS using infrastructure-as-code (CDK). The project uses GitHub Actions for continuous integration and enforces code quality standards via automated checks before code reaches `main`.

**Key Infrastructure Components:**

- Lambda: Serverless API backend (Node.js 24)
- DynamoDB: Session state persistence
- API Gateway: REST API routing
- CloudFront + S3: Static frontend distribution
- CloudWatch: Logs and metrics

**Quality Gates:**

- Code formatting (Prettier)
- Linting (ESLint)
- TypeScript strict mode compilation
- Automated tests (Jest)

## CI/CD Pipeline

### GitHub Actions CI Workflow

**File:** `.github/workflows/ci.yml`

The CI workflow runs on every pull request to `main` (open, synchronize, reopen). It enforces all quality standards before code can be merged.

**Workflow Steps (in order):**

1. **Checkout** — Fetch PR code
2. **Node.js Setup** — Install runtime from `.nvmrc` (currently 24.15.0)
3. **Install Dependencies** — `npm ci` (clean install, deterministic)
4. **Format Check** — `npm run format:check` (Prettier validation)
5. **Lint** — `npm run lint` (ESLint with TypeScript strict rules)
6. **Build** — `npm run build` (TypeScript compilation, all packages)
7. **Test** — `npm run test` (Jest test suites)

**Caching Strategy:**

- Node.js action caches `node_modules/` keyed on `package-lock.json`
- Cache hit on subsequent runs within the same PR saves ~2-3 minutes
- Clean install (`npm ci`) ensures package-lock.json integrity

**Fail-Fast Behavior:**

The workflow stops immediately on first failure. Errors in any step prevent proceeding to the next step. This is intentional to save CI minutes and provide fast feedback.

**Performance Targets:**

- Cold cache (no prior runs): <5 minutes
- Warm cache (subsequent runs): ~1-2 minutes

### Concurrency

The workflow uses `concurrency` groups to cancel previous runs on the same PR when new commits are pushed. This prevents queue buildup and reduces CI minutes.

## GitHub Actions Workflows

### Current Workflows

- **CI** (`.github/workflows/ci.yml`) — Runs on PR events; validates code quality and build integrity

### Recommended Future Workflows

1. **Deployment** — Deploy to staging on merge to `main`; production deployment manual or on release tags
2. **Scheduled Security** — Weekly dependency updates and vulnerability scans
3. **Performance** — Lighthouse CI for frontend bundle analysis

## Branching Strategy

**Main Branch (`main`):**

- Protected branch; all changes via pull request
- Requires CI workflow to pass before merge
- Deploys to production (manual approval recommended)
- All commits must be clean (no broken builds)

**Feature Branches:**

- Branch from `main` with descriptive names (e.g., `feat/conversation-state`, `fix/bedrock-error`)
- Push commits to trigger CI workflow
- Request review before merge
- Delete after merge (kept in history via commits)

**Release Branches (future):**

- Use semantic versioning tags (e.g., `v1.0.0`) for releases
- Consider release branches for maintenance updates

## Deployment

### Prerequisites

- AWS credentials configured (via environment or credential file)
- Node.js >=24.15.0 and npm >=11.12.1
- AWS CDK CLI: `npm install -g aws-cdk`

### Deploying Infrastructure

Infrastructure is deployed via AWS CDK stacks defined in `infra/src/app.ts`.

**Local Deployment:**

```bash
cd infra
npm run cdk:deploy
```

**Specifying Stack(s):**

```bash
# Deploy a specific stack
npm run cdk:deploy -- StorageStack ApiStack FrontendStack

# See what will change before deploying
npm run cdk:synth
```

**Environment-Specific Configuration:**

CDK context values (in `cdk.json`) control deployment behavior:

```json
{
  "context": {
    "bedrockRegion": "us-east-1",
    "bedrockModelId": "anthropic.claude-haiku-4-5-20251001-v1:0",
    "tableName": "career-compass-conversations",
    "ttlDays": 7
  }
}
```

Update `cdk.json` before deploying to different environments (dev, staging, production).

### Lambda Environment Variables

Lambda receives environment variables injected by CDK:

- `DYNAMODB_TABLE_NAME` — DynamoDB table for storing conversations
- `BEDROCK_REGION` — AWS region with Bedrock models
- `BEDROCK_MODEL_ID` — Claude model identifier (specified in CDK context)
- `NODE_ENV` — Set to `production` automatically

Validation occurs at Lambda cold start; cold start takes ~1 second due to Node.js initialization.

### Frontend Deployment

The frontend (React SPA) is built and deployed to S3/CloudFront:

1. CDK builds the React app with Vite: `npm run build` in `packages/web`
2. Artifacts are deployed to S3 bucket
3. CloudFront invalidates cache on redeploy
4. API endpoint is injected as `VITE_API_BASE_URL` during build

## Monitoring and Observability

### CloudWatch Logs

All Lambda logs go to CloudWatch in log group `/aws/lambda/{FunctionName}`.

**Example Query:**

```
fields @timestamp, @message, sessionId, phase
| filter @message like /ERROR/
| stats count() by phase
```

### CloudWatch Dashboards

CDK `ObservabilityStack` creates a dashboard showing:

- Lambda invocation counts and durations
- Error rates
- DynamoDB consumed capacity

Access via AWS Console: CloudWatch → Dashboards → career-compass

### Metrics

- `Lambda:Invocations` — API requests to backend
- `Lambda:Errors` — Failed invocations
- `Lambda:Duration` — Request latency (p50, p99)
- `DynamoDB:ConsumedWriteCapacityUnits` — Session state writes
- `DynamoDB:ConsumedReadCapacityUnits` — Session state reads

### Alarms (Recommended Future)

Set up SNS alarms for:

- Lambda error rate >1% over 5 minutes
- Lambda duration p99 >3 seconds
- DynamoDB throttling events

## Troubleshooting

### CI Workflow Failures

#### "npm ci" fails

**Cause:** `package-lock.json` out of sync with `package.json`

**Solution:**

```bash
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push
```

#### "format:check" fails

**Cause:** Code not formatted with Prettier

**Solution:**

```bash
npm run format
git add .
git commit -m "style: format code"
git push
```

#### "lint" fails

**Cause:** ESLint violations (unused variables, import cycles, type errors)

**Solution:**

```bash
npm run lint:fix  # Auto-fixes many issues
# Manually fix remaining issues (e.g., unused parameters → prefix with _)
git add .
git commit -m "chore: fix linting violations"
git push
```

#### "build" fails

**Cause:** TypeScript compilation errors (strict mode violations)

**Solution:**

1. Run `npm run build` locally to see full error
2. Fix issues (add type annotations, explicit error handling, etc.)
3. Verify with `npm run build` locally before pushing

#### "test" fails

**Cause:** Test assertions failing or new tests added

**Solution:**

1. Run `npm run test` locally to see failures
2. Fix test code or implementation
3. Re-run tests to verify

### Cold Start Performance

**Symptom:** First request to Lambda takes >5 seconds

**Cause:** Node.js runtime initialization and dependencies loading

**Mitigation:**

- Lambda is allocated 256 MB memory (baseline); increase if needed
- Provisioned concurrency can be enabled in production
- CloudFront caches responses; client sees cache hits

### DynamoDB Throttling

**Symptom:** Lambda logs show "ProvisionedThroughputExceededException"

**Cause:** Request rate exceeds provisioned capacity

**Solution:**

```bash
# Increase provisioned capacity in CDK context
# Then redeploy:
npm run cdk:deploy
```

### Cache Not Hitting in CI

**Symptom:** Workflow takes 5+ minutes consistently

**Cause:** `package-lock.json` changed between runs

**Verification:**

1. Check GitHub Actions logs for "Cache hit" vs "Cache miss"
2. If cache missing, ensure `package-lock.json` is committed and unchanged
3. Run `npm ci` locally to verify lock file consistency

### API Gateway CORS Issues

**Symptom:** Frontend GET requests fail with CORS error

**Cause:** API endpoint not configured with CORS headers

**Solution:**

CDK `ApiStack` should configure CORS in API Gateway. Check:

```typescript
// infra/src/stacks/api-stack.ts
const api = new apigateway.RestApi(this, 'Api', {
  // ... CORS configuration should be here
});
```

If missing, add CORS configuration and redeploy.

## Security Considerations

- **Secrets:** Never commit AWS credentials or API keys. Use AWS Secrets Manager or environment variables injected by CDK.
- **Network:** API Gateway and Lambda are private to AWS. Only CloudFront is public.
- **DynamoDB:** Encryption at rest enabled by default; no sensitive data (e.g., passwords) stored.
- **Dependencies:** Review `npm audit` output regularly; update vulnerable packages.

## Related Documentation

- [Configuration Guide](./CONFIGURATION_GUIDE.md) — Environment variables and application configuration
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) — Project milestones and feature roadmap
- [Project Overview](./PROJECT_OVERVIEW.md) — Architecture and tech stack
