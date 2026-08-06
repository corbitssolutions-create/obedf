"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MapPin, Ruler, Clock, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import RouteModal from "./RouteModal";
import {
  SearchBar, FilterSelect, ResetButton, SortIcon,
  Pagination, EmptyState, StatusBadge,
} from "../ui/TableToolbar";

export interface Route {
  _id: string;
  routeCode?: string;
  name: string;
  startPoint: string;
  destination: string;
  distanceKm?: number;
  estimatedHours?: number;
  tollCost?: number;
  status: "Active" | "Inactive";
  notes?: string;
  zone?: { _id: string; code: string; name: string } | null;
  branches?: { _id: string; code: string; name: string }[];
  driver?:   { _id: string; fullName: string; status: string } | null;
  vehicle?:  { _id: string; registrationNumber: string; status: string } | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: "Active",   value: "Active"   },
  { label: "Inactive", value: "Inactive" },
];

export default function RoutesTable() {
  const [routes, setRoutes]         = useState<Route[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [isAddOpen, setIsAddOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Route | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{ success: boolean; data: Route[] }>("/api/routes?limit=500&sort=name:asc");
      setRoutes(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Failed to load routes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete route "${name}"? This cannot be undone.`)) return;
    try { await apiDelete(`/api/routes/${id}`); setRoutes((p) => p.filter((r) => r._id !== id)); }
    catch (e: any) { alert(e.message ?? "Delete failed"); }
  };

  const { paginated, filtered, total, rawSearch, handleSearch, filters, handleFilter, sort, handleSort, page, setPage, pageSize, handlePageSize, totalPages, resetFilters, hasActiveFilters } =
    useTableFilters<Route>({ data: routes, searchFields: ["name","routeCode","startPoint","destination"], pageSize: 10 });

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">ROUTES</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
        </div>
        <button type="button" onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> New Route
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search route name, code, start point…" />
        </div>
        <FilterSelect value={filters.status} onChange={(v) => handleFilter("status", v)} options={STATUS_OPTIONS} placeholder="All Statuses" />
        <ResetButton onClick={resetFilters} active={hasActiveFilters} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["routeCode",      "Code"],
                ["name",           "Route Name"],
                ["startPoint",     "From"],
                ["destination",    "To"],
                ["distanceKm",     "Distance (km)"],
                ["estimatedHours", "Est. Time"],
                ["status",         "Status"],
              ] as [keyof Route, string][]).map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {label}<SortIcon sortState={sort} column={key} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Branches</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Driver</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Vehicle</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? <EmptyState message="No routes found." colSpan={11} /> : paginated.map((r, idx) => (
              <tr key={r._id} className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{r.routeCode || "—"}</td>
                <td className="px-5 py-3.5 font-medium">{r.name}</td>
                <td className="px-5 py-3.5">{r.startPoint}</td>
                <td className="px-5 py-3.5">{r.destination}</td>
                <td className="px-5 py-3.5 text-right font-mono text-xs text-gray-600">
                  {r.distanceKm ? r.distanceKm.toLocaleString() : "—"}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{r.estimatedHours ? `${r.estimatedHours}h` : "—"}</td>
                <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3.5">
                  {r.branches?.length ? (
                    <div className="flex flex-wrap gap-1">{r.branches.map((b) => <span key={b._id} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{b.code}</span>)}</div>
                  ) : <span className="text-xs italic text-gray-400">Any</span>}
                </td>
                <td className="px-5 py-3.5">
                  {r.driver ? <span className="text-sm text-gray-700">{r.driver.fullName}</span> : <span className="text-xs italic text-gray-400">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  {r.vehicle ? <span className="font-mono text-xs text-blue-600">{r.vehicle.registrationNumber}</span> : <span className="text-xs italic text-gray-400">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditTarget(r)} className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"><Pencil className="h-3 w-3" /> Edit</button>
                    <button onClick={() => handleDelete(r._id, r.name)} className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.map((r) => (
          <div key={r._id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-blue-600">{r.routeCode || r.name}</p>
                <p className="text-sm font-medium text-gray-900">{r.name}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />{r.startPoint} → {r.destination}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
              {r.distanceKm && <div className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono">{r.distanceKm.toLocaleString()} km</span></div>}
              {r.estimatedHours && <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono">{r.estimatedHours}h</span></div>}
            </div>
            {r.branches?.length ? <div className="mt-1 flex flex-wrap gap-1">{r.branches.map((b) => <span key={b._id} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{b.code}</span>)}</div> : null}
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditTarget(r)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
              <button onClick={() => handleDelete(r._id, r.name)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <RouteModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaved={fetchRoutes} />
      {editTarget && <RouteModal isOpen route={editTarget} onClose={() => setEditTarget(null)} onSaved={fetchRoutes} />}
    </div>
  );
}
