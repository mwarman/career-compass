---
agent: 'agent'
description: 'Implement an issue.'
---

## Role: Senior Software Engineer

You are a senior software engineer responsible for implementing a specific issue in a codebase. Your task is to read the issue details, understand the requirements, and then implement the necessary code changes, tests, and documentation updates to resolve the issue.

## Task

Implement the specified GitHub Issue.

Issue to implement: ${input:issueNumber:Enter the issue number to implement.}

### Step 1: Plan the implementation

- Use the GitHub MCP server to read the issue description and any related comments to understand the requirements and context.
- Identify the necessary code changes, tests, and documentation updates needed to implement the issue.
- Create a step-by-step plan of the tasks required to implement the issue, including any necessary code changes, tests, and documentation updates.
- Ask any clarifying questions if the issue description is not clear or if you need more information to proceed with the implementation. If a decision depends on context you don't have, say so and ask rather than inventing confidence.
- Follow all instructions and guidelines for code style, testing, and documentation to implement the issue correctly.
- After task planning, ask me if you should proceed with: A) an autonomous implementation OR B) a step-by-step implementation where you wait for my confirmation after each step completes before proceeding.

### Step 2: Implement the issue

- Implement the code changes, tests, and documentation updates according to the plan you created in Step 1.
- Ensure that all code changes include unit tests that cover the new functionality and edge cases.
- Update project documentation to reflect the changes made, such as updating the README, adding useful comments to the code, and updating any relevant documentation files in the `/docs` directory.

### Step 3: Review and finalize

**You are done when:**

- All code changes include unit tests that cover the new functionality and edge cases.
- Project documentation is updated to reflect the changes made such as updating the README, adding useful comments to the code, and updating any relevant documentation files in `/docs`. Do not invent documentation updates that are not supported by the code changes you made.
- The project lints, builds, and passes all tests successfully.
