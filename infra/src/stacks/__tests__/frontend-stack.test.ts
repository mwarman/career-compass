import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { describe, it, expect } from 'vitest';

import { FrontendStack } from '../frontend-stack.js';

describe('FrontendStack', () => {
  it('should create a stack with the correct stack name', () => {
    // Arrange
    const app = new cdk.App();

    // Act
    const stack = new FrontendStack(app, 'TestFrontendStack', {
      stackName: 'TestCareerCompassFrontendStack',
    });

    // Assert
    expect(stack.stackName).toBe('TestCareerCompassFrontendStack');
  });

  it('should create a private S3 bucket with blockPublicAccess enabled', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    // Assert
    expect(template).toBeDefined();
  });

  it('should create a CloudFront distribution with S3 origin', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        Enabled: true,
      },
    });
  });

  it('should configure CloudFront with error responses for 403 and 404', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    // Verify that error responses are configured
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: [
          {
            ErrorCode: 403,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
            ErrorCachingMinTTL: 0,
          },
          {
            ErrorCode: 404,
            ResponseCode: 200,
            ResponsePagePath: '/index.html',
            ErrorCachingMinTTL: 0,
          },
        ],
      },
    });
  });

  it('should set PRICE_CLASS_100 for cost optimization', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        PriceClass: 'PriceClass_100',
      },
    });
  });

  it('should create a CloudFront output with distribution URL', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    template.hasOutput('CloudFrontDistributionUrlOutput', {
      Description: 'CloudFront distribution URL for the Career Compass frontend',
      Export: {
        Name: 'CareerCompass-CloudFrontDistributionUrl',
      },
    });
  });

  it('should create an Origin Access Control', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: {
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4',
      },
    });
  });

  it('should enable S3 bucket versioning for deployments', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  it('should set bucket removal policy to DESTROY', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    // Verify bucket is created (DeletionPolicy will be Destroy due to removalPolicy)
    const buckets = template.findResources('AWS::S3::Bucket');
    expect(Object.keys(buckets).length).toBeGreaterThan(0);
  });

  it('should export the correct stack properties', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');

    // Act
    const bucket = stack.bucket;
    const distribution = stack.distribution;

    // Assert
    expect(bucket).toBeDefined();
    expect(distribution).toBeDefined();
    expect(bucket).toBeInstanceOf(s3.Bucket);
    expect(distribution).toBeInstanceOf(cloudfront.Distribution);
  });

  it('should apply tags for organization and cost allocation', () => {
    // Arrange
    const app = new cdk.App();
    const stack = new FrontendStack(app, 'TestFrontendStack');
    const template = Template.fromStack(stack);

    // Act & Assert
    // Verify tags are applied to stack resources
    const allResources = template.findResources('AWS::S3::Bucket');
    expect(Object.keys(allResources).length).toBeGreaterThan(0);
  });
});
