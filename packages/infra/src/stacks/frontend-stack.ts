import * as path from 'path';

import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

/**
 * Props for the FrontendStack.
 * FrontendStack is independent and has no dependencies on other stacks.
 */
type FrontendStackProps = cdk.StackProps;

/**
 * FrontendStack constructs the S3 bucket and CloudFront distribution for the React SPA frontend.
 * This stack manages static asset hosting with SPA routing support.
 *
 * Features:
 * - Private S3 bucket with no public access
 * - CloudFront distribution with Origin Access Control (OAC)
 * - SPA error handling: 403/404 responses serve index.html with status 200
 * - Automatic deployment from packages/web/dist with cache invalidation
 * - Independent stack with no cross-stack dependencies
 */
export class FrontendStack extends cdk.Stack {
  /**
   * The S3 bucket storing the React SPA static assets.
   * Remains private; all access is via CloudFront.
   */
  public readonly bucket: s3.Bucket;

  /**
   * The CloudFront distribution serving the frontend assets.
   * Configured with OAC for secure S3 origin access.
   */
  public readonly distribution: cloudfront.Distribution;

  /**
   * Output exported name for the CloudFront distribution URL.
   * Consumable by other stacks or local development via cross-stack references.
   */
  public static readonly CLOUDFRONT_DISTRIBUTION_URL_EXPORT = 'CareerCompass-CloudFrontDistributionUrl';

  constructor(scope: Construct, id: string, props?: FrontendStackProps) {
    super(scope, id, props);

    // Create private S3 bucket for storing frontend assets
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `career-compass-frontend-${cdk.Aws.ACCOUNT_ID}`,
      // Security: Block all public access to the bucket
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Encryption: AWS-managed encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,
      // Versioning: Enable for easy rollback of deployments
      versioned: true,
      // Portfolio project: All resources are ephemeral and destroyed on removal
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Auto-delete objects on bucket destruction (required when removalPolicy=DESTROY)
      autoDeleteObjects: true,
    });

    // Create CloudFront distribution for the frontend
    // Uses S3BucketOrigin.withOriginAccessControl() which automatically:
    // - Creates and manages the OAC
    // - Configures S3 origin with OAC
    // - Grants OAC access to the bucket (no manual permission needed)
    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        // Origin: S3 bucket accessed via OAC using the modern CDK pattern
        // This automatically handles OAC creation, configuration, and permissions
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        // Caching: Allow CloudFront to cache assets
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Cache control for development (can be tuned for production)
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        // Compress assets for faster transfer
        compress: true,
      },
      // Default root object for SPA
      defaultRootObject: 'index.html',
      // Price class: Cost-optimized, excludes expensive regions
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      // Custom error responses for SPA client-side routing
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0), // Don't cache error responses
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0), // Don't cache error responses
        },
      ],
    });

    // Deploy the frontend assets from packages/web/dist to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset(path.join(import.meta.dirname, '../../../web/dist'))],
      destinationBucket: this.bucket,
      // Invalidate CloudFront distribution on every deployment
      // This ensures users get the latest assets immediately
      distribution: this.distribution,
      distributionPaths: ['/*'],
      // Retain existing objects in bucket (S3 upload behavior)
      retainOnDelete: false,
    });

    // Export CloudFront distribution URL for use by other stacks
    new cdk.CfnOutput(this, 'CloudFrontDistributionUrlOutput', {
      value: `https://${this.distribution.domainName}`,
      exportName: FrontendStack.CLOUDFRONT_DISTRIBUTION_URL_EXPORT,
      description: 'CloudFront distribution URL for the Career Compass frontend',
    });

    // Export CloudFront domain name for reference
    new cdk.CfnOutput(this, 'CloudFrontDomainNameOutput', {
      value: this.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });
  }
}
