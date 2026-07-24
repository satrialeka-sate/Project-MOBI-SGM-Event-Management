"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatDateRange(from: Date | undefined, to: Date | undefined): string {
  if (!from && !to) return "";
  if (from && !to) {
    return from.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (from && to) {
    const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
    if (sameMonth) {
      return `${from.getDate()} ${MONTH_NAMES[from.getMonth()].slice(0, 3)} ${from.getFullYear()} - ${to.getDate()} ${MONTH_NAMES[to.getMonth()].slice(0, 3)} ${to.getFullYear()}`;
    }
    return `${from.getDate()} ${MONTH_NAMES[from.getMonth()].slice(0, 3)} ${from.getFullYear()} - ${to.getDate()} ${MONTH_NAMES[to.getMonth()].slice(0, 3)} ${to.getFullYear()}`;
  }
  return "";
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(date: Date, from: Date | undefined, to: Date | undefined) {
  if (!from || !to) return false;
  return date > from && date < to;
}

function isStartOrEnd(date: Date, from: Date | undefined, to: Date | undefined) {
  if (from && isSameDay(date, from)) return true;
  if (to && isSameDay(date, to)) return true;
  return false;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Props ─────────────────────────────────────────────────────────────
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// DATE RANGE PICKER
// ═══════════════════════════════════════════════════════════════════════
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pilih Periode",
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [hoverDate, setHoverDate] = useState<Date | undefined>();
  const pickerRef = useRef<HTMLDivElement>(null);

  const { from, to } = value;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDayClick = useCallback((day: Date) => {
    if (selecting === "start") {
      onChange({ from: day, to: undefined });
      setSelecting("end");
    } else {
      // If clicking before the start date, swap
      if (from && day < from) {
        onChange({ from: day, to: from });
      } else {
        onChange({ from: from, to: day });
      }
      setSelecting("start");
      setIsOpen(false);
    }
  }, [selecting, from, onChange]);

  const handleDayHover = useCallback((day: Date) => {
    if (selecting === "end") {
      setHoverDate(day);
    }
  }, [selecting]);

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const displayText = from
    ? formatDateRange(from, to)
    : "";

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow focus:border-sgm-red focus:outline-none focus:ring-2 focus:ring-sgm-red/20"
      >
        <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
        <span className={`flex-1 text-left ${displayText ? "text-gray-900" : "text-gray-400"}`}>
          {displayText || placeholder}
        </span>
        {from && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ from: undefined, to: undefined });
              setSelecting("start");
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            &times;
          </button>
        )}
      </button>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 origin-top animate-[fadeIn_0.2s_ease-out]">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5">
            {/* Month Navigation */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-semibold text-gray-900">
                {MONTH_NAMES[month]} {year}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day Names */}
            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {DAY_NAMES.map((name) => (
                <div
                  key={name}
                  className="flex h-8 items-center justify-center text-[10px] font-medium uppercase tracking-wider text-gray-400"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {/* Empty cells for days before the first */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 w-full" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                date.setHours(0, 0, 0, 0);
                const isToday = isSameDay(date, today);
                const isSelected = isStartOrEnd(date, from, to);
                const inRange = isInRange(date, from, to) || (selecting === "end" && from && hoverDate && !to && ((date > from && date <= hoverDate) || (date < from && date >= hoverDate)));
                const isStart = from && isSameDay(date, from);
                const isEnd = to && isSameDay(date, to);
                let cellStyle = "flex h-9 w-full items-center justify-center text-xs rounded-lg transition-colors cursor-pointer select-none ";

                if (isSelected) {
                  cellStyle += "bg-sgm-red text-white font-semibold shadow-sm ";
                } else if (inRange) {
                  cellStyle += "bg-sgm-red-light text-gray-700 ";
                } else if (isToday) {
                  cellStyle += "text-sgm-red font-semibold hover:bg-gray-100 ";
                } else {
                  cellStyle += "text-gray-700 hover:bg-gray-100 ";
                }

                // Rounded edges for range
                if (isStart) {
                  cellStyle += "rounded-r-none ";
                }
                if (isEnd) {
                  cellStyle += "rounded-l-none ";
                }
                if (inRange && !isStart && !isEnd) {
                  cellStyle += "rounded-none ";
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    onMouseEnter={() => handleDayHover(date)}
                    className={cellStyle}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  onChange({ from: undefined, to: undefined });
                  setSelecting("start");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-sgm-red px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sgm-red-dark transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
