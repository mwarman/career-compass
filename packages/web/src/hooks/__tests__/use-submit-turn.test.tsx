import { ConversationalResponse } from '@career-compass/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config before importing modules that depend on it
vi.mock('@/utils/config', () => ({
  config: {
    apiBaseUrl: 'http://localhost:3000',
    mode: 'development',
  },
}));

// Mock dependencies
vi.mock('@/utils/api-client');
vi.mock('@/context/session-context');

import { useSubmitTurn } from '../use-submit-turn';

import { useSession } from '@/context/session-context';
import { apiClient } from '@/utils/api-client';

// Create a test wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Helper to create a fresh mock session
const createMockSession = () => ({
  sessionId: null as string | null,
  phase: 'discovery' as const,
  turnCount: 0,
  synthesisReady: false,
  messages: [] as Array<{ role: 'user' | 'assistant'; content: string }>,
  recommendation: null,
  updateState: vi.fn(),
  resetSession: vi.fn(),
});

describe('useSubmitTurn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have initial state with no pending request', () => {
    const mockSession = createMockSession();
    vi.mocked(useSession).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(apiClient).post as any) = vi.fn();

    const { result } = renderHook(() => useSubmitTurn(), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful conversational response', async () => {
    const mockSession = createMockSession();
    vi.mocked(useSession).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(apiClient).post as any) = vi.fn();

    const mockResponse: ConversationalResponse = {
      type: 'conversational',
      sessionId: 'session-123',
      assistantMessage: 'Great question! Let me help you with that.',
      phase: 'discovery',
      turnCount: 1,
      synthesisReady: false,
    };

    vi.mocked(apiClient).post?.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useSubmitTurn(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ userMessage: 'Hello, assistant!' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(mockSession.updateState).toHaveBeenCalledWith({
      sessionId: 'session-123',
      phase: 'discovery',
      turnCount: 1,
      synthesisReady: false,
      messages: [
        { role: 'user', content: 'Hello, assistant!' },
        { role: 'assistant', content: 'Great question! Let me help you with that.' },
      ],
    });
  });

  it('should send correct request body on successful response', async () => {
    const mockSession = createMockSession();
    vi.mocked(useSession).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(apiClient).post as any) = vi.fn();

    const mockResponse: ConversationalResponse = {
      type: 'conversational',
      sessionId: 'session-123',
      assistantMessage: 'Response message',
      phase: 'discovery',
      turnCount: 1,
      synthesisReady: false,
    };

    vi.mocked(apiClient).post?.mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useSubmitTurn(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ userMessage: 'Test message' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Verify API was called correctly
    expect(vi.mocked(apiClient).post).toHaveBeenCalledWith('/conversation/turn', {
      userMessage: 'Test message',
    });
  });

  it('should send sessionId on subsequent turns', async () => {
    const mockSession = createMockSession();
    mockSession.sessionId = 'session-123';
    vi.mocked(useSession).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(apiClient).post as any) = vi.fn();

    const mockResponse: ConversationalResponse = {
      type: 'conversational',
      sessionId: 'session-123',
      assistantMessage: 'Continuing our conversation...',
      phase: 'goalElicitation',
      turnCount: 2,
      synthesisReady: false,
    };

    vi.mocked(apiClient).post?.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useSubmitTurn(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ userMessage: 'Second turn' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(vi.mocked(apiClient).post).toHaveBeenCalledWith('/conversation/turn', {
      sessionId: 'session-123',
      userMessage: 'Second turn',
    });
  });

  it('should not send sessionId on first turn', async () => {
    const mockSession = createMockSession();
    vi.mocked(useSession).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(apiClient).post as any) = vi.fn();

    const mockResponse: ConversationalResponse = {
      type: 'conversational',
      sessionId: 'session-123',
      assistantMessage: 'Welcome!',
      phase: 'discovery',
      turnCount: 1,
      synthesisReady: false,
    };

    vi.mocked(apiClient).post?.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useSubmitTurn(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ userMessage: 'First message' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(vi.mocked(apiClient).post).toHaveBeenCalledWith('/conversation/turn', {
      userMessage: 'First message',
    });
  });

  it('should mark isError when mutation fails', async () => {
    const mockSession = createMockSession();
    vi.mocked(useSession).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(apiClient).post as any) = vi.fn();

    const mockError = new Error('Network error');

    vi.mocked(apiClient).post?.mockRejectedValue(mockError);

    const { result } = renderHook(() => useSubmitTurn(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ userMessage: 'Test message' });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // When the mutation fails, isError should be true
    expect(result.current.isError).toBe(true);
  });

  it('should expose mutateAsync for promise-based usage', async () => {
    const mockSession = createMockSession();
    vi.mocked(useSession).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked(apiClient).post as any) = vi.fn();

    const mockResponse: ConversationalResponse = {
      type: 'conversational',
      sessionId: 'session-123',
      assistantMessage: 'Response',
      phase: 'discovery',
      turnCount: 1,
      synthesisReady: false,
    };

    vi.mocked(apiClient).post?.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(() => useSubmitTurn(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ userMessage: 'Test' });
    });

    expect(mockSession.updateState).toHaveBeenCalled();
  });
});
