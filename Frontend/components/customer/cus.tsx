"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Mail, Phone, Building2, MapPin, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import AddCustomerModal from "./AddCustomerModal";
import EditCustomerModal from "./EditCustomerModal";
import {
  SearchBar,
  FilterSelect,
  ResetButton,
  SortIcon,
  Pagination,
  EmptyState,
  StatusBadge,
} from "../ui/TableToolbar";

interface Customer {
  _id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  wechat: string;
  pickupPoints: string[];
  status: "Active" | "Inactive";
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: "Active",   value: "Active"   },
  { label: "Inactive", value: "Inactive" },
];

export default function CustomersTable() {
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [isAddOpen, setIsAddOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<{ success: boolean; data: Customer[] }>(
        "/api/customers?limit=500&sort=name:asc"
      );
      setCustomers(res.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete customer "${name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
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
  } = useTableFilters<Customer>({
    data: customers,
    searchFields: ["name", "email", "contact", "address"],
    pageSize: 10,
  });

  const anyActive = hasActiveFilters;

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
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">CUSTOMERS</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Customer
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
            placeholder="Search name, email, phone, address…" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect value={filters.status} onChange={(v) => handleFilter("status", v)}
            options={STATUS_OPTIONS} placeholder="All Statuses" />
          <div className="col-span-2 sm:col-span-1">
            <ResetButton onClick={resetFilters} active={anyActive} />
          </div>
        </div>
      </div>

      {anyActive && (
        <p className="mb-3 text-xs font-medium text-blue-600">
          {filtered.length} of {total} records match current filters
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["name",    "Customer Name"],
                ["email",   "Email"],
                ["contact", "Phone"],
                ["address", "Address"],
                ["status",  "Status"],
              ] as [keyof Customer, string][]).map(([key, label]) => (
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
              <EmptyState message="No customers found." colSpan={6} />
            ) : (
              paginated.map((c, idx) => (
                <tr key={c._id}
                  className={`text-sm text-gray-700 transition-colors hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{c.email || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{c.contact || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-[240px] truncate">{c.address || "—"}</td>
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
            No customers found.
          </div>
        ) : (
          paginated.map((c) => (
            <div key={c._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-2 space-y-1.5 text-xs text-gray-600">
                {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" />{c.email}</div>}
                {c.contact && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono">{c.contact}</span></div>}
                {c.address && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />{c.address}</div>}
                {c.pickupPoints?.length > 0 && (
                  <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-gray-400" />
                    {c.pickupPoints.join(", ")}
                  </div>
                )}
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

      <AddCustomerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={fetchCustomers} />

      {editTarget && (
        <EditCustomerModal isOpen={!!editTarget} customer={editTarget}
          onClose={() => setEditTarget(null)} onUpdated={fetchCustomers} />
      )}
    </div>
  );
}
