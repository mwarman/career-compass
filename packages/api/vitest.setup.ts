// Set environment variables for testing
process.env.SESSION_TABLE_NAME = 'test-sessions-table';
process.env.BEDROCK_REGION = 'us-east-1';
process.env.BEDROCK_MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';
process.env.BEDROCK_TEMPERATURE = '0.7';
process.env.BEDROCK_MAX_TOKENS_DEFAULT = '1024';
process.env.BEDROCK_MAX_TOKENS_SYNTHESIS = '3072';
process.env.CONVERSATION_MAX_TURNS = '10';
process.env.NODE_ENV = 'test';
