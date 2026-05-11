import { z } from 'zod';

/**
 * Configuration schema for API environment variables.
 * Validates and transforms process.env into a typed Config object.
 * Fails fast on cold start if any required variables are missing or invalid.
 */
const configSchema = z.object({
  // DynamoDB configuration
  SESSION_TABLE_NAME: z.string().min(1, 'SESSION_TABLE_NAME is required'),

  // Bedrock configuration
  BEDROCK_REGION: z.string().min(1, 'BEDROCK_REGION is required'),
  BEDROCK_MODEL_ID: z.string().min(1, 'BEDROCK_MODEL_ID is required'),

  CONVERSATION_MAX_TURNS: z.coerce.number().positive().default(10),

  // Node environment (defaults to 'development' if not set)
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Parse and validate environment variables.
 * Throws an error if validation fails, ensuring fail-fast behavior on cold start.
 */
const parseConfig = (): Config => {
  const result = configSchema.safeParse(process.env);

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
