import type { Ref } from 'react';

const HEADING = /^#{1,6} /;

/**
 * Read-only, scrollable, dark code box. Content is rendered as React text, never as HTML.
 * Markdown heading lines get the accent colour; the text itself is unchanged (copy uses the prompt string).
 */
export function CodeBox({
  text,
  label,
  ref,
}: {
  text: string;
  label: string;
  ref?: Ref<HTMLPreElement>;
}) {
  const lines = text.split('\n');
  return (
    <pre
      ref={ref}
      // Focusable so keyboard users can scroll it (WCAG: scrollable regions must be reachable).
      tabIndex={0}
      role="region"
      aria-label={label}
      className="rounded-control bg-code-bg text-code-ink focus-visible:outline-accent max-h-[60vh] overflow-auto border border-black/10 p-4 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10"
    >
      {lines.map((line, i) => {
        const end = i < lines.length - 1 ? '\n' : '';
        return HEADING.test(line) ? (
          <span key={i} className="text-code-heading font-bold">
            {line}
            {end}
          </span>
        ) : (
          line + end
        );
      })}
    </pre>
  );
}
