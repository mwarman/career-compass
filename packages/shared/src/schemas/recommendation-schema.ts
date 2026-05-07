import { z } from 'zod';

/**
 * Schema for a single skill gap identified in the recommendation process.
 * Represents a gap between current skills and desired career trajectory.
 */
const SkillGapSchema = z.object({
  name: z.string().min(1, 'Skill gap name is required').max(200),
  severity: z.enum(['low', 'medium', 'high'], {
    message: 'Severity must be one of: low, medium, high',
  }),
  rationale: z.string().min(1, 'Rationale is required').max(1000),
});

/**
 * Schema for a single recommended learning area.
 * Provides guidance on specific skills to develop with estimated timeline and effort.
 */
const RecommendedAreaSchema = z.object({
  area: z.string().min(1, 'Learning area name is required').max(200),
  rationale: z
    .string()
    .min(1, 'Rationale is required')
    .max(1000)
    .describe('Explanation of why this area is recommended, tied to a career goal'),
  resourceCategories: z.array(z.string().min(1).max(100), {
    message: 'Resource categories must be an array of strings',
  }),
  estimatedEffort: z
    .enum(['minimal', 'light', 'moderate', 'substantial', 'intensive'], {
      message: 'Estimated effort must be one of: minimal, light, moderate, substantial, intensive',
    })
    .describe('Effort level required to complete this learning area'),
  estimatedTimeline: z
    .string()
    .min(1, 'Estimated timeline is required')
    .max(100)
    .describe('Human-readable timeline estimate (e.g., "4-6 weeks", "2-3 months")'),
});

/**
 * Schema for the complete recommendation output from the generate_recommendation tool.
 * This is the authoritative definition used by both Bedrock tool schema and frontend type checking.
 */
export const RecommendationSchema = z.object({
  profileSummary: z
    .string()
    .min(1, 'Profile summary is required')
    .max(1000)
    .describe('Inferred summary of the professional profile based on conversation'),
  skillGaps: z
    .array(SkillGapSchema, {
      message: 'Skill gaps must be an array of gap objects',
    })
    .min(1, 'At least one skill gap is required')
    .describe('Prioritized array of identified skill gaps'),
  recommendations: z
    .array(RecommendedAreaSchema, {
      message: 'Recommendations must be an array of recommended areas',
    })
    .min(1, 'At least one recommendation is required')
    .describe('Array of recommended learning areas with supporting details'),
});

/**
 * Inferred TypeScript type from RecommendationSchema.
 * Use this type in frontend and backend code for type safety.
 */
export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Inferred TypeScript type for skill gap objects.
 */
export type SkillGap = z.infer<typeof SkillGapSchema>;

/**
 * Inferred TypeScript type for recommended learning areas.
 */
export type RecommendedArea = z.infer<typeof RecommendedAreaSchema>;
