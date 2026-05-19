// src/components/PrimaryColorSetter.tsx
"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PrimaryColorSetter() {
  const { data: session } = useSession();
  const color = session?.metadata?.primary_color || "#0070f3"; // default primary color
  const colorWithOpacity = color.startsWith("#") ? `${color}80` : color;
  useEffect(() => {
    if (session?.metadata?.primary_color) {
      document.documentElement.style.setProperty(
        "--primary",
        session.metadata.primary_color,
      );
      document.documentElement.style.setProperty(
        "--secondary-foreground",
        session.metadata.primary_color,
      );
      document.documentElement.style.setProperty(
        "--ring",
        session.metadata.primary_color,
      );
      document.documentElement.style.setProperty(
        "--chart-1",
        session.metadata.primary_color,
      );
      document.documentElement.style.setProperty(
        "--sidebar-primary",
        session.metadata.primary_color,
      );
      document.documentElement.style.setProperty("--accent", colorWithOpacity);
    }
  }, [session?.metadata?.primary_color]);

  return null;
}
