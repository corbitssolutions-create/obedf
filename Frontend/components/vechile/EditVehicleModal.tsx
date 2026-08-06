"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPut, apiGet } from "@/lib/api";
import { Building2, Check } from "lucide-react";
import type { Vehicle } from "./vechile";

interface DriverLookup      { _id: string; fullName: string; status: string; }
interface BranchLookup      { _id: string; code: string; name: string; isHeadOffice?: boolean; }
interface VehicleTypeLookup { _id: string; name: string; }
interface FuelTypeLookup    { _id: string; name: string; }

interface Props { isOpen: boolean; vehicle: Vehicle; onClose: () => void; onUpdated: () => void; }

const TABS = [
  { key: "details",    label: "Vehicle Details"   },
  { key: "specs",      label: "Capacity & Weight" },
  { key: "compliance", label: "Compliance"        },
  { key: "branches",   label: "Branches"          },
] as const;

function getVehicleBranchIds(vehicle: Vehicle): string[] {
  const b = (vehicle as any).branches;
  if (!Array.isArray(b)) return [];
  return b.map((x: any) => (typeof x === "object" ? x._id : x)).filter(Boolean);
}

export default function EditVehicleModal({ isOpen, vehicle, onClose, onUpdated }: Props) {
  const [vehicleCode,        setVehicleCode]   = useState((vehicle as any).vehicleCode ?? "");
  const [fleetNumber,        setFleet]         = useState(vehicle.fleetNumber ?? "");
  const [vehicleTypeId,      setVehicleTypeId] = useState(typeof vehicle.vehicleType === "object" ? (vehicle.vehicleType as any)?._id ?? "" : vehicle.vehicleType ?? "");
  const [fuelTypeId,         setFuelTypeId]    = useState(typeof (vehicle as any).fuelType === "object" ? (vehicle as any).fuelType?._id ?? "" : (vehicle as any).fuelType ?? "");
  const [make,               setMake]          = useState(vehicle.make ?? "");
  const [model,              setModel]         = useState(vehicle.model ?? "");
  const [year,               setYear]          = useState(vehicle.year?.toString() ?? "");
  const [colour,             setColour]        = useState((vehicle as any).colour ?? "");
  const [capacityKg,         setCapacity]      = useState((vehicle as any).capacityKg?.toString() ?? vehicle.capacity?.toString() ?? "");
  const [tareWeightKg,       setTare]          = useState((vehicle as any).tareWeightKg?.toString() ?? "");
  const [gvm,                setGvm]           = useState((vehicle as any).gvm?.toString() ?? "");
  const [licenseDiscExpiry,  setLicDisc]       = useState((vehicle as any).licenseDiscExpiry?.slice(0, 10) ?? "");
  const [roadworthyExpiry,   setRoadworthy]    = useState((vehicle as any).roadworthyExpiry?.slice(0, 10) ?? "");
  const [insuranceExpiry,    setInsurance]     = useState((vehicle as any).insuranceExpiry?.slice(0, 10) ?? "");
  const [driverId,           setDriverId]      = useState(typeof vehicle.currentDriver === "object" ? vehicle.currentDriver?._id ?? "" : "");
  const [status,             setStatus]        = useState(vehicle.status);
  const [selectedBranches,   setSelected]      = useState<string[]>(getVehicleBranchIds(vehicle));
  const [branchSearch,       setBranchSearch]  = useState("");

  const [drivers,      setDrivers]      = useState<DriverLookup[]>([]);
  const [branches,     setBranches]     = useState<BranchLookup[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeLookup[]>([]);
  const [fuelTypes,    setFuelTypes]    = useState<FuelTypeLookup[]>([]);
  const [activeTab,    setActiveTab]    = useState<typeof TABS[number]["key"]>("details");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      apiGet<{ success: boolean; data: DriverLookup[]      }>("/api/drivers/lookup"),
      apiGet<{ success: boolean; data: BranchLookup[]      }>("/api/branches/lookup"),
      apiGet<{ success: boolean; data: VehicleTypeLookup[] }>("/api/master/vehicle-types/lookup"),
      apiGet<{ success: boolean; data: FuelTypeLookup[]    }>("/api/master/fuel-types/lookup"),
    ]).then(([dr, br, vt, ft]) => {
      setDrivers(dr.data ?? []); setBranches(br.data ?? []);
      setVehicleTypes(vt.data ?? []); setFuelTypes(ft.data ?? []);
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    setVehicleCode((vehicle as any).vehicleCode ?? "");
    setFleet(vehicle.fleetNumber ?? "");
    setVehicleTypeId(typeof vehicle.vehicleType === "object" ? (vehicle.vehicleType as any)?._id ?? "" : vehicle.vehicleType ?? "");
    setFuelTypeId(typeof (vehicle as any).fuelType === "object" ? (vehicle as any).fuelType?._id ?? "" : (vehicle as any).fuelType ?? "");
    setMake(vehicle.make ?? ""); setModel(vehicle.model ?? "");
    setYear(vehicle.year?.toString() ?? ""); setColour((vehicle as any).colour ?? "");
    setCapacity((vehicle as any).capacityKg?.toString() ?? vehicle.capacity?.toString() ?? "");
    setTare((vehicle as any).tareWeightKg?.toString() ?? "");
    setGvm((vehicle as any).gvm?.toString() ?? "");
    setLicDisc((vehicle as any).licenseDiscExpiry?.slice(0, 10) ?? "");
    setRoadworthy((vehicle as any).roadworthyExpiry?.slice(0, 10) ?? "");
    setInsurance((vehicle as any).insuranceExpiry?.slice(0, 10) ?? "");
    setDriverId(typeof vehicle.currentDriver === "object" ? vehicle.currentDriver?._id ?? "" : "");
    setStatus(vehicle.status);
    setSelected(getVehicleBranchIds(vehicle));
    setBranchSearch(""); setError(""); setActiveTab("details");
  }, [vehicle]);

  const toggleBranch = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await apiPut(`/api/vehicles/${vehicle._id}`, {
        vehicleCode:       vehicleCode.toUpperCase().trim() || undefined,
        fleetNumber:       fleetNumber   || undefined,
        vehicleType:       vehicleTypeId || undefined,
        fuelType:          fuelTypeId    || undefined,
        make:              make          || undefined,
        model:             model         || undefined,
        year:              year          ? parseInt(year)           : undefined,
        colour:            colour        || undefined,
        capacityKg:        capacityKg    ? parseFloat(capacityKg)   : undefined,
        tareWeightKg:      tareWeightKg  ? parseFloat(tareWeightKg) : undefined,
        gvm:               gvm           ? parseFloat(gvm)          : undefined,
        licenseDiscExpiry: licenseDiscExpiry || undefined,
        roadworthyExpiry:  roadworthyExpiry  || undefined,
        insuranceExpiry:   insuranceExpiry   || undefined,
        currentDriver:     driverId      || undefined,
        branches:          selectedBranches,
        status,
      });
      onUpdated(); onClose();
    } catch (e: any) { setError(e.message ?? "Update failed"); }
    finally { setSubmitting(false); }
  };

  const driverOptions      = drivers.map((d) => ({ label: `${d.fullName} (${d.status})`, value: d._id }));
  const vehicleTypeOptions = vehicleTypes.length > 0 ? vehicleTypes.map((v) => ({ label: v.name, value: v._id })) : ["Truck","Van","Bakkie","Horse & Trailer","Superlink","Tautliner","Refrigerated","Flatbed","Tanker"];
  const fuelTypeOptions    = fuelTypes.length    > 0 ? fuelTypes.map((f)    => ({ label: f.name, value: f._id })) : ["Diesel","Petrol","Electric","Hybrid"];

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
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="edit-vehicle-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={`Edit — ${vehicle.registrationNumber}`} footer={footer} size="max-w-3xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <div className="mb-5 grid grid-cols-4 gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`rounded-lg py-1.5 text-sm font-medium transition-all ${activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {tabLabel(t.key)}
          </button>
        ))}
      </div>

      <form id="edit-vehicle-form" onSubmit={handleSubmit}>

        {activeTab === "details" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vehicle Code"><input type="text" value={vehicleCode} onChange={(e) => setVehicleCode(e.target.value.toUpperCase())} className={inputClass} /></Field>
            <Field label="Fleet Number"><input type="text" value={fleetNumber} onChange={(e) => setFleet(e.target.value)} className={inputClass} /></Field>
            <Field label="Vehicle Type" required><Select value={vehicleTypeId} onChange={setVehicleTypeId} placeholder="Select type" options={vehicleTypeOptions} required /></Field>
            <Field label="Fuel Type" required><Select value={fuelTypeId} onChange={setFuelTypeId} placeholder="Select fuel" options={fuelTypeOptions} required /></Field>
            <Field label="Make"><input type="text" value={make} onChange={(e) => setMake(e.target.value)} className={inputClass} /></Field>
            <Field label="Model"><input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} /></Field>
            <Field label="Year"><input type="number" value={year} onChange={(e) => setYear(e.target.value)} min="1990" max="2030" className={inputClass} /></Field>
            <Field label="Colour"><input type="text" value={colour} onChange={(e) => setColour(e.target.value)} className={inputClass} /></Field>
            <Field label="Assigned Driver"><Select value={driverId} onChange={setDriverId} placeholder="— No driver —" options={driverOptions} /></Field>
            <Field label="Status" required><Select value={status} onChange={(v) => setStatus(v as any)} placeholder="Select status" options={["Active","In Maintenance","Breakdown","Inactive"]} required /></Field>
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
                ? <p>⚠️ No branches selected — vehicle not restricted to any branch.</p>
                : <p>✅ Vehicle assigned to <strong>{selectedBranches.length} branch{selectedBranches.length > 1 ? "es" : ""}</strong>.</p>}
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
