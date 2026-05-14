import { default as MarkdownToJsx } from 'markdown-to-jsx';
import { JSX } from 'react';

/**
 * Markdown component for rendering Markdown content.
 * @param param0 - Component props
 * @param param0.children - Markdown content to render
 * @param param0.className - Optional CSS class for styling
 * @returns JSX element containing rendered Markdown
 */
export const Markdown = ({ children, className }: React.ComponentPropsWithoutRef<'div'>): JSX.Element => {
  return (
    <div className={className}>
      <MarkdownToJsx>{children}</MarkdownToJsx>
    </div>
  );
};
