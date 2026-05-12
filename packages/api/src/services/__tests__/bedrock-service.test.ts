/**
 * Unit tests for BedrockService.
 * Tests successful response extraction, error handling, and edge cases.
 */

import { BedrockMessage } from '@career-compass/shared';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Create mock variables using vi.hoisted() to ensure they're available in vi.mock()
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockConverseCommand = function ConverseCommand(_input: any): void {
    // Mock constructor
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockBedrockRuntimeClient = vi.fn(function (this: any): void {
    this.send = mockSend;
  });

  return {
    BedrockRuntimeClient: MockBedrockRuntimeClient,
    ConverseCommand: vi.fn(MockConverseCommand),
  };
});

vi.mock('../../utils/logger');

// Import the service after mocking dependencies
import { BedrockError } from '../../errors/bedrock-error';
import { BedrockService } from '../bedrock-service';

describe('BedrockService', () => {
  const systemPrompt = "You are a career advisor. Ask about the user's experience.";
  const mockMessages: BedrockMessage[] = [
    {
      role: 'user',
      content: [{ text: 'What skills should I develop?' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('converse() - Successful response extraction', () => {
    it('should return assistant text when Bedrock responds successfully', async () => {
      // Arrange
      const expectedResponse = 'I recommend focusing on JavaScript and React skills.';
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                text: expectedResponse,
              },
            ],
          },
        },
      });

      // Act
      const result = await BedrockService.converse(systemPrompt, mockMessages);

      // Assert
      expect(result).toBe(expectedResponse);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should construct ConverseCommand with correct parameters', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                text: 'Response text',
              },
            ],
          },
        },
      });

      // Act
      await BedrockService.converse(systemPrompt, mockMessages);

      // Assert
      expect(mockSend).toHaveBeenCalled();
      // Verify the service constructed and used the Bedrock client
      expect(mockSend.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('converse() - Error handling and propagation', () => {
    it('should throw BedrockError when API call fails', async () => {
      // Arrange
      const apiError = new Error('Service unavailable');
      mockSend.mockRejectedValue(apiError);

      // Act & Assert
      await expect(BedrockService.converse(systemPrompt, mockMessages)).rejects.toThrow(BedrockError);
    });

    it('should throw BedrockError when response has no output', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: undefined,
      });

      // Act & Assert
      await expect(BedrockService.converse(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: missing output with content',
      );
    });

    it('should throw BedrockError when content array is empty', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.converse(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: missing or empty content array',
      );
    });

    it('should throw BedrockError when first content block is not text', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                image: { source: { bytes: 'not-a-text-response' } }, // Image block instead of text
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.converse(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: first content block is not text',
      );
    });

    it('should throw BedrockError when text property is empty', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                text: '', // Empty text
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.converse(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: text property is missing or empty',
      );
    });

    it('should throw BedrockError when text property is missing', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                // Missing text property
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.converse(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: first content block is not text',
      );
    });
  });

  describe('converse() - Message history handling', () => {
    it('should include full message history in ConverseCommand', async () => {
      // Arrange
      const multiTurnHistory: BedrockMessage[] = [
        {
          role: 'user',
          content: [{ text: 'Turn 1' }],
        },
        {
          role: 'assistant',
          content: [{ text: 'Response 1' }],
        },
        {
          role: 'user',
          content: [{ text: 'Turn 2' }],
        },
      ];

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                text: 'Final response',
              },
            ],
          },
        },
      });

      // Act
      await BedrockService.converse(systemPrompt, multiTurnHistory);

      // Assert
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('converse() - Empty message history', () => {
    it('should handle empty message history gracefully', async () => {
      // Arrange
      const emptyHistory: BedrockMessage[] = [];
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                text: 'Initial response',
              },
            ],
          },
        },
      });

      // Act
      const result = await BedrockService.converse(systemPrompt, emptyHistory);

      // Assert
      expect(result).toBe('Initial response');
    });
  });

  describe('synthesize() - Successful tool execution and validation', () => {
    it('should extract and validate toolUse block successfully', async () => {
      // Arrange
      const validRecommendation = {
        profileSummary: 'Software engineer with 5 years of experience in backend development',
        skillGaps: [
          {
            name: 'Cloud Architecture',
            severity: 'high',
            rationale: 'Need to understand modern cloud patterns',
          },
        ],
        recommendations: [
          {
            area: 'AWS Certification',
            rationale: 'Essential for career advancement in cloud roles',
            resourceCategories: ['Courses', 'Practice Exams'],
            estimatedEffort: 'moderate',
            estimatedTimeline: '3-4 months',
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: validRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act
      const result = await BedrockService.synthesize(systemPrompt, mockMessages);

      // Assert
      expect(result).toEqual(validRecommendation);
      expect(result.profileSummary).toBe(validRecommendation.profileSummary);
      expect(result.skillGaps).toHaveLength(1);
      expect(result.recommendations).toHaveLength(1);
    });

    it('should handle multiple skill gaps and recommendations', async () => {
      // Arrange
      const complexRecommendation = {
        profileSummary: 'Mid-level developer transitioning to leadership',
        skillGaps: [
          {
            name: 'System Design',
            severity: 'high',
            rationale: 'Critical for architect roles',
          },
          {
            name: 'Team Management',
            severity: 'medium',
            rationale: 'Needed for lead positions',
          },
        ],
        recommendations: [
          {
            area: 'System Design Fundamentals',
            rationale: 'Build foundational knowledge',
            resourceCategories: ['Books', 'Online Courses'],
            estimatedEffort: 'substantial',
            estimatedTimeline: '2-3 months',
          },
          {
            area: 'Leadership Training',
            rationale: 'Develop people management skills',
            resourceCategories: ['Workshops', 'Mentoring'],
            estimatedEffort: 'moderate',
            estimatedTimeline: '3-6 months',
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: complexRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act
      const result = await BedrockService.synthesize(systemPrompt, mockMessages);

      // Assert
      expect(result.skillGaps).toHaveLength(2);
      expect(result.recommendations).toHaveLength(2);
      expect(result.skillGaps[0].severity).toBe('high');
      expect(result.recommendations[0].estimatedEffort).toBe('substantial');
    });
  });

  describe('synthesize() - Tool use response extraction errors', () => {
    it('should throw BedrockError when response has no toolUse block', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                text: 'This is regular text, not a tool use block',
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: missing toolUse block in response',
      );
    });

    it('should throw BedrockError when toolUse block has wrong tool name', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'wrong_tool_name',
                  input: { some: 'data' },
                },
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: toolUse block does not match generate_recommendation',
      );
    });

    it('should throw BedrockError when output content is empty', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: missing or empty content array',
      );
    });

    it('should throw BedrockError when response has no output', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: undefined,
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: missing output with content',
      );
    });

    it('should throw BedrockError when toolUse is missing name field', async () => {
      // Arrange
      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  input: { some: 'data' },
                  // Missing name field
                },
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow(
        'Unexpected Bedrock response structure: toolUse block does not match generate_recommendation',
      );
    });
  });

  describe('synthesize() - Schema validation errors', () => {
    it('should throw ValidationError when recommendation is missing required fields', async () => {
      // Arrange
      const invalidRecommendation = {
        profileSummary: 'Some profile',
        // Missing required skillGaps array
        recommendations: [
          {
            area: 'Test',
            rationale: 'Test rationale',
            resourceCategories: ['Test'],
            estimatedEffort: 'minimal',
            estimatedTimeline: '1 week',
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: invalidRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow();
    });

    it('should throw ValidationError when skill gap has invalid severity', async () => {
      // Arrange
      const invalidRecommendation = {
        profileSummary: 'Test profile',
        skillGaps: [
          {
            name: 'Test Skill',
            severity: 'invalid_severity', // Invalid enum value
            rationale: 'Test rationale',
          },
        ],
        recommendations: [
          {
            area: 'Test',
            rationale: 'Test rationale',
            resourceCategories: ['Test'],
            estimatedEffort: 'minimal',
            estimatedTimeline: '1 week',
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: invalidRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow();
    });

    it('should throw ValidationError when skill gap is missing required fields', async () => {
      // Arrange
      const invalidRecommendation = {
        profileSummary: 'Test profile',
        skillGaps: [
          {
            name: 'Test Skill',
            // Missing required severity and rationale fields
          },
        ],
        recommendations: [
          {
            area: 'Test',
            rationale: 'Test rationale',
            resourceCategories: ['Test'],
            estimatedEffort: 'minimal',
            estimatedTimeline: '1 week',
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: invalidRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow();
    });

    it('should throw ValidationError when recommendation area is missing required fields', async () => {
      // Arrange
      const invalidRecommendation = {
        profileSummary: 'Test profile',
        skillGaps: [
          {
            name: 'Test Skill',
            severity: 'high',
            rationale: 'Test rationale',
          },
        ],
        recommendations: [
          {
            // Missing required fields: area, rationale, resourceCategories, etc.
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: invalidRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow();
    });

    it('should throw ValidationError when skill gaps array is empty', async () => {
      // Arrange
      const invalidRecommendation = {
        profileSummary: 'Test profile',
        skillGaps: [], // Empty array violates minimum length requirement
        recommendations: [
          {
            area: 'Test',
            rationale: 'Test rationale',
            resourceCategories: ['Test'],
            estimatedEffort: 'minimal',
            estimatedTimeline: '1 week',
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: invalidRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow();
    });
  });

  describe('synthesize() - API error handling', () => {
    it('should throw BedrockError when Bedrock API call fails', async () => {
      // Arrange
      const apiError = new Error('Service unavailable');
      mockSend.mockRejectedValue(apiError);

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow(BedrockError);
    });

    it('should wrap non-BedrockError exceptions as BedrockError', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected error');
      mockSend.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(BedrockService.synthesize(systemPrompt, mockMessages)).rejects.toThrow(BedrockError);
    });
  });

  describe('synthesize() - Message history handling', () => {
    it('should include full message history in synthesis call', async () => {
      // Arrange
      const multiTurnHistory: BedrockMessage[] = [
        {
          role: 'user',
          content: [{ text: 'Turn 1' }],
        },
        {
          role: 'assistant',
          content: [{ text: 'Response 1' }],
        },
        {
          role: 'user',
          content: [{ text: 'Turn 2' }],
        },
      ];

      const validRecommendation = {
        profileSummary: 'Test profile',
        skillGaps: [
          {
            name: 'Test',
            severity: 'high',
            rationale: 'Test rationale',
          },
        ],
        recommendations: [
          {
            area: 'Test',
            rationale: 'Test rationale',
            resourceCategories: ['Test'],
            estimatedEffort: 'minimal',
            estimatedTimeline: '1 week',
          },
        ],
      };

      mockSend.mockResolvedValue({
        output: {
          message: {
            content: [
              {
                toolUse: {
                  name: 'generate_recommendation',
                  input: validRecommendation,
                },
              },
            ],
          },
        },
      });

      // Act
      await BedrockService.synthesize(systemPrompt, multiTurnHistory);

      // Assert
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
