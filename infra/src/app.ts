import * as cdk from 'aws-cdk-lib';

import { ApiStack } from './stacks/api-stack.js';
import { StorageStack } from './stacks/storage-stack.js';

// Define common tags for all resources in the application
const tags = {
  App: 'CareerCompass',
  Env: 'dev',
  OU: 'leanstacks',
  Owner: 'Matthew Warman',
};

// Main entry point for the CDK application.
// Defines the stacks and their dependencies for the Career Compass infrastructure.
const app = new cdk.App();

// M3: Storage Stack - DynamoDB table for session state persistence
const storageStack = new StorageStack(app, 'CareerCompassStorageStack', {
  stackName: 'CareerCompassStorageStack',
  description: 'Storage resources for Career Compass',
  tags,
});

// M6: API Stack - API Gateway and Lambda handler for conversation endpoint
const apiStack = new ApiStack(app, 'CareerCompassApiStack', {
  stackName: 'CareerCompassApiStack',
  description: 'Network and compute resources for Career Compass API',
  sessionTable: storageStack.sessionTable,
  tags,
});

// Add explicit dependency to ensure StorageStack is deployed first
apiStack.addDependency(storageStack);

// Export the stacks so they can be referenced externally if needed
export { storageStack, apiStack };
