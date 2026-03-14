"use client";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[24px] bg-white/80 ${className}`} />;
}

export default function RestaurantLoading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ee_52%,#fffefb_100%)]">
      <div className="mobile-page mobile-page-top mobile-page-bottom-nav">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-3 w-40 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="h-11 w-11 rounded-full" />
            <SkeletonBlock className="h-11 w-11 rounded-full" />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <SkeletonBlock className="h-12 flex-1 rounded-[18px]" />
          <SkeletonBlock className="h-12 w-12 rounded-[18px]" />
        </div>

        <div className="mt-7 space-y-3">
          <SkeletonBlock className="h-5 w-36 rounded-full" />
          <SkeletonBlock className="h-3 w-48 rounded-full" />
        </div>

        <div className="mt-4 flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="min-w-[74px] space-y-2">
              <SkeletonBlock className="h-16 w-16 rounded-[20px]" />
              <SkeletonBlock className="mx-auto h-3 w-14 rounded-full" />
            </div>
          ))}
        </div>

        <SkeletonBlock className="mt-7 h-[280px] w-full rounded-[30px]" />

        <div className="mt-7 space-y-3">
          <SkeletonBlock className="h-5 w-32 rounded-full" />
          <SkeletonBlock className="h-3 w-52 rounded-full" />
        </div>

        <div className="mt-4 flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-[230px] min-w-[178px] rounded-[26px]" />
          ))}
        </div>

        <div className="mt-7 space-y-3">
          <SkeletonBlock className="h-5 w-40 rounded-full" />
          <SkeletonBlock className="h-3 w-44 rounded-full" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-[220px] rounded-[24px]" />
          ))}
        </div>
      </div>
    </main>
  );
}
