import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export default function EmptyState({
  title = "No data found",
  description = "There are no records to display yet.",
  actionLabel,
  actionHref,
  actionOnClick,
}: EmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-6 py-16">
      <ClipboardList className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="mb-1 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 max-w-xs text-center text-sm text-gray-500">{description}</p>
      {actionLabel && actionHref && (
        <Button onClick={() => router.push(actionHref)}>{actionLabel}</Button>
      )}
      {actionLabel && !actionHref && actionOnClick && (
        <Button onClick={actionOnClick}>{actionLabel}</Button>
      )}
    </div>
  );
}
