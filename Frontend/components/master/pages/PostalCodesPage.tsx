"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, MapPin, Building2, Search } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useTableFilters } from "../../hooks/useTableFilters";
import { ModalShell, Field, Select, inputClass } from "../../ui/FormControls";
import { SearchBar, FilterSelect, ResetButton, SortIcon, Pagination, EmptyState, StatusBadge } from "../../ui/TableToolbar";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface PostalCode {
  _id: string;
  code: string;
  suburb?: string;
  city?: string;
  province?: string;
  branchCode?: { _id: string; code: string; name: string } | null;
  status: string;
}

interface LookupItem { _id: string; label: string; }

const STATUS_OPTS = [
  { label: "Active",   value: "Active"   },
  { label: "Inactive", value: "Inactive" },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function PostalCodesPage() {
  const [rows,       setRows]       = useState<PostalCode[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [isAddOpen,  setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<PostalCode | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{ success: boolean; data: PostalCode[] }>(
        "/api/master/postal-codes?limit=500&sort=code:asc"
      );
      setRows(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Failed to load postal codes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete postal code "${code}"?`)) return;
    try {
      await apiDelete(`/api/master/postal-codes/${id}`);
      setRows(p => p.filter(r => r._id !== id));
    } catch (e: any) { alert(e.message ?? "Delete failed"); }
  };

  const {
    paginated, filtered, total, rawSearch, handleSearch,
    filters, handleFilter, sort, handleSort,
    page, setPage, pageSize, handlePageSize, totalPages,
    resetFilters, hasActiveFilters,
  } = useTableFilters<PostalCode>({
    data: rows,
    searchFields: ["code", "suburb", "city", "province"],
    pageSize: 15,
  });

  if (loading) return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">POSTAL CODES</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} records — each postal code is assigned to a Branch for automatic TO Branch determination
          </p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> Add Postal Code
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p>
          <span className="font-semibold">Branch Assignment:</span> When creating a Waybill, the receiver's postal code
          is used to automatically determine the <strong>TO Branch</strong>. Assign each postal code to its
          servicing branch here.
        </p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search code, suburb, city…" />
        </div>
        <FilterSelect value={String(filters.status ?? "")} onChange={v => handleFilter("status", v)}
          options={STATUS_OPTS} placeholder="All Statuses" />
        <ResetButton onClick={resetFilters} active={hasActiveFilters} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["code",    "Postal Code"],
                ["suburb",  "Suburb"],
                ["city",    "City"],
                ["province","Province"],
              ] as [keyof PostalCode, string][]).map(([k, l]) => (
                <th key={k} onClick={() => handleSort(k)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {l}<SortIcon sortState={sort} column={k} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Branch (TO Branch)
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 w-24">Status</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <EmptyState message="No postal codes found." colSpan={7} />
              : paginated.map((row, idx) => (
                <tr key={row._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{row.code}</td>
                  <td className="px-5 py-3.5">{row.suburb || "—"}</td>
                  <td className="px-5 py-3.5">{row.city || "—"}</td>
                  <td className="px-5 py-3.5">{row.province || "—"}</td>
                  <td className="px-5 py-3.5">
                    {row.branchCode ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700">
                          {row.branchCode.code}
                        </span>
                        <span className="text-gray-700">{row.branchCode.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                        <MapPin className="h-3.5 w-3.5" /> Not assigned
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={row.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(row)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(row._id, row.code)}
                        className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.map(row => (
          <div key={row._id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-blue-600">{row.code}</p>
                <p className="text-xs text-gray-500">{[row.suburb, row.city, row.province].filter(Boolean).join(", ")}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <p className="mb-2 text-xs text-gray-600">
              Branch: {row.branchCode
                ? `${row.branchCode.code} — ${row.branchCode.name}`
                : <span className="text-amber-600">Not assigned</span>}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setEditTarget(row)}
                className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
              <button onClick={() => handleDelete(row._id, row.code)}
                className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <PostalCodeModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onSaved={fetchRows} />
      {editTarget && (
        <PostalCodeModal isOpen postalCode={editTarget}
          onClose={() => setEditTarget(null)} onSaved={fetchRows} />
      )}
    </div>
  );
}

/* ─── Add / Edit Modal ───────────────────────────────────────────────────── */
interface ModalProps {
  isOpen: boolean;
  postalCode?: PostalCode;
  onClose: () => void;
  onSaved: () => void;
}

function PostalCodeModal({ isOpen, postalCode, onClose, onSaved }: ModalProps) {
  const editing = !!postalCode;

  const [code,       setCode]      = useState(postalCode?.code     ?? "");
  const [suburb,     setSuburb]    = useState(postalCode?.suburb   ?? "");
  const [city,       setCity]      = useState(postalCode?.city     ?? "");
  const [province,   setProvince]  = useState(postalCode?.province ?? "");
  const [branchId,   setBranchId]  = useState(
    postalCode?.branchCode?._id ?? ""
  );
  const [status,     setStatus]    = useState(postalCode?.status   ?? "Active");
  const [branches,   setBranches]  = useState<LookupItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]     = useState("");

  useEffect(() => {
    if (!isOpen) return;
    apiGet<any>("/api/branches/lookup").then(r => {
      setBranches((r.data || []).map((b: any) => ({
        _id:   b._id,
        label: `${b.code} — ${b.name}`,
      })));
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    setCode(postalCode?.code     ?? "");
    setSuburb(postalCode?.suburb ?? "");
    setCity(postalCode?.city     ?? "");
    setProvince(postalCode?.province ?? "");
    setBranchId(postalCode?.branchCode?._id ?? "");
    setStatus(postalCode?.status ?? "Active");
    setError("");
  }, [postalCode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError("Postal code is required."); return; }
    setSubmitting(true); setError("");
    try {
      const payload = {
        code:       code.trim(),
        suburb:     suburb.trim()   || undefined,
        city:       city.trim()     || undefined,
        province:   province.trim() || undefined,
        branchCode: branchId        || null,
        status,
      };
      if (editing) await apiPut(`/api/master/postal-codes/${postalCode!._id}`, payload);
      else         await apiPost("/api/master/postal-codes", payload);
      onSaved(); onClose();
    } catch (e: any) { setError(e.message ?? "Save failed"); }
    finally { setSubmitting(false); }
  };

  const PROVINCES = ["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape"];

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="pc-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : editing ? "Save Changes" : "Add Postal Code"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={editing ? `Edit — ${postalCode!.code}` : "Add Postal Code"}
      footer={footer} size="max-w-lg">
      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      <form id="pc-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Postal Code" required>
          <input type="text" value={code} onChange={e => setCode(e.target.value)}
            placeholder="e.g. 2000" required maxLength={10} className={inputClass} />
        </Field>
        <Field label="Suburb">
          <input type="text" value={suburb} onChange={e => setSuburb(e.target.value)}
            placeholder="e.g. Sandton" className={inputClass} />
        </Field>
        <Field label="City">
          <input type="text" value={city} onChange={e => setCity(e.target.value)}
            placeholder="e.g. Johannesburg" className={inputClass} />
        </Field>
        <Field label="Province">
          <Select value={province} onChange={setProvince}
            placeholder="— Select province —" options={PROVINCES} />
        </Field>

        {/* KEY FIELD: Branch assignment for TO Branch determination */}
        <div className="sm:col-span-2">
          <Field label="Servicing Branch (determines TO Branch on Waybill)">
            <Select
              value={branchId}
              onChange={setBranchId}
              placeholder="— Select branch —"
              options={branches.map(b => ({ label: b.label, value: b._id }))}
            />
          </Field>
          <p className="mt-1.5 text-xs text-gray-500">
            When a Waybill receiver has this postal code, the system will automatically
            assign the selected branch as the TO Branch.
          </p>
        </div>

        <Field label="Status">
          <Select value={status} onChange={setStatus}
            placeholder="Select status"
            options={["Active","Inactive"]} />
        </Field>
      </form>
    </ModalShell>
  );
}
