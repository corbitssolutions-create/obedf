"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPost, apiGet } from "@/lib/api";
import { Building2, Check } from "lucide-react";

interface DriverLookup  { _id: string; fullName: string; status: string; }
interface BranchLookup  { _id: string; code: string; name: string; isHeadOffice?: boolean; }
interface VehicleTypeLookup { _id: string; name: string; }
interface FuelTypeLookup    { _id: string; name: string; }

interface Props { isOpen: boolean; onClose: () => void; onCreated: () => void; }

const TABS = [
  { key: "details",    label: "Vehicle Details"   },
  { key: "specs",      label: "Capacity & Weight" },
  { key: "compliance", label: "Compliance"        },
  { key: "branches",   label: "Branches"          },
] as const;

export default function AddVehicleModal({ isOpen, onClose, onCreated }: Props) {
  // Details
  const [vehicleCode,        setVehicleCode]   = useState("");
  const [registrationNumber, setReg]           = useState("");
  const [fleetNumber,        setFleet]         = useState("");
  const [vinNumber,          setVin]           = useState("");
  const [vehicleTypeId,      setVehicleTypeId] = useState("");
  const [fuelTypeId,         setFuelTypeId]    = useState("");
  const [make,               setMake]          = useState("");
  const [model,              setModel]         = useState("");
  const [year,               setYear]          = useState("");
  const [colour,             setColour]        = useState("");
  const [driverId,           setDriverId]      = useState("");
  const [status,             setStatus]        = useState("Active");

  // Specs
  const [capacityKg,  setCapacity]  = useState("");
  const [tareWeightKg,setTare]      = useState("");
  const [gvm,         setGvm]       = useState("");

  // Compliance
  const [licenseDiscExpiry, setLicDisc]    = useState("");
  const [roadworthyExpiry,  setRoadworthy] = useState("");
  const [insuranceExpiry,   setInsurance]  = useState("");

  // Branches (multiple)
  const [selectedBranches, setSelected]   = useState<string[]>([]);
  const [branchSearch,     setBranchSearch] = useState("");

  // Lookups
  const [drivers,      setDrivers]      = useState<DriverLookup[]>([]);
  const [branches,     setBranches]     = useState<BranchLookup[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeLookup[]>([]);
  const [fuelTypes,    setFuelTypes]    = useState<FuelTypeLookup[]>([]);

  const [activeTab,  setActiveTab]  = useState<typeof TABS[number]["key"]>("details");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      apiGet<{ success: boolean; data: DriverLookup[]      }>("/api/drivers/lookup"),
      apiGet<{ success: boolean; data: BranchLookup[]      }>("/api/branches/lookup"),
      apiGet<{ success: boolean; data: VehicleTypeLookup[] }>("/api/master/vehicle-types/lookup"),
      apiGet<{ success: boolean; data: FuelTypeLookup[]    }>("/api/master/fuel-types/lookup"),
    ]).then(([dr, br, vt, ft]) => {
      setDrivers(dr.data ?? []);
      setBranches(br.data ?? []);
      setVehicleTypes(vt.data ?? []);
      setFuelTypes(ft.data ?? []);
    }).catch(() => {});
  }, [isOpen]);

  const reset = () => {
    setVehicleCode(""); setReg(""); setFleet(""); setVin("");
    setVehicleTypeId(""); setFuelTypeId(""); setMake(""); setModel("");
    setYear(""); setColour(""); setDriverId(""); setStatus("Active");
    setCapacity(""); setTare(""); setGvm("");
    setLicDisc(""); setRoadworthy(""); setInsurance("");
    setSelected([]); setBranchSearch(""); setError(""); setActiveTab("details");
  };

  const handleClose = () => { reset(); onClose(); };
  const toggleBranch = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim()) { setActiveTab("details"); setError("Registration number is required."); return; }
    setSubmitting(true); setError("");
    try {
      await apiPost("/api/vehicles", {
        vehicleCode:        vehicleCode.toUpperCase().trim() || undefined,
        registrationNumber: registrationNumber.toUpperCase().trim(),
        fleetNumber:        fleetNumber   || undefined,
        vinNumber:          vinNumber     || undefined,
        vehicleType:        vehicleTypeId || undefined,
        fuelType:           fuelTypeId    || undefined,
        make:               make          || undefined,
        model:              model         || undefined,
        year:               year          ? parseInt(year)          : undefined,
        colour:             colour        || undefined,
        capacityKg:         capacityKg    ? parseFloat(capacityKg)   : undefined,
        tareWeightKg:       tareWeightKg  ? parseFloat(tareWeightKg) : undefined,
        gvm:                gvm           ? parseFloat(gvm)          : undefined,
        licenseDiscExpiry:  licenseDiscExpiry || undefined,
        roadworthyExpiry:   roadworthyExpiry  || undefined,
        insuranceExpiry:    insuranceExpiry   || undefined,
        currentDriver:      driverId      || undefined,
        branches:           selectedBranches,
        status,
      });
      reset(); onCreated(); onClose();
    } catch (e: any) { setError(e.message ?? "Failed to create vehicle"); }
    finally { setSubmitting(false); }
  };

  const driverOptions      = drivers.map((d) => ({ label: `${d.fullName} (${d.status})`, value: d._id }));
  const vehicleTypeOptions = vehicleTypes.length > 0
    ? vehicleTypes.map((v) => ({ label: v.name, value: v._id }))
    : ["Truck","Van","Bakkie","Horse & Trailer","Superlink","Tautliner","Refrigerated","Flatbed","Tanker"];
  const fuelTypeOptions = fuelTypes.length > 0
    ? fuelTypes.map((f) => ({ label: f.name, value: f._id }))
    : ["Diesel","Petrol","Electric","Hybrid"];

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.code.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const tabLabel = (key: string) =>
    key === "branches"
      ? `Branches${selectedBranches.length ? ` (${selectedBranches.length})` : ""}`
      : TABS.find((t) => t.key === key)?.label ?? key;

  const footer = (
    <>
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="add-vehicle-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Creating…" : "Create Vehicle"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Add New Vehicle" footer={footer} size="max-w-3xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {/* Tab bar */}
      <div className="mb-5 grid grid-cols-4 gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`rounded-lg py-1.5 text-sm font-medium transition-all ${activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tabLabel(t.key)}
          </button>
        ))}
      </div>

      <form id="add-vehicle-form" onSubmit={handleSubmit}>

        {/* ── Vehicle Details ───────────────────────────────────────────── */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vehicle Code">
              <input type="text" value={vehicleCode} onChange={(e) => setVehicleCode(e.target.value.toUpperCase())}
                placeholder="e.g. VEH-001 (auto if blank)" className={inputClass} />
            </Field>
            <Field label="Registration Number" required>
              <input type="text" value={registrationNumber} onChange={(e) => setReg(e.target.value.toUpperCase())}
                placeholder="e.g. CAA 125 GP" required className={inputClass} />
            </Field>
            <Field label="Fleet Number">
              <input type="text" value={fleetNumber} onChange={(e) => setFleet(e.target.value)} placeholder="e.g. FLT-001" className={inputClass} />
            </Field>
            <Field label="VIN Number">
              <input type="text" value={vinNumber} onChange={(e) => setVin(e.target.value)} placeholder="e.g. WDB963..." className={inputClass} />
            </Field>
            <Field label="Vehicle Type" required>
              <Select value={vehicleTypeId} onChange={setVehicleTypeId} placeholder="Select vehicle type" options={vehicleTypeOptions} required />
            </Field>
            <Field label="Fuel Type" required>
              <Select value={fuelTypeId} onChange={setFuelTypeId} placeholder="Select fuel type" options={fuelTypeOptions} required />
            </Field>
            <Field label="Make">
              <input type="text" value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Volvo" className={inputClass} />
            </Field>
            <Field label="Model">
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. FH16" className={inputClass} />
            </Field>
            <Field label="Year">
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="1990" max="2030" placeholder="e.g. 2021" className={inputClass} />
            </Field>
            <Field label="Colour">
              <input type="text" value={colour} onChange={(e) => setColour(e.target.value)} placeholder="e.g. White" className={inputClass} />
            </Field>
            <Field label="Assign Driver">
              <Select value={driverId} onChange={setDriverId} placeholder="— No driver —" options={driverOptions} />
            </Field>
            <Field label="Status" required>
              <Select value={status} onChange={setStatus} placeholder="Select status"
                options={["Active","In Maintenance","Breakdown","Inactive"]} required />
            </Field>
          </div>
        )}

        {/* ── Capacity & Weight ─────────────────────────────────────────── */}
        {activeTab === "specs" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Capacity (kg)">
              <input type="number" min="0" value={capacityKg} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 25000" className={inputClass} />
            </Field>
            <Field label="Tare Weight (kg)">
              <input type="number" min="0" value={tareWeightKg} onChange={(e) => setTare(e.target.value)} placeholder="e.g. 8500" className={inputClass} />
            </Field>
            <Field label="GVM (kg)">
              <input type="number" min="0" value={gvm} onChange={(e) => setGvm(e.target.value)} placeholder="e.g. 33500" className={inputClass} />
            </Field>
          </div>
        )}

        {/* ── Compliance ────────────────────────────────────────────────── */}
        {activeTab === "compliance" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Licence Disc Expiry">
              <input type="date" value={licenseDiscExpiry} onChange={(e) => setLicDisc(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Roadworthy Expiry">
              <input type="date" value={roadworthyExpiry} onChange={(e) => setRoadworthy(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Insurance Expiry">
              <input type="date" value={insuranceExpiry} onChange={(e) => setInsurance(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {/* ── Branches ──────────────────────────────────────────────────── */}
        {activeTab === "branches" && (
          <div className="space-y-4">
            {/* Info banner */}
            <div className={`rounded-xl border px-4 py-3 text-sm ${selectedBranches.length === 0 ? "border-amber-100 bg-amber-50 text-amber-700" : "border-green-100 bg-green-50 text-green-700"}`}>
              {selectedBranches.length === 0
                ? <p>⚠️ No branches selected — vehicle not restricted to any branch.</p>
                : <p>✅ Vehicle assigned to <strong>{selectedBranches.length} branch{selectedBranches.length > 1 ? "es" : ""}</strong>.</p>}
            </div>

            {/* Search + bulk */}
            <div className="flex items-center gap-2">
              <input type="text" value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branches…" className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => setSelected(branches.map((b) => b._id))}
                className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Select all</button>
              <button type="button" onClick={() => setSelected([])}
                className="whitespace-nowrap rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50">Clear</button>
            </div>

            {/* Checklist */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
              {branches.length === 0
                ? <div className="py-10 text-center text-sm text-gray-400">No branches found. Add branches first.</div>
                : filteredBranches.map((b, i) => {
                    const checked = selectedBranches.includes(b._id);
                    return (
                      <label key={b._id} onClick={() => toggleBranch(b._id)}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${i !== filteredBranches.length - 1 ? "border-b border-gray-50" : ""} ${checked ? "bg-blue-50/60" : "hover:bg-gray-50/60"}`}>
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
