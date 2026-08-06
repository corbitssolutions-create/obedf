"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, GripVertical } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, apiFetch } from "@/lib/api";
import { useTableFilters } from "../../hooks/useTableFilters";
import { ModalShell, Field, inputClass } from "../../ui/FormControls";
import {
  SearchBar, FilterSelect, ResetButton,
  SortIcon, Pagination, EmptyState,
} from "../../ui/TableToolbar";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Incoterm {
  _id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

const STATUS_OPTS = [
  { label: "Active",   value: "true"  },
  { label: "Inactive", value: "false" },
];

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
      ${active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function IncotermsPage() {
  const [rows,       setRows]       = useState<Incoterm[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [isAddOpen,  setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<Incoterm | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{ success: boolean; data: Incoterm[] }>(
        "/api/master/incoterms?limit=500&sort=sortOrder:asc"
      );
      setRows(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Failed to load incoterms"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete incoterm "${code}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/master/incoterms/${id}`);
      setRows(p => p.filter(r => r._id !== id));
    } catch (e: any) { alert(e.message ?? "Delete failed"); }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await apiFetch<{ success: boolean; data: Incoterm }>(
        `/api/master/incoterms/${id}/toggle-status`, { method: "PUT" }
      );
      setRows(p => p.map(r => r._id === id ? res.data : r));
    } catch (e: any) { alert(e.message ?? "Toggle failed"); }
  };

  /* filter rows by isActive */
  const [activeFilter, setActiveFilter] = useState("");

  const {
    paginated, filtered, total, rawSearch, handleSearch,
    sort, handleSort, page, setPage, pageSize, handlePageSize,
    totalPages, resetFilters, hasActiveFilters,
  } = useTableFilters<Incoterm>({
    data: activeFilter === ""
      ? rows
      : rows.filter(r => String(r.isActive) === activeFilter),
    searchFields: ["code", "name", "description"],
    pageSize: 10,
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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">INCOTERMS</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} records — manage trade terms used on Waybills
          </p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> Add Incoterm
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search code, name…" />
        </div>
        <FilterSelect
          value={activeFilter}
          onChange={v => { setActiveFilter(v); }}
          options={STATUS_OPTS}
          placeholder="All Statuses"
        />
        <ResetButton onClick={() => { resetFilters(); setActiveFilter(""); }}
          active={hasActiveFilters || activeFilter !== ""} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([ ["sortOrder","Order"], ["code","Code"], ["name","Name"],
                  ["description","Description"], ["isActive","Status"],
              ] as [keyof Incoterm, string][]).map(([k, l]) => (
                <th key={String(k)} onClick={() => handleSort(k)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {l}<SortIcon sortState={sort} column={String(k)} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <EmptyState message="No incoterms found." colSpan={6} />
              : paginated.map((row, idx) => (
                <tr key={row._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <GripVertical className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs">{row.sortOrder}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{row.code}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{row.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{row.description || "—"}</td>
                  <td className="px-5 py-3.5"><ActiveBadge active={row.isActive} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(row)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleToggle(row._id)}
                        title={row.isActive ? "Deactivate" : "Activate"}
                        className="flex items-center gap-1 rounded-md border border-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
                        {row.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
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
        {paginated.length === 0
          ? <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-400">No incoterms found.</div>
          : paginated.map(row => (
            <div key={row._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-blue-600">{row.code}</p>
                  <p className="text-sm font-medium text-gray-900">{row.name}</p>
                </div>
                <ActiveBadge active={row.isActive} />
              </div>
              {row.description && <p className="mb-2 text-xs text-gray-500">{row.description}</p>}
              <div className="flex gap-2">
                <button onClick={() => setEditTarget(row)}
                  className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleToggle(row._id)}
                  className="flex-1 rounded-lg border border-blue-100 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">
                  {row.isActive ? "Deactivate" : "Activate"}
                </button>
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

      <IncotermModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onSaved={fetchRows} />
      {editTarget && (
        <IncotermModal isOpen incoterm={editTarget} onClose={() => setEditTarget(null)} onSaved={fetchRows} />
      )}
    </div>
  );
}

/* ─── Add / Edit Modal ───────────────────────────────────────────────────── */
interface ModalProps {
  isOpen: boolean;
  incoterm?: Incoterm;
  onClose: () => void;
  onSaved: () => void;
}

function IncotermModal({ isOpen, incoterm, onClose, onSaved }: ModalProps) {
  const editing = !!incoterm;
  const [code,        setCode]       = useState(incoterm?.code        ?? "");
  const [name,        setName]       = useState(incoterm?.name        ?? "");
  const [description, setDesc]       = useState(incoterm?.description ?? "");
  const [sortOrder,   setSortOrder]  = useState(incoterm?.sortOrder   ?? 0);
  const [isActive,    setIsActive]   = useState(incoterm?.isActive    ?? true);
  const [submitting,  setSubmitting] = useState(false);
  const [error,       setError]      = useState("");

  useEffect(() => {
    setCode(incoterm?.code        ?? "");
    setName(incoterm?.name        ?? "");
    setDesc(incoterm?.description ?? "");
    setSortOrder(incoterm?.sortOrder ?? 0);
    setIsActive(incoterm?.isActive   ?? true);
    setError("");
  }, [incoterm, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) { setError("Code and Name are required."); return; }
    setSubmitting(true); setError("");
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };
      if (editing) await apiPut(`/api/master/incoterms/${incoterm!._id}`, payload);
      else         await apiPost("/api/master/incoterms", payload);
      onSaved(); onClose();
    } catch (e: any) { setError(e.message ?? "Save failed"); }
    finally { setSubmitting(false); }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="incoterm-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : editing ? "Save Changes" : "Create Incoterm"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={editing ? `Edit — ${incoterm!.code}` : "Add Incoterm"}
      footer={footer} size="max-w-lg">
      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      <form id="incoterm-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Code" required>
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. EXW" required maxLength={10} className={inputClass} />
        </Field>
        <Field label="Name" required>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Ex Works" required className={inputClass} />
        </Field>
        <Field label="Sort Order">
          <input type="number" min={0} value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            placeholder="0" className={inputClass} />
        </Field>
        <Field label="Status">
          <label className="flex cursor-pointer items-center gap-3 pt-2">
            <div onClick={() => setIsActive(p => !p)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${isActive ? "bg-blue-600" : "bg-gray-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${isActive ? "translate-x-6" : "translate-x-1"}`} />
            </div>
            <span className="text-sm text-gray-700">{isActive ? "Active" : "Inactive"}</span>
          </label>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea value={description} onChange={e => setDesc(e.target.value)}
              placeholder="e.g. Seller makes goods available at their premises."
              rows={3} className={`${inputClass} resize-none`} />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
