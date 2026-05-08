// Set environment variables for testing
process.env.DYNAMODB_TABLE_NAME = 'test-sessions-table';
process.env.BEDROCK_REGION = 'us-east-1';
process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-5-haiku-20241022-v1:0';
process.env.NODE_ENV = 'test';
