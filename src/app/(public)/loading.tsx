export default function PublicLoading() {
  return (
    <div className="section-padding">
      <div className="container space-y-4">
        <div className="h-9 w-56 animate-pulse rounded bg-eco-100" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border bg-white p-4">
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
              <div className="mt-4 h-5 w-4/5 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
