import Image from "next/image";
import { cn } from "@/lib/utils";
import logoImage from "../../../logo_ecolingua.png";

type EcoLinguaLogoProps = {
  size?: "sm" | "md" | "lg";
  framed?: boolean;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

const sizeClasses: Record<NonNullable<EcoLinguaLogoProps["size"]>, string> = {
  sm: "size-10",
  md: "size-14",
  lg: "size-24"
};

export function EcoLinguaLogo({ size = "md", framed = false, priority = false, className, imageClassName }: EcoLinguaLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        sizeClasses[size],
        framed && "rounded-full bg-white/90 p-1.5 shadow-sm ring-1 ring-black/5",
        className
      )}
      aria-hidden="true"
    >
      <Image src={logoImage} alt="" fill priority={priority} sizes="(max-width: 768px) 56px, 96px" className={cn("object-contain", imageClassName)} />
    </span>
  );
}
