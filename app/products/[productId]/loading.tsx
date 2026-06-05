export default function ProductDetailLoading() {
  return (
    <section className="bg-[#f7f7f5] pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <div className="mb-8 h-5 w-36 animate-pulse rounded bg-stone-200" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
          <div className="aspect-[4/3] min-h-[360px] animate-pulse rounded-lg bg-stone-200" />
          <div>
            <div className="h-8 w-32 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-6 h-12 w-full animate-pulse rounded bg-stone-200" />
            <div className="mt-3 h-12 w-4/5 animate-pulse rounded bg-stone-200" />
            <div className="mt-5 h-6 w-40 animate-pulse rounded bg-stone-200" />
            <div className="mt-8 space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-stone-200" />
            </div>
            <div className="mt-8 space-y-3">
              <div className="h-14 w-full animate-pulse rounded-lg bg-stone-200" />
              <div className="h-14 w-full animate-pulse rounded-lg bg-stone-200" />
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-7 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-lg bg-stone-200"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
