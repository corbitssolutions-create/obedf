"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Phone, MapPin, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import AddContractorModal from "./AddContractorModal";
import EditContractorModal from "./EditContractorModal";
import {
  SearchBar,
  FilterSelect,
  ResetButton,
  SortIcon,
  Pagination,
  EmptyState,
} from "../ui/TableToolbar";

type ContractorStatus = "Active" | "Inactive" | "Suspended";

export interface Contractor {
  _id: string;
  name: string;
  companyRegistration?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  serviceRegions: string[];
  vehicleTypes: string[];
  contractStartDate?: string;
  contractEndDate?: string;
  ratePerKm?: number;
  status: ContractorStatus;
  notes?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: "Active",    value: "Active"    },
  { label: "Inactive",  value: "Inactive"  },
  { label: "Suspended", value: "Suspended" },
];

function StatusBadge({ status }: { status: ContractorStatus }) {
  const styles: Record<ContractorStatus, string> = {
    Active:    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
    Inactive:  "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
    Suspended: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function SubContractorTable() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [isAddOpen, setIsAddOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Contractor | null>(null);

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<{ success: boolean; data: Contractor[] }>(
        "/api/contractors?limit=500&sort=name:asc"
      );
      setContractors(res.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load contractors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContractors(); }, [fetchContractors]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete contractor "${name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/contractors/${id}`);
      setContractors((prev) => prev.filter((c) => c._id !== id));
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
  } = useTableFilters<Contractor>({
    data: contractors,
    searchFields: ["name", "contactPerson", "phoneNumber", "email", "address"],
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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 flex-shrink-0 text-gray-700" />
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl">
              SUB CONTRACTORS
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Contractor
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar value={rawSearch} onChange={handleSearch}
            placeholder="Search company, contact, phone…" />
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
          {filtered.length} of {total} records match current filters
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["name",           "Company Name"],
                ["contactPerson",  "Contact Person"],
                ["phoneNumber",    "Phone"],
                ["serviceRegions", "Service Regions"],
                ["contractEndDate","Agreement Expiry"],
                ["ratePerKm",      "Rate/km"],
                ["status",         "Status"],
              ] as [keyof Contractor, string][]).map(([key, label]) => (
                <th key={key} onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-100">
                  {label}<SortIcon sortState={sort} column={key} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <EmptyState message="No contractors found." colSpan={8} />
            ) : (
              paginated.map((c, idx) => (
                <tr key={c._id}
                  className={`text-sm text-gray-700 transition-colors hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-5 py-3.5">{c.contactPerson || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{c.phoneNumber || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {c.serviceRegions?.length ? c.serviceRegions.join(", ") : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{fmtDate(c.contractEndDate)}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                    {c.ratePerKm ? `R ${c.ratePerKm.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(c)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(c._id, c.name)}
                        className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">
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
          <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">
            No contractors found.
          </div>
        ) : (
          paginated.map((c) => (
            <div key={c._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-gray-500">{c.contactPerson}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                {c.phoneNumber && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-mono">{c.phoneNumber}</span>
                  </div>
                )}
                {c.serviceRegions?.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {c.serviceRegions.join(", ")}
                  </div>
                )}
                <div className="col-span-2 text-gray-400">
                  Expires: {fmtDate(c.contractEndDate)}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditTarget(c)}
                  className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  Edit
                </button>
                <button onClick={() => handleDelete(c._id, c.name)}
                  className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <AddContractorModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={fetchContractors} />

      {editTarget && (
        <EditContractorModal isOpen={!!editTarget} contractor={editTarget}
          onClose={() => setEditTarget(null)} onUpdated={fetchContractors} />
      )}
    </div>
  );
}
