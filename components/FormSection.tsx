import { type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  invalid?: boolean;
  errorMessage?: string;
}

export default function FormSection({
  title,
  description,
  children,
  invalid,
  errorMessage,
}: FormSectionProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm md:p-6 ${
        invalid ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        {invalid && errorMessage && (
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
