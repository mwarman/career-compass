import { ConversationPhase, Recommendation } from '@career-compass/shared';
import { JSX, ReactNode, createContext, useContext, useState } from 'react';

/**
 * Client-side message structure for the session.
 * Separate from Bedrock message structure to keep frontend state simple.
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Client-side session state managed by React Context.
 * Tracks conversation progress, messages, and recommendation output.
 * Not persisted to localStorage — fresh session on page refresh.
 */
export interface ClientSessionState {
  /** Unique session identifier, null on first turn */
  sessionId: string | null;
  /** Current conversation phase */
  phase: ConversationPhase;
  /** Sequential turn number in the conversation */
  turnCount: number;
  /** Whether sufficient information has been gathered for recommendations */
  synthesisReady: boolean;
  /** Conversation message history */
  messages: Message[];
  /** Generated recommendation output, null until synthesis phase completes */
  recommendation: Recommendation | null;
}

/**
 * Session actions for state management.
 */
export interface SessionActions {
  /** Update part or all of the session state */
  updateState: (updates: Partial<ClientSessionState>) => void;
  /** Reset all session state to initial values */
  resetSession: () => void;
}

/**
 * Combined session context type extending state and actions.
 */
type SessionContextType = ClientSessionState & SessionActions;

/**
 * React Context for session state.
 */
const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * Initial session state.
 */
const INITIAL_STATE: ClientSessionState = {
  sessionId: null,
  phase: 'discovery',
  turnCount: 0,
  synthesisReady: false,
  messages: [],
  recommendation: null,
};

/**
 * SessionProvider component.
 * Wraps the application and provides session state to all child components.
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 */
export const SessionProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [state, setState] = useState<ClientSessionState>(INITIAL_STATE);

  const updateState = (updates: Partial<ClientSessionState>): void => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetSession = (): void => {
    setState(INITIAL_STATE);
  };

  const value: SessionContextType = {
    ...state,
    updateState,
    resetSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

/**
 * Hook to access session state and actions.
 * Must be used within a SessionProvider.
 *
 * @returns Session state and actions
 * @throws Error if used outside SessionProvider
 */
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
