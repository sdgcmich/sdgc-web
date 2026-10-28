"use client";

import { useMemo } from "react";
import { generateQRCodeSvg } from "@/lib/qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
  labelClassName?: string;
  showCardBackground?: boolean;
}

export function QRCodeDisplay({
  value,
  size = 140,
  className = "",
  label,
  labelClassName,
  showCardBackground = true,
}: QRCodeDisplayProps) {
  const svgHtml = useMemo(() => {
    return generateQRCodeSvg(value, {
      size,
      margin: 2,
      color: "#0f172a",
      background: "#ffffff",
    });
  }, [value, size]);

  return (
    <div
      className={`inline-flex flex-col items-center justify-center ${
        showCardBackground
          ? "rounded-2xl border border-border/80 bg-white p-3 shadow-2xs dark:border-border/60"
          : ""
      } ${className}`}
    >
      <div
        className="overflow-hidden rounded-lg bg-white"
        style={{ width: size, height: size }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized pure SVG generated locally from input value
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
      {label && (
        <span
          className={
            labelClassName ||
            "mt-2 text-[10px] font-mono font-medium tracking-tight text-slate-600 select-all"
          }
        >
          {label}
        </span>
      )}
    </div>
  );
}
