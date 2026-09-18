"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { TipsScope } from "~/components/tips/tips-scope";
import { cn } from "~/lib/utils";

export const JUMBO_WIDTH = 1016;
export const JUMBO_HEIGHT = 540;

/** Fixed 1016×540 stage, scaled to fit the viewport (letterboxed). */
export function JumboFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setScale(
        Math.min(
          window.innerWidth / JUMBO_WIDTH,
          window.innerHeight / JUMBO_HEIGHT,
        ),
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <TipsScope className="flex h-svh w-svw items-center justify-center overflow-hidden bg-black!">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden tips-bg",
          className,
        )}
        style={{
          width: JUMBO_WIDTH,
          height: JUMBO_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </TipsScope>
  );
}
