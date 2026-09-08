"use client";

import { useEffect, useState } from "react";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { formatCssColor, parseCssColor } from "~/lib/branding-colors";

type BrandingColorFieldProps = {
  label: string;
  cssVar: string;
  value: string;
  placeholder: string;
  supportsAlpha?: boolean;
  onChange: (value: string) => void;
};

export function BrandingColorField({
  label,
  cssVar,
  value,
  placeholder,
  supportsAlpha = false,
  onChange,
}: BrandingColorFieldProps) {
  const parsed = parseCssColor(value || placeholder);
  const [hex, setHex] = useState(parsed.hex);
  const [alpha, setAlpha] = useState(parsed.alpha);

  useEffect(() => {
    const next = parseCssColor(value || placeholder);
    setHex(next.hex);
    setAlpha(next.alpha);
  }, [value, placeholder]);

  const emit = (nextHex: string, nextAlpha: number) => {
    onChange(formatCssColor(nextHex, nextAlpha, supportsAlpha));
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        <span className="font-mono text-[10px] text-muted-foreground">{cssVar}</span>
      </Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            setHex(e.target.value);
            emit(e.target.value, alpha);
          }}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
          aria-label={`${label} color`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 font-mono text-xs"
          placeholder={placeholder}
        />
      </div>
      {supportsAlpha && (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(alpha * 100)}
            onChange={(e) => {
              const nextAlpha = Number(e.target.value) / 100;
              setAlpha(nextAlpha);
              emit(hex, nextAlpha);
            }}
            className="h-2 flex-1 cursor-pointer accent-primary"
            aria-label={`${label} opacity`}
          />
          <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {Math.round(alpha * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
