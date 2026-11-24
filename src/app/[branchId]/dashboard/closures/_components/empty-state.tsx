"use client";

import React from "react";
import { Calendar, AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm text-center">
        {description}
      </p>
    </div>
  );
}
