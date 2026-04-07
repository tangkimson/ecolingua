import { homeStats } from "@/lib/mock-content";

export function HomeStats() {
  return (
    <section className="section-padding bg-gradient-to-br from-eco-900 via-eco-800 to-eco-700 text-white">
      <div className="container grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {homeStats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center shadow-[0_20px_35px_-28px_rgba(0,0,0,0.7)] backdrop-blur"
          >
            <p className="text-4xl font-bold md:text-5xl">{item.value}</p>
            <p className="mt-2 text-sm font-medium text-eco-100">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
