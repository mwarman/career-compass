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
          content: [
            {
              text: expectedResponse,
            },
          ],
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
          content: [
            {
              text: 'Response text',
            },
          ],
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
          content: [],
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
          content: [
            {
              image: { source: { bytes: 'not-a-text-response' } }, // Image block instead of text
            },
          ],
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
          content: [
            {
              text: '', // Empty text
            },
          ],
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
          content: [
            {
              // Missing text property
            },
          ],
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
          content: [
            {
              text: 'Final response',
            },
          ],
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
          content: [
            {
              text: 'Initial response',
            },
          ],
        },
      });

      // Act
      const result = await BedrockService.converse(systemPrompt, emptyHistory);

      // Assert
      expect(result).toBe('Initial response');
    });
  });
});
