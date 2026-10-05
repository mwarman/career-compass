import { JSX } from 'react';

import { Marker, MarkerContent, MarkerIcon } from '@/components/shadcn/marker';
import { Spinner } from '@/components/shadcn/spinner';

/**
 * ReasoningIndicator component displays a status marker while the AI is processing a turn.
 * Uses the Marker component with a Spinner icon and status role for accessibility.
 *
 * This component is shown during the `isPending` state of a turn submission,
 * providing visual feedback that the system is thinking/processing.
 *
 * @returns The rendered reasoning indicator element
 */
export const ReasoningIndicator = (): JSX.Element => (
  <Marker role="status">
    <MarkerIcon>
      <Spinner />
    </MarkerIcon>
    <MarkerContent>Thinking...</MarkerContent>
  </Marker>
);
