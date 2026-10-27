"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Windowing for fixed-height table rows. Returns the slice [start, end) to render and a
 * scroll handler for the scroll container. Scroll updates are coalesced to one per frame.
 */
export function useVirtualRows(containerRef: RefObject<HTMLElement | null>, count: number, rowHeight: number, overscan = 6) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(800);

  // The scroll container unmounts while there are no rows, so re-attach the observer when that flips.
  const empty = count === 0;
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setViewport(entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, empty]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const next = e.currentTarget.scrollTop;
      requestAnimationFrame(() => setScrollTop(next));
    },
    [],
  );

  const first = Math.floor(scrollTop / rowHeight);
  const start = Math.max(0, first - overscan);
  const end = Math.min(count, first + Math.ceil(viewport / rowHeight) + overscan);
  return { start, end, onScroll };
}
