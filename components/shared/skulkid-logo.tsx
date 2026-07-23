import Image from "next/image";
import { cn } from "@/lib/utils";

export function SkulKidLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return <Image
    alt="SkulKid"
    className={cn("h-auto w-36 object-contain", className)}
    height={590}
    priority={priority}
    src="/brand/skulkid-logo.png"
    width={1678}
  />;
}
