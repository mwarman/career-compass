import { z } from 'zod';

/**
 * Configuration schema for Web environment variables.
 * Validates and transforms import.meta.env into a typed Config object.
 * Vite automatically prefixes VITE_ variables with import.meta.env
 */
const configSchema = z.object({
  // API configuration
  apiBaseUrl: z.url('VITE_API_BASE_URL must be a valid URL'),

  // Environment mode (defaults to 'development' if not set)
  mode: z.enum(['development', 'production']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Parse and validate environment variables from Vite.
 * Throws an error if validation fails, ensuring fail-fast behavior on app load.
 */
const parseConfig = (): Config => {
  const raw = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    mode: import.meta.env.MODE,
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
 * const apiUrl = getConfig('apiBaseUrl');
 */
export function getConfig(key: keyof Config): Config[keyof Config] {
  return config[key];
}
