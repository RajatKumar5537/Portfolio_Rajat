"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ScrollRestorer ensures that whenever the page route changes,
 * any lingering body/document locks or disabled scroll styles from modals
 * are immediately and unconditionally removed without requiring a full page refresh.
 */
export default function ScrollRestorer() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.touchAction = "";
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("position");
      document.body.style.removeProperty("top");
      document.body.style.removeProperty("width");
      document.body.style.removeProperty("height");
      document.body.style.removeProperty("touch-action");

      document.documentElement.style.overflow = "";
      document.documentElement.style.position = "";
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("position");
    }
  }, [pathname]);

  return null;
}
