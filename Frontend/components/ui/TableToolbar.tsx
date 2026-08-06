"use client";

import { Search, X, RefreshCw, ChevronDown, Calendar } from "lucide-react";
import { SortState } from "../hooks/useTableFilters";

// ── SearchBar ──────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}
export function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── FilterSelect ───────────────────────────────────────────────────────────
interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}
export function FilterSelect({ value, onChange, options, placeholder }: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

// ── DateRangeFilter ────────────────────────────────────────────────────────
interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}
export function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white py-2 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
      />
      <span className="text-gray-400 text-sm">–</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white py-2 px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
      />
    </div>
  );
}

// ── QuickDateSelect ────────────────────────────────────────────────────────
interface QuickDateSelectProps {
  onSelect: (from: string, to: string) => void;
}
export function QuickDateSelect({ onSelect }: QuickDateSelectProps) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const options = [
    { label: "Today", from: fmt(today), to: fmt(today) },
    {
      label: "Yesterday",
      from: fmt(new Date(today.getTime() - 86400000)),
      to: fmt(new Date(today.getTime() - 86400000)),
    },
    {
      label: "Last 7 days",
      from: fmt(new Date(today.getTime() - 6 * 86400000)),
      to: fmt(today),
    },
    {
      label: "Last 30 days",
      from: fmt(new Date(today.getTime() - 29 * 86400000)),
      to: fmt(today),
    },
    {
      label: "This month",
      from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: fmt(today),
    },
  ];

  return (
    <div className="relative">
      <select
        defaultValue=""
        onChange={(e) => {
          const opt = options.find((o) => o.label === e.target.value);
          if (opt) onSelect(opt.from, opt.to);
          // reset select back to placeholder
          (e.target as HTMLSelectElement).value = "";
        }}
        className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
      >
        <option value="" disabled>
          Quick date
        </option>
        {options.map((o) => (
          <option key={o.label} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

// ── ResetButton ────────────────────────────────────────────────────────────
interface ResetButtonProps {
  onClick: () => void;
  active?: boolean;
}
export function ResetButton({ onClick, active }: ResetButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Reset all filters"
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition ${
        active
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
      }`}
    >
      <RefreshCw className="h-4 w-4" />
      Reset
    </button>
  );
}

// ── SortIcon ───────────────────────────────────────────────────────────────
interface SortIconProps {
  sortState: SortState;
  column: string;
}
export function SortIcon({ sortState, column }: SortIconProps) {
  const active = sortState.key === column;
  return (
    <span className={`ml-1 inline-flex flex-col text-[9px] leading-none ${active ? "text-blue-500" : "text-gray-300"}`}>
      <span className={active && sortState.direction === "asc" ? "text-blue-600" : ""}>▲</span>
      <span className={active && sortState.direction === "desc" ? "text-blue-600" : ""}>▼</span>
    </span>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;          // total filtered records
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}
export function Pagination({ page, totalPages, pageSize, total, onPage, onPageSize }: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // generate page numbers
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{start}</span>–
          <span className="font-semibold text-gray-700">{end}</span> of{" "}
          <span className="font-semibold text-gray-700">{total}</span>
        </p>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="appearance-none rounded border border-gray-200 bg-white py-1 pl-2 pr-6 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition ${
                page === p
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  message?: string;
  colSpan?: number;
}
export function EmptyState({ message = "No records found.", colSpan = 6 }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <Search className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">{message}</p>
        </div>
      </td>
    </tr>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────
const badgeMap: Record<string, { cls: string; label?: string }> = {
  // ── Waybill statuses ─────────────────────────────────────────────────────
  "draft":        { cls: "bg-gray-100 text-gray-500",        label: "Draft"        },
  "active":       { cls: "bg-blue-50 text-blue-600",         label: "To Deliver"   },
  "to deliver":   { cls: "bg-green-50 text-green-600",       label: "To Deliver"   },
  "to manifest":  { cls: "bg-violet-50 text-violet-700",     label: "To Manifest"  },
  "outstanding":  { cls: "bg-amber-50 text-amber-600",       label: "Outstanding"  },
  "in transit":   { cls: "bg-sky-50 text-sky-600",           label: "In Transit"   },
  "delivered":    { cls: "bg-green-50 text-green-600",       label: "Delivered"    },
  "completed":    { cls: "bg-green-50 text-green-600",       label: "Completed"    },
  "failed":       { cls: "bg-red-50 text-red-500",           label: "Failed"       },
  "cancelled":    { cls: "bg-gray-100 text-gray-500",        label: "Cancelled"    },
  // ── General statuses ─────────────────────────────────────────────────────
  "inactive":     { cls: "bg-red-50 text-red-500",           label: "Inactive"     },
  "suspended":    { cls: "bg-orange-50 text-orange-500",     label: "Suspended"    },
  "closed":       { cls: "bg-gray-100 text-gray-400",        label: "Closed"       },
  "pending":      { cls: "bg-yellow-50 text-yellow-600",     label: "Pending"      },
  "returned":     { cls: "bg-orange-50 text-orange-500",     label: "Returned"     },
  "delayed":      { cls: "bg-orange-50 text-orange-500",     label: "Delayed"      },
  "available":    { cls: "bg-emerald-50 text-emerald-600",   label: "Available"    },
  "on trip":      { cls: "bg-blue-50 text-blue-600",         label: "On Trip"      },
  "offline":      { cls: "bg-gray-100 text-gray-500",        label: "Offline"      },
  "utilizing":    { cls: "bg-emerald-50 text-emerald-600",   label: "Utilizing"    },
  "in maintenance":{ cls: "bg-amber-50 text-amber-600",      label: "In Maintenance"},
  "breakdown":    { cls: "bg-red-50 text-red-500",           label: "Breakdown"    },
  "out for delivery":{ cls: "bg-sky-50 text-sky-600",        label: "Out for Delivery"},
  // ── User roles ────────────────────────────────────────────────────────────
  "super admin":       { cls: "bg-purple-50 text-purple-700",  label: "Super Admin"       },
  "administrator":     { cls: "bg-blue-50 text-blue-700",      label: "Administrator"     },
  "dispatcher":        { cls: "bg-sky-50 text-sky-700",        label: "Dispatcher"        },
  "driver":            { cls: "bg-teal-50 text-teal-700",      label: "Driver"            },
  "operation manager": { cls: "bg-orange-50 text-orange-700",  label: "Operation Manager" },
  "finance user":      { cls: "bg-emerald-50 text-emerald-700",label: "Finance User"      },
  "sales user":        { cls: "bg-pink-50 text-pink-700",      label: "Sales User"        },
  "viewer":            { cls: "bg-orange-50 text-orange-700",  label: "Operation Manager" }, // legacy
};

export function StatusBadge({ status }: { status: string }) {
  const key  = (status || "").toLowerCase();
  const entry = badgeMap[key];
  const cls   = entry?.cls   ?? "bg-gray-100 text-gray-600";
  const label = entry?.label ?? status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
