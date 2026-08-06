"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface FilterState {
  search: string;
  status: string;
  dateRange: DateRange;
  [key: string]: string | DateRange;
}

interface UseTableFiltersOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  pageSize?: number;
  filterFn?: (item: T, filters: FilterState) => boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTableFilters<T extends Record<string, any>>({
  data,
  searchFields,
  pageSize: defaultPageSize = 10,
  filterFn,
}: UseTableFiltersOptions<T>) {
  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    dateRange: { from: "", to: "" },
  });
  const [sort, setSort] = useState<SortState>({ key: "", direction: null });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Debounce search 300ms
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(rawSearch.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [rawSearch]);

  const handleSearch = useCallback((value: string) => {
    setRawSearch(value);
  }, []);

  const handleFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleDateRange = useCallback((range: DateRange) => {
    setFilters((prev) => ({ ...prev, dateRange: range }));
    setPage(1);
  }, []);

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key === key) {
        const next: SortDirection =
          prev.direction === "asc" ? "desc" : prev.direction === "desc" ? null : "asc";
        return { key, direction: next };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setRawSearch("");
    setDebouncedSearch("");
    setFilters({ search: "", status: "", dateRange: { from: "", to: "" } });
    setSort({ key: "", direction: null });
    setPage(1);
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);

  const handlePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let result = [...data];

    // Search across fields
    if (debouncedSearch) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const val = item[field];
          if (val == null) return false;
          return String(val).toLowerCase().includes(debouncedSearch);
        })
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter((item) =>
        String(item["status"] ?? "").toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Date range filter — expects item.date as "DD/MM/YYYY" or "YYYY-MM-DD"
    const { from, to } = filters.dateRange;
    if (from || to) {
      result = result.filter((item) => {
        const rawDate = String(item["date"] ?? "");
        const parsed = parseDDMMYYYY(rawDate);
        if (!parsed) return true;
        if (from && parsed < new Date(from)) return false;
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          if (parsed > toDate) return false;
        }
        return true;
      });
    }

    // Custom filter function
    if (filterFn) {
      result = result.filter((item) => filterFn(item, filters));
    }

    // Sorting
    if (sort.key && sort.direction) {
      const dir = sort.direction === "asc" ? 1 : -1;
      result = result.sort((a, b) => {
        const aVal = a[sort.key];
        const bVal = b[sort.key];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * dir;
        }
        return String(aVal ?? "").localeCompare(String(bVal ?? "")) * dir;
      });
    }

    return result;
  }, [data, debouncedSearch, filters, sort, searchFields, filterFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return {
    // data
    paginated,
    filtered,
    total: data.length,
    // search
    rawSearch,
    handleSearch,
    // filters
    filters,
    handleFilter,
    handleDateRange,
    // sort
    sort,
    handleSort,
    // pagination
    page: safePage,
    setPage,
    pageSize,
    handlePageSize,
    totalPages,
    // reset
    resetFilters,
    // helpers
    hasActiveFilters:
      rawSearch !== "" ||
      filters.status !== "" ||
      filters.dateRange.from !== "" ||
      filters.dateRange.to !== "" ||
      Object.entries(filters).some(
        ([k, v]) => k !== "search" && k !== "status" && k !== "dateRange" && v !== ""
      ),
  };
}

// Parse "DD/MM/YYYY" to Date
export function parseDDMMYYYY(str: string): Date | null {
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const d = new Date(`${yyyy}-${mm}-${dd}`);
  return isNaN(d.getTime()) ? null : d;
}
