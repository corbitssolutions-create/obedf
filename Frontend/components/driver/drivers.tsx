"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Phone, IdCard, Car, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import AddDriverModal from "./AddDriverModal";
import EditDriverModal from "./EditDriverModal";
import {
  SearchBar,
  FilterSelect,
  ResetButton,
  SortIcon,
  Pagination,
  EmptyState,
  StatusBadge,
} from "../ui/TableToolbar";

export interface Driver {
  _id: string;
  employeeId?: string;
  fullName: string;
  idNumber?: string;
  licenseNumber: string;
  licenseType?: string;
  licenseExpiry?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  status: "Available" | "On Trip" | "Offline" | "Suspended";
  currentVehicle?: { _id: string; registrationNumber: string } | null;
  branches?: { _id: string; code: string; name: string }[];
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: "Available",  value: "Available"  },
  { label: "On Trip",    value: "On Trip"    },
  { label: "Offline",    value: "Offline"    },
  { label: "Suspended",  value: "Suspended"  },
];

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-ZA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isExpired(iso?: string) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export default function DriversTable() {
  const [drivers, setDrivers]       = useState<Driver[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [isAddOpen, setIsAddOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Driver | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<{ success: boolean; data: Driver[] }>(
        "/api/drivers?limit=500&sort=fullName:asc"
      );
      setDrivers(res.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete driver "${name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/drivers/${id}`);
      setDrivers((prev) => prev.filter((d) => d._id !== id));
    } catch (e: any) {
      alert(e.message ?? "Delete failed");
    }
  };

  const {
    paginated, filtered, total,
    rawSearch, handleSearch,
    filters, handleFilter,
    sort, handleSort,
    page, setPage, pageSize, handlePageSize, totalPages,
    resetFilters, hasActiveFilters,
  } = useTableFilters<Driver>({
    data: drivers,
    searchFields: ["fullName", "employeeId", "licenseNumber", "phoneNumber", "email", "idNumber"],
    pageSize: 10,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">DRIVERS</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
        </div>
        <button type="button" onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> New Driver
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
      )}

      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search name, license, phone…" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect value={filters.status} onChange={(v) => handleFilter("status", v)}
            options={STATUS_OPTIONS} placeholder="All Statuses" />
          <div className="col-span-2 sm:col-span-1">
            <ResetButton onClick={resetFilters} active={hasActiveFilters} />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <p className="mb-3 text-xs font-medium text-blue-600">
          {filtered.length} of {total} records match filters
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["fullName",      "Driver Name"],
                ["employeeId",    "Employee ID"],
                ["phoneNumber",   "Phone"],
                ["licenseNumber", "License No."],
                ["licenseExpiry", "License Expiry"],
                ["status",        "Status"],
              ] as [keyof Driver, string][]).map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {label}<SortIcon sortState={sort} column={key} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Vehicle</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Branches</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <EmptyState message="No drivers found." colSpan={9} />
            ) : (
              paginated.map((d, idx) => (
                <tr key={d._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{d.fullName}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{d.employeeId || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{d.phoneNumber || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{d.licenseNumber}</td>
                  <td className={`px-5 py-3.5 font-mono text-xs ${isExpired(d.licenseExpiry) ? "text-red-500 font-semibold" : "text-gray-600"}`}>
                    {fmtDate(d.licenseExpiry)}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3.5 font-mono text-xs text-blue-600">
                    {d.currentVehicle?.registrationNumber || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {d.branches && d.branches.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {d.branches.map((b) => (
                          <span key={b._id}
                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {b.code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs italic text-gray-400">Any</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(d)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(d._id, d.fullName)}
                        className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">No drivers found.</div>
        ) : (
          paginated.map((d) => (
            <div key={d._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{d.fullName}</p>
                  <p className="text-xs text-gray-500">{d.employeeId || d.licenseNumber}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                {d.phoneNumber && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono">{d.phoneNumber}</span></div>}
                {d.currentVehicle && <div className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono text-blue-600">{d.currentVehicle.registrationNumber}</span></div>}
                <div className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5 text-gray-400" />{d.licenseNumber}</div>
                <div className={`flex items-center gap-1.5 ${isExpired(d.licenseExpiry) ? "text-red-500 font-semibold" : ""}`}>
                  <CalendarClock className="h-3.5 w-3.5 text-gray-400" />{fmtDate(d.licenseExpiry)}
                </div>
              </div>
              {d.branches && d.branches.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.branches.map((b) => (
                    <span key={b._id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {b.code} — {b.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditTarget(d)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleDelete(d._id, d.fullName)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <AddDriverModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={fetchDrivers} />
      {editTarget && (
        <EditDriverModal isOpen={!!editTarget} driver={editTarget}
          onClose={() => setEditTarget(null)} onUpdated={fetchDrivers} />
      )}
    </div>
  );
}
