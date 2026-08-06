"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPut, apiGet } from "@/lib/api";
import { Building2, Check } from "lucide-react";
import type { Driver } from "./drivers";

interface VehicleLookup { _id: string; registrationNumber: string; make?: string; status: string; }
interface BranchLookup  { _id: string; code: string; name: string; isHeadOffice?: boolean; }

interface Props { isOpen: boolean; driver: Driver; onClose: () => void; onUpdated: () => void; }

const TABS = [
  { key: "personal", label: "Personal"           },
  { key: "licence",  label: "Licence"            },
  { key: "contact",  label: "Contact & Address"  },
  { key: "branches", label: "Branches"           },
] as const;

function getDriverBranchIds(driver: Driver): string[] {
  const b = (driver as any).branches;
  if (!Array.isArray(b)) return [];
  return b.map((x: any) => (typeof x === "object" ? x._id : x)).filter(Boolean);
}

export default function EditDriverModal({ isOpen, driver, onClose, onUpdated }: Props) {
  // Personal
  const [employeeId,    setEmployeeId]   = useState(driver.employeeId ?? "");
  const [fullName,      setFullName]     = useState(driver.fullName);
  const [idNumber,      setIdNumber]     = useState(driver.idNumber ?? "");
  const [status,        setStatus]       = useState(driver.status);
  const [vehicleId,     setVehicleId]    = useState(
    typeof driver.currentVehicle === "object" ? driver.currentVehicle?._id ?? "" : ""
  );

  // Licence
  const [licenseNumber, setLicNum]    = useState(driver.licenseNumber);
  const [licenseType,   setLicType]   = useState(driver.licenseType ?? "");
  const [licenseExpiry, setLicExp]    = useState(driver.licenseExpiry?.slice(0, 10) ?? "");
  const [pdpNumber,     setPdp]       = useState((driver as any).pdpNumber ?? "");
  const [pdpExpiry,     setPdpExp]    = useState((driver as any).pdpExpiry?.slice(0, 10) ?? "");
  const [medicalExpiry, setMedExp]    = useState((driver as any).medicalExpiry?.slice(0, 10) ?? "");
  const [trainingExpiry,setTrainExp]  = useState((driver as any).trainingExpiry?.slice(0, 10) ?? "");

  // Contact
  const [phoneNumber,   setPhone]     = useState(driver.phoneNumber ?? "");
  const [email,         setEmail]     = useState(driver.email ?? "");
  const [address,       setAddress]   = useState<AddressData>(emptyAddress());
  const [emergName,     setEmergName] = useState((driver as any).emergencyContact?.name ?? "");
  const [emergPhone,    setEmergPhone]= useState((driver as any).emergencyContact?.phone ?? "");
  const [emergRelation, setEmergRel]  = useState((driver as any).emergencyContact?.relation ?? "");

  // Branches
  const [selectedBranches, setSelected] = useState<string[]>(getDriverBranchIds(driver));
  const [branchSearch,  setBranchSearch]= useState("");

  // Lookups
  const [vehicles,  setVehicles]  = useState<VehicleLookup[]>([]);
  const [branches,  setBranches]  = useState<BranchLookup[]>([]);

  const [activeTab,   setActiveTab]  = useState<typeof TABS[number]["key"]>("personal");
  const [submitting,  setSubmitting] = useState(false);
  const [error,       setError]      = useState("");

  const updateAddress = makeAddressUpdater(setAddress);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      apiGet<{ success: boolean; data: VehicleLookup[] }>("/api/vehicles/lookup"),
      apiGet<{ success: boolean; data: BranchLookup[]  }>("/api/branches/lookup"),
    ]).then(([vr, br]) => {
      setVehicles(vr.data ?? []);
      setBranches(br.data ?? []);
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    setEmployeeId(driver.employeeId ?? "");
    setFullName(driver.fullName);
    setIdNumber(driver.idNumber ?? "");
    setStatus(driver.status);
    setVehicleId(typeof driver.currentVehicle === "object" ? driver.currentVehicle?._id ?? "" : "");
    setLicNum(driver.licenseNumber);
    setLicType(driver.licenseType ?? "");
    setLicExp(driver.licenseExpiry?.slice(0, 10) ?? "");
    setPdp((driver as any).pdpNumber ?? "");
    setPdpExp((driver as any).pdpExpiry?.slice(0, 10) ?? "");
    setMedExp((driver as any).medicalExpiry?.slice(0, 10) ?? "");
    setTrainExp((driver as any).trainingExpiry?.slice(0, 10) ?? "");
    setPhone(driver.phoneNumber ?? "");
    setEmail(driver.email ?? "");
    setEmergName((driver as any).emergencyContact?.name ?? "");
    setEmergPhone((driver as any).emergencyContact?.phone ?? "");
    setEmergRel((driver as any).emergencyContact?.relation ?? "");
    setSelected(getDriverBranchIds(driver));
    setBranchSearch("");
    setError("");
    setActiveTab("personal");
  }, [driver]);

  const toggleBranch = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await apiPut(`/api/drivers/${driver._id}`, {
        employeeId:     employeeId     || undefined,
        fullName,
        idNumber:       idNumber       || undefined,
        licenseNumber,
        licenseType:    licenseType    || undefined,
        licenseExpiry:  licenseExpiry  || undefined,
        pdpNumber:      pdpNumber      || undefined,
        pdpExpiry:      pdpExpiry      || undefined,
        medicalExpiry:  medicalExpiry  || undefined,
        trainingExpiry: trainingExpiry || undefined,
        phoneNumber:    phoneNumber    || undefined,
        email:          email          || undefined,
        address: [address.addressLine1, address.addressLine2, address.city, address.province, address.postalCode, address.country].filter(Boolean).join(", "),
        emergencyContact: (emergName || emergPhone) ? { name: emergName, phone: emergPhone, relation: emergRelation } : undefined,
        currentVehicle: vehicleId || undefined,
        branches: selectedBranches,
        status,
      });
      onUpdated(); onClose();
    } catch (e: any) { setError(e.message ?? "Update failed"); }
    finally { setSubmitting(false); }
  };

  const vehicleOptions = vehicles.map((v) => ({
    label: `${v.registrationNumber}${v.make ? ` — ${v.make}` : ""} (${v.status})`,
    value: v._id,
  }));

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    b.code.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const tabLabel = (key: string) => {
    if (key === "branches") return `Branches${selectedBranches.length ? ` (${selectedBranches.length})` : ""}`;
    return TABS.find((t) => t.key === key)?.label ?? key;
  };

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="edit-driver-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={`Edit Driver — ${driver.fullName}`} footer={footer} size="max-w-3xl">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-5 grid grid-cols-4 gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`rounded-lg py-1.5 text-sm font-medium transition-all ${
              activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {tabLabel(t.key)}
          </button>
        ))}
      </div>

      <form id="edit-driver-form" onSubmit={handleSubmit}>

        {/* ── Personal ──────────────────────────────────────────────────── */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Employee Number">
              <input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Full Name" required>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
            </Field>
            <Field label="ID / Passport Number">
              <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Status" required>
              <Select value={status} onChange={(v) => setStatus(v as any)} placeholder="Select status"
                options={["Available","On Trip","Offline","Suspended"]} required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Assigned Vehicle">
                <Select value={vehicleId} onChange={setVehicleId} placeholder="— No vehicle —" options={vehicleOptions} />
              </Field>
            </div>
          </div>
        )}

        {/* ── Licence ───────────────────────────────────────────────────── */}
        {activeTab === "licence" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Driver Licence Number" required>
              <input type="text" value={licenseNumber} onChange={(e) => setLicNum(e.target.value)} required className={inputClass} />
            </Field>
            <Field label="Licence Type">
              <Select value={licenseType} onChange={setLicType} placeholder="Select type"
                options={["Code 8","Code 10","Code 14","Code EB"]} />
            </Field>
            <Field label="Licence Expiry">
              <input type="date" value={licenseExpiry} onChange={(e) => setLicExp(e.target.value)} className={inputClass} />
            </Field>
            <Field label="PDP Number">
              <input type="text" value={pdpNumber} onChange={(e) => setPdp(e.target.value)} className={inputClass} />
            </Field>
            <Field label="PDP Expiry">
              <input type="date" value={pdpExpiry} onChange={(e) => setPdpExp(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Medical Expiry">
              <input type="date" value={medicalExpiry} onChange={(e) => setMedExp(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Training Expiry">
              <input type="date" value={trainingExpiry} onChange={(e) => setTrainExp(e.target.value)} className={inputClass} />
            </Field>
          </div>
        )}

        {/* ── Contact & Address ─────────────────────────────────────────── */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mobile Number">
                <input type="text" value={phoneNumber} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <AddressSection title="Residential Address" values={address} onChange={updateAddress} />
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Emergency Contact</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Name">
                  <input type="text" value={emergName} onChange={(e) => setEmergName(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Phone">
                  <input type="text" value={emergPhone} onChange={(e) => setEmergPhone(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Relationship">
                  <Select value={emergRelation} onChange={setEmergRel} placeholder="Select"
                    options={["Spouse","Parent","Sibling","Child","Friend","Other"]} />
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* ── Branches ──────────────────────────────────────────────────── */}
        {activeTab === "branches" && (
          <div className="space-y-4">

            {/* Info banner */}
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              selectedBranches.length === 0
                ? "border-amber-100 bg-amber-50 text-amber-700"
                : "border-green-100 bg-green-50 text-green-700"
            }`}>
              {selectedBranches.length === 0
                ? <p>⚠️ No branches selected — driver not restricted to any branch.</p>
                : <p>✅ Driver assigned to <strong>{selectedBranches.length} branch{selectedBranches.length > 1 ? "es" : ""}</strong>.</p>
              }
            </div>

            {/* Search + bulk actions */}
            <div className="flex items-center gap-2">
              <input type="text" value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branches…"
                className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => setSelected(branches.map((b) => b._id))}
                className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Select all
              </button>
              <button type="button" onClick={() => setSelected([])}
                className="whitespace-nowrap rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50">
                Clear
              </button>
            </div>

            {/* Checklist */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
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
                  const checked = selectedBranches.includes(b._id);
                  return (
                    <label key={b._id} onClick={() => toggleBranch(b._id)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                        i !== filteredBranches.length - 1 ? "border-b border-gray-50" : ""
                      } ${checked ? "bg-blue-50/60" : "hover:bg-gray-50/60"}`}>

                      {/* Checkbox */}
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

            {selectedBranches.length > 0 && (
              <p className="text-xs text-gray-500">
                Selected:{" "}
                {branches
                  .filter((b) => selectedBranches.includes(b._id))
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
