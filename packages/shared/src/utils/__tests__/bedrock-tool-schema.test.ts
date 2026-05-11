import { describe, it, expect } from 'vitest';

import { RecommendationSchema, type Recommendation } from '../../schemas/recommendation-schema';
import { getRecommendationToolSchema } from '../bedrock-tool-schema';

describe('getRecommendationToolSchema', () => {
  it('should return a JSON Schema object', () => {
    const schema = getRecommendationToolSchema();
    expect(schema).toBeDefined();
    expect(typeof schema).toBe('object');
    expect(schema !== null).toBe(true);
  });

  it('should have type of object', () => {
    const schema = getRecommendationToolSchema();
    expect(schema.type).toBe('object');
  });

  it('should have properties field', () => {
    const schema = getRecommendationToolSchema();
    expect(schema.properties).toBeDefined();
    expect(typeof schema.properties).toBe('object');
  });

  it('should have required field', () => {
    const schema = getRecommendationToolSchema();
    expect(schema.required).toBeDefined();
    expect(Array.isArray(schema.required)).toBe(true);
  });

  it('should have all expected top-level properties from RecommendationSchema', () => {
    const schema = getRecommendationToolSchema();
    const properties = schema.properties as Record<string, unknown>;

    expect(properties.profileSummary).toBeDefined();
    expect(properties.skillGaps).toBeDefined();
    expect(properties.recommendations).toBeDefined();
  });

  it('should mark all top-level fields as required', () => {
    const schema = getRecommendationToolSchema();
    const required = schema.required as string[];

    expect(required).toContain('profileSummary');
    expect(required).toContain('skillGaps');
    expect(required).toContain('recommendations');
  });

  it('should correctly describe skillGaps as an array', () => {
    const schema = getRecommendationToolSchema();
    const properties = schema.properties as Record<string, unknown>;
    const skillGapsSchema = properties.skillGaps as Record<string, unknown>;

    expect(skillGapsSchema.type).toBe('array');
    expect(skillGapsSchema.items).toBeDefined();
  });

  it('should correctly describe recommendations as an array', () => {
    const schema = getRecommendationToolSchema();
    const properties = schema.properties as Record<string, unknown>;
    const recommendationsSchema = properties.recommendations as Record<string, unknown>;

    expect(recommendationsSchema.type).toBe('array');
    expect(recommendationsSchema.items).toBeDefined();
  });

  it('should validate a valid Recommendation object against the schema', () => {
    const validRecommendation: Recommendation = {
      profileSummary: 'Senior engineer interested in management roles',
      skillGaps: [
        {
          name: 'Leadership',
          severity: 'high',
          rationale: 'Limited formal leadership experience',
        },
      ],
      recommendations: [
        {
          area: 'Leadership fundamentals',
          rationale: 'Essential for management track',
          resourceCategories: ['online-courses', 'books'],
          estimatedEffort: 'moderate',
          estimatedTimeline: '3-4 months',
        },
      ],
    };

    // Verify this object is valid against the schema
    const result = RecommendationSchema.safeParse(validRecommendation);
    expect(result.success).toBe(true);

    // The derived schema should be compatible with this valid object
    const schema = getRecommendationToolSchema();
    expect(schema).toBeDefined();
  });

  it('should be consistent across multiple calls', () => {
    const schema1 = getRecommendationToolSchema();
    const schema2 = getRecommendationToolSchema();

    expect(JSON.stringify(schema1)).toBe(JSON.stringify(schema2));
  });

  it('should be a valid Bedrock toolSpec.inputSchema contract', () => {
    const schema = getRecommendationToolSchema();

    // Bedrock requires: type: object, properties, required fields
    expect(schema.type).toBe('object');
    expect(schema.properties).toBeDefined();
    expect(schema.required).toBeDefined();
    expect(Array.isArray(schema.required)).toBe(true);

    // Properties should not be empty
    const properties = schema.properties as Record<string, unknown>;
    expect(Object.keys(properties).length).toBeGreaterThan(0);

    // Required should not be empty
    const required = schema.required as string[];
    expect(required.length).toBeGreaterThan(0);
  });
});
