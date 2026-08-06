"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Truck, User, Hash, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import AddVehicleModal from "./AddVehicleModal";
import EditVehicleModal from "./EditVehicleModal";
import {
  SearchBar, FilterSelect, ResetButton, SortIcon,
  Pagination, EmptyState, StatusBadge,
} from "../ui/TableToolbar";

export interface Vehicle {
  _id: string;
  vehicleCode?: string;
  registrationNumber: string;
  fleetNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  vehicleType?: any;
  fuelType?: any;
  capacityKg?: number;
  capacity?: number;
  status: "Active" | "In Maintenance" | "Breakdown" | "Inactive";
  currentDriver?: { _id: string; fullName: string } | null;
  branches?: { _id: string; code: string; name: string }[];
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: "Active",          value: "Active"         },
  { label: "In Maintenance",  value: "In Maintenance" },
  { label: "Breakdown",       value: "Breakdown"      },
  { label: "Inactive",        value: "Inactive"       },
];

export default function VehiclesList() {
  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [isAddOpen, setIsAddOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<{ success: boolean; data: Vehicle[] }>(
        "/api/vehicles?limit=500&sort=registrationNumber:asc"
      );
      setVehicles(res.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleDelete = async (id: string, reg: string) => {
    if (!confirm(`Delete vehicle "${reg}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
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
  } = useTableFilters<Vehicle>({
    data: vehicles,
    searchFields: ["registrationNumber", "fleetNumber", "make", "model", "vehicleType"],
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">VEHICLES</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
        </div>
        <button type="button" onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> New Vehicle
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search reg, make, fleet…" />
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
        <p className="mb-3 text-xs font-medium text-blue-600">{filtered.length} of {total} records match filters</p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[780px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["registrationNumber","Registration"],
                ["fleetNumber",       "Fleet No."],
                ["make",              "Make"],
                ["vehicleType",       "Type"],
                ["capacityKg",        "Capacity (kg)"],
                ["status",            "Status"],
              ] as [keyof Vehicle, string][]).map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {label}<SortIcon sortState={sort} column={key} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Driver</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Branches</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <EmptyState message="No vehicles found." colSpan={8} />
            ) : (
              paginated.map((v, idx) => (
                <tr key={v._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{v.registrationNumber}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{v.fleetNumber || "—"}</td>
                  <td className="px-5 py-3.5 font-medium">{v.make || "—"}{v.model ? ` ${v.model}` : ""}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {typeof v.vehicleType === "object" ? (v.vehicleType as any)?.name : v.vehicleType || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-gray-600">
                    {v.capacityKg ? v.capacityKg.toLocaleString() : (v.capacity ? v.capacity.toLocaleString() : "—")}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={v.status} /></td>
                  <td className="px-5 py-3.5">
                    {v.currentDriver?.fullName
                      ? <span className="text-blue-600">{v.currentDriver.fullName}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {v.branches && v.branches.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {v.branches.map((b) => (
                          <span key={b._id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
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
                      <button onClick={() => setEditTarget(v)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(v._id, v.registrationNumber)}
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
          <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">No vehicles found.</div>
        ) : (
          paginated.map((v) => (
            <div key={v._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-mono text-sm font-semibold text-blue-600">{v.registrationNumber}</p>
                <StatusBadge status={v.status} />
              </div>
              <p className="text-sm font-medium text-gray-900">{v.make} {v.model}</p>
              <p className="text-xs text-gray-500">{v.vehicleType}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono">{v.fleetNumber || "—"}</span></div>
                <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-gray-400" />{v.capacity ? `${v.capacity.toLocaleString()} kg` : "—"}</div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {v.currentDriver?.fullName ? <span className="text-blue-600">{v.currentDriver.fullName}</span> : <span className="text-gray-400">Unassigned</span>}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditTarget(v)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleDelete(v._id, v.registrationNumber)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <AddVehicleModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={fetchVehicles} />
      {editTarget && (
        <EditVehicleModal isOpen={!!editTarget} vehicle={editTarget}
          onClose={() => setEditTarget(null)} onUpdated={fetchVehicles} />
      )}
    </div>
  );
}
