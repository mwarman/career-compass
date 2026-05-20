# career-compass

> A production-grade conversational AI platform that guides professionals through structured multi-turn dialogue to assess skills, surface career goals, and generate prioritized upskilling recommendations.

---

## Purpose

**career-compass** demonstrates mastery of conversational AI integration patterns in a serverless AWS environment. It showcases:

- **Multi-turn state management** via full message history accumulation across conversation phases
- **Phase-aware prompt architecture** with adaptive context switching (Discovery → Goal Elicitation → Synthesis)
- **Hybrid conversation control** combining system-guided questioning with adaptive handling of user-volunteered information
- **Structured output generation** via AWS Bedrock forced tool use and Zod schema validation
- **Cost-optimized inference** using Claude Haiku 4.5 on serverless compute

The application is built as a thematic companion to [resume-lens](https://github.com/mwarman/resume-lens), forming a coherent portfolio suite of AWS Bedrock–powered career tooling.

---

## Architecture Overview

### High-Level Flow

```mermaid
graph TD
    User["👤 User<br/>React SPA"]
    CF["🌐 CloudFront<br/>Distribution"]
    S3["📦 S3<br/>Static Assets"]
    APIGW["🔌 API Gateway<br/>REST API"]
    Lambda["⚡ Lambda<br/>Conversation Handler"]
    DDB["🗄️ DynamoDB<br/>Session State"]
    Bedrock["🤖 AWS Bedrock<br/>Claude Haiku 4.5<br/>Converse API"]
    CW["📊 CloudWatch<br/>Dashboard + Alarms"]

    User -->|HTTPS| CF
    CF -->|Static Assets| S3
    User -->|POST /conversation/turn| APIGW
    APIGW --> Lambda
    Lambda -->|GetItem / PutItem| DDB
    Lambda -->|ConverseAPI + Tool Use| Bedrock
    Lambda -.->|Metrics + Logs| CW
    Bedrock -.->|Metrics| CW
```

### Conversation State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Discovery: User submits seed
    Discovery --> Discovery: Gather skill context
    Discovery --> GoalElicitation: System detects<br/>sufficient context
    GoalElicitation --> GoalElicitation: Refine goals
    GoalElicitation --> Synthesis: User triggers OR<br/>max turns reached
    Synthesis --> [*]: Recommendation artifact
    Discovery --> Synthesis: User triggers early
    GoalElicitation --> Synthesis: User triggers early
    Discovery --> Idle: User resets
    GoalElicitation --> Idle: User resets
    Synthesis --> Idle: User resets
```

---

## AI Integration Design

### Bedrock Converse API + Tool Use

**Conversational Turns:**

- Full message history passed to Bedrock Converse API on each turn
- Model-agnostic abstraction enabling flexible model swaps
- Natural language responses flow directly to frontend

**Synthesis Turn:**

- Backend forces tool use via `toolChoice: { tool: { name: "generate_recommendation" } }`
- Model returns structured `toolUse` block containing validated recommendation JSON
- Zod schema validates tool input on backend before payload reaches frontend
- Eliminates markdown wrapping and brittle prompt-only JSON enforcement

### Phase-Aware System Prompts

The backend maintains three distinct system prompts, swapped based on conversation phase:

| Phase                | Purpose             | Focus                                                |
| -------------------- | ------------------- | ---------------------------------------------------- |
| **Discovery**        | Establish baseline  | Probe current skills, experience, and domain context |
| **Goal Elicitation** | Surface aspirations | Clarify career direction, timeline, and constraints  |
| **Synthesis**        | Generate insight    | Force tool use to produce structured recommendation  |

Phase transitions are driven by:

- System self-evaluation after each turn
- User-triggered "I'm ready" signal
- Maximum turn enforcement (10 turns)

### Context Management (V1)

- Full message history accumulated per session
- Cost-controlled via Haiku model and 10-turn ceiling
- Progressive summarization documented as V2 enhancement

---

## Tech Stack

| Layer              | Technology                                                                  | Rationale                                                                   |
| ------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Frontend**       | Vite, React, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, Axios, Zod | Modern, minimal-but-complete SPA stack; Zod for shared schema validation    |
| **Backend**        | AWS Lambda (Node.js / TypeScript), API Gateway (REST)                       | Serverless, pay-per-invocation, cost-optimized                              |
| **AI / Inference** | AWS Bedrock (Converse API + Tool Use), Claude Haiku 4.5                     | Model-agnostic abstraction; native multi-turn support; cost-optimized model |
| **Session State**  | DynamoDB (on-demand, TTL expiry)                                            | Serverless, low-cost, fits session lifetime pattern                         |
| **Infrastructure** | AWS CDK (TypeScript)                                                        | IaC; four-stack decomposition (Storage, API, Frontend, Observability)       |
| **CI/CD**          | GitHub Actions                                                              | CI, Deploy, and Teardown workflows                                          |
| **Observability**  | CloudWatch Dashboard + Alarms                                               | Service utilization and cost-bearing metrics                                |
| **Monorepo**       | npm workspaces                                                              | Shared Zod schemas across frontend and backend                              |

---

## Monorepo Structure

```
career-compass/
├── packages/
│   ├── api/              # Backend Lambda functions & API logic
│   ├── shared/           # Shared TypeScript types & Zod schemas
│   └── web/              # Frontend React SPA (Vite)
├── infra/                # AWS CDK IaC (four stacks)
├── docs/                 # Project documentation
├── package.json          # Root workspace config
└── tsconfig.base.json    # Root TypeScript config
```

Each package maintains its own `package.json`, `tsconfig.json`, and source tree.

---

## Local Development

### Prerequisites

- Node.js ≥ 24.15.0, npm ≥ 11.12.1
- AWS credentials configured locally
- Bedrock API access enabled in your AWS account

### Setup

```bash
# Install dependencies (all workspaces)
npm install

# Build all packages
npm run build --workspaces

# Run tests
npm test --workspaces
```

### Development Workflow

**Frontend (Vite dev server with HMR):**

```bash
cd packages/web
npm run dev
```

---

## Deployment

### CDK Deployment

The infrastructure is organized into four stacks:

| Stack                | Contents                                      | Deploy Order |
| -------------------- | --------------------------------------------- | ------------ |
| `StorageStack`       | DynamoDB table, TTL configuration             | 1            |
| `ApiStack`           | Lambda, API Gateway, IAM, Bedrock permissions | 2            |
| `FrontendStack`      | S3, CloudFront distribution                   | 3            |
| `ObservabilityStack` | CloudWatch dashboard, alarms, log groups      | 4            |

**Deploy all stacks:**

```bash
cd infra
npm run deploy
```

### CI/CD

GitHub Actions workflows:

- **CI**: Linting, type checking, tests on every push to main
- **Deploy**: Infrastructure + frontend deployment on merge to main
- **Teardown**: Destroy all AWS resources (manual trigger)

---

## Cost Profile

**Serverless pay-per-invocation model:**

- **API Requests:** AWS Lambda (generous free tier); API Gateway per-million-request pricing
- **AI Inference:** Bedrock pay-per-input/output tokens; Haiku model cost-optimized
- **Session State:** DynamoDB on-demand pricing; TTL auto-cleanup reduces storage
- **Frontend Hosting:** CloudFront + S3; minimal egress costs
- **Observability:** CloudWatch Logs + Dashboard (within free tier for typical usage)

**Cost Control:**

- 10-turn conversation ceiling limits token spend
- Haiku model selected for cost efficiency without sacrificing quality
- Billing alerts configured from day one

**TBD - Cost projections and budget breakdown coming soon.**

---

## Testing

### Test Coverage

The project maintains comprehensive unit test coverage across all packages.

**Run all tests:**

```bash
npm run test --workspaces
```

**Run tests with coverage:**

```bash
npm run test:coverage -w packages/web
```

### Frontend Component Testing

The React components are thoroughly tested using Vitest and React Testing Library:

All component tests follow the AAA pattern (Arrange, Act, Assert) and include:

- Accessibility attribute validation
- User interaction testing
- Error condition handling
- Edge case coverage

---

## Documentation

- [**PROJECT_OVERVIEW.md**](docs/PROJECT_OVERVIEW.md) — Detailed project goals, design decisions, risks, and V2 enhancements
- [**IMPLEMENTATION_PLAN.md**](docs/IMPLEMENTATION_PLAN.md) — Development roadmap and milestones
- [**CONFIGURATION_GUIDE.md**](docs/CONFIGURATION_GUIDE.md) — Environment setup and configuration
- [**API Reference**](docs/README.md) — REST API endpoint documentation

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Author

**Matt Warman** — Portfolio project  
GitHub: [@mwarman](https://github.com/mwarman)  
Related: [resume-lens](https://github.com/mwarman/resume-lens)
