import { describe, it, expect } from 'vitest';

import { RecommendationSchema, type Recommendation } from '../recommendation-schema';

describe('RecommendationSchema', () => {
  const validRecommendation: Recommendation = {
    profileSummary: 'Senior software engineer with 10 years of experience',
    skillGaps: [
      {
        name: 'Cloud Architecture',
        severity: 'high',
        rationale: 'Need expertise in designing scalable cloud solutions',
      },
      {
        name: 'Machine Learning',
        severity: 'medium',
        rationale: 'Growing field relevant to career progression',
      },
    ],
    recommendations: [
      {
        area: 'AWS Solutions Architect Certification',
        rationale: 'Directly addresses cloud architecture gap and aligns with goal of moving into leadership',
        resourceCategories: ['Certification', 'Online Course', 'Hands-on Lab'],
        estimatedEffort: 'substantial',
        estimatedTimeline: '12-16 weeks',
      },
      {
        area: 'Machine Learning Fundamentals',
        rationale: 'Builds foundation for understanding ML applications in modern systems',
        resourceCategories: ['Online Course', 'Book', 'Project'],
        estimatedEffort: 'moderate',
        estimatedTimeline: '8-12 weeks',
      },
    ],
  };

  describe('valid inputs', () => {
    it('should validate a complete, valid recommendation object', () => {
      const result = RecommendationSchema.safeParse(validRecommendation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRecommendation);
      }
    });

    it('should validate recommendation with single skill gap and recommendation', () => {
      const minimal: Recommendation = {
        profileSummary: 'A professional profile',
        skillGaps: [
          {
            name: 'Python',
            severity: 'low',
            rationale: 'Basic Python knowledge needed',
          },
        ],
        recommendations: [
          {
            area: 'Python Programming',
            rationale: 'Learn Python basics',
            resourceCategories: ['Online Course'],
            estimatedEffort: 'light',
            estimatedTimeline: '4 weeks',
          },
        ],
      };
      const result = RecommendationSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });
  });

  describe('missing required fields', () => {
    it('should fail when profileSummary is missing', () => {
      const invalid = {
        skillGaps: validRecommendation.skillGaps,
        recommendations: validRecommendation.recommendations,
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('profileSummary'))).toBe(true);
      }
    });

    it('should fail when skillGaps is missing', () => {
      const invalid = {
        profileSummary: validRecommendation.profileSummary,
        recommendations: validRecommendation.recommendations,
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('skillGaps'))).toBe(true);
      }
    });

    it('should fail when recommendations is missing', () => {
      const invalid = {
        profileSummary: validRecommendation.profileSummary,
        skillGaps: validRecommendation.skillGaps,
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('recommendations'))).toBe(true);
      }
    });
  });

  describe('invalid enum values', () => {
    it('should fail when severity has invalid value', () => {
      const invalid = {
        ...validRecommendation,
        skillGaps: [
          {
            name: 'Python',
            severity: 'critical',
            rationale: 'Invalid severity value',
          },
        ],
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('severity'))).toBe(true);
      }
    });

    it('should fail when estimatedEffort has invalid value', () => {
      const invalid = {
        ...validRecommendation,
        recommendations: [
          {
            area: 'Some Area',
            rationale: 'Some rationale',
            resourceCategories: ['Resource'],
            estimatedEffort: 'extreme',
            estimatedTimeline: '10 weeks',
          },
        ],
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('estimatedEffort'))).toBe(true);
      }
    });
  });

  describe('edge cases and constraints', () => {
    it('should fail when skillGaps array is empty', () => {
      const invalid = {
        ...validRecommendation,
        skillGaps: [],
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when recommendations array is empty', () => {
      const invalid = {
        ...validRecommendation,
        recommendations: [],
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when profileSummary is empty string', () => {
      const invalid = {
        ...validRecommendation,
        profileSummary: '',
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when skill gap name is empty', () => {
      const invalid = {
        ...validRecommendation,
        skillGaps: [
          {
            name: '',
            severity: 'high',
            rationale: 'Some rationale',
          },
        ],
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should fail when resourceCategories is not an array', () => {
      const invalid = {
        ...validRecommendation,
        recommendations: [
          {
            area: 'Some Area',
            rationale: 'Some rationale',
            resourceCategories: 'not-an-array',
            estimatedEffort: 'moderate',
            estimatedTimeline: '10 weeks',
          },
        ],
      };
      const result = RecommendationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate with maximum length strings', () => {
      const maxNameLength = 'a'.repeat(200);
      const maxLongStrLength = 'a'.repeat(1000);
      const maxResourceLength = 'a'.repeat(100);
      const maxTimelineLength = 'a'.repeat(100);
      const valid: Recommendation = {
        profileSummary: maxLongStrLength,
        skillGaps: [
          {
            name: maxNameLength,
            severity: 'high',
            rationale: maxLongStrLength,
          },
        ],
        recommendations: [
          {
            area: maxNameLength,
            rationale: maxLongStrLength,
            resourceCategories: [maxResourceLength],
            estimatedEffort: 'moderate',
            estimatedTimeline: maxTimelineLength,
          },
        ],
      };
      const result = RecommendationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should correctly infer Recommendation type at compile time', () => {
      const rec: Recommendation = validRecommendation;
      expect(rec.profileSummary).toBe(validRecommendation.profileSummary);
      expect(rec.skillGaps).toHaveLength(2);
      expect(rec.recommendations).toHaveLength(2);
    });

    it('should preserve nested type information', () => {
      const rec: Recommendation = validRecommendation;
      const firstGap = rec.skillGaps[0];
      expect(firstGap.severity).toBe('high');
      const firstRec = rec.recommendations[0];
      expect(firstRec.estimatedEffort).toBe('substantial');
    });
  });
});
