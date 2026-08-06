"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPost, apiPut, apiGet } from "@/lib/api";
import { Building2, Check } from "lucide-react";
import type { Route } from "./route";

interface BranchLookup  { _id: string; code: string; name: string; isHeadOffice?: boolean; }
interface DriverLookup  { _id: string; fullName: string; employeeId?: string; status: string; }
interface VehicleLookup { _id: string; registrationNumber: string; vehicleCode?: string; status: string; }

interface Props {
  isOpen: boolean;
  route?: Route;
  onClose: () => void;
  onSaved: () => void;
}

const TABS = [
  { key: "details",  label: "Route Details" },
  { key: "branches", label: "Branches"      },
] as const;

type TabKey = typeof TABS[number]["key"];

function getId(val: any): string {
  if (!val) return "";
  if (typeof val === "object") return val._id ?? "";
  return val;
}

function getIds(arr: any[] | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x: any) => (typeof x === "object" ? x._id : x)).filter(Boolean);
}

export default function RouteModal({ isOpen, route, onClose, onSaved }: Props) {
  const editing = !!route;

  /* ── Details ──────────────────────────────────────────────────────────── */
  const [routeCode,      setRouteCode]      = useState(route?.routeCode ?? "");
  const [name,           setName]           = useState(route?.name ?? "");
  const [startPoint,     setStartPoint]     = useState(route?.startPoint ?? "");
  const [destination,    setDestination]    = useState(route?.destination ?? "");
  const [distanceKm,     setDistance]       = useState(route?.distanceKm?.toString() ?? "");
  const [estimatedHours, setEstHours]       = useState(route?.estimatedHours?.toString() ?? "");
  const [tollCost,       setTollCost]       = useState(route?.tollCost?.toString() ?? "");
  const [status,         setStatus]         = useState(route?.status ?? "Active");
  const [notes,          setNotes]          = useState(route?.notes ?? "");

  /* ── Single dropdowns ────────────────────────────────────────────────── */
  const [driverId,  setDriverId]  = useState(getId((route as any)?.driver));
  const [vehicleId, setVehicleId] = useState(getId((route as any)?.vehicle));

  /* ── Multi-select branches ───────────────────────────────────────────── */
  const [selBranches, setSelBranches] = useState<string[]>(getIds(route?.branches));
  const [branchQ,     setBranchQ]     = useState("");

  /* ── Lookup data ─────────────────────────────────────────────────────── */
  const [branches,  setBranches]  = useState<BranchLookup[]>([]);
  const [drivers,   setDrivers]   = useState<DriverLookup[]>([]);
  const [vehicles,  setVehicles]  = useState<VehicleLookup[]>([]);

  const [activeTab,  setActiveTab]  = useState<TabKey>("details");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  /* load lookups once */
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      apiGet<{ success: boolean; data: BranchLookup[]  }>("/api/branches/lookup"),
      apiGet<{ success: boolean; data: DriverLookup[]  }>("/api/drivers/lookup"),
      apiGet<{ success: boolean; data: VehicleLookup[] }>("/api/vehicles/lookup"),
    ]).then(([br, dr, ve]) => {
      setBranches(br.data ?? []);
      setDrivers(dr.data ?? []);
      setVehicles(ve.data ?? []);
    }).catch(() => {});
  }, [isOpen]);

  /* sync when route prop changes */
  useEffect(() => {
    setRouteCode(route?.routeCode ?? "");
    setName(route?.name ?? "");
    setStartPoint(route?.startPoint ?? "");
    setDestination(route?.destination ?? "");
    setDistance(route?.distanceKm?.toString() ?? "");
    setEstHours(route?.estimatedHours?.toString() ?? "");
    setTollCost(route?.tollCost?.toString() ?? "");
    setStatus(route?.status ?? "Active");
    setNotes(route?.notes ?? "");
    setDriverId(getId((route as any)?.driver));
    setVehicleId(getId((route as any)?.vehicle));
    setSelBranches(getIds(route?.branches));
    setBranchQ(""); setError(""); setActiveTab("details");
  }, [route, isOpen]);

  const toggleBranch = (id: string) =>
    setSelBranches((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeCode.trim() || !name.trim()) {
      setActiveTab("details");
      setError("Route Code and Route Name are required.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      const payload = {
        routeCode:      routeCode.toUpperCase().trim(),
        name:           name.trim(),
        startPoint:     startPoint.trim(),
        destination:    destination.trim(),
        origin:         startPoint.trim(),
        distanceKm:     distanceKm     ? parseFloat(distanceKm)     : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        tollCost:       tollCost       ? parseFloat(tollCost)       : undefined,
        driver:         driverId       || undefined,
        vehicle:        vehicleId      || undefined,
        branches:       selBranches,
        status,
        notes:          notes || undefined,
      };
      if (editing) await apiPut(`/api/routes/${route!._id}`, payload);
      else         await apiPost("/api/routes", payload);
      onSaved(); onClose();
    } catch (e: any) {
      // If duplicate route code — stay on details tab so user can fix it
      setActiveTab("details");
      setError(e.message ?? "Save failed");
    }
    finally { setSubmitting(false); }
  };

  /* label helpers */
  const tabLabel = (key: TabKey) => {
    if (key === "branches" && selBranches.length) return `Branches (${selBranches.length})`;
    return TABS.find((t) => t.key === key)?.label ?? key;
  };

  /* build dropdown option lists */
  const driverOptions = drivers.map((d) => ({
    label: `${d.fullName}${d.employeeId ? ` (${d.employeeId})` : ""} — ${d.status}`,
    value: d._id,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    label: `${v.registrationNumber}${v.vehicleCode ? ` — ${v.vehicleCode}` : ""} (${v.status})`,
    value: v._id,
  }));

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchQ.toLowerCase()) ||
    b.code.toLowerCase().includes(branchQ.toLowerCase())
  );

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="route-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : editing ? "Save Changes" : "Create Route"}
      </button>
    </>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Edit Route — ${route!.name}` : "Add New Route"}
      footer={footer}
      size="max-w-3xl"
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {tabLabel(t.key)}
          </button>
        ))}
      </div>

      <form id="route-form" onSubmit={handleSubmit}>

        {/* ── Route Details tab ─────────────────────────────────────────── */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Route Code" required>
              <input type="text" value={routeCode}
                onChange={(e) => setRouteCode(e.target.value.toUpperCase())}
                placeholder="e.g. JHB-PTA"
                required className={inputClass} />
            </Field>
            <Field label="Route Name" required>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Johannesburg - Pretoria" required className={inputClass} />
            </Field>
            <Field label="Start Point (From)">
              <input type="text" value={startPoint} onChange={(e) => setStartPoint(e.target.value)}
                placeholder="e.g. Johannesburg" className={inputClass} />
            </Field>
            <Field label="Destination (To)">
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Pretoria" className={inputClass} />
            </Field>
            <Field label="Distance (km)">
              <input type="number" step="0.1" min="0" value={distanceKm}
                onChange={(e) => setDistance(e.target.value)} placeholder="e.g. 56" className={inputClass} />
            </Field>
            <Field label="Estimated Hours">
              <input type="number" step="0.5" min="0" value={estimatedHours}
                onChange={(e) => setEstHours(e.target.value)} placeholder="e.g. 1.5" className={inputClass} />
            </Field>
            <Field label="Toll Cost (R)">
              <input type="number" step="0.01" min="0" value={tollCost}
                onChange={(e) => setTollCost(e.target.value)} placeholder="e.g. 250.00" className={inputClass} />
            </Field>

            {/* ── Assigned Driver (single dropdown) ── */}
            <Field label="Assign Driver">
              <Select
                value={driverId}
                onChange={setDriverId}
                placeholder="— No driver assigned —"
                options={driverOptions}
              />
            </Field>

            {/* ── Assigned Vehicle (single dropdown) ── */}
            <Field label="Assign Vehicle">
              <Select
                value={vehicleId}
                onChange={setVehicleId}
                placeholder="— No vehicle assigned —"
                options={vehicleOptions}
              />
            </Field>

            <Field label="Status" required>
              <Select value={status} onChange={(v) => setStatus(v as any)} placeholder="Select status"
                options={["Active","Inactive"]} required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={2} placeholder="Any notes about this route…"
                  className={`${inputClass} resize-none`} />
              </Field>
            </div>
          </div>
        )}

        {/* ── Branches tab (checkbox list) ──────────────────────────────── */}
        {activeTab === "branches" && (
          <div className="space-y-4">

            {/* Info banner */}
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              selBranches.length === 0
                ? "border-amber-100 bg-amber-50 text-amber-700"
                : "border-green-100 bg-green-50 text-green-700"
            }`}>
              {selBranches.length === 0
                ? <p>⚠️ No branches selected — route not restricted to any branch.</p>
                : <p>✅ Route assigned to <strong>{selBranches.length} branch{selBranches.length > 1 ? "es" : ""}</strong>.</p>}
            </div>

            {/* Search + bulk actions */}
            <div className="flex items-center gap-2">
              <input type="text" value={branchQ}
                onChange={(e) => setBranchQ(e.target.value)}
                placeholder="Search branches…"
                className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => setSelBranches(branches.map((b) => b._id))}
                className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Select all
              </button>
              <button type="button" onClick={() => setSelBranches([])}
                className="whitespace-nowrap rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50">
                Clear
              </button>
            </div>

            {/* Checklist */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100">
              {branches.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No branches found. Add branches first.
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No branches match your search.
                </div>
              ) : (
                filteredBranches.map((b, i) => {
                  const checked = selBranches.includes(b._id);
                  return (
                    <label key={b._id} onClick={() => toggleBranch(b._id)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                        i !== filteredBranches.length - 1 ? "border-b border-gray-50" : ""
                      } ${checked ? "bg-blue-50/60" : "hover:bg-gray-50/60"}`}>

                      {/* Custom checkbox */}
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                        checked ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                      }`}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>

                      <Building2 className={`h-4 w-4 shrink-0 ${checked ? "text-blue-600" : "text-gray-400"}`} />

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${checked ? "text-blue-700" : "text-gray-800"}`}>
                          {b.name}
                          {b.isHeadOffice && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                              HQ
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-xs text-gray-400">{b.code}</p>
                      </div>

                      {checked && (
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          Assigned
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {selBranches.length > 0 && (
              <p className="text-xs text-gray-500">
                Selected:{" "}
                {branches
                  .filter((b) => selBranches.includes(b._id))
                  .map((b) => b.name)
                  .join(" • ")}
              </p>
            )}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
