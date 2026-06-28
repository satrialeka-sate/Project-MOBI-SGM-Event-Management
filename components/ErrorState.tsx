"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-white px-6 py-16">
      <AlertTriangle className="mb-4 h-12 w-12 text-red-400" />
      <h3 className="mb-1 text-base font-semibold text-gray-900">Error</h3>
      <p className="mb-6 text-sm text-gray-500">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
