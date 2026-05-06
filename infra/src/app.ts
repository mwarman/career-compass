import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();

// Placeholder stack - will be populated with actual resources in future milestones
const placeholderStack = new cdk.Stack(app, 'CareerCompassPlaceholder', {
  description: 'Placeholder stack for Career Compass infrastructure',
});

// Export the placeholder stack so TypeScript doesn't complain about unused variable
export { placeholderStack };
