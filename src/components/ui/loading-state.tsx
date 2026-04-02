import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

function SkeletonBar({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-slate-200/80",
        className,
      )}
    />
  );
}

export function LoadingState({
  className,
  title = "Loading surface",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("grid gap-6", className)}>
      <Card className="p-7 sm:p-8">
        <p className="text-sm font-semibold tracking-[0.22em] text-slate-500 uppercase">
          {title}
        </p>
        <SkeletonBar className="mt-5 h-12 w-2/3 max-w-xl" />
        <SkeletonBar className="mt-4 h-5 w-full max-w-2xl" />
        <SkeletonBar className="mt-2 h-5 w-4/5 max-w-xl" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SkeletonBar className="h-28 rounded-[1.5rem]" />
          <SkeletonBar className="h-28 rounded-[1.5rem]" />
          <SkeletonBar className="h-28 rounded-[1.5rem]" />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonBar className="h-56 rounded-[2rem]" />
        <SkeletonBar className="h-56 rounded-[2rem]" />
      </div>
    </div>
  );
}
