# Configuration Guide

This guide describes how environment variables flow through the Career Compass application across local development and deployed environments.

## Table of Contents

- [Overview](#overview)
- [Local Development](#local-development)
- [Deployed Environments](#deployed-environments)
- [Package-Specific Configuration](#package-specific-configuration)
- [Security Practices](#security-practices)

## Overview

The Career Compass monorepo manages environment variables according to the following principles:

1. **Typed Configuration**: All packages use Zod schemas to validate and transform raw environment variables into typed `Config` objects
2. **Fail-Fast Validation**: Configuration is validated at module load time, ensuring issues are caught immediately
3. **No Hardcoded Secrets**: Secrets and deployment-specific values (table names, model IDs, regions) are never hardcoded
4. **Package Isolation**: Each package manages its own environment variables independently

## Local Development

### Setup

1. Copy `.env.example` to `.env.local` in each package where you need environment variables:

   ```bash
   # In packages/api/
   cp .env.example .env.local

   # In packages/web/
   cp .env.example .env.local
   ```

2. Edit `.env.local` files with your local configuration values

3. Ensure `.env.local` and `.env*.local` are in `.gitignore` (they are by default)

### Reading Environment Variables

Each package has a typed config module that validates and provides access to environment variables:

#### API Package

```typescript
import { config, getConfig } from '@career-compass/api/src/utils/config';

// Access via singleton
const tableName = config.dynamodbTableName;
const region = config.bedrockRegion;

// Or use helper function
const modelId = getConfig('bedrockModelId');
```

#### Web Package

```typescript
import { config, getConfig } from '@career-compass/web/src/utils/config';

// Access via singleton
const apiUrl = config.apiBaseUrl;

// Or use helper function
const mode = getConfig('mode');
```

## Deployed Environments

### API (Lambda)

Environment variables are injected by the CDK `ApiStack` at deployment time:

- `DYNAMODB_TABLE_NAME`: Passed from the `StorageStack`
- `BEDROCK_REGION`: Configured in CDK context
- `BEDROCK_MODEL_ID`: Configured in CDK context
- `NODE_ENV`: Set to `production`

### Web (Frontend)

The CDK `FrontendStack` handles frontend environment variables:

- Vite env vars are injected at build time using a `.env` file generated during the build process
- `VITE_API_BASE_URL`: Set to the deployed API endpoint
- `MODE`: Automatically set to `production` by Vite during build

### Infrastructure (CDK)

The CDK application itself:

- Reads AWS credentials from standard AWS credential sources (not from `.env`)
- Uses CDK context values for configuration
- Never stores secrets in code or CDK outputs
- Stores sensitive values in AWS Secrets Manager or Parameter Store if needed

## Package-Specific Configuration

### packages/api

**Type**: Node.js Lambda function  
**Location**: `src/utils/config.ts`  
**Env File**: `.env.local` (local development only)  
**Schema Validation**: Zod (fail-fast at cold start)

**Required Variables**:

- `DYNAMODB_TABLE_NAME`: DynamoDB table for storing conversations
- `BEDROCK_REGION`: AWS region with Bedrock models
- `BEDROCK_MODEL_ID`: Claude model identifier

**Optional Variables**:

- `NODE_ENV`: `development` (default) or `production`

### packages/web

**Type**: Vite React frontend  
**Location**: `src/utils/config.ts`  
**Env File**: `.env.local` (local development only)  
**Schema Validation**: Zod (fail-fast at app load)

**Required Variables**:

- `VITE_API_BASE_URL`: API backend URL (e.g., `http://localhost:3001` for local dev)

**Optional Variables**:

- `MODE`: Automatically set by Vite (`development` or `production`)

### infra

**Type**: AWS CDK application  
**Location**: Uses CDK context, not `.env` files  
**Credentials**: AWS credential chain (environment variables, credential file, IAM role)

**Configuration**:

- CDK context for environment-specific values
- AWS credentials from standard AWS SDK sources
- Secrets managed via AWS Secrets Manager or Parameter Store

## Security Practices

### Do's ✓

- ✓ Use typed config modules with Zod validation
- ✓ Store secrets in AWS Secrets Manager or Parameter Store
- ✓ Use `.env.local` for local development only
- ✓ Document required variables in `.env.example`
- ✓ Validate environment variables at module load time

### Don'ts ✗

- ✗ Do NOT commit `.env.local` or `.env*.local` files
- ✗ Do NOT hardcode table names, model IDs, or regions
- ✗ Do NOT store secrets in `.env` files or CDK code
- ✗ Do NOT commit AWS credentials or API keys
- ✗ Do NOT use environment variables for sensitive values in CDK stacks

## Troubleshooting

### "Invalid environment configuration" error

This error occurs when required environment variables are missing or invalid. Check:

1. Is `.env.local` present with the required variables?
2. Are all required variables in `.env.example` also in `.env.local`?
3. Do the values match the expected format (e.g., `VITE_API_BASE_URL` must be a valid URL)?

### Development server not connecting to API

If the web app can't reach the API:

1. Verify `VITE_API_BASE_URL` in `packages/web/.env.local` matches your API server address
2. Ensure the API server is running and listening on the specified port
3. Check for CORS issues in the API logs

### Lambda unable to access DynamoDB

If Lambda can't access DynamoDB:

1. Verify `DYNAMODB_TABLE_NAME` matches the table created by CDK
2. Check that the Lambda execution role has DynamoDB permissions
3. Ensure `BEDROCK_REGION` matches where your table is deployed
