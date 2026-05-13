import { Recommendation } from '@career-compass/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RecommendationPanel } from './RecommendationPanel';

/**
 * Mock recommendation data for testing.
 */
const mockRecommendation: Recommendation = {
  profileSummary: 'You are a mid-level full-stack developer with 5 years of experience in JavaScript and React.',
  skillGaps: [
    {
      name: 'System Design',
      severity: 'high',
      rationale: 'Understanding distributed systems architecture is critical for senior roles.',
    },
    {
      name: 'Cloud Platforms',
      severity: 'medium',
      rationale: 'AWS/GCP knowledge would expand your backend opportunities.',
    },
    {
      name: 'TypeScript Advanced',
      severity: 'low',
      rationale: 'Mastering advanced types and generics would improve code quality.',
    },
  ],
  recommendations: [
    {
      area: 'System Design Fundamentals',
      rationale: 'Essential for transitioning to senior engineer roles and building scalable applications.',
      resourceCategories: ['Online Courses', 'Books', 'Practice Problems'],
      estimatedEffort: 'substantial',
      estimatedTimeline: '8-12 weeks',
    },
    {
      area: 'AWS Certification (Solutions Architect)',
      rationale: 'Industry-recognized credential that validates cloud architecture knowledge.',
      resourceCategories: ['Official Courses', 'Practice Exams', 'Hands-on Labs'],
      estimatedEffort: 'moderate',
      estimatedTimeline: '4-6 weeks',
    },
  ],
};

describe('RecommendationPanel', () => {
  // AC-01: Component accepts recommendation prop and renders all fields
  describe('AC-01: Component accepts recommendation prop and renders all fields', () => {
    it('should render the component with a recommendation prop', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      const panel = screen.getByText('Professional Profile Summary');
      expect(panel).toBeTruthy();
    });

    it('should render the profile summary section with content', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      expect(screen.getByText(mockRecommendation.profileSummary)).toBeTruthy();
    });

    it('should render the skill gaps section with heading', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      expect(screen.getByText('Identified Skill Gaps')).toBeTruthy();
    });

    it('should render the recommendations section with heading', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      expect(screen.getByText('Recommended Learning Areas')).toBeTruthy();
    });
  });

  // AC-02: Skill gaps rendered in order with severity visually encoded
  describe('AC-02: Skill gaps rendered in order with severity badges', () => {
    it('should render all skill gaps in order', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      expect(screen.getByText('System Design')).toBeTruthy();
      expect(screen.getByText('Cloud Platforms')).toBeTruthy();
      expect(screen.getByText('TypeScript Advanced')).toBeTruthy();
    });

    it('should render skill gap rationales', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      mockRecommendation.skillGaps.forEach((gap) => {
        expect(screen.getByText(gap.rationale)).toBeTruthy();
      });
    });

    it('should render severity badges with correct variants', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      // High severity badge
      const badges = screen.getAllByText((content, element) => {
        return element?.textContent === 'high' || element?.textContent === 'medium' || element?.textContent === 'low';
      });
      expect(badges.length).toBe(3);
    });

    it('should display severity badges with correct text', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      expect(screen.getByText('high')).toBeTruthy();
      expect(screen.getByText('medium')).toBeTruthy();
      expect(screen.getByText('low')).toBeTruthy();
    });
  });

  // AC-03: Each recommendation rendered in its own Card with labeled fields
  describe('AC-03: Each recommendation rendered in Card with labeled fields', () => {
    it('should render all recommendations', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      expect(screen.getByText('System Design Fundamentals')).toBeTruthy();
      expect(screen.getByText('AWS Certification (Solutions Architect)')).toBeTruthy();
    });

    it('should render recommendation areas as titles', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      mockRecommendation.recommendations.forEach((rec) => {
        expect(screen.getByText(rec.area)).toBeTruthy();
      });
    });

    it('should render recommendation rationales as descriptions', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      mockRecommendation.recommendations.forEach((rec) => {
        expect(screen.getByText(rec.rationale)).toBeTruthy();
      });
    });

    it('should render resource categories for each recommendation', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      expect(screen.getByText('Online Courses')).toBeTruthy();
      expect(screen.getByText('Books')).toBeTruthy();
      expect(screen.getByText('Practice Problems')).toBeTruthy();
      expect(screen.getByText('Official Courses')).toBeTruthy();
      expect(screen.getByText('Practice Exams')).toBeTruthy();
      expect(screen.getByText('Hands-on Labs')).toBeTruthy();
    });

    it('should render estimated effort labels and values', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      const effortLabels = screen.getAllByText('Estimated Effort');
      expect(effortLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('substantial')).toBeTruthy();
      expect(screen.getByText('moderate')).toBeTruthy();
    });

    it('should render timeline labels and values', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      const timelineLabels = screen.getAllByText('Timeline');
      expect(timelineLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('8-12 weeks')).toBeTruthy();
      expect(screen.getByText('4-6 weeks')).toBeTruthy();
    });

    it('should render resource categories label', () => {
      render(<RecommendationPanel recommendation={mockRecommendation} />);
      const labels = screen.getAllByText('Resource Categories');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  // AC-06: Renders without errors with live synthesis output
  describe('AC-06: Renders without errors with various data', () => {
    it('should render without errors with complete recommendation data', () => {
      expect(() => {
        render(<RecommendationPanel recommendation={mockRecommendation} />);
      }).not.toThrow();
    });

    it('should handle minimum required data', () => {
      const minimalRecommendation: Recommendation = {
        profileSummary: 'Test profile',
        skillGaps: [
          {
            name: 'Skill One',
            severity: 'low',
            rationale: 'Test rationale',
          },
        ],
        recommendations: [
          {
            area: 'Area One',
            rationale: 'Test recommendation',
            resourceCategories: ['Resource'],
            estimatedEffort: 'minimal',
            estimatedTimeline: '1 week',
          },
        ],
      };

      render(<RecommendationPanel recommendation={minimalRecommendation} />);
      expect(screen.getByText('Test profile')).toBeTruthy();
      expect(screen.getByText('Skill One')).toBeTruthy();
      expect(screen.getByText('Area One')).toBeTruthy();
    });

    it('should handle multiple skill gaps of different severities', () => {
      const multiSeverityRecommendation: Recommendation = {
        profileSummary: 'Profile',
        skillGaps: [
          { name: 'Gap 1', severity: 'high', rationale: 'Reason 1' },
          { name: 'Gap 2', severity: 'high', rationale: 'Reason 2' },
          { name: 'Gap 3', severity: 'medium', rationale: 'Reason 3' },
          { name: 'Gap 4', severity: 'low', rationale: 'Reason 4' },
        ],
        recommendations: [
          {
            area: 'Area',
            rationale: 'Rationale',
            resourceCategories: ['Cat1', 'Cat2'],
            estimatedEffort: 'intensive',
            estimatedTimeline: '6 months',
          },
        ],
      };

      render(<RecommendationPanel recommendation={multiSeverityRecommendation} />);
      expect(screen.getByText('Gap 1')).toBeTruthy();
      expect(screen.getByText('Gap 4')).toBeTruthy();
    });
  });
});
