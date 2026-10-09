/** Placeholder field rows shown while follow-up questions load. */
export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5 motion-safe:animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="bg-line h-4 w-2/3 rounded" />
          <div className="rounded-control bg-ground border-line h-10 border" />
        </div>
      ))}
    </div>
  );
}
