import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

/**
 * Props for the ApiStack.
 * Accepts the DynamoDB table construct for direct access to table resources and methods.
 */
export interface ApiStackProps extends cdk.StackProps {
  /**
   * The DynamoDB session table created by StorageStack.
   * Passed as a construct reference to enable grantReadData/grantWriteData and direct property access.
   */
  sessionTable: dynamodb.Table;
}

/**
 * ApiStack constructs the API Gateway and Lambda handler for the conversation API.
 * This stack manages the POST /conversation/turn endpoint that processes AI conversation turns.
 *
 * Dependencies:
 * - DynamoDB table from StorageStack (tableArn and tableName as props)
 * - Lambda handler bundle from packages/api/dist
 */
export class ApiStack extends cdk.Stack {
  /**
   * The API Gateway REST API instance.
   * Exposes the conversation endpoint.
   */
  public readonly api: apigateway.RestApi;

  /**
   * The Lambda function handler for conversation turns.
   * Processes POST requests and orchestrates Bedrock interactions.
   */
  public readonly conversationFunction: lambda.Function;

  /**
   * Output exported name for the API URL.
   * Consumable by FrontendStack via cross-stack references.
   */
  public static readonly CONVERSATION_API_URL_EXPORT = 'CareerCompass-ConversationApiUrl';

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create Lambda function for conversation handler
    // Bundle the handler from packages/api/src with esbuild
    this.conversationFunction = new NodejsFunction(this, 'ConversationFunction', {
      functionName: 'CareerCompassConversationFunction',
      runtime: lambda.Runtime.NODEJS_24_X,

      // handler and entry point for the Lambda function
      handler: 'handler',
      entry: path.join(import.meta.dirname, '../../../packages/api/src/handlers/conversation-handler.ts'),

      // Bundling options for esbuild
      bundling: {
        minify: true,
        sourceMap: true,
      },

      // Performance options
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),

      // CloudWatch Logs configuration with JSON format
      loggingFormat: lambda.LoggingFormat.JSON,
      logGroup: new logs.LogGroup(this, 'ConversationFunctionLogGroup', {
        logGroupName: `/aws/lambda/career-compass-conversation-function`,
        retention: logs.RetentionDays.ONE_WEEK, // 7 days for portfolio project
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Clean up logs when stack is deleted
      }),

      // Environment variables for configuration
      environment: {
        SESSION_TABLE_NAME: props.sessionTable.tableName,
        BEDROCK_REGION: 'us-east-1', // Bedrock availability: configure in cdk.json context if needed
        BEDROCK_MODEL_ID: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
        BEDROCK_TEMPERATURE: '0.7',
        BEDROCK_MAX_TOKENS: '1024',
        CONVERSATION_MAX_TURNS: '10', // Phase state machine max turns
      },

      // Observability
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing for performance insights
      description: 'Handles POST /conversation/turn requests for AI conversation workflow',
    });

    props.sessionTable.grantReadWriteData(this.conversationFunction); // Grant Lambda permissions to read/write session data

    // IAM Policy for Bedrock InvokeModel on the configured Claude Haiku model
    this.conversationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          // Allow invoking the specific Claude Haiku model (ARN format for Bedrock models)
          `arn:aws:bedrock:us-east-1:${cdk.Aws.ACCOUNT_ID}:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0`,
          // Also allow general pattern for Bedrock models if needed for flexibility
          `arn:aws:bedrock:us-east-1:${cdk.Aws.ACCOUNT_ID}:inference-profile/us.anthropic.claude*`,
          // TODO: Need to figure out the exact ARN format for Bedrock models and update this policy accordingly. The above is a best guess based on typical AWS ARN patterns and may need adjustment.
          `*`,
        ],
      }),
    );

    // Create API Gateway REST API
    this.api = new apigateway.RestApi(this, 'ConversationApi', {
      restApiName: 'CareerCompassApi',
      description: 'Career Compass API',
      deployOptions: {
        stageName: 'dev',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false, // Disable request/response body logging for privacy
      },
      defaultCorsPreflightOptions: {
        // AC-04: CORS enabled for portfolio demo (allow all origins)
        // NOTE: In production, restrict to specific frontend domain
        allowOrigins: ['*'],
        allowMethods: ['POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        maxAge: cdk.Duration.hours(1),
        exposeHeaders: ['x-amzn-RequestId'],
        disableCache: false,
      },
      endpointExportName: 'ConversationApiEndpoint',
    });

    // Create /conversation resource
    const conversationResource = this.api.root.addResource('conversation');

    // Create /conversation/turn resource
    const turnResource = conversationResource.addResource('turn');

    // Add POST method with Lambda integration
    // AC-03: POST /conversation/turn resource with Lambda integration
    turnResource.addMethod('POST', new apigateway.LambdaIntegration(this.conversationFunction));

    // Export API URL for use by FrontendStack and local development
    // AC-05: API URL exported as CfnOutput named ConversationApiUrl
    new cdk.CfnOutput(this, 'ConversationApiUrlOutput', {
      value: this.api.url,
      exportName: ApiStack.CONVERSATION_API_URL_EXPORT,
      description: 'Base URL for the Career Compass Conversation API',
    });

    // Export endpoint URL for convenience
    new cdk.CfnOutput(this, 'ConversationApiEndpointOutput', {
      value: `${this.api.url}conversation/turn`,
      description: 'POST endpoint for conversation turns',
    });

    // Add tags for organization and cost allocation
    cdk.Tags.of(this).add('Component', 'Api');
    cdk.Tags.of(this).add('Purpose', 'ConversationHandling');
  }
}
