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
import { BedrockMessage } from '@career-compass/shared';

import { BedrockError } from '../errors/bedrock-error';
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

    if (!response.output || !('content' in response.output)) {
      throw new BedrockError('Unexpected Bedrock response structure: missing output with content', response);
    }

    const outputContent = response.output.content as ContentBlock[] | undefined;
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

export const BedrockService = {
  converse,
};
