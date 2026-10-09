import type { Ref } from 'react';

/** Read-only, scrollable, dark code box. Content is rendered as text, never as HTML. */
export function CodeBox({
  text,
  label,
  ref,
}: {
  text: string;
  label: string;
  ref?: Ref<HTMLPreElement>;
}) {
  return (
    <pre
      ref={ref}
      // Focusable so keyboard users can scroll it (WCAG: scrollable regions must be reachable).
      tabIndex={0}
      role="region"
      aria-label={label}
      className="focus-visible:outline-brand-500 max-h-[60vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {text}
    </pre>
  );
}
