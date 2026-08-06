"use client";
import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPut } from "@/lib/api";
import type { Branch } from "./branches";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
interface OperatingHour { day:string; opens:string; closes:string; closed:boolean; }
function defaultHours():OperatingHour[] {
  return DAYS.map(day=>({ day, opens:day==="Sunday"?"":"08:00", closes:day==="Sunday"?"":day==="Saturday"?"13:00":"17:00", closed:day==="Sunday" }));
}

interface Props { isOpen:boolean; branch:Branch; onClose:()=>void; onUpdated:()=>void; }

export default function EditBranchModal({ isOpen, branch, onClose, onUpdated }:Props) {
  const [name,        setName]        = useState(branch.name);
  const [phone,       setPhone]       = useState(branch.phoneNumber??"");
  const [email,       setEmail]       = useState(branch.email??"");
  const [fax,         setFax]         = useState((branch as any).faxNumber??"");
  const [mgrName,     setMgrName]     = useState(branch.managerName??"");
  const [mgrEmail,    setMgrEmail]    = useState((branch as any).managerEmail??"");
  const [mgrPhone,    setMgrPhone]    = useState((branch as any).managerPhone??"");
  const [isHQ,        setIsHQ]        = useState(branch.isHeadOffice??false);
  const [status,      setStatus]      = useState(branch.status);
  const [address,     setAddress]     = useState<AddressData>({
    addressLine1: (branch as any).addressLine1||"",
    addressLine2: (branch as any).addressLine2||"",
    city:         branch.city||"",
    province:     branch.province||"",
    postalCode:   (branch as any).postalCode||"",
    country:      (branch as any).country||"South Africa",
  });
  const [hours,       setHours]       = useState<OperatingHour[]>((branch as any).operatingHours?.length ? (branch as any).operatingHours : defaultHours());
  const [activeTab,   setActiveTab]   = useState<"general"|"address"|"hours">("general");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  const updateAddress = makeAddressUpdater(setAddress);

  useEffect(() => {
    setName(branch.name); setPhone(branch.phoneNumber??""); setEmail(branch.email??"");
    setFax((branch as any).faxNumber??""); setMgrName(branch.managerName??"");
    setMgrEmail((branch as any).managerEmail??""); setMgrPhone((branch as any).managerPhone??"");
    setIsHQ(branch.isHeadOffice??false); setStatus(branch.status);
    setAddress({ addressLine1:(branch as any).addressLine1||"", addressLine2:(branch as any).addressLine2||"",
      city:branch.city||"", province:branch.province||"", postalCode:(branch as any).postalCode||"", country:(branch as any).country||"South Africa" });
    setHours((branch as any).operatingHours?.length ? (branch as any).operatingHours : defaultHours());
    setError(""); setActiveTab("general");
  }, [branch]);

  const updateHour = (i:number, f:keyof OperatingHour, v:string|boolean) =>
    setHours(p=>p.map((h,idx)=>idx===i?{...h,[f]:v}:h));

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("");
    try {
      await apiPut(`/api/branches/${branch._id}`, {
        name:name.trim(), phoneNumber:phone||undefined, email:email||undefined, faxNumber:fax||undefined,
        managerName:mgrName||undefined, managerEmail:mgrEmail||undefined, managerPhone:mgrPhone||undefined,
        isHeadOffice:isHQ, status,
        addressLine1:address.addressLine1||undefined, addressLine2:address.addressLine2||undefined,
        city:address.city||undefined, province:address.province||undefined,
        postalCode:address.postalCode||undefined, country:address.country||undefined,
        address:[address.addressLine1,address.addressLine2,address.city,address.province,address.postalCode].filter(Boolean).join(", "),
        operatingHours:hours,
      });
      onUpdated(); onClose();
    } catch(e:any) { setError(e.message??"Update failed"); }
    finally { setSubmitting(false); }
  };

  const tabs = [{key:"general",label:"General"},{key:"address",label:"Address"},{key:"hours",label:"Operating Hours"}] as const;
  const footer = (
    <>
      <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="edit-branch-form" disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{submitting?"Saving…":"Save Changes"}</button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={`Edit Branch — ${branch.code}`} footer={footer} size="max-w-3xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1">
        {tabs.map(t=>(
          <button key={t.key} type="button" onClick={()=>setActiveTab(t.key)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${activeTab===t.key?"bg-white text-blue-600 shadow-sm":"text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>
      <form id="edit-branch-form" onSubmit={handleSubmit}>
        {activeTab==="general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Branch Name" required><input type="text" value={name} onChange={e=>setName(e.target.value)} required className={inputClass} /></Field>
              <Field label="Status" required><Select value={status} onChange={setStatus} placeholder="Select status" options={["Active","Inactive"]} required /></Field>
              <Field label="Phone Number"><input type="text" value={phone} onChange={e=>setPhone(e.target.value)} className={inputClass} /></Field>
              <Field label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={inputClass} /></Field>
              <Field label="Fax Number"><input type="text" value={fax} onChange={e=>setFax(e.target.value)} className={inputClass} /></Field>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Branch Manager</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Name"><input type="text" value={mgrName} onChange={e=>setMgrName(e.target.value)} className={inputClass} /></Field>
                <Field label="Email"><input type="email" value={mgrEmail} onChange={e=>setMgrEmail(e.target.value)} className={inputClass} /></Field>
                <Field label="Phone"><input type="text" value={mgrPhone} onChange={e=>setMgrPhone(e.target.value)} className={inputClass} /></Field>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={isHQ} onChange={e=>setIsHQ(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />Head Office
            </label>
          </div>
        )}
        {activeTab==="address" && <AddressSection title="Branch Physical Address" values={address} onChange={updateAddress} />}
        {activeTab==="hours" && (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <div className="grid grid-cols-4 gap-0 bg-gray-50/70 px-4 py-2.5 text-xs font-semibold uppercase text-gray-600">
              <span>Day</span><span>Opens</span><span>Closes</span><span>Closed</span>
            </div>
            {hours.map((h,i)=>(
              <div key={h.day} className={`grid grid-cols-4 items-center gap-2 px-4 py-2 ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
                <span className="text-sm font-medium text-gray-700">{h.day}</span>
                <input type="time" value={h.opens} disabled={h.closed} onChange={e=>updateHour(i,"opens",e.target.value)} className={`${inputClass} py-1.5 disabled:bg-gray-100 disabled:text-gray-400`} />
                <input type="time" value={h.closes} disabled={h.closed} onChange={e=>updateHour(i,"closes",e.target.value)} className={`${inputClass} py-1.5 disabled:bg-gray-100 disabled:text-gray-400`} />
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
                  <input type="checkbox" checked={h.closed} onChange={e=>updateHour(i,"closed",e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 text-red-500" />Closed
                </label>
              </div>
            ))}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
