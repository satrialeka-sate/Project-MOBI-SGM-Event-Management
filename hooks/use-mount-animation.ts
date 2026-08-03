"use client";

import { useEffect, useState } from "react";

/**
 * Returns `false` on the first render, then `true` on the next animation
 * frame. Use it to trigger one-shot CSS entrance animations (e.g. growing
 * bars, circular progress sweeps) right after a component mounts.
 */
export function useMountAnimation(): boolean {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return animated;
}
