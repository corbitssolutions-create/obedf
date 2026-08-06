"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, apiFetch } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import {
  SearchBar, FilterSelect, ResetButton,
  SortIcon, Pagination, EmptyState, StatusBadge,
} from "../ui/TableToolbar";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";

/* ─── Column definition ──────────────────────────────────────────────────── */
export interface ColDef<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  width?: string;
}

/* ─── Field definition for the Add/Edit form ─────────────────────────────── */
export type FieldType =
  | "text" | "email" | "number" | "textarea"
  | "date" | "select" | "boolean";

export interface FormFieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: (string | { label: string; value: string })[];
  defaultValue?: any;
  /** Function to derive extra option list from API at runtime */
  loadOptions?: () => Promise<{ label: string; value: string }[]>;
}

/* ─── CrudPage props ─────────────────────────────────────────────────────── */
interface CrudPageProps<T extends { _id: string; status?: string }> {
  title: string;
  subtitle?: string;
  apiPath: string;             // e.g. "/api/master/zones"
  columns: ColDef<T>[];
  formFields: FormFieldDef[];
  searchFields?: (keyof T | string)[];
  canToggleStatus?: boolean;
  addLabel?: string;
  emptyMsg?: string;
}

const STATUS_OPTS = [
  { label: "Active",   value: "Active"   },
  { label: "Inactive", value: "Inactive" },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function CrudPage<T extends { _id: string; status?: string }>({
  title, subtitle, apiPath, columns, formFields,
  searchFields = [], canToggleStatus = true,
  addLabel = "Add New", emptyMsg,
}: CrudPageProps<T>) {
  const [rows, setRows]           = useState<T[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [isAddOpen, setAddOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<T | null>(null);
  const [dynOpts, setDynOpts]     = useState<Record<string, { label: string; value: string }[]>>({});

  /* load dynamic option lists once */
  useEffect(() => {
    formFields.forEach(async (f) => {
      if (f.loadOptions) {
        const opts = await f.loadOptions().catch(() => []);
        setDynOpts((prev) => ({ ...prev, [f.key]: opts }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{ success: boolean; data: T[] }>(`${apiPath}?limit=500&sort=name:asc`);
      setRows(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Load failed"); }
    finally { setLoading(false); }
  }, [apiPath]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    try { await apiDelete(`${apiPath}/${id}`); setRows((p) => p.filter((r) => r._id !== id)); }
    catch (e: any) { alert(e.message ?? "Delete failed"); }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await apiFetch<{ success: boolean; data: T }>(`${apiPath}/${id}/toggle-status`, { method: "PUT" });
      setRows((p) => p.map((r) => r._id === id ? res.data : r));
    } catch (e: any) { alert(e.message ?? "Toggle failed"); }
  };

  const {
    paginated, filtered, total,
    rawSearch, handleSearch,
    filters, handleFilter,
    sort, handleSort,
    page, setPage, pageSize, handlePageSize, totalPages,
    resetFilters, hasActiveFilters,
  } = useTableFilters<T>({ data: rows, searchFields: searchFields as any, pageSize: 10 });

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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle ?? `${total} records`}</p>}
          {!subtitle && <p className="mt-0.5 text-sm text-gray-500">{total} records</p>}
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs"><SearchBar value={rawSearch} onChange={handleSearch} /></div>
        <FilterSelect value={filters.status} onChange={(v) => handleFilter("status", v)} options={STATUS_OPTS} placeholder="All Statuses" />
        <ResetButton onClick={resetFilters} active={hasActiveFilters} />
      </div>

      {hasActiveFilters && (
        <p className="mb-3 text-xs font-medium text-blue-600">{filtered.length} of {total} match</p>
      )}

      {/* Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {columns.map((col) => (
                <th key={String(col.key)}
                  onClick={() => col.sortable !== false && handleSort(col.key as any)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100"
                  style={col.width ? { width: col.width } : {}}>
                  {col.label}<SortIcon sortState={sort} column={String(col.key)} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <EmptyState message={emptyMsg ?? `No ${title.toLowerCase()} found.`} colSpan={columns.length + 1} />
              : paginated.map((row, idx) => (
                <tr key={row._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-3.5">
                      {col.render
                        ? col.render(row)
                        : col.key === "status"
                          ? <StatusBadge status={String((row as any)[col.key] ?? "")} />
                          : String((row as any)[col.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(row)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      {canToggleStatus && (
                        <button onClick={() => handleToggle(row._id)}
                          title="Toggle status"
                          className="flex items-center gap-1 rounded-md border border-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
                          {row.status === "Active"
                            ? <ToggleRight className="h-3.5 w-3.5" />
                            : <ToggleLeft className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <button onClick={() => handleDelete(row._id)}
                        className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0
          ? <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-400">{emptyMsg ?? `No ${title.toLowerCase()} found.`}</div>
          : paginated.map((row) => (
            <div key={row._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {columns.slice(0, 2).map((col) => (
                    <p key={String(col.key)} className="truncate text-sm font-semibold text-gray-900">
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? "—")}
                    </p>
                  ))}
                </div>
                {row.status && <StatusBadge status={row.status} />}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
                {columns.slice(2, 5).map((col) => (
                  <div key={String(col.key)}>
                    <span className="font-medium text-gray-600">{col.label}: </span>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? "—")}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditTarget(row)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleDelete(row._id)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))
        }
      </div>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      {/* Add modal */}
      <CrudFormModal
        isOpen={isAddOpen}
        title={`Add ${title}`}
        fields={formFields}
        dynOpts={dynOpts}
        onClose={() => setAddOpen(false)}
        onSubmit={async (data) => {
          await apiPost(apiPath, data);
          await fetchRows();
          setAddOpen(false);
        }}
      />

      {/* Edit modal */}
      {editTarget && (
        <CrudFormModal
          isOpen
          title={`Edit ${title}`}
          fields={formFields}
          dynOpts={dynOpts}
          initialData={editTarget as any}
          onClose={() => setEditTarget(null)}
          onSubmit={async (data) => {
            await apiPut(`${apiPath}/${editTarget._id}`, data);
            await fetchRows();
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Generic form modal ─────────────────────────────────────────────────── */
interface CrudFormModalProps {
  isOpen: boolean;
  title: string;
  fields: FormFieldDef[];
  dynOpts: Record<string, { label: string; value: string }[]>;
  initialData?: Record<string, any>;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
}

function CrudFormModal({ isOpen, title, fields, dynOpts, initialData, onClose, onSubmit }: CrudFormModalProps) {
  const buildInitial = () => {
    const init: Record<string, any> = {};
    fields.forEach((f) => {
      init[f.key] = initialData?.[f.key] ?? f.defaultValue ?? (f.type === "boolean" ? false : "");
    });
    return init;
  };

  const [values, setValues] = useState<Record<string, any>>(buildInitial);
  const [submitting, setSub] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => { setValues(buildInitial()); setError(""); }, [initialData, isOpen]);

  const set = (key: string, val: any) => setValues((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSub(true); setError("");
    try {
      // Remove empty strings so optional fields don't overwrite with ""
      const payload: Record<string, any> = {};
      Object.entries(values).forEach(([k, v]) => {
        if (v !== "" && v !== undefined && v !== null) payload[k] = v;
      });
      await onSubmit(payload);
    } catch (e: any) { setError(e.message ?? "Save failed"); }
    finally { setSub(false); }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="crud-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : "Save"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
      <form id="crud-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const opts = dynOpts[f.key] ?? (f.options as any) ?? [];
          return (
            <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
              <Field label={f.label} required={f.required}>
                {f.type === "textarea" ? (
                  <textarea value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder} rows={3} className={`${inputClass} resize-none`} />
                ) : f.type === "select" ? (
                  <Select value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)}
                    placeholder={`Select ${f.label}`} options={opts} required={f.required} />
                ) : f.type === "boolean" ? (
                  <label className="flex cursor-pointer items-center gap-2 pt-2">
                    <input type="checkbox" checked={!!values[f.key]}
                      onChange={(e) => set(f.key, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-600">Yes</span>
                  </label>
                ) : (
                  <input type={f.type} value={values[f.key] ?? ""}
                    onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                    placeholder={f.placeholder} required={f.required} className={inputClass} />
                )}
              </Field>
            </div>
          );
        })}
      </form>
    </ModalShell>
  );
}
