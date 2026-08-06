"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, StarOff } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, apiFetch } from "@/lib/api";
import { useTableFilters } from "../../hooks/useTableFilters";
import { ModalShell, Field, Select, inputClass } from "../../ui/FormControls";
import {
  SearchBar, FilterSelect, ResetButton,
  SortIcon, Pagination, EmptyState,
} from "../../ui/TableToolbar";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ExtraCharge {
  _id: string;
  chargeCode: string;
  chargeName: string;
  description?: string;
  chargeType: "Fixed" | "Percentage";
  defaultAmount: number;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  status: string;
}

const STATUS_OPTS = [
  { label: "Active",   value: "true"  },
  { label: "Inactive", value: "false" },
];

const DEFAULT_OPTS = [
  { label: "Default",     value: "true"  },
  { label: "Non-default", value: "false" },
];

/* ─── Small badge helpers ────────────────────────────────────────────────── */
function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
      ${active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DefaultBadge({ isDefault }: { isDefault: boolean }) {
  return isDefault ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Default
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-400">
      Manual
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ExtraChargesPage() {
  const [rows,       setRows]       = useState<ExtraCharge[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [isAddOpen,  setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<ExtraCharge | null>(null);

  /* filters */
  const [activeFilter,  setActiveFilter]  = useState("");
  const [defaultFilter, setDefaultFilter] = useState("");

  const fetchRows = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{ success: boolean; data: ExtraCharge[] }>(
        "/api/master/extra-charges?limit=500&sort=sortOrder:asc"
      );
      setRows(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Failed to load extra charges"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  /* ── Filter data client-side for isActive / isDefault ── */
  const filteredData = rows.filter(r => {
    if (activeFilter  !== "" && String(r.isActive)  !== activeFilter)  return false;
    if (defaultFilter !== "" && String(r.isDefault) !== defaultFilter) return false;
    return true;
  });

  const {
    paginated, filtered, total, rawSearch, handleSearch,
    sort, handleSort, page, setPage, pageSize, handlePageSize,
    totalPages, resetFilters, hasActiveFilters,
  } = useTableFilters<ExtraCharge>({
    data: filteredData,
    searchFields: ["chargeCode", "chargeName", "description"],
    pageSize: 10,
  });

  /* ── Actions ── */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete extra charge "${name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/master/extra-charges/${id}`);
      setRows(p => p.filter(r => r._id !== id));
    } catch (e: any) { alert(e.message ?? "Delete failed"); }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await apiFetch<{ success: boolean; data: ExtraCharge }>(
        `/api/master/extra-charges/${id}/toggle-status`, { method: "PUT" }
      );
      setRows(p => p.map(r => r._id === id ? res.data : r));
    } catch (e: any) { alert(e.message ?? "Toggle failed"); }
  };

  const handleToggleDefault = async (id: string) => {
    try {
      const res = await apiFetch<{ success: boolean; data: ExtraCharge }>(
        `/api/master/extra-charges/${id}/toggle-default`, { method: "PUT" }
      );
      setRows(p => p.map(r => r._id === id ? res.data : r));
    } catch (e: any) { alert(e.message ?? "Toggle default failed"); }
  };

  const handleReset = () => {
    resetFilters();
    setActiveFilter("");
    setDefaultFilter("");
  };

  const defaultCount = rows.filter(r => r.isDefault && r.isActive).length;

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
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">EXTRA CHARGES</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} records &mdash;
            <span className="ml-1 font-medium text-amber-600">{defaultCount} auto-loaded on new Waybills</span>
          </p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> Add Extra Charge
        </button>
      </div>

      {/* Info banner */}
      <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span className="font-semibold">How it works:</span> Charges marked as{" "}
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Default
        </span>{" "}
        and <span className="font-semibold">Active</span> are automatically added to every new Waybill.
        Users can still edit or remove them per Waybill.
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search code, name…" />
        </div>
        <FilterSelect value={activeFilter}  onChange={setActiveFilter}
          options={STATUS_OPTS}  placeholder="All Statuses" />
        <FilterSelect value={defaultFilter} onChange={setDefaultFilter}
          options={DEFAULT_OPTS} placeholder="All Types" />
        <ResetButton onClick={handleReset}
          active={hasActiveFilters || activeFilter !== "" || defaultFilter !== ""} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([
                ["sortOrder",    "#"],
                ["chargeCode",   "Code"],
                ["chargeName",   "Charge Name"],
                ["chargeType",   "Type"],
                ["defaultAmount","Default Amount"],
                ["isDefault",    "Auto-load"],
                ["isActive",     "Status"],
              ] as [keyof ExtraCharge, string][]).map(([k, l]) => (
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
              ? <EmptyState message="No extra charges found." colSpan={8} />
              : paginated.map((row, idx) => (
                <tr key={row._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{row.sortOrder}</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{row.chargeCode}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{row.chargeName}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${row.chargeType === "Percentage"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-blue-50 text-blue-700"}`}>
                      {row.chargeType === "Percentage" ? "% Percentage" : "R Fixed"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm">
                    {row.chargeType === "Percentage"
                      ? `${row.defaultAmount}%`
                      : `R ${row.defaultAmount.toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3.5"><DefaultBadge isDefault={row.isDefault} /></td>
                  <td className="px-5 py-3.5"><ActiveBadge active={row.isActive} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditTarget(row)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleToggleDefault(row._id)}
                        title={row.isDefault ? "Remove from defaults" : "Add to defaults"}
                        className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                          ${row.isDefault
                            ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                        {row.isDefault
                          ? <Star    className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          : <StarOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => handleToggleActive(row._id)}
                        title={row.isActive ? "Deactivate" : "Activate"}
                        className="flex items-center gap-1 rounded-md border border-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
                        {row.isActive
                          ? <ToggleRight className="h-3.5 w-3.5" />
                          : <ToggleLeft  className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => handleDelete(row._id, row.chargeName)}
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
          ? <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-400">No extra charges found.</div>
          : paginated.map(row => (
            <div key={row._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-blue-600">{row.chargeCode}</p>
                  <p className="text-sm font-medium text-gray-900">{row.chargeName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ActiveBadge active={row.isActive} />
                  <DefaultBadge isDefault={row.isDefault} />
                </div>
              </div>
              <p className="mb-1 text-xs text-gray-500">
                {row.chargeType === "Percentage" ? `${row.defaultAmount}%` : `R ${row.defaultAmount.toFixed(2)}`}
                {" · "}{row.chargeType}
              </p>
              {row.description && <p className="mb-2 text-xs text-gray-400">{row.description}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEditTarget(row)}
                  className="rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
                <button onClick={() => handleToggleDefault(row._id)}
                  className="rounded-lg border border-amber-100 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50">
                  {row.isDefault ? "Remove Default" : "Set Default"}
                </button>
                <button onClick={() => handleToggleActive(row._id)}
                  className="rounded-lg border border-blue-100 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">
                  {row.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => handleDelete(row._id, row.chargeName)}
                  className="rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <ExtraChargeModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onSaved={fetchRows} />
      {editTarget && (
        <ExtraChargeModal isOpen charge={editTarget}
          onClose={() => setEditTarget(null)} onSaved={fetchRows} />
      )}
    </div>
  );
}

/* ─── Add / Edit Modal ───────────────────────────────────────────────────── */
interface ModalProps {
  isOpen: boolean;
  charge?: ExtraCharge;
  onClose: () => void;
  onSaved: () => void;
}

function ExtraChargeModal({ isOpen, charge, onClose, onSaved }: ModalProps) {
  const editing = !!charge;

  const [chargeCode,     setChargeCode]     = useState(charge?.chargeCode     ?? "");
  const [chargeName,     setChargeName]     = useState(charge?.chargeName     ?? "");
  const [description,    setDescription]    = useState(charge?.description    ?? "");
  const [chargeType,     setChargeType]     = useState<"Fixed"|"Percentage">(charge?.chargeType ?? "Fixed");
  const [defaultAmount,  setDefaultAmount]  = useState(charge?.defaultAmount  ?? 0);
  const [sortOrder,      setSortOrder]      = useState(charge?.sortOrder      ?? 0);
  const [isDefault,      setIsDefault]      = useState(charge?.isDefault      ?? false);
  const [isActive,       setIsActive]       = useState(charge?.isActive       ?? true);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState("");

  useEffect(() => {
    setChargeCode(   charge?.chargeCode    ?? "");
    setChargeName(   charge?.chargeName    ?? "");
    setDescription(  charge?.description   ?? "");
    setChargeType(   charge?.chargeType    ?? "Fixed");
    setDefaultAmount(charge?.defaultAmount ?? 0);
    setSortOrder(    charge?.sortOrder     ?? 0);
    setIsDefault(    charge?.isDefault     ?? false);
    setIsActive(     charge?.isActive      ?? true);
    setError("");
  }, [charge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeCode.trim() || !chargeName.trim()) {
      setError("Charge Code and Charge Name are required.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      const payload = {
        chargeCode:    chargeCode.trim().toUpperCase(),
        chargeName:    chargeName.trim(),
        description:   description.trim() || undefined,
        chargeType,
        defaultAmount: Number(defaultAmount) || 0,
        sortOrder:     Number(sortOrder)     || 0,
        isDefault,
        isActive,
        status:        isActive ? "Active" : "Inactive",
      };
      if (editing) await apiPut(`/api/master/extra-charges/${charge!._id}`, payload);
      else         await apiPost("/api/master/extra-charges", payload);
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
      <button type="submit" form="ec-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : editing ? "Save Changes" : "Create Charge"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={editing ? `Edit — ${charge!.chargeName}` : "Add Extra Charge"}
      footer={footer} size="max-w-lg">

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form id="ec-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Charge Code" required>
          <input type="text" value={chargeCode}
            onChange={e => setChargeCode(e.target.value.toUpperCase())}
            placeholder="e.g. FUEL-LEVY" required maxLength={20} className={inputClass} />
        </Field>
        <Field label="Charge Name" required>
          <input type="text" value={chargeName}
            onChange={e => setChargeName(e.target.value)}
            placeholder="e.g. Fuel Levy" required className={inputClass} />
        </Field>
        <Field label="Charge Type">
          <Select value={chargeType}
            onChange={v => setChargeType(v as "Fixed" | "Percentage")}
            placeholder="Select type"
            options={[
              { label: "Fixed (R amount)", value: "Fixed" },
              { label: "Percentage (% of freight)", value: "Percentage" },
            ]} />
        </Field>
        <Field label={chargeType === "Percentage" ? "Default Amount (%)" : "Default Amount (R)"}>
          <input type="number" min="0" step="0.01" value={defaultAmount}
            onChange={e => setDefaultAmount(Number(e.target.value))}
            placeholder="0.00" className={inputClass} />
        </Field>
        <Field label="Sort Order">
          <input type="number" min="0" value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            placeholder="0" className={inputClass} />
        </Field>
        <Field label="Flags">
          <div className="flex flex-col gap-3 pt-1.5">
            {/* isDefault toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <div onClick={() => setIsDefault(p => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${isDefault ? "bg-amber-500" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${isDefault ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm text-gray-700">
                Auto-load on new Waybills
                {isDefault && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">Default</span>}
              </span>
            </label>
            {/* isActive toggle */}
            <label className="flex cursor-pointer items-center gap-3">
              <div onClick={() => setIsActive(p => !p)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${isActive ? "bg-blue-600" : "bg-gray-300"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${isActive ? "translate-x-6" : "translate-x-1"}`} />
              </div>
              <span className="text-sm text-gray-700">{isActive ? "Active" : "Inactive"}</span>
            </label>
          </div>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Standard fuel surcharge applied to all shipments."
              rows={2} className={`${inputClass} resize-none`} />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}
