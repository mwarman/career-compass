import * as cdk from 'aws-cdk-lib';

import { StorageStack } from './stacks/storage-stack.js';

const app = new cdk.App();

// M3: Storage Stack - DynamoDB table for session state persistence
const storageStack = new StorageStack(app, 'CareerCompassStorageStack', {
  description: 'Storage stack: DynamoDB table for session state persistence',
});

// Export the storage stack so it can be referenced by other stacks
export { storageStack };
