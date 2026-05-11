/**
 * Bedrock service for multi-turn conversation orchestration.
 * Wraps AWS Bedrock Runtime ConverseCommand to interact with Claude Haiku.
 * Responsible for constructing requests, managing inference parameters, and extracting responses.
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseCommandInput,
  ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import {
  BedrockMessage,
  Recommendation,
  RecommendationSchema,
  getRecommendationToolSchema,
} from '@career-compass/shared';

import { BedrockError } from '../errors/bedrock-error';
import { ValidationError } from '../errors/validation-error';
import { config } from '../utils/config';
import { Logger } from '../utils/logger';

/**
 * Bedrock Runtime client instance.
 * Initialized once and reused across Lambda invocations for connection efficiency.
 */
const bedrockClient = new BedrockRuntimeClient({ region: config.BEDROCK_REGION });

/**
 * Converse with Bedrock Claude model using the ConverseCommand API.
 * Constructs a multi-turn conversation request with system prompt and message history,
 * calls the Bedrock Converse API, and extracts the assistant text response.
 *
 * @param systemPrompt - The active phase system prompt guiding model behavior
 * @param messages - Full conversation history from session (Bedrock message format)
 * @returns The assistant text response as a string
 * @throws BedrockError if the API call fails or response is malformed
 */
const converse = async (systemPrompt: string, messages: BedrockMessage[]): Promise<string> => {
  Logger.debug('BedrockService.converse - entering', {
    messageCount: messages.length,
    hasSystemPrompt: !!systemPrompt,
  });

  try {
    // Construct ConverseCommand input with configured inference parameters
    // Cast messages to the SDK Message type (compatible due to our schema structure)
    const converseInput: ConverseCommandInput = {
      modelId: config.BEDROCK_MODEL_ID,
      system: [
        {
          text: systemPrompt,
        },
      ],
      // @ts-expect-error: BedrockMessage type from shared is compatible with SDK Message type
      // Our message structure matches SDK requirements: { role: 'user'|'assistant', content: [...] }
      messages: messages,
      inferenceConfig: {
        temperature: config.BEDROCK_TEMPERATURE,
        maxTokens: config.BEDROCK_MAX_TOKENS,
      },
    };

    Logger.debug('BedrockService.converse - calling ConverseCommand', {
      modelId: config.BEDROCK_MODEL_ID,
      temperature: config.BEDROCK_TEMPERATURE,
      maxTokens: config.BEDROCK_MAX_TOKENS,
    });

    // Execute the ConverseCommand
    const command = new ConverseCommand(converseInput);
    const response = await bedrockClient.send(command);

    // Extract assistant text response with guards against unexpected structures
    // Response output is a Message union type; we expect it to be an AssistantMessage with content
    Logger.debug('BedrockService.converse - processing response', {
      hasOutput: !!response.output,
    });

    if (!response.output || !('message' in response.output)) {
      throw new BedrockError('Unexpected Bedrock response structure: missing output with content', response);
    }

    const outputContent = response.output.message?.content as ContentBlock[] | undefined;
    if (!Array.isArray(outputContent) || outputContent.length === 0) {
      throw new BedrockError('Unexpected Bedrock response structure: missing or empty content array', response.output);
    }

    // Extract the first content block (expected to be text)
    const firstContent = outputContent[0];
    if (!firstContent || typeof firstContent !== 'object' || !('text' in firstContent)) {
      throw new BedrockError('Unexpected Bedrock response structure: first content block is not text', firstContent);
    }

    const assistantText = (firstContent as { text: string }).text;
    if (typeof assistantText !== 'string' || assistantText.length === 0) {
      throw new BedrockError('Unexpected Bedrock response structure: text property is missing or empty', firstContent);
    }

    Logger.debug('BedrockService.converse - response extracted successfully', {
      textLength: assistantText.length,
    });

    return assistantText;
  } catch (error) {
    // If error is already a BedrockError, re-throw it
    if (error instanceof BedrockError) {
      Logger.error('BedrockService.converse - BedrockError caught', {
        message: error.message,
        cause: error.cause,
      });
      throw error;
    }

    // Wrap other errors (AWS SDK errors, parsing errors, etc.) as BedrockError
    Logger.error('BedrockService.converse - unexpected error', {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw new BedrockError('Bedrock API call failed', error);
  }
};

/**
 * Synthesize a structured recommendation using Bedrock's forced tool use.
 * Calls Bedrock with the generate_recommendation tool configured for forced use,
 * extracts the toolUse block from the response, parses the tool input as a recommendation,
 * and validates against RecommendationSchema.
 *
 * @param systemPrompt - The synthesis phase system prompt
 * @param messages - Full conversation history from session (Bedrock message format)
 * @returns The validated Recommendation object
 * @throws BedrockError if the API call fails or response structure is unexpected
 * @throws ValidationError if the tool output fails Zod schema validation
 */
const synthesize = async (systemPrompt: string, messages: BedrockMessage[]): Promise<Recommendation> => {
  Logger.debug('BedrockService.synthesize - entering', {
    messageCount: messages.length,
    hasSystemPrompt: !!systemPrompt,
  });

  try {
    // Get the recommendation tool schema from the shared utilities
    const toolSchema = getRecommendationToolSchema();

    Logger.debug('BedrockService.synthesize - tool schema prepared', {
      hasInputSchema: !!toolSchema,
      schema: toolSchema,
      prompt: systemPrompt,
    });

    // Construct ConverseCommand input with forced tool use for generate_recommendation
    const converseInput: ConverseCommandInput = {
      modelId: config.BEDROCK_MODEL_ID,
      system: [
        {
          text: systemPrompt,
        },
      ],
      // @ts-expect-error: BedrockMessage type from shared is compatible with SDK Message type
      messages: messages,
      inferenceConfig: {
        temperature: config.BEDROCK_TEMPERATURE,
        maxTokens: config.BEDROCK_MAX_TOKENS,
      },
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: 'generate_recommendation',
              description:
                'Generate a structured recommendation with identified skill gaps and learning areas based on the conversation',
              inputSchema: {
                // Cast toolSchema as unknown first, then to the SDK's expected type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                json: toolSchema as any,
              },
            },
          },
        ],
        toolChoice: {
          tool: {
            name: 'generate_recommendation',
          },
        },
      },
    };

    Logger.debug('BedrockService.synthesize - calling ConverseCommand with forced tool use', {
      modelId: config.BEDROCK_MODEL_ID,
      toolName: 'generate_recommendation',
    });

    // Execute the ConverseCommand with forced tool use
    const command = new ConverseCommand(converseInput);
    const response = await bedrockClient.send(command);

    // Extract the response and look for toolUse block
    Logger.debug('BedrockService.synthesize - processing response', {
      hasOutput: !!response.output,
      output: response.output,
    });

    if (!response.output || !('message' in response.output)) {
      throw new BedrockError('Unexpected Bedrock response structure: missing output with content', response);
    }

    const outputContent = response.output.message?.content as ContentBlock[] | undefined;
    if (!Array.isArray(outputContent) || outputContent.length === 0) {
      throw new BedrockError('Unexpected Bedrock response structure: missing or empty content array', response.output);
    }

    // Find the toolUse block (iterate through content blocks)
    let toolUseBlock: unknown = null;
    for (const block of outputContent) {
      if (block && typeof block === 'object' && 'toolUse' in block) {
        toolUseBlock = block.toolUse;
        break;
      }
    }

    if (!toolUseBlock) {
      throw new BedrockError('Unexpected Bedrock response structure: missing toolUse block in response', outputContent);
    }

    // Validate toolUse block structure
    const toolUse = toolUseBlock as Record<string, unknown> | undefined;
    if (!toolUse || typeof toolUse !== 'object' || toolUse.name !== 'generate_recommendation') {
      throw new BedrockError(
        'Unexpected Bedrock response structure: toolUse block does not match generate_recommendation',
        toolUseBlock,
      );
    }

    // Extract the input from the toolUse block
    const toolInput = toolUse.input as unknown;
    Logger.debug('BedrockService.synthesize - tool input extracted', {
      hasInput: !!toolInput,
    });

    // Validate the tool input against RecommendationSchema
    try {
      const recommendation = RecommendationSchema.parse(toolInput);
      Logger.debug('BedrockService.synthesize - recommendation validated successfully', {
        profileSummaryLength: recommendation.profileSummary.length,
        skillGapsCount: recommendation.skillGaps.length,
        recommendationsCount: recommendation.recommendations.length,
      });

      return recommendation;
    } catch (error) {
      // Zod parsing error - throw as ValidationError with details
      Logger.error('BedrockService.synthesize - Zod validation failed', {
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      throw new ValidationError(
        'Recommendation output failed schema validation',
        error instanceof Error ? error.message : String(error),
      );
    }
  } catch (error) {
    // If error is already a ValidationError, re-throw it
    if (error instanceof ValidationError) {
      Logger.error('BedrockService.synthesize - ValidationError caught', {
        message: error.message,
        details: error.details,
      });
      throw error;
    }

    // If error is already a BedrockError, re-throw it
    if (error instanceof BedrockError) {
      Logger.error('BedrockService.synthesize - BedrockError caught', {
        message: error.message,
        cause: error.cause,
      });
      throw error;
    }

    // Wrap other errors (AWS SDK errors, parsing errors, etc.) as BedrockError
    Logger.error('BedrockService.synthesize - unexpected error', {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw new BedrockError('Bedrock synthesis call failed', error);
  }
};

export const BedrockService = {
  converse,
  synthesize,
};
