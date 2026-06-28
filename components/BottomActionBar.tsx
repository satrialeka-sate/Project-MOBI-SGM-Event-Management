"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { type ReactNode } from "react";

interface BottomActionBarProps {
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  children?: ReactNode;
}

export default function BottomActionBar({
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
}: BottomActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4 md:hidden">
      <div className="mx-auto flex max-w-2xl gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 text-base"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-12 flex-1 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
