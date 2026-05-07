import { RecommendationSchema } from '../schemas/recommendation-schema';

/**
 * Derives a Bedrock-compatible JSON Schema from RecommendationSchema.
 *
 * AWS Bedrock's Converse API expects tool specs with an `inputSchema.json` field
 * containing a JSON Schema object that describes the tool's input parameters.
 * This function eliminates hand-maintaining a parallel schema definition by
 * deriving the schema directly from the authoritative Zod RecommendationSchema.
 *
 * The returned schema object has the structure:
 * {
 *   type: "object",
 *   properties: { ... },
 *   required: [ ... ],
 *   ...
 * }
 *
 * This matches Bedrock's `toolSpec.inputSchema.json` contract.
 *
 * @returns A JSON Schema object derived from RecommendationSchema
 * @see https://zod.dev/json-schema
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use.html
 */
export const getRecommendationToolSchema = (): Record<string, unknown> => {
  const jsonSchema = RecommendationSchema.toJSONSchema();
  return jsonSchema;
};
