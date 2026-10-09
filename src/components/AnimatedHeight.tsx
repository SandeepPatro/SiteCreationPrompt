import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Animates its height to match its content instead of jumping. Disabled under reduced motion. */
export function AnimatedHeight({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="overflow-hidden transition-[height] duration-250 ease-out motion-reduce:transition-none"
      style={{ height }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
