"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function DynamicFavicon() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.metadata?.icon) {
      // Update the favicon link element
      const link =
        document.querySelector("link[rel='icon']") ||
        document.createElement("link");

      link.rel = "icon";
      link.href = session.metadata.icon;

      if (!document.querySelector("link[rel='icon']")) {
        document.head.appendChild(link);
      }
    }
  }, [session?.metadata?.icon]);

  return null;
}
