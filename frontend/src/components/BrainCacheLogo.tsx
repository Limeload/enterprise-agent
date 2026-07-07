"use client";

import Image from "next/image";

interface MarkProps {
  size?: number;
  className?: string;
}

export function BCMark({ size = 32, className = "" }: MarkProps) {
  return (
    <Image
      src="/braincache.png"
      alt="Brain Cache"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

interface LogoProps {
  variant?: "mark" | "full";
  size?: number;
  className?: string;
}

export default function BrainCacheLogo({ variant = "full", size = 32, className = "" }: LogoProps) {
  if (variant === "mark") return <BCMark size={size} className={className} />;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BCMark size={size} />
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">
          <span className="text-copy-primary">Brain</span>
          <span className="text-bc-accent">Cache</span>
        </span>
        <span className="text-[9px] font-medium tracking-[0.08em] uppercase text-bc-teal mt-0.5 hidden sm:block">
          Store Knowledge. Retrieve Intelligence.
        </span>
      </div>
    </div>
  );
}
