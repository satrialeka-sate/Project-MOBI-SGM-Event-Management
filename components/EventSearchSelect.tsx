"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEvents } from "@/hooks/use-events";
import { Loader2, Search, Check, ChevronDown } from "lucide-react";

interface EventSearchSelectProps {
  value: string;
  onChange: (eventId: string) => void;
}

export default function EventSearchSelect({ value, onChange }: EventSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch events with debounced search
  const { data, isLoading } = useEvents({
    search: debouncedSearch || undefined,
    limit: 50,
  });

  const selectedEvent = data?.items?.find((ev) => ev.id === value);
  const events = data?.items ?? [];

  // Debounce search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < events.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : events.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < events.length) {
            const event = events[highlightedIndex];
            onChange(event.id);
            setSearchQuery("");
            setDebouncedSearch("");
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, events, highlightedIndex, onChange]
  );

  function selectEvent(eventId: string) {
    onChange(eventId);
    setSearchQuery("");
    setDebouncedSearch("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="relative">
      {/* Selected event badge or search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedEvent ? selectedEvent.venueName : "Cari event..."}
          value={isOpen || searchQuery ? searchQuery : ""}
          onChange={handleSearchChange}
          onFocus={() => {
            setIsOpen(true);
            if (selectedEvent) {
              setSearchQuery("");
              setDebouncedSearch("");
            }
          }}
          onKeyDown={handleKeyDown}
          className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Selected event info (shown when no search) */}
      {selectedEvent && !searchQuery && !isOpen && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
          <span className="font-medium">{selectedEvent.venueName}</span>
          <span className="text-green-600">
            — {formatDate(selectedEvent.eventDate)}
          </span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mencari event...
            </div>
          ) : events.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              {debouncedSearch
                ? `Tidak ada event dengan nama "${debouncedSearch}"`
                : "Tidak ada event tersedia"}
            </div>
          ) : (
            <ul className="py-1" role="listbox">
              {events.map((event, index) => {
                const isSelected = event.id === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={event.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isHighlighted
                        ? "bg-sgm-red-light/10"
                        : isSelected
                          ? "bg-sgm-red-light/5"
                          : "hover:bg-gray-50"
                    }`}
                    onClick={() => selectEvent(event.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`truncate font-medium ${
                            isSelected ? "text-sgm-red" : "text-gray-900"
                          }`}
                        >
                          {event.venueName}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 flex-shrink-0 text-sgm-red" />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDate(event.eventDate)}</span>
                        {event.regionName && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span>{event.regionName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
