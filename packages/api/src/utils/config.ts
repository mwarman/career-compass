import { z } from 'zod';

/**
 * Configuration schema for API environment variables.
 * Validates and transforms process.env into a typed Config object.
 * Fails fast on cold start if any required variables are missing or invalid.
 */
const configSchema = z.object({
  // DynamoDB configuration
  dynamodbTableName: z.string().min(1, 'DYNAMODB_TABLE_NAME is required'),

  // Bedrock configuration
  bedrockRegion: z.string().min(1, 'BEDROCK_REGION is required'),
  bedrockModelId: z.string().min(1, 'BEDROCK_MODEL_ID is required'),

  // Node environment (defaults to 'development' if not set)
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Parse and validate environment variables.
 * Throws an error if validation fails, ensuring fail-fast behavior on cold start.
 */
const parseConfig = (): Config => {
  const raw = {
    dynamodbTableName: process.env.DYNAMODB_TABLE_NAME,
    bedrockRegion: process.env.BEDROCK_REGION,
    bedrockModelId: process.env.BEDROCK_MODEL_ID,
    nodeEnv: process.env.NODE_ENV,
  };

  const result = configSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  return result.data;
};

/**
 * Singleton config instance.
 * Validated on module load to ensure fail-fast behavior.
 */
export const config: Config = parseConfig();

/**
 * Helper function to get configuration values with type safety.
 * @example
 * const tableName = getConfig('dynamodbTableName');
 */
export function getConfig(key: keyof Config): Config[keyof Config] {
  return config[key];
}
