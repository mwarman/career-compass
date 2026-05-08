import { describe, it, expect, beforeEach } from '@jest/globals';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { StorageStack } from '../storage-stack';

/**
 * Tests for the StorageStack CDK construct.
 * Validates that the stack creates a correctly configured DynamoDB table.
 */
describe('StorageStack', () => {
  let app: cdk.App;
  let stack: StorageStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new StorageStack(app, 'TestStorageStack');
  });

  describe('stack creation', () => {
    it('should create a valid StorageStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(StorageStack);
    });

    it('should have a sessionTable property', () => {
      expect(stack.sessionTable).toBeDefined();
      expect(stack.sessionTable).toBeInstanceOf(dynamodb.Table);
    });
  });

  describe('DynamoDB table configuration', () => {
    it('should use sessionId as partition key', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH', // Partition key
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'sessionId',
            AttributeType: 'S', // String type
          },
        ],
      });
    });

    it('should have no sort key', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: cdk.assertions.Match.arrayWith([
          cdk.assertions.Match.objectLike({
            KeyType: 'HASH',
          }),
        ]),
      });

      // Verify that there is no RANGE key (sort key)
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: cdk.assertions.Match.not(
          cdk.assertions.Match.arrayWith([
            cdk.assertions.Match.objectLike({
              KeyType: 'RANGE',
            }),
          ]),
        ),
      });
    });

    it('should use on-demand (PAY_PER_REQUEST) billing mode', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    it('should have TTL enabled on ttl attribute', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    it('should have RemovalPolicy.DESTROY set for portfolio ephemeral design', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });
    });

    it('should use AWS managed encryption', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  describe('stack outputs', () => {
    it('should export SessionTableName output', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasOutput('SessionTableNameOutput', {
        Export: {
          Name: StorageStack.SESSION_TABLE_NAME_EXPORT,
        },
      });
    });

    it('should export the correct table name', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasOutput('SessionTableNameOutput', {
        Value: {
          Ref: cdk.assertions.Match.stringLikeRegexp('SessionTable'),
        },
      });
    });
  });

  describe('cross-stack references', () => {
    it('should provide a consumable export name constant', () => {
      expect(StorageStack.SESSION_TABLE_NAME_EXPORT).toBe('CareerCompass-SessionTableName');
    });

    it('should allow importing the table name by export', () => {
      // Verify that the export name is consistent and can be used by other stacks
      const exportName = StorageStack.SESSION_TABLE_NAME_EXPORT;
      expect(exportName).toMatch(/^CareerCompass/);
      expect(exportName).toMatch(/SessionTableName$/);
    });
  });

  describe('stack synthesis', () => {
    it('should synthesize without errors', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    it('should produce valid CloudFormation template', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      const resources = template.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });
  });

  describe('tags', () => {
    it('should apply Component tag', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: cdk.assertions.Match.arrayWith([
          cdk.assertions.Match.objectLike({
            Key: 'Component',
            Value: 'Storage',
          }),
        ]),
      });
    });

    it('should apply Purpose tag', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: cdk.assertions.Match.arrayWith([
          cdk.assertions.Match.objectLike({
            Key: 'Purpose',
            Value: 'SessionPersistence',
          }),
        ]),
      });
    });
  });
});
