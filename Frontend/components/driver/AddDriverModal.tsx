"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPost, apiGet } from "@/lib/api";
import { Building2, Check } from "lucide-react";

interface VehicleLookup { _id: string; registrationNumber: string; make?: string; status: string; }
interface BranchLookup  { _id: string; code: string; name: string; isHeadOffice?: boolean; }

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TABS = [
  { key: "personal", label: "Personal"            },
  { key: "licence",  label: "Licence"             },
  { key: "contact",  label: "Contact & Address"   },
  { key: "branches", label: "Branches"            },
] as const;

export default function AddDriverModal({ isOpen, onClose, onCreated }: AddDriverModalProps) {
  // Personal
  const [employeeId,    setEmployeeId]   = useState("");
  const [fullName,      setFullName]     = useState("");
  const [idNumber,      setIdNumber]     = useState("");
  const [status,        setStatus]       = useState("Available");
  const [vehicleId,     setVehicleId]    = useState("");

  // Licence
  const [licenseNumber, setLicNum]       = useState("");
  const [licenseType,   setLicType]      = useState("");
  const [licenseExpiry, setLicExp]       = useState("");
  const [pdpNumber,     setPdp]          = useState("");
  const [pdpExpiry,     setPdpExp]       = useState("");
  const [medicalExpiry, setMedExp]       = useState("");
  const [trainingExpiry,setTrainExp]     = useState("");

  // Contact
  const [phoneNumber,   setPhone]        = useState("");
  const [email,         setEmail]        = useState("");
  const [address,       setAddress]      = useState<AddressData>(emptyAddress());
  const [emergName,     setEmergName]    = useState("");
  const [emergPhone,    setEmergPhone]   = useState("");
  const [emergRelation, setEmergRel]     = useState("");

  // Branches (multiple)
  const [selectedBranches, setSelected] = useState<string[]>([]);
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

  const reset = () => {
    setEmployeeId(""); setFullName(""); setIdNumber(""); setStatus("Available"); setVehicleId("");
    setLicNum(""); setLicType(""); setLicExp(""); setPdp(""); setPdpExp(""); setMedExp(""); setTrainExp("");
    setPhone(""); setEmail(""); setAddress(emptyAddress()); setEmergName(""); setEmergPhone(""); setEmergRel("");
    setSelected([]); setBranchSearch(""); setError(""); setActiveTab("personal");
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleBranch = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((b) => b !== id) : [...p, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !licenseNumber.trim()) {
      setActiveTab("personal");
      setError("Full name and licence number are required.");
      return;
    }
    setSubmitting(true); setError("");
    try {
      await apiPost("/api/drivers", {
        employeeId:     employeeId     || undefined,
        fullName:       fullName.trim(),
        idNumber:       idNumber       || undefined,
        licenseNumber:  licenseNumber.trim(),
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
      reset(); onCreated(); onClose();
    } catch (e: any) { setError(e.message ?? "Failed to create driver"); }
    finally { setSubmitting(false); }
  };

  const vehicleOptions = vehicles.map((v) => ({ label: `${v.registrationNumber}${v.make ? ` — ${v.make}` : ""} (${v.status})`, value: v._id }));
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
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="add-driver-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Creating…" : "Create Driver"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Add New Driver" footer={footer} size="max-w-3xl">
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

      <form id="add-driver-form" onSubmit={handleSubmit}>

        {/* ── Personal ──────────────────────────────────────────────────── */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Employee Number"><input type="text" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. EMP-001" className={inputClass} /></Field>
            <Field label="Full Name" required><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. John Dube" required className={inputClass} /></Field>
            <Field label="ID / Passport Number"><input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. 8001015001085" className={inputClass} /></Field>
            <Field label="Status" required><Select value={status} onChange={setStatus} placeholder="Select status" options={["Available","On Trip","Offline","Suspended"]} required /></Field>
            <div className="sm:col-span-2">
              <Field label="Assign Vehicle"><Select value={vehicleId} onChange={setVehicleId} placeholder="— No vehicle —" options={vehicleOptions} /></Field>
            </div>
          </div>
        )}

        {/* ── Licence ───────────────────────────────────────────────────── */}
        {activeTab === "licence" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Driver Licence Number" required><input type="text" value={licenseNumber} onChange={(e) => setLicNum(e.target.value)} placeholder="e.g. DL-001234" required className={inputClass} /></Field>
            <Field label="Licence Type"><Select value={licenseType} onChange={setLicType} placeholder="Select type" options={["Code 8","Code 10","Code 14","Code EB"]} /></Field>
            <Field label="Licence Expiry"><input type="date" value={licenseExpiry} onChange={(e) => setLicExp(e.target.value)} className={inputClass} /></Field>
            <Field label="PDP Number"><input type="text" value={pdpNumber} onChange={(e) => setPdp(e.target.value)} placeholder="e.g. PDP-00123" className={inputClass} /></Field>
            <Field label="PDP Expiry"><input type="date" value={pdpExpiry} onChange={(e) => setPdpExp(e.target.value)} className={inputClass} /></Field>
            <Field label="Medical Expiry"><input type="date" value={medicalExpiry} onChange={(e) => setMedExp(e.target.value)} className={inputClass} /></Field>
            <Field label="Training Expiry"><input type="date" value={trainingExpiry} onChange={(e) => setTrainExp(e.target.value)} className={inputClass} /></Field>
          </div>
        )}

        {/* ── Contact & Address ─────────────────────────────────────────── */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mobile Number"><input type="text" value={phoneNumber} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 082 111 2222" className={inputClass} /></Field>
              <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. driver@ff.co.za" className={inputClass} /></Field>
            </div>
            <AddressSection title="Residential Address" values={address} onChange={updateAddress} />
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Emergency Contact</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Name"><input type="text" value={emergName} onChange={(e) => setEmergName(e.target.value)} placeholder="e.g. Mary Dube" className={inputClass} /></Field>
                <Field label="Phone"><input type="text" value={emergPhone} onChange={(e) => setEmergPhone(e.target.value)} placeholder="e.g. 083 999 8888" className={inputClass} /></Field>
                <Field label="Relationship"><Select value={emergRelation} onChange={setEmergRel} placeholder="Select" options={["Spouse","Parent","Sibling","Child","Friend","Other"]} /></Field>
              </div>
            </div>
          </div>
        )}

        {/* ── Branches ──────────────────────────────────────────────────── */}
        {activeTab === "branches" && (
          <div className="space-y-4">
            {/* Info banner */}
            <div className={`rounded-xl border px-4 py-3 text-sm ${selectedBranches.length === 0 ? "border-amber-100 bg-amber-50 text-amber-700" : "border-green-100 bg-green-50 text-green-700"}`}>
              {selectedBranches.length === 0
                ? <p>⚠️ No branches selected — driver is not restricted to any branch.</p>
                : <p>✅ Driver assigned to <strong>{selectedBranches.length} branch{selectedBranches.length > 1 ? "es" : ""}</strong>.</p>}
            </div>

            {/* Search + bulk actions */}
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
