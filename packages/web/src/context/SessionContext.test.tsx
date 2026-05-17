import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SessionProvider, useSession } from './SessionContext';

const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

describe('SessionContext', () => {
  describe('useSession hook', () => {
    it('should throw error when used outside SessionProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSession());
      }).toThrow('useSession must be used within a SessionProvider');

      consoleError.mockRestore();
    });

    it('should initialize with default state', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.sessionId).toBeNull();
      expect(result.current.phase).toBe('discovery');
      expect(result.current.turnCount).toBe(0);
      expect(result.current.synthesisReady).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(result.current.recommendation).toBeNull();
    });

    it('should update state via updateState action', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.updateState({
          sessionId: 'session-123',
          turnCount: 1,
          phase: 'goalElicitation',
        });
      });

      expect(result.current.sessionId).toBe('session-123');
      expect(result.current.turnCount).toBe(1);
      expect(result.current.phase).toBe('goalElicitation');
    });

    it('should add messages via updateState', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      act(() => {
        result.current.updateState({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        });
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(result.current.messages[1]).toEqual({ role: 'assistant', content: 'Hi there!' });
    });

    it('should reset session state via resetSession action', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      // Set some state
      act(() => {
        result.current.updateState({
          sessionId: 'session-123',
          turnCount: 5,
          phase: 'synthesis',
          messages: [{ role: 'user', content: 'Test' }],
          synthesisReady: true,
          recommendation: {
            profileSummary: 'Test summary',
            skillGaps: [
              {
                name: 'Python',
                severity: 'high',
                rationale: 'Required for role',
              },
            ],
            recommendations: [
              {
                area: 'Python Fundamentals',
                rationale: 'Essential skill',
                resourceCategories: ['online-course'],
                estimatedEffort: 'substantial',
                estimatedTimeline: '8 weeks',
              },
            ],
          },
        });
      });

      // Verify state was updated
      expect(result.current.sessionId).toBe('session-123');
      expect(result.current.turnCount).toBe(5);
      expect(result.current.synthesisReady).toBe(true);
      expect(result.current.recommendation).not.toBeNull();

      // Reset
      act(() => {
        result.current.resetSession();
      });

      // Verify state was reset
      expect(result.current.sessionId).toBeNull();
      expect(result.current.phase).toBe('discovery');
      expect(result.current.turnCount).toBe(0);
      expect(result.current.synthesisReady).toBe(false);
      expect(result.current.messages).toEqual([]);
      expect(result.current.recommendation).toBeNull();
    });

    it('should update partial state without overwriting other fields', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      // Set initial state
      act(() => {
        result.current.updateState({
          sessionId: 'session-123',
          turnCount: 2,
          phase: 'goalElicitation',
        });
      });

      // Update only turnCount
      act(() => {
        result.current.updateState({
          turnCount: 3,
        });
      });

      // Other fields should remain unchanged
      expect(result.current.sessionId).toBe('session-123');
      expect(result.current.phase).toBe('goalElicitation');
      expect(result.current.turnCount).toBe(3);
    });

    it('should set synthesisReady flag correctly', () => {
      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.synthesisReady).toBe(false);

      act(() => {
        result.current.updateState({
          synthesisReady: true,
        });
      });

      expect(result.current.synthesisReady).toBe(true);
    });
  });
});
