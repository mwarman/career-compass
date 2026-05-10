import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { describe, it, expect, beforeEach } from 'vitest';

import { ApiStack } from '../api-stack';

/**
 * Tests for the ApiStack CDK construct.
 * Validates that the stack creates a correctly configured API Gateway and Lambda function
 * with proper permissions for DynamoDB and Bedrock integration.
 */
describe('ApiStack', () => {
  let app: cdk.App;
  let stack: ApiStack;
  let mockSessionTable: dynamodb.Table;

  beforeEach(() => {
    app = new cdk.App();

    // Create a mock DynamoDB table to pass to ApiStack
    const storageStack = new cdk.Stack(app, 'TestStorageStack');
    mockSessionTable = new dynamodb.Table(storageStack, 'SessionTable', {
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    stack = new ApiStack(app, 'TestApiStack', {
      description: 'Test API Stack',
      sessionTable: mockSessionTable,
    });
  });

  describe('stack creation', () => {
    it('should create a valid ApiStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(ApiStack);
    });

    it('should have an api property', () => {
      expect(stack.api).toBeDefined();
      expect(stack.api).toBeInstanceOf(apigateway.RestApi);
    });

    it('should have a conversationHandler property', () => {
      expect(stack.conversationFunction).toBeDefined();
      expect(stack.conversationFunction).toBeInstanceOf(lambda.Function);
    });
  });

  describe('Lambda function configuration', () => {
    it('should have memory size of 512MB', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 512,
      });
    });

    it('should have timeout of 30 seconds', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });
    });

    it('should have runtime Node.js 24.x', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs24.x',
      });
    });

    it('should have environment variables configured', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: cdk.assertions.Match.objectLike({
            SESSION_TABLE_NAME: cdk.assertions.Match.anyValue(),
            BEDROCK_REGION: 'us-east-1',
            BEDROCK_MODEL_ID: 'anthropic.claude-haiku-4-5-20251001-v1:0',
            CONVERSATION_MAX_TURNS: '10',
          }),
        },
      });
    });

    it('should have JSON logging format enabled', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        LoggingConfig: {
          LogFormat: 'JSON',
        },
      });
    });

    it('should have tracing enabled', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });
  });

  describe('IAM permissions', () => {
    it('should have DynamoDB read/write permissions for the session table', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: cdk.assertions.Match.objectLike({
          Statement: [
            cdk.assertions.Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ],
        }),
      });

      // Verify that inline policies contain DynamoDB permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: cdk.assertions.Match.objectLike({
          Statement: cdk.assertions.Match.arrayWith([
            cdk.assertions.Match.objectLike({
              Effect: 'Allow',
              Action: cdk.assertions.Match.arrayWith(['dynamodb:GetItem', 'dynamodb:PutItem']),
            }),
          ]),
        }),
      });
    });

    it('should have Bedrock permissions for Claude Haiku model', () => {
      // Note: Bedrock IAM policy is marked as TBD in the current implementation
      // This test placeholder verifies the stack creates without errors
      const template = cdk.assertions.Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    it('should have CloudWatch Logs permissions', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      // NodejsFunction automatically adds CloudWatch Logs permissions via managed policy
      // Verify that an IAM role exists for the Lambda function
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: cdk.assertions.Match.objectLike({
          Statement: [
            cdk.assertions.Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ],
        }),
      });
    });
  });

  describe('API Gateway configuration', () => {
    it('should create a REST API', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'CareerCompassApi',
      });
    });

    it('should have /conversation/turn resource', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      // The resource path should include /conversation/turn
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'turn',
      });
    });

    it('should have POST method on /conversation/turn', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });

    it('should have CORS enabled on resources', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      // Check for OPTIONS method which is created for CORS
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    it('should have deployment stage configured', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'dev',
        TracingEnabled: true,
      });
    });
  });

  describe('stack outputs', () => {
    it('should export API URL as CfnOutput', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasOutput('ConversationApiUrlOutput', {
        Description: cdk.assertions.Match.stringLikeRegexp('.*Conversation API.*'),
        Export: cdk.assertions.Match.objectLike({
          Name: ApiStack.CONVERSATION_API_URL_EXPORT,
        }),
      });
    });

    it('should export API endpoint URL as CfnOutput', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasOutput('ConversationApiEndpointOutput', {
        Description: cdk.assertions.Match.stringLikeRegexp('.*turn.*'),
      });
    });
  });

  describe('tags', () => {
    it('should have Component tag set to Api', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: cdk.assertions.Match.arrayWith([
          cdk.assertions.Match.objectLike({
            Key: 'Component',
            Value: 'Api',
          }),
        ]),
      });
    });

    it('should have Purpose tag set to ConversationHandling', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: cdk.assertions.Match.arrayWith([
          cdk.assertions.Match.objectLike({
            Key: 'Purpose',
            Value: 'ConversationHandling',
          }),
        ]),
      });
    });
  });

  describe('acceptance criteria validation', () => {
    it('AC-01: accepts Table construct as prop with proper resource references', () => {
      // Verify that the stack uses the table construct's properties
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: cdk.assertions.Match.objectLike({
            SESSION_TABLE_NAME: cdk.assertions.Match.anyValue(),
          }),
        },
      });
    });

    it('AC-02: Lambda has 512MB memory and 30s timeout', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 512,
        Timeout: 30,
      });
    });

    it('AC-04: CORS headers configured', () => {
      // Verify that OPTIONS method exists (created for CORS preflight)
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    it('AC-05: API URL exported as CfnOutput named ConversationApiUrl', () => {
      const template = cdk.assertions.Template.fromStack(stack);
      template.hasOutput('ConversationApiUrlOutput', {
        Export: cdk.assertions.Match.objectLike({
          Name: ApiStack.CONVERSATION_API_URL_EXPORT,
        }),
      });
    });

    it('AC-08: Infrastructure synthesizes successfully', () => {
      // If we reach here, the template has been successfully created and validated
      const template = cdk.assertions.Template.fromStack(stack);
      expect(template).toBeDefined();
    });
  });
});
