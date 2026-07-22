import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type StarRatingProps = {
  stars: number;
  className?: string;
};

export function StarRating({ stars, className }: StarRatingProps) {
  return (
    <div
      aria-label={`${stars} out of 3 stars`}
      className={cn("inline-flex min-h-8 items-center gap-1", className)}
    >
      {[1, 2, 3].map((star) => (
        <Star
          aria-hidden="true"
          className={cn(
            "size-5",
            star <= stars ? "fill-amber-400 text-amber-500" : "text-slate-300"
          )}
          key={star}
        />
      ))}
    </div>
  );
}
