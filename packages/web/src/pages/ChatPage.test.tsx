import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatPage } from './ChatPage';

import { useSession } from '@/context/session-context';
import { useSubmitTurn } from '@/hooks/use-submit-turn';
import { queryClient } from '@/utils/query-client';

// Mock the hooks
vi.mock('@/hooks/use-submit-turn');
vi.mock('@/context/session-context');

/**
 * Render helper for ChatPage with required providers.
 * Note: SessionProvider is NOT used since we're mocking useSession directly.
 */
const renderChatPage = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatPage />
    </QueryClientProvider>,
  );
};

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-01: Message history scrolls; new messages auto-scroll to bottom
  describe('AC-01: Message history scrolling and auto-scroll', () => {
    it('should display message history in scrollable container', () => {
      const mockMessages = [
        { role: 'user' as const, content: 'What should I learn?' },
        { role: 'assistant' as const, content: 'Based on your goals...' },
      ];

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 2,
        synthesisReady: false,
        messages: mockMessages,
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      // Verify messages are rendered
      expect(screen.getByText('What should I learn?')).toBeTruthy();
      expect(screen.getByText('Based on your goals...')).toBeTruthy();

      // Verify message list has log role for accessibility
      const messageList = screen.getByRole('log');
      expect(messageList).toBeTruthy();
    });

    it('should auto-scroll to bottom on new messages', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const mockMessages = [
        { role: 'user' as const, content: 'Question 1' },
        { role: 'assistant' as const, content: 'Answer 1' },
      ];

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 2,
        synthesisReady: false,
        messages: mockMessages,
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      // Wait for scroll to be called
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });

  // AC-02: User and assistant messages are visually distinct
  describe('AC-02: Message visual distinction', () => {
    it('should display user messages right-aligned with different styling', async () => {
      const mockMessages = [{ role: 'user' as const, content: 'User message' }];

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 1,
        synthesisReady: false,
        messages: mockMessages,
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const userMessage = screen.getByText('User message');
      const bubbleContainer = userMessage.closest('.rounded-lg');

      // User messages should have primary background
      expect(bubbleContainer?.className).toContain('bg-primary');
    });

    it('should display assistant messages left-aligned with different styling', async () => {
      const mockMessages = [{ role: 'assistant' as const, content: 'Assistant message' }];

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 1,
        synthesisReady: false,
        messages: mockMessages,
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const assistantMessage = screen.getByText('Assistant message');
      const bubbleContainer = assistantMessage.closest('.rounded-lg');

      // Assistant messages should have muted background
      expect(bubbleContainer?.className).toContain('bg-muted');
    });
  });

  // AC-03: Submit button disabled and shows loading state while isPending is true
  describe('AC-03: Submit button loading state', () => {
    it('should disable submit button when isPending is true', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: true,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const submitButton = screen.getByRole('button', { name: /Sending message/ });
      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should show loading text when isPending is true', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: true,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      expect(screen.getByText('Sending...')).toBeTruthy();
    });

    it('should enable submit button when isPending is false', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'Test message' } });

      const submitButton = screen.getByRole('button', { name: /Send message/ });
      expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    });
  });

  // AC-04: Phase badge updates when phase changes in session context
  describe('AC-04: Phase badge updates', () => {
    it('should display discovery phase badge with neutral styling', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const badge = screen.getByText('Discovery');
      expect(badge.className).toContain('bg-neutral-200');
    });

    it('should display goalElicitation phase badge with blue styling', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'goalElicitation',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const badge = screen.getByText('Goal Elicitation');
      expect(badge.className).toContain('bg-blue-200');
    });

    it('should display synthesis phase badge with green styling', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'synthesis',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const badge = screen.getByText('Synthesis');
      expect(badge.className).toContain('bg-green-200');
    });
  });

  // AC-05: Enter key in the input field triggers submission (in addition to button click)
  describe('AC-05: Keyboard submission', () => {
    it('should submit on Enter key press', async () => {
      const mockMutate = vi.fn();

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const input = screen.getByPlaceholderText('Type your message...');
      await userEvent.type(input, 'Test message{Enter}');

      expect(mockMutate).toHaveBeenCalledWith({ userMessage: 'Test message' }, expect.objectContaining({}));
    });

    it('should not submit on Shift+Enter', async () => {
      const mockMutate = vi.fn();

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should submit on button click', async () => {
      const mockMutate = vi.fn();

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const input = screen.getByPlaceholderText('Type your message...');
      await userEvent.type(input, 'Test message');

      const submitButton = screen.getByRole('button', { name: /Send message/ });
      await userEvent.click(submitButton);

      expect(mockMutate).toHaveBeenCalledWith({ userMessage: 'Test message' }, expect.any(Object));
    });
  });

  // AC-06: Input clears after successful submission
  describe('AC-06: Input clearing after submission', () => {
    it('should clear input after successful submission', async () => {
      let mutateCallback: { onSuccess?: () => void } | undefined;

      const mockMutate = vi.fn((_variables, options: { onSuccess?: () => void }) => {
        mutateCallback = options;
      });

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: mockMutate,
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const input = screen.getByPlaceholderText('Type your message...') as HTMLInputElement;
      await userEvent.type(input, 'Test message');

      expect(input.value).toBe('Test message');

      // Simulate successful submission
      const submitButton = screen.getByRole('button', { name: /Send message/ });
      await userEvent.click(submitButton);

      // Trigger onSuccess callback
      mutateCallback?.onSuccess?.();

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  // Additional test: Empty state message
  describe('Empty state', () => {
    it('should display guidance when no messages', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: null,
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      expect(screen.getByText('Start a conversation to receive career guidance.')).toBeTruthy();
    });
  });

  // Additional test: Error display
  describe('Error handling', () => {
    it('should display error message when error exists', () => {
      const mockError: { message: string; status: number } = {
        message: 'Failed to send message',
        status: 500,
      };

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 0,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: vi.fn(),
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: true,
        error: mockError,
      } as unknown as ReturnType<typeof useSubmitTurn>);

      renderChatPage();

      expect(screen.getByText('Failed to send message')).toBeTruthy();
    });
  });
});
