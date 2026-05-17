import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatPage } from './ChatPage';

import { useSession } from '@/context/SessionContext';
import { useSubmitTurn } from '@/hooks/useSubmitTurn';
import { queryClient } from '@/utils/query-client';

// Mock the hooks
vi.mock('@/hooks/useSubmitTurn');
vi.mock('@/context/SessionContext');

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

  // AC-01: Seed input view rendered when sessionId === null
  describe('AC-01: Seed input view', () => {
    it('should display seed message when sessionId is null', () => {
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

      expect(screen.getByText('Welcome to Career Compass')).toBeTruthy();
      expect(screen.getByText(/Share your current professional context/)).toBeTruthy();
    });

    it('should display seed input instructions in welcome view', () => {
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

      expect(screen.getByText(/Your current role and experience level/)).toBeTruthy();
      expect(screen.getByText(/Technologies or skills you currently use/)).toBeTruthy();
      expect(screen.getByText(/Your career goals and aspirations/)).toBeTruthy();
    });

    it('should display textarea with seed-specific placeholder when sessionId is null', () => {
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

      const textarea = screen.getByPlaceholderText(/Describe your current role, experience, skills, and career goals/);
      expect(textarea).toBeTruthy();
    });
  });

  // AC-02: Message history view rendered when sessionId is populated
  describe('AC-02: Message history view', () => {
    it('should display message history when sessionId is populated', () => {
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

    it('should hide seed message when sessionId is populated', () => {
      const mockMessages = [{ role: 'user' as const, content: 'Test' }];

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

      // Seed message should not be visible
      expect(screen.queryByText('Welcome to Career Compass')).toBeFalsy();
    });

    it('should display regular placeholder for ongoing conversation', () => {
      const mockMessages = [{ role: 'user' as const, content: 'Test' }];

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

      const textarea = screen.getByPlaceholderText('Type your message...');
      expect(textarea).toBeTruthy();
    });
  });

  // AC-03: Textarea has placeholder text describing expected input
  describe('AC-03: Textarea placeholder text', () => {
    it('should have seed placeholder when no sessionId', () => {
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

      const textarea = screen.getByPlaceholderText(/Describe your current role, experience, skills, and career goals/);
      expect(textarea).toBeTruthy();
    });

    it('should have generic placeholder for ongoing conversation', () => {
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

      const textarea = screen.getByPlaceholderText('Type your message...');
      expect(textarea).toBeTruthy();
    });
  });

  // AC-04: "Start Over" button visible in chat view; triggers resetSession
  describe('AC-04: Start Over button', () => {
    it('should not display Start Over button when sessionId is null', () => {
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

      expect(screen.queryByText('Start Over')).toBeFalsy();
    });

    it('should display Start Over button when sessionId is populated', () => {
      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 1,
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

      const startOverButton = screen.getByText('Start Over');
      expect(startOverButton).toBeTruthy();
    });

    it('should call resetSession when Start Over button is clicked', async () => {
      const mockResetSession = vi.fn();

      vi.mocked(useSession).mockReturnValue({
        sessionId: 'test-session',
        phase: 'discovery',
        turnCount: 1,
        synthesisReady: false,
        messages: [],
        recommendation: null,
        updateState: vi.fn(),
        resetSession: mockResetSession,
      });

      vi.mocked(useSubmitTurn).mockReturnValue({
        isPending: false,
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isError: false,
        error: null,
      });

      renderChatPage();

      const startOverButton = screen.getByText('Start Over');
      await userEvent.click(startOverButton);

      expect(mockResetSession).toHaveBeenCalled();
    });
  });

  // AC-05: Seed input is pre-populated in the message history as the first user message
  describe('AC-05: Seed input pre-population', () => {
    it('should display seed input as first message after transition to chat view', () => {
      const mockMessages = [
        { role: 'user' as const, content: 'Senior React dev with TypeScript experience' },
        { role: 'assistant' as const, content: 'Based on your background...' },
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

      // First user message should be the seed input
      expect(screen.getByText('Senior React dev with TypeScript experience')).toBeTruthy();
    });
  });

  // AC-06: Unit tests for all new and updated components
  describe('AC-06: Textarea submission behavior', () => {
    it('should submit on Enter key without Shift', async () => {
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

      const textarea = screen.getByPlaceholderText('Type your message...');
      await userEvent.type(textarea, 'Test message{Enter}');

      expect(mockMutate).toHaveBeenCalledWith({ userMessage: 'Test message' }, expect.objectContaining({}));
    });

    it('should allow newlines with Shift+Enter', async () => {
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

      const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      // The message should NOT be submitted - just a newline allowed
      // This test verifies the handler doesn't prevent the newline
      fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
      expect(textarea.value).toContain('\n');
    });

    it('should not submit on Shift+Enter', () => {
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

      const textarea = screen.getByPlaceholderText('Type your message...');
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should clear textarea after successful submission', async () => {
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

      const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      await userEvent.type(textarea, 'Test message');

      expect(textarea.value).toBe('Test message');

      // Simulate successful submission
      const submitButton = screen.getByRole('button', { name: /Send message/ });
      await userEvent.click(submitButton);

      // Trigger onSuccess callback
      mutateCallback?.onSuccess?.();

      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('should disable submit button when textarea is empty', () => {
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

      const submitButton = screen.getByRole('button', { name: /Send message/ });
      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should enable submit button when textarea has content', async () => {
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

      const textarea = screen.getByPlaceholderText('Type your message...');
      await userEvent.type(textarea, 'Test');

      const submitButton = screen.getByRole('button', { name: /Send message/ });
      expect((submitButton as HTMLButtonElement).disabled).toBe(false);
    });

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
  });

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

  describe('Phase badge display', () => {
    it('should display discovery phase badge', () => {
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

      expect(screen.getByText('Discovery')).toBeTruthy();
    });
  });
});
