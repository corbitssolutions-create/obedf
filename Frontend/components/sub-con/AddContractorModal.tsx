"use client";

/**
 * Add Contractor / Sub-Contractor Modal
 * Fields per requirement doc (Suppliers section maps to contractors):
 * Supplier Code, Company Name, Supplier Type,
 * Contact Details (person, phone, email),
 * Banking Details (bank, account no, branch code, account type),
 * VAT Number, Physical Address (structured), Status
 * + Contract dates, Service Regions, Rate per km
 */

import React, { useState } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPost } from "@/lib/api";

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddContractorModal({ isOpen, onClose, onCreated }: AddContractorModalProps) {
  // ── Identification ─────────────────────────────────────────────────────────
  const [name,           setName]           = useState("");
  const [companyReg,     setCompanyReg]     = useState("");
  const [vatNumber,      setVatNumber]      = useState("");

  // ── Contact ────────────────────────────────────────────────────────────────
  const [contactPerson,  setContactPerson]  = useState("");
  const [phoneNumber,    setPhoneNumber]    = useState("");
  const [email,          setEmail]          = useState("");

  // ── Address ────────────────────────────────────────────────────────────────
  const [physicalAddress, setPhysAddr]      = useState<AddressData>(emptyAddress());

  // ── Banking Details ────────────────────────────────────────────────────────
  const [bankName,       setBankName]       = useState("");
  const [bankAccNo,      setBankAccNo]      = useState("");
  const [bankBranch,     setBankBranch]     = useState("");
  const [bankAccType,    setBankAccType]    = useState("");

  // ── Contract & Rates ───────────────────────────────────────────────────────
  const [serviceRegionsRaw, setServiceRaw] = useState("");
  const [vehicleTypesRaw,   setVehicleRaw] = useState("");
  const [contractStart,  setContractStart] = useState("");
  const [contractEnd,    setContractEnd]   = useState("");
  const [ratePerKm,      setRatePerKm]     = useState("");

  // ── Status ─────────────────────────────────────────────────────────────────
  const [status,         setStatus]        = useState("Active");
  const [notes,          setNotes]         = useState("");

  const [activeTab,      setActiveTab]     = useState<"general"|"address"|"banking">("general");
  const [submitting,     setSubmitting]    = useState(false);
  const [error,          setError]         = useState("");

  const updatePhysAddr = makeAddressUpdater(setPhysAddr);

  const reset = () => {
    setName(""); setCompanyReg(""); setVatNumber("");
    setContactPerson(""); setPhoneNumber(""); setEmail("");
    setPhysAddr(emptyAddress());
    setBankName(""); setBankAccNo(""); setBankBranch(""); setBankAccType("");
    setServiceRaw(""); setVehicleRaw(""); setContractStart(""); setContractEnd(""); setRatePerKm("");
    setStatus("Active"); setNotes(""); setError(""); setActiveTab("general");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true); setError("");
    try {
      await apiPost("/api/contractors", {
        name:              name.trim(),
        companyRegistration: companyReg    || undefined,
        vatNumber:         vatNumber       || undefined,
        contactPerson:     contactPerson   || undefined,
        phoneNumber:       phoneNumber     || undefined,
        email:             email           || undefined,
        address: `${physicalAddress.addressLine1}${physicalAddress.addressLine2 ? ", " + physicalAddress.addressLine2 : ""}, ${physicalAddress.city}, ${physicalAddress.province}, ${physicalAddress.postalCode}, ${physicalAddress.country}`.replace(/^[, ]+|[, ]+$/g, ""),
        bankName:          bankName        || undefined,
        bankAccountNumber: bankAccNo       || undefined,
        bankBranchCode:    bankBranch      || undefined,
        bankAccountType:   bankAccType     || undefined,
        serviceRegions:    serviceRegionsRaw.split(",").map((s) => s.trim()).filter(Boolean),
        vehicleTypes:      vehicleTypesRaw.split(",").map((s) => s.trim()).filter(Boolean),
        contractStartDate: contractStart   || undefined,
        contractEndDate:   contractEnd     || undefined,
        ratePerKm:         ratePerKm       ? parseFloat(ratePerKm) : undefined,
        status,
        notes: notes || undefined,
      });
      reset(); onCreated(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create contractor");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: "general", label: "General"     },
    { key: "address", label: "Address"     },
    { key: "banking", label: "Banking & Contract" },
  ] as const;

  const footer = (
    <>
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="add-contractor-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Creating…" : "Create Contractor"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Add New Contractor" footer={footer} size="max-w-3xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {/* Tab nav */}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form id="add-contractor-form" onSubmit={handleSubmit}>

        {/* ── General Tab ─────────────────────────────────────────────────── */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company Name" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Swift Haul CC" required className={inputClass} />
              </Field>
              <Field label="Registration Number">
                <input type="text" value={companyReg} onChange={(e) => setCompanyReg(e.target.value)}
                  placeholder="e.g. 2022/123456/07" className={inputClass} />
              </Field>
              <Field label="VAT Number">
                <input type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="e.g. 4560000000" className={inputClass} />
              </Field>
              <Field label="Status" required>
                <Select value={status} onChange={setStatus} placeholder="Select status"
                  options={["Active","Inactive","Suspended"]} required />
              </Field>
              <Field label="Contact Person">
                <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. John Smith" className={inputClass} />
              </Field>
              <Field label="Phone Number">
                <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 011 888 1234" className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ops@contractor.co.za" className={inputClass} />
                </Field>
              </div>
            </div>
            <Field label="Notes">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} placeholder="Any notes…" className={`${inputClass} resize-none`} />
            </Field>
          </div>
        )}

        {/* ── Address Tab ─────────────────────────────────────────────────── */}
        {activeTab === "address" && (
          <AddressSection title="Physical Address" values={physicalAddress} onChange={updatePhysAddr} />
        )}

        {/* ── Banking & Contract Tab ────────────────────────────────────────── */}
        {activeTab === "banking" && (
          <div className="space-y-4">
            {/* Banking */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Banking Details</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Bank Name">
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Standard Bank" className={inputClass} />
                </Field>
                <Field label="Account Number">
                  <input type="text" value={bankAccNo} onChange={(e) => setBankAccNo(e.target.value)}
                    placeholder="e.g. 012345678" className={inputClass} />
                </Field>
                <Field label="Branch Code">
                  <input type="text" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="e.g. 051001" className={inputClass} />
                </Field>
                <Field label="Account Type">
                  <Select value={bankAccType} onChange={setBankAccType} placeholder="Select type"
                    options={["Current","Savings","Transmission"]} />
                </Field>
              </div>
            </div>

            {/* Contract & Rates */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Contract & Rates</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Contract Start Date">
                  <input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Contract Expiry Date">
                  <input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Rate per km (R)">
                  <input type="number" step="0.01" min="0" value={ratePerKm}
                    onChange={(e) => setRatePerKm(e.target.value)} placeholder="e.g. 14.50" className={inputClass} />
                </Field>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Service Regions">
                  <input type="text" value={serviceRegionsRaw} onChange={(e) => setServiceRaw(e.target.value)}
                    placeholder="e.g. Gauteng, KZN (comma-separated)" className={inputClass} />
                </Field>
                <Field label="Vehicle Types Operated">
                  <input type="text" value={vehicleTypesRaw} onChange={(e) => setVehicleRaw(e.target.value)}
                    placeholder="e.g. Truck, Van (comma-separated)" className={inputClass} />
                </Field>
              </div>
            </div>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
