import { TurnResponseSchema } from '@career-compass/shared';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

import { useSession } from '@/context/SessionContext';
import { apiClient, APIError, isAPIError } from '@/utils/api-client';

/**
 * Mutation variables for submitting a conversation turn.
 */
export interface SubmitTurnVariables {
  userMessage: string;
}

/**
 * Result type for the useSubmitTurn mutation.
 */
export interface SubmitTurnResult {
  isPending: boolean;
  mutate: (
    variables: SubmitTurnVariables,
    options?: Omit<UseMutationOptions<void, Error, SubmitTurnVariables>, 'mutationFn'>,
  ) => void;
  mutateAsync: (
    variables: SubmitTurnVariables,
    options?: Omit<UseMutationOptions<void, Error, SubmitTurnVariables>, 'mutationFn'>,
  ) => Promise<void>;
  isError: boolean;
  error: APIError | null;
}

/**
 * Custom hook for submitting a conversation turn via the API.
 * Manages the mutation state and automatically updates the session context with response data.
 *
 * Behavior:
 * - Reads sessionId from session context (null on first turn)
 * - Posts { sessionId?, userMessage } to POST /conversation/turn
 * - Validates response against TurnResponseSchema
 * - On success: updates session context atomically with returned session data and messages
 * - On synthesis response: stores recommendation in session context
 * - Surfaces errors as typed APIError objects
 *
 * @returns Mutation state with isPending and error handling
 *
 * @example
 * const { mutate, isPending, error } = useSubmitTurn();
 *
 * const handleSubmit = (userMessage: string) => {
 *   mutate({ userMessage });
 * };
 *
 * return (
 *   <button disabled={isPending} onClick={() => handleSubmit('My question')}>
 *     {isPending ? 'Sending...' : 'Send'}
 *   </button>
 * );
 */
export const useSubmitTurn = (
  options?: Omit<UseMutationOptions<void, Error, SubmitTurnVariables>, 'mutationFn'>,
): SubmitTurnResult => {
  const session = useSession();

  const mutation = useMutation<void, Error, SubmitTurnVariables>({
    mutationFn: async (variables: SubmitTurnVariables): Promise<void> => {
      // Build request body with optional sessionId
      const requestBody = {
        sessionId: session.sessionId || undefined,
        userMessage: variables.userMessage,
      };

      // Remove undefined sessionId for first turn
      if (requestBody.sessionId === undefined) {
        delete (requestBody as Partial<typeof requestBody>).sessionId;
      }

      // Send request to API
      const response = await apiClient.post<unknown>('/conversation/turn', requestBody);

      // Validate response against schema
      const validatedResponse = TurnResponseSchema.parse(response.data);

      // Atomically update session state based on response type
      if (validatedResponse.type === 'conversational') {
        session.updateState({
          sessionId: validatedResponse.sessionId,
          phase: validatedResponse.phase,
          turnCount: validatedResponse.turnCount,
          synthesisReady: validatedResponse.synthesisReady,
          messages: [
            ...session.messages,
            { role: 'user', content: variables.userMessage },
            { role: 'assistant', content: validatedResponse.assistantMessage },
          ],
        });
      } else if (validatedResponse.type === 'synthesis') {
        session.updateState({
          sessionId: validatedResponse.sessionId,
          phase: validatedResponse.phase,
          turnCount: validatedResponse.turnCount,
          recommendation: validatedResponse.recommendation,
          messages: [...session.messages, { role: 'user', content: variables.userMessage }],
        });
      }
    },
    ...options,
  });

  return {
    isPending: mutation.isPending,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isError: mutation.isError,
    error: isAPIError(mutation.error) ? mutation.error : null,
  };
};
