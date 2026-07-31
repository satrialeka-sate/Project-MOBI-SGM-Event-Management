"use client";

import { useRouter, usePathname } from "next/navigation";

const VERSIONS = [
  {
    key: "v1",
    label: "Standard",
    href: "/survey/report",
    description: "Visualisasi per pertanyaan",
  },
  {
    key: "v2",
    label: "Regional Comparison",
    href: "/survey/report-v2",
    description: "Perbandingan antar region",
  },
] as const;

export function VersionSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const currentVersion = pathname === "/survey/report-v2" ? "v2" : "v1";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
      {VERSIONS.map((v) => {
        const isActive = v.key === currentVersion;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => router.push(v.href)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 md:px-4 md:py-2.5 md:text-sm ${
              isActive
                ? "bg-sgm-red text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span
              className={`hidden font-semibold md:inline ${
                isActive ? "text-white" : "text-gray-400"
              }`}
            >
              {v.key === "v1" ? "V1" : "V2"}
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span>{v.label}</span>
              <span
                className={`text-[9px] leading-tight md:text-[10px] ${
                  isActive ? "text-white/70" : "text-gray-400"
                }`}
              >
                {v.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
