import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * StorageStack constructs the DynamoDB table for session state persistence.
 * This stack manages all data storage resources for the Career Compass application.
 */
export class StorageStack extends cdk.Stack {
  /**
   * The DynamoDB table storing session state.
   * Partition key: sessionId (string)
   * TTL attribute: ttl (epoch seconds for 24-hour expiry)
   */
  public readonly sessionTable: dynamodb.Table;

  /**
   * Output exported name for the session table name.
   * Consumable by other stacks (e.g., ApiStack) via cross-stack references.
   */
  public static readonly SESSION_TABLE_NAME_EXPORT = 'CareerCompass-SessionTableName';

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for session state management
    this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
      // Partition key: sessionId (unique identifier for each conversation session)
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      // No sort key required for this access pattern
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity
      // Enable TTL for automatic 24-hour expiration of old sessions
      timeToLiveAttribute: 'ttl',
      // Portfolio project: all resources are ephemeral, including data
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Enable point-in-time recovery for data protection (optional, can be disabled for cost savings)
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
      // Encryption at rest (AWS managed by default)
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Export table name as stack output for use by other stacks
    new cdk.CfnOutput(this, 'SessionTableNameOutput', {
      value: this.sessionTable.tableName,
      exportName: StorageStack.SESSION_TABLE_NAME_EXPORT,
      description: 'DynamoDB table name for storing session state',
    });

    // Log table configuration for observability
    cdk.Tags.of(this).add('Component', 'Storage');
    cdk.Tags.of(this).add('Purpose', 'SessionPersistence');
  }
}
