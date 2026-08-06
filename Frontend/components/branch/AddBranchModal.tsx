"use client";

/**
 * Add Branch Modal
 * Fields per requirement doc:
 * Branch Code, Branch Name, Physical Address (structured),
 * Contact Details (phone, email, fax),
 * Manager (name, email, phone),
 * Operating Hours (per day), Status
 */

import React, { useState } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPost } from "@/lib/api";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

interface OperatingHour { day: string; opens: string; closes: string; closed: boolean; }

function defaultHours(): OperatingHour[] {
  return DAYS.map((day) => ({
    day,
    opens: day === "Saturday" ? "08:00" : day === "Sunday" ? "" : "08:00",
    closes: day === "Saturday" ? "13:00" : day === "Sunday" ? "" : "17:00",
    closed: day === "Sunday",
  }));
}

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddBranchModal({ isOpen, onClose, onCreated }: AddBranchModalProps) {
  const [code,         setCode]         = useState("");
  const [name,         setName]         = useState("");
  const [phone,        setPhone]        = useState("");
  const [email,        setEmail]        = useState("");
  const [fax,          setFax]          = useState("");
  const [managerName,  setMgrName]      = useState("");
  const [managerEmail, setMgrEmail]     = useState("");
  const [managerPhone, setMgrPhone]     = useState("");
  const [isHeadOffice, setIsHQ]         = useState(false);
  const [status,       setStatus]       = useState("Active");
  const [address,      setAddress]      = useState<AddressData>(emptyAddress());
  const [hours,        setHours]        = useState<OperatingHour[]>(defaultHours());
  const [activeTab,    setActiveTab]    = useState<"general"|"address"|"hours">("general");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");

  const updateAddress = makeAddressUpdater(setAddress);

  const updateHour = (idx: number, field: keyof OperatingHour, value: string | boolean) => {
    setHours((p) => p.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  const reset = () => {
    setCode(""); setName(""); setPhone(""); setEmail(""); setFax("");
    setMgrName(""); setMgrEmail(""); setMgrPhone(""); setIsHQ(false);
    setStatus("Active"); setAddress(emptyAddress()); setHours(defaultHours());
    setError(""); setActiveTab("general");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setSubmitting(true); setError("");
    try {
      await apiPost("/api/branches", {
        code:         code.trim().toUpperCase(),
        name:         name.trim(),
        phoneNumber:  phone       || undefined,
        email:        email       || undefined,
        faxNumber:    fax         || undefined,
        managerName:  managerName || undefined,
        managerEmail: managerEmail|| undefined,
        managerPhone: managerPhone|| undefined,
        isHeadOffice,
        status,
        addressLine1: address.addressLine1 || undefined,
        addressLine2: address.addressLine2 || undefined,
        suburb:       address.suburb       || undefined,
        city:         address.city         || undefined,
        province:     address.province     || undefined,
        postalCode:   address.postalCode   || undefined,
        country:      address.country      || undefined,
        address:      [address.addressLine1, address.addressLine2, address.suburb, address.city, address.province, address.postalCode].filter(Boolean).join(", "),
        operatingHours: hours,
      });
      reset(); onCreated(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create branch");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: "general", label: "General"           },
    { key: "address", label: "Address"            },
    { key: "hours",   label: "Operating Hours"    },
  ] as const;

  const footer = (
    <>
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="add-branch-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Creating…" : "Create Branch"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Add New Branch" footer={footer} size="max-w-3xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <div className="mb-5 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form id="add-branch-form" onSubmit={handleSubmit}>

        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Branch Code" required>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. JHB" required className={inputClass} />
              </Field>
              <Field label="Branch Name" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Johannesburg" required className={inputClass} />
              </Field>
              <Field label="Phone Number">
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 011 123 4567" className={inputClass} />
              </Field>
              <Field label="Email Address">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jhb@freightflow.co.za" className={inputClass} />
              </Field>
              <Field label="Fax Number">
                <input type="text" value={fax} onChange={(e) => setFax(e.target.value)}
                  placeholder="e.g. 011 123 4568" className={inputClass} />
              </Field>
              <Field label="Status" required>
                <Select value={status} onChange={setStatus} placeholder="Select status"
                  options={["Active","Inactive"]} required />
              </Field>
            </div>

            {/* Manager */}
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Branch Manager</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Manager Name">
                  <input type="text" value={managerName} onChange={(e) => setMgrName(e.target.value)}
                    placeholder="e.g. Sarah Mokoena" className={inputClass} />
                </Field>
                <Field label="Manager Email">
                  <input type="email" value={managerEmail} onChange={(e) => setMgrEmail(e.target.value)}
                    placeholder="e.g. sarah@ff.co.za" className={inputClass} />
                </Field>
                <Field label="Manager Phone">
                  <input type="text" value={managerPhone} onChange={(e) => setMgrPhone(e.target.value)}
                    placeholder="e.g. 082 000 0000" className={inputClass} />
                </Field>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={isHeadOffice} onChange={(e) => setIsHQ(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              This is the Head Office branch
            </label>
          </div>
        )}

        {activeTab === "address" && (
          <AddressSection title="Branch Physical Address" values={address} onChange={updateAddress} />
        )}

        {activeTab === "hours" && (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <div className="grid grid-cols-4 gap-0 bg-gray-50/70 px-4 py-2.5 text-xs font-semibold uppercase text-gray-600">
              <span>Day</span><span>Opens</span><span>Closes</span><span>Closed</span>
            </div>
            {hours.map((h, i) => (
              <div key={h.day} className={`grid grid-cols-4 items-center gap-2 px-4 py-2 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                <span className="text-sm font-medium text-gray-700">{h.day}</span>
                <input type="time" value={h.opens} disabled={h.closed}
                  onChange={(e) => updateHour(i, "opens", e.target.value)}
                  className={`${inputClass} py-1.5 disabled:bg-gray-100 disabled:text-gray-400`} />
                <input type="time" value={h.closes} disabled={h.closed}
                  onChange={(e) => updateHour(i, "closes", e.target.value)}
                  className={`${inputClass} py-1.5 disabled:bg-gray-100 disabled:text-gray-400`} />
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
                  <input type="checkbox" checked={h.closed}
                    onChange={(e) => updateHour(i, "closed", e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-red-500" />
                  Closed
                </label>
              </div>
            ))}
          </div>
        )}
      </form>
    </ModalShell>
  );
}