"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Building2, Check } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useTableFilters } from "../../hooks/useTableFilters";
import { ModalShell, Field, Select, inputClass } from "../../ui/FormControls";
import { SearchBar, FilterSelect, ResetButton, SortIcon, Pagination, EmptyState, StatusBadge } from "../../ui/TableToolbar";

interface Trailer {
  _id: string;
  trailerCode?: string;
  registrationNumber: string;
  fleetNumber?: string;
  trailerType?: string;
  make?: string;
  capacityKg?: number;
  status: string;
  branches?: { _id: string; code: string; name: string }[];
}

interface BranchLookup { _id: string; code: string; name: string; isHeadOffice?: boolean; }

const STATUS_OPTS = [
  { label: "Active",         value: "Active"         },
  { label: "In Maintenance", value: "In Maintenance" },
  { label: "Breakdown",      value: "Breakdown"      },
  { label: "Inactive",       value: "Inactive"       },
];

const TRAILER_TYPES = ["Flatbed","Curtainsider","Refrigerated","Tanker","Lowbed","Skeletal","Other"];

export default function TrailersPage() {
  const [trailers,   setTrailers]   = useState<Trailer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [isAddOpen,  setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<Trailer | null>(null);

  const fetchTrailers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{ success: boolean; data: Trailer[] }>("/api/trailers?limit=500&sort=registrationNumber:asc");
      setTrailers(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Failed to load trailers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTrailers(); }, [fetchTrailers]);

  const handleDelete = async (id: string, reg: string) => {
    if (!confirm(`Delete trailer "${reg}"?`)) return;
    try { await apiDelete(`/api/trailers/${id}`); setTrailers((p) => p.filter((t) => t._id !== id)); }
    catch (e: any) { alert(e.message ?? "Delete failed"); }
  };

  const { paginated, filtered, total, rawSearch, handleSearch, filters, handleFilter, sort, handleSort, page, setPage, pageSize, handlePageSize, totalPages, resetFilters, hasActiveFilters } =
    useTableFilters<Trailer>({ data: trailers, searchFields: ["trailerCode","registrationNumber","fleetNumber","make","trailerType"], pageSize: 10 });

  if (loading) return <div className="flex min-h-[300px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">TRAILERS</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} records</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> New Trailer
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs"><SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search registration, fleet, type…" /></div>
        <FilterSelect value={filters.status} onChange={(v) => handleFilter("status", v)} options={STATUS_OPTS} placeholder="All Statuses" />
        <ResetButton onClick={resetFilters} active={hasActiveFilters} />
      </div>

      {/* Table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([["registrationNumber","Registration"],["fleetNumber","Fleet No."],["trailerType","Type"],["make","Make"],["capacityKg","Capacity (kg)"],["status","Status"]] as [keyof Trailer,string][]).map(([k,l])=>(
                <th key={k} onClick={()=>handleSort(k)} className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {l}<SortIcon sortState={sort} column={k} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Branches</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? <EmptyState message="No trailers found." colSpan={8} /> : paginated.map((t, i) => (
              <tr key={t._id} className={`text-sm text-gray-700 hover:bg-gray-50/60 ${i !== paginated.length-1 ? "border-b border-gray-50" : ""}`}>
                <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{t.registrationNumber}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{t.fleetNumber||"—"}</td>
                <td className="px-5 py-3.5">{t.trailerType||"—"}</td>
                <td className="px-5 py-3.5">{t.make||"—"}</td>
                <td className="px-5 py-3.5 font-mono text-xs">{t.capacityKg?.toLocaleString()||"—"}</td>
                <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3.5">
                  {t.branches && t.branches.length > 0
                    ? <div className="flex flex-wrap gap-1">{t.branches.map((b)=><span key={b._id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{b.code}</span>)}</div>
                    : <span className="text-xs italic text-gray-400">Any</span>}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setEditTarget(t)} className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"><Pencil className="h-3 w-3"/>Edit</button>
                    <button onClick={()=>handleDelete(t._id,t.registrationNumber)} className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3"/>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.map((t) => (
          <div key={t._id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="font-mono text-sm font-semibold text-blue-600">{t.registrationNumber}</p>
              <StatusBadge status={t.status} />
            </div>
            <p className="text-xs text-gray-500">{t.trailerType} • {t.make}</p>
            {t.branches && t.branches.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {t.branches.map((b) => <span key={b._id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{b.code} — {b.name}</span>)}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={()=>setEditTarget(t)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
              <button onClick={()=>handleDelete(t._id,t.registrationNumber)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4"><Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={handlePageSize} /></div>

      <TrailerModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onSaved={fetchTrailers} />
      {editTarget && <TrailerModal isOpen trailer={editTarget} onClose={() => setEditTarget(null)} onSaved={fetchTrailers} />}
    </div>
  );
}

/* ─── Shared Add/Edit Modal ─────────────────────────────────────────────── */
interface TrailerModalProps { isOpen: boolean; trailer?: Trailer; onClose: () => void; onSaved: () => void; }

const TABS = [
  { key: "details",    label: "Details"    },
  { key: "specs",      label: "Specs"      },
  { key: "compliance", label: "Compliance" },
  { key: "branches",   label: "Branches"   },
] as const;

function TrailerModal({ isOpen, trailer, onClose, onSaved }: TrailerModalProps) {
  const editing = !!trailer;

  const [trailerCode,        setTrailerCode]  = useState(trailer?.trailerCode ?? "");
  const [registrationNumber, setReg]          = useState(trailer?.registrationNumber ?? "");
  const [fleetNumber,        setFleet]        = useState(trailer?.fleetNumber ?? "");
  const [trailerType,        setTrailerType]  = useState(trailer?.trailerType ?? "");
  const [make,               setMake]         = useState((trailer as any)?.make ?? "");
  const [model,              setModel]        = useState((trailer as any)?.model ?? "");
  const [year,               setYear]         = useState((trailer as any)?.year?.toString() ?? "");
  const [capacityKg,         setCapacity]     = useState(trailer?.capacityKg?.toString() ?? "");
  const [tareWeightKg,       setTare]         = useState((trailer as any)?.tareWeightKg?.toString() ?? "");
  const [gvm,                setGvm]          = useState((trailer as any)?.gvm?.toString() ?? "");
  const [colour,             setColour]       = useState((trailer as any)?.colour ?? "");
  const [vinNumber,          setVin]          = useState((trailer as any)?.vinNumber ?? "");
  const [licenseDiscExpiry,  setLicDisc]      = useState((trailer as any)?.licenseDiscExpiry?.slice(0,10) ?? "");
  const [roadworthyExpiry,   setRoadworthy]   = useState((trailer as any)?.roadworthyExpiry?.slice(0,10) ?? "");
  const [insuranceExpiry,    setInsurance]    = useState((trailer as any)?.insuranceExpiry?.slice(0,10) ?? "");
  const [status,             setStatus]       = useState(trailer?.status ?? "Active");

  const getIds = (t?: Trailer) => {
    const b = (t as any)?.branches;
    if (!Array.isArray(b)) return [];
    return b.map((x: any) => (typeof x === "object" ? x._id : x)).filter(Boolean);
  };
  const [selectedBranches, setSelected] = useState<string[]>(getIds(trailer));
  const [branchSearch,     setBranchSearch] = useState("");
  const [branches,         setBranches]     = useState<BranchLookup[]>([]);
  const [activeTab,        setActiveTab]    = useState<typeof TABS[number]["key"]>("details");
  const [submitting,       setSubmitting]   = useState(false);
  const [error,            setError]        = useState("");

  useEffect(() => {
    if (!isOpen) return;
    apiGet<{ success: boolean; data: BranchLookup[] }>("/api/branches/lookup")
      .then((r) => setBranches(r.data ?? [])).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    setTrailerCode(trailer?.trailerCode ?? "");
    setReg(trailer?.registrationNumber ?? "");
    setFleet(trailer?.fleetNumber ?? "");
    setTrailerType(trailer?.trailerType ?? "");
    setMake((trailer as any)?.make ?? "");
    setModel((trailer as any)?.model ?? "");
    setYear((trailer as any)?.year?.toString() ?? "");
    setCapacity(trailer?.capacityKg?.toString() ?? "");
    setTare((trailer as any)?.tareWeightKg?.toString() ?? "");
    setGvm((trailer as any)?.gvm?.toString() ?? "");
    setColour((trailer as any)?.colour ?? "");
    setVin((trailer as any)?.vinNumber ?? "");
    setLicDisc((trailer as any)?.licenseDiscExpiry?.slice(0,10) ?? "");
    setRoadworthy((trailer as any)?.roadworthyExpiry?.slice(0,10) ?? "");
    setInsurance((trailer as any)?.insuranceExpiry?.slice(0,10) ?? "");
    setStatus(trailer?.status ?? "Active");
    setSelected(getIds(trailer));
    setBranchSearch(""); setError(""); setActiveTab("details");
  }, [trailer, isOpen]);

  const toggleBranch = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim()) { setActiveTab("details"); setError("Registration number is required."); return; }
    setSubmitting(true); setError("");
    try {
      const payload = {
        trailerCode:        trailerCode.toUpperCase().trim() || undefined,
        registrationNumber: registrationNumber.toUpperCase().trim(),
        fleetNumber:        fleetNumber  || undefined,
        trailerType:        trailerType  || undefined,
        make:               make         || undefined,
        model:              model        || undefined,
        year:               year         ? parseInt(year)           : undefined,
        capacityKg:         capacityKg   ? parseFloat(capacityKg)   : undefined,
        tareWeightKg:       tareWeightKg ? parseFloat(tareWeightKg) : undefined,
        gvm:                gvm          ? parseFloat(gvm)          : undefined,
        colour:             colour       || undefined,
        vinNumber:          vinNumber    || undefined,
        licenseDiscExpiry:  licenseDiscExpiry || undefined,
        roadworthyExpiry:   roadworthyExpiry  || undefined,
        insuranceExpiry:    insuranceExpiry   || undefined,
        branches:           selectedBranches,
        status,
      };
      if (editing) await apiPut(`/api/trailers/${trailer!._id}`, payload);
      else         await apiPost("/api/trailers", payload);
      onSaved(); onClose();
    } catch (e: any) { setError(e.message ?? "Save failed"); }
    finally { setSubmitting(false); }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.code.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const tabLabel = (key: string) =>
    key === "branches" ? `Branches${selectedBranches.length ? ` (${selectedBranches.length})` : ""}` : TABS.find((t) => t.key === key)?.label ?? key;

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="trailer-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : editing ? "Save Changes" : "Create Trailer"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={editing ? `Edit — ${trailer!.registrationNumber}` : "Add New Trailer"} footer={footer} size="max-w-3xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <div className="mb-5 grid grid-cols-4 gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`rounded-lg py-1.5 text-sm font-medium transition-all ${activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tabLabel(t.key)}
          </button>
        ))}
      </div>

      <form id="trailer-form" onSubmit={handleSubmit}>

        {activeTab === "details" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Trailer Code">
              <input type="text" value={trailerCode} onChange={(e) => setTrailerCode(e.target.value.toUpperCase())}
                placeholder="e.g. TRL-001 (auto if blank)" className={inputClass} />
            </Field>
            <Field label="Registration Number" required>
              <input type="text" value={registrationNumber} onChange={(e) => setReg(e.target.value.toUpperCase())}
                placeholder="e.g. CAA 001 GP" required className={inputClass} />
            </Field>
            <Field label="Fleet Number">
              <input type="text" value={fleetNumber} onChange={(e) => setFleet(e.target.value)} placeholder="e.g. FLT-T01" className={inputClass} />
            </Field>
            <Field label="Trailer Type" required>
              <Select value={trailerType} onChange={setTrailerType} placeholder="Select type" options={TRAILER_TYPES} required />
            </Field>
            <Field label="Make">
              <input type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Afrit" className={inputClass} />
            </Field>
            <Field label="Model">
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Year">
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="1990" max="2030" className={inputClass} />
            </Field>
            <Field label="Colour">
              <input type="text" value={colour} onChange={(e) => setColour(e.target.value)} placeholder="e.g. White" className={inputClass} />
            </Field>
            <Field label="VIN Number">
              <input type="text" value={vinNumber} onChange={(e) => setVin(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Status" required>
              <Select value={status} onChange={setStatus} placeholder="Select status"
                options={["Active","In Maintenance","Breakdown","Inactive"]} required />
            </Field>
          </div>
        )}

        {activeTab === "specs" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Capacity (kg)"><input type="number" min="0" value={capacityKg} onChange={(e) => setCapacity(e.target.value)} className={inputClass} /></Field>
            <Field label="Tare Weight (kg)"><input type="number" min="0" value={tareWeightKg} onChange={(e) => setTare(e.target.value)} className={inputClass} /></Field>
            <Field label="GVM (kg)"><input type="number" min="0" value={gvm} onChange={(e) => setGvm(e.target.value)} className={inputClass} /></Field>
          </div>
        )}

        {activeTab === "compliance" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Licence Disc Expiry"><input type="date" value={licenseDiscExpiry} onChange={(e) => setLicDisc(e.target.value)} className={inputClass} /></Field>
            <Field label="Roadworthy Expiry"><input type="date" value={roadworthyExpiry} onChange={(e) => setRoadworthy(e.target.value)} className={inputClass} /></Field>
            <Field label="Insurance Expiry"><input type="date" value={insuranceExpiry} onChange={(e) => setInsurance(e.target.value)} className={inputClass} /></Field>
          </div>
        )}

        {activeTab === "branches" && (
          <div className="space-y-4">
            <div className={`rounded-xl border px-4 py-3 text-sm ${selectedBranches.length === 0 ? "border-amber-100 bg-amber-50 text-amber-700" : "border-green-100 bg-green-50 text-green-700"}`}>
              {selectedBranches.length === 0
                ? <p>⚠️ No branches selected — trailer not restricted to any branch.</p>
                : <p>✅ Trailer assigned to <strong>{selectedBranches.length} branch{selectedBranches.length > 1 ? "es" : ""}</strong>.</p>}
            </div>

            <div className="flex items-center gap-2">
              <input type="text" value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branches…" className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => setSelected(branches.map((b) => b._id))}
                className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Select all</button>
              <button type="button" onClick={() => setSelected([])}
                className="whitespace-nowrap rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50">Clear</button>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
              {branches.length === 0
                ? <div className="py-10 text-center text-sm text-gray-400">No branches found.</div>
                : filteredBranches.map((b, i) => {
                    const checked = selectedBranches.includes(b._id);
                    return (
                      <label key={b._id} onClick={() => toggleBranch(b._id)}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${i !== filteredBranches.length-1 ? "border-b border-gray-50" : ""} ${checked ? "bg-blue-50/60" : "hover:bg-gray-50/60"}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${checked ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                          {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                        </span>
                        <Building2 className={`h-4 w-4 shrink-0 ${checked ? "text-blue-600" : "text-gray-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${checked ? "text-blue-700" : "text-gray-800"}`}>
                            {b.name}
                            {b.isHeadOffice && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">HQ</span>}
                          </p>
                          <p className="font-mono text-xs text-gray-400">{b.code}</p>
                        </div>
                        {checked && <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">Assigned</span>}
                      </label>
                    );
                  })
              }
            </div>

            {selectedBranches.length > 0 && (
              <p className="text-xs text-gray-500">
                Selected: {branches.filter((b) => selectedBranches.includes(b._id)).map((b) => b.name).join(" • ")}
              </p>
            )}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
