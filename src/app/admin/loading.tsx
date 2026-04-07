export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-72 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      <div className="rounded-xl border bg-white p-4 md:p-6">
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded bg-muted/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
