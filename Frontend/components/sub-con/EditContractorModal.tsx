"use client";
import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPut } from "@/lib/api";
import type { Contractor } from "./sub";

interface Props { isOpen:boolean; contractor:Contractor; onClose:()=>void; onUpdated:()=>void; }

export default function EditContractorModal({ isOpen, contractor, onClose, onUpdated }:Props) {
  const [name,        setName]       = useState(contractor.name);
  const [companyReg,  setCompanyReg] = useState(contractor.companyRegistration ?? "");
  const [vatNumber,   setVatNumber]  = useState((contractor as any).vatNumber ?? "");
  const [contactPerson,setContact]  = useState(contractor.contactPerson ?? "");
  const [phone,       setPhone]      = useState(contractor.phoneNumber ?? "");
  const [email,       setEmail]      = useState(contractor.email ?? "");
  const [physAddr,    setPhysAddr]   = useState<AddressData>(emptyAddress());
  const [bankName,    setBankName]   = useState((contractor as any).bankName ?? "");
  const [bankAccNo,   setBankAccNo]  = useState((contractor as any).bankAccountNumber ?? "");
  const [bankBranch,  setBankBranch] = useState((contractor as any).bankBranchCode ?? "");
  const [bankAccType, setBankAccType]= useState((contractor as any).bankAccountType ?? "");
  const [serviceRaw,  setServiceRaw] = useState((contractor.serviceRegions ?? []).join(", "));
  const [vehicleRaw,  setVehicleRaw] = useState((contractor.vehicleTypes ?? []).join(", "));
  const [contractStart,setStart]    = useState(contractor.contractStartDate?.slice(0,10) ?? "");
  const [contractEnd, setEnd]        = useState(contractor.contractEndDate?.slice(0,10) ?? "");
  const [ratePerKm,   setRate]       = useState(contractor.ratePerKm?.toString() ?? "");
  const [status,      setStatus]     = useState(contractor.status);
  const [notes,       setNotes]      = useState(contractor.notes ?? "");
  const [activeTab,   setActiveTab]  = useState<"general"|"address"|"banking">("general");
  const [submitting,  setSubmitting] = useState(false);
  const [error,       setError]      = useState("");

  const updateAddr = makeAddressUpdater(setPhysAddr);

  useEffect(() => {
    setName(contractor.name); setCompanyReg(contractor.companyRegistration??"");
    setVatNumber((contractor as any).vatNumber??"");
    setContact(contractor.contactPerson??""); setPhone(contractor.phoneNumber??""); setEmail(contractor.email??"");
    setBankName((contractor as any).bankName??""); setBankAccNo((contractor as any).bankAccountNumber??"");
    setBankBranch((contractor as any).bankBranchCode??""); setBankAccType((contractor as any).bankAccountType??"");
    setServiceRaw((contractor.serviceRegions??[]).join(", ")); setVehicleRaw((contractor.vehicleTypes??[]).join(", "));
    setStart(contractor.contractStartDate?.slice(0,10)??""); setEnd(contractor.contractEndDate?.slice(0,10)??"");
    setRate(contractor.ratePerKm?.toString()??""); setStatus(contractor.status); setNotes(contractor.notes??"");
    setError(""); setActiveTab("general");
  }, [contractor]);

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await apiPut(`/api/contractors/${contractor._id}`, {
        name: name.trim(), companyRegistration: companyReg||undefined, vatNumber: vatNumber||undefined,
        contactPerson: contactPerson||undefined, phoneNumber: phone||undefined, email: email||undefined,
        address: [physAddr.addressLine1,physAddr.addressLine2,physAddr.city,physAddr.province,physAddr.postalCode,physAddr.country].filter(Boolean).join(", "),
        bankName: bankName||undefined, bankAccountNumber: bankAccNo||undefined,
        bankBranchCode: bankBranch||undefined, bankAccountType: bankAccType||undefined,
        serviceRegions: serviceRaw.split(",").map(s=>s.trim()).filter(Boolean),
        vehicleTypes: vehicleRaw.split(",").map(s=>s.trim()).filter(Boolean),
        contractStartDate: contractStart||undefined, contractEndDate: contractEnd||undefined,
        ratePerKm: ratePerKm ? parseFloat(ratePerKm) : undefined,
        status, notes: notes||undefined,
      });
      onUpdated(); onClose();
    } catch(e:any) { setError(e.message??"Update failed"); }
    finally { setSubmitting(false); }
  };

  const tabs = [{key:"general",label:"General"},{key:"address",label:"Address"},{key:"banking",label:"Banking & Contract"}] as const;
  const footer = (
    <>
      <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="edit-contractor-form" disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{submitting?"Saving…":"Save Changes"}</button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={`Edit — ${contractor.name}`} footer={footer} size="max-w-3xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1">
        {tabs.map(t=>(
          <button key={t.key} type="button" onClick={()=>setActiveTab(t.key)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${activeTab===t.key?"bg-white text-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>
      <form id="edit-contractor-form" onSubmit={handleSubmit}>
        {activeTab==="general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company Name" required><input type="text" value={name} onChange={e=>setName(e.target.value)} required className={inputClass} /></Field>
              <Field label="Registration Number"><input type="text" value={companyReg} onChange={e=>setCompanyReg(e.target.value)} className={inputClass} /></Field>
              <Field label="VAT Number"><input type="text" value={vatNumber} onChange={e=>setVatNumber(e.target.value)} className={inputClass} /></Field>
              <Field label="Status" required><Select value={status} onChange={(v) => setStatus(v as "Active" | "Inactive" | "Suspended")} placeholder="Select status" options={["Active","Inactive","Suspended"]} required /></Field>
              <Field label="Contact Person"><input type="text" value={contactPerson} onChange={e=>setContact(e.target.value)} className={inputClass} /></Field>
              <Field label="Phone"><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className={inputClass} /></Field>
              <div className="sm:col-span-2"><Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inputClass} /></Field></div>
            </div>
            <Field label="Notes"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} /></Field>
          </div>
        )}
        {activeTab==="address" && <AddressSection title="Physical Address" values={physAddr} onChange={updateAddr} />}
        {activeTab==="banking" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Banking Details</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Bank Name"><input type="text" value={bankName} onChange={e=>setBankName(e.target.value)} className={inputClass} /></Field>
                <Field label="Account Number"><input type="text" value={bankAccNo} onChange={e=>setBankAccNo(e.target.value)} className={inputClass} /></Field>
                <Field label="Branch Code"><input type="text" value={bankBranch} onChange={e=>setBankBranch(e.target.value)} className={inputClass} /></Field>
                <Field label="Account Type"><Select value={bankAccType} onChange={setBankAccType} placeholder="Select type" options={["Current","Savings","Transmission"]} /></Field>
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Contract & Rates</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Start Date"><input type="date" value={contractStart} onChange={e=>setStart(e.target.value)} className={inputClass} /></Field>
                <Field label="Expiry Date"><input type="date" value={contractEnd} onChange={e=>setEnd(e.target.value)} className={inputClass} /></Field>
                <Field label="Rate/km (R)"><input type="number" step="0.01" value={ratePerKm} onChange={e=>setRate(e.target.value)} className={inputClass} /></Field>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Service Regions"><input type="text" value={serviceRaw} onChange={e=>setServiceRaw(e.target.value)} placeholder="Comma-separated" className={inputClass} /></Field>
                <Field label="Vehicle Types"><input type="text" value={vehicleRaw} onChange={e=>setVehicleRaw(e.target.value)} placeholder="Comma-separated" className={inputClass} /></Field>
              </div>
            </div>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
