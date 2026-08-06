"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, User, Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import AddPodModal from "./AddPodModal";
import EditPodModal from "./EditPodModal";
import {
  SearchBar, FilterSelect, DateRangeFilter, QuickDateSelect,
  ResetButton, SortIcon, Pagination, EmptyState, StatusBadge,
} from "../ui/TableToolbar";

export interface POD {
  _id: string;
  waybillNo: string;
  waybill?: { waybillNo: string; sender: string; receiver: string };
  driver?: { _id: string; fullName: string } | null;
  driverName?: string;
  receiverName: string;
  deliveryDate: string;
  deliveryTime?: string;
  status: "Pending" | "Captured" | "Verified" | "Disputed";
  notes?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: "Pending",   value: "Pending"   },
  { label: "Captured",  value: "Captured"  },
  { label: "Verified",  value: "Verified"  },
  { label: "Disputed",  value: "Disputed"  },
];

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PodTable() {
  const [pods, setPods]             = useState<POD[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [isAddOpen, setIsAddOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<POD | null>(null);

  const fetchPods = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<{ success: boolean; data: POD[] }>(
        "/api/pod?limit=500&sort=deliveryDate:desc"
      );
      setPods(res.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load PODs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPods(); }, [fetchPods]);

  const handleDelete = async (id: string, waybillNo: string) => {
    if (!confirm(`Delete POD for waybill "${waybillNo}"?`)) return;
    try {
      await apiDelete(`/api/pod/${id}`);
      setPods((prev) => prev.filter((p) => p._id !== id));
    } catch (e: any) {
      alert(e.message ?? "Delete failed");
    }
  };

  const {
    paginated, filtered, total,
    rawSearch, handleSearch,
    filters, handleFilter, handleDateRange,
    sort, handleSort,
    page, setPage, pageSize, handlePageSize, totalPages,
    resetFilters, hasActiveFilters,
  } = useTableFilters<POD>({
    data: pods,
    searchFields: ["waybillNo", "receiverName", "driverName"],
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
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-700" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">POD & RETURNS</h1>
            <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
          </div>
        </div>
        <button type="button" onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> Add POD
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search waybill no, receiver, driver…" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect value={filters.status} onChange={(v) => handleFilter("status", v)}
            options={STATUS_OPTIONS} placeholder="All Statuses" />
          <div className="col-span-2 sm:col-span-1">
            <QuickDateSelect onSelect={(from, to) => handleDateRange({ from, to })} />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DateRangeFilter
            from={filters.dateRange.from} to={filters.dateRange.to}
            onFromChange={(v) => handleDateRange({ ...filters.dateRange, from: v })}
            onToChange={(v) => handleDateRange({ ...filters.dateRange, to: v })} />
          <ResetButton onClick={resetFilters} active={hasActiveFilters} />
        </div>
      </div>

      {hasActiveFilters && (
        <p className="mb-3 text-xs font-medium text-blue-600">{filtered.length} of {total} records match filters</p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["waybillNo",    "Waybill No."],
                ["receiverName", "Receiver"],
                ["driverName",   "Driver"],
                ["deliveryDate", "Delivery Date"],
                ["deliveryTime", "Time"],
                ["status",       "Status"],
              ] as [keyof POD, string][]).map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {label}<SortIcon sortState={sort} column={key} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <EmptyState message="No POD records found." colSpan={7} />
            ) : (
              paginated.map((p, idx) => (
                <tr key={p._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{p.waybillNo}</td>
                  <td className="px-5 py-3.5 font-medium">{p.receiverName}</td>
                  <td className="px-5 py-3.5">{p.driverName || p.driver?.fullName || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500">{fmtDate(p.deliveryDate)}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{p.deliveryTime || "—"}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(p)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(p._id, p.waybillNo)}
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
          <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">No POD records found.</div>
        ) : (
          paginated.map((p) => (
            <div key={p._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-mono text-sm font-semibold text-blue-600">{p.waybillNo}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm font-medium text-gray-900">{p.receiverName}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" />{p.driverName || p.driver?.fullName || "—"}</div>
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" />{fmtDate(p.deliveryDate)}</div>
                {p.deliveryTime && <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono">{p.deliveryTime}</span></div>}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditTarget(p)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleDelete(p._id, p.waybillNo)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <AddPodModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={fetchPods} />
      {editTarget && (
        <EditPodModal isOpen={!!editTarget} pod={editTarget}
          onClose={() => setEditTarget(null)} onUpdated={fetchPods} />
      )}
    </div>
  );
}
