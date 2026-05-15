import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * Props for the ObservabilityStack.
 * Accepts individual resources needed for creating CloudWatch metrics and dashboards.
 */
export interface ObservabilityStackProps extends cdk.StackProps {
  /**
   * The Lambda function for conversation handling.
   * Used to display Lambda metrics (invocations, errors, duration, throttles).
   */
  conversationFunction: lambda.IFunction;

  /**
   * The API Gateway REST API instance.
   * Used to display API Gateway metrics (request count, error rates, latency).
   */
  api: apigateway.RestApi;

  /**
   * The DynamoDB table for session storage.
   * Used to display DynamoDB metrics (capacity units, errors).
   */
  sessionTable: dynamodb.ITable;
}

/**
 * ObservabilityStack constructs CloudWatch dashboards and alarms for Career Compass.
 * This stack provides comprehensive observability across Lambda, API Gateway, and DynamoDB.
 *
 * Dashboard Organization (4 widget categories):
 * - API Health: API Gateway metrics (request count, error rates, latency)
 * - Lambda Metrics: Function metrics (invocations, errors, duration, throttles)
 * - Storage: DynamoDB metrics (capacity units, errors)
 * - Cost Indicators: Metrics that correlate with AWS billing (capacity, invocations)
 *
 * Note on Bedrock Observability:
 * AWS Bedrock does not emit standard CloudWatch metrics by default. To track Bedrock usage:
 * 1. Extract metrics from Lambda CloudWatch Logs (contains Bedrock response info)
 * 2. Manually publish custom metrics from Lambda handler using CloudWatch PutMetricData
 * 3. Use CloudWatch Logs Insights to analyze Bedrock API calls
 * This implementation focuses on the automatically available metrics.
 */
export class ObservabilityStack extends cdk.Stack {
  /**
   * The CloudWatch dashboard for Career Compass observability.
   * Displays metrics for all service components grouped by concern.
   */
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    // Create the main observability dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'CareerCompassDashboard', {
      dashboardName: 'career-compass',
      defaultInterval: cdk.Duration.hours(24), // Default to 24-hour time range
    });

    // ========== LAMBDA METRICS ==========
    // Invocation count
    const lambdaInvocations = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Invocations',
      statistic: 'Sum',
      dimensionsMap: {
        FunctionName: props.conversationFunction.functionName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Invocations',
    });

    // Error count
    const lambdaErrors = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      statistic: 'Sum',
      dimensionsMap: {
        FunctionName: props.conversationFunction.functionName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Errors',
    });

    // Duration (AVERAGE for p50-like metric)
    const lambdaDuration = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      statistic: 'Average',
      dimensionsMap: {
        FunctionName: props.conversationFunction.functionName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Duration (Avg)',
    });

    // Throttles
    const lambdaThrottles = new cloudwatch.Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Throttles',
      statistic: 'Sum',
      dimensionsMap: {
        FunctionName: props.conversationFunction.functionName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Throttles',
    });

    // ========== API GATEWAY METRICS ==========
    // Request count
    const apiRequests = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      statistic: 'Sum',
      dimensionsMap: {
        ApiName: props.api.restApiName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Request Count',
    });

    // 4XX error rate
    const api4xxErrors = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      statistic: 'Sum',
      dimensionsMap: {
        ApiName: props.api.restApiName,
      },
      period: cdk.Duration.minutes(1),
      label: '4XX Errors',
    });

    // 5XX error rate
    const api5xxErrors = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      statistic: 'Sum',
      dimensionsMap: {
        ApiName: props.api.restApiName,
      },
      period: cdk.Duration.minutes(1),
      label: '5XX Errors',
    });

    // Latency (AVERAGE for p50-like metric)
    const apiLatency = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      statistic: 'Average',
      dimensionsMap: {
        ApiName: props.api.restApiName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Latency (Avg ms)',
    });

    // ========== DYNAMODB METRICS ==========
    // Consumed read capacity units
    const dynamodbReadCapacity = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedReadCapacityUnits',
      statistic: 'Sum',
      dimensionsMap: {
        TableName: props.sessionTable.tableName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Read Capacity Units',
    });

    // Consumed write capacity units
    const dynamodbWriteCapacity = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ConsumedWriteCapacityUnits',
      statistic: 'Sum',
      dimensionsMap: {
        TableName: props.sessionTable.tableName,
      },
      period: cdk.Duration.minutes(1),
      label: 'Write Capacity Units',
    });

    // User errors (failed requests)
    const dynamodbUserErrors = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'UserErrors',
      statistic: 'Sum',
      dimensionsMap: {
        TableName: props.sessionTable.tableName,
      },
      period: cdk.Duration.minutes(1),
      label: 'User Errors',
    });

    // System errors
    const dynamodbSystemErrors = new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'SystemErrors',
      statistic: 'Sum',
      dimensionsMap: {
        TableName: props.sessionTable.tableName,
      },
      period: cdk.Duration.minutes(1),
      label: 'System Errors',
    });

    // ========== BEDROCK METRICS ==========
    // NOTE: Standard Bedrock metrics (ModelInvocations, InputTokens, OutputTokens) are not
    // automatically published to CloudWatch. To implement Bedrock observability:
    // Option 1: Parse Bedrock response in Lambda handler and publish custom metrics
    // Option 2: Log Bedrock API response details and extract via CloudWatch Logs Insights
    // Option 3: Integrate with CloudTrail for API-level observability
    // For now, we focus on Lambda logs which contain Bedrock call information

    // ========== DASHBOARD WIDGETS ==========
    // API Health Widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Health',
        width: 12,
        height: 6,
        left: [apiRequests, api4xxErrors, api5xxErrors],
        right: [apiLatency],
      }),
    );

    // Lambda Metrics Widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Function Metrics',
        width: 12,
        height: 6,
        left: [lambdaInvocations, lambdaErrors, lambdaThrottles],
        right: [lambdaDuration],
      }),
    );

    // DynamoDB Storage Widget
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Storage Metrics',
        width: 12,
        height: 6,
        left: [dynamodbReadCapacity, dynamodbWriteCapacity],
        right: [dynamodbUserErrors, dynamodbSystemErrors],
      }),
    );

    // Cost Indicators Widget (focused on Lambda and DynamoDB capacity which drive billing)
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Cost Indicators (Capacity & Invocations)',
        width: 12,
        height: 6,
        left: [dynamodbReadCapacity, dynamodbWriteCapacity, lambdaInvocations],
      }),
    );

    // Add tags for organization and cost allocation
    cdk.Tags.of(this).add('Component', 'Observability');
    cdk.Tags.of(this).add('Purpose', 'Monitoring');
  }
}
