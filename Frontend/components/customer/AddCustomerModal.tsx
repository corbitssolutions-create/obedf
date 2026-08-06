"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPost, apiGet } from "@/lib/api";

interface ContactPerson { name: string; email: string; phone: string; isPrimary: boolean; }
interface CustomerTypeOption { _id: string; code: string; name: string; }

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function emptyContact(): ContactPerson {
  return { name: "", email: "", phone: "", isPrimary: false };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---- Section accent tokens (kept local to this file, doesn't touch shared FormControls) ----
const SECTION_ACCENTS = {
  general:   { text: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   ring: "ring-blue-100"   },
  address:   { text: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200",   ring: "ring-teal-100"   },
  financial: { text: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  ring: "ring-amber-100"  },
} as const;

export default function AddCustomerModal({ isOpen, onClose, onCreated }: AddCustomerModalProps) {
  const [customerCode,  setCustomerCode]  = useState("");
  const [codeIsAuto,    setCodeIsAuto]    = useState(false);
  const [codeLoading,   setCodeLoading]   = useState(false);
  const [name,          setName]          = useState("");
  const [customerType,  setCustomerType]  = useState("");
  const [email,         setEmail]         = useState("");
  const [phone,         setPhone]         = useState("");
  const [contactPersons,setContacts]      = useState<ContactPerson[]>([emptyContact()]);
  const [billingAddress, setBilling]      = useState<AddressData>(emptyAddress());
  const [deliveryAddress,setDelivery]     = useState<AddressData>(emptyAddress());
  const [sameAsDelivery, setSame]         = useState(false);
  const [vatNumber,     setVat]           = useState("");
  const [creditLimit,   setCreditLimit]   = useState("");
  const [creditTerms,   setCreditTerms]   = useState("");
  const [pickupRaw,     setPickupRaw]     = useState("");
  const [status,        setStatus]        = useState("Active");
  const [customerTypes, setCustomerTypes] = useState<CustomerTypeOption[]>([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");
  const [activeTab,     setActiveTab]     = useState<"general"|"address"|"financial">("general");

  const updateBilling  = makeAddressUpdater(setBilling);
  const updateDelivery = makeAddressUpdater(setDelivery);

  // Load customer types from DB master data
  useEffect(() => {
    if (!isOpen) return;
    apiGet<{ success: boolean; data: CustomerTypeOption[] }>("/api/master/customer-types/lookup")
      .then((res) => setCustomerTypes(res.data ?? []))
      .catch(() => {});
  }, [isOpen]);

  // Auto-generate a default Customer Code — user can still edit or regenerate it
  const generateCode = useCallback(() => {
    setCodeLoading(true);
    apiGet<{ success: boolean; code: string }>("/api/customers/next-code")
      .then((res) => {
        if (res.code) {
          setCustomerCode(res.code);
          setCodeIsAuto(true);
        }
      })
      .catch(() => {
        const fallback = `CUST-${Date.now().toString().slice(-6)}`;
        setCustomerCode(fallback);
        setCodeIsAuto(true);
      })
      .finally(() => setCodeLoading(false));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    generateCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updateContact = (i: number, f: keyof ContactPerson, v: string | boolean) =>
    setContacts((prev) => prev.map((c, idx) => idx === i ? { ...c, [f]: v } : c));

  const reset = () => {
    setCustomerCode(""); setCodeIsAuto(false); setName(""); setCustomerType("");
    setEmail(""); setPhone(""); setContacts([emptyContact()]);
    setBilling(emptyAddress()); setDelivery(emptyAddress()); setSame(false);
    setVat(""); setCreditLimit(""); setCreditTerms(""); setPickupRaw("");
    setStatus("Active"); setError(""); setActiveTab("general");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCode.trim()) {
      setError("Customer Code is required");
      setActiveTab("general");
      return;
    }
    if (!name.trim()) return;
    setSubmitting(true); setError("");
    try {
      const effectiveBilling = sameAsDelivery ? deliveryAddress : billingAddress;
      await apiPost("/api/customers", {
        customerCode:   customerCode.trim().toUpperCase(),
        name:           name.trim(),
        customerType:   customerType || undefined,
        email:          email || undefined,
        phone:          phone || undefined,
        contactPersons: contactPersons.filter((c) => c.name.trim()),
        billingAddress:  effectiveBilling,
        deliveryAddress: deliveryAddress,
        vatNumber:      vatNumber || undefined,
        creditLimit:    creditLimit ? parseFloat(creditLimit) : undefined,
        creditTerms:    creditTerms || undefined,
        pickupPoints:   pickupRaw.split(",").map((s) => s.trim()).filter(Boolean),
        status,
      });
      reset(); onCreated(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  // DB options with static fallback
  const customerTypeOptions = customerTypes.length > 0
    ? customerTypes.map((t) => ({ label: t.name, value: t.name }))
    : ["Corporate","Individual","Government","SME","Retail","Wholesale","NGO"].map((v) => ({ label: v, value: v }));

  const tabs = [
    { key: "general",   label: "General",   icon: IconUser,    hint: "Identity & contacts" },
    { key: "address",   label: "Address",   icon: IconMapPin,  hint: "Delivery & billing"  },
    { key: "financial", label: "Financial", icon: IconReceipt, hint: "Credit & terms"      },
  ] as const;

  const primaryCount = contactPersons.filter((c) => c.isPrimary).length;

  const footer = (
    <>
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="add-customer-form" disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 disabled:opacity-60 disabled:shadow-none">
        {submitting ? (
          <>
            <IconSpinner /> Creating…
          </>
        ) : (
          <>
            <IconCheck /> Create Customer
          </>
        )}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Add New Customer" footer={footer} size="max-w-3xl">
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      {/* ---------- Tab bar ---------- */}
      <div className="mb-6 flex gap-1.5 rounded-xl border border-gray-100 bg-gray-50 p-1.5">
        {tabs.map((t) => {
          const accent = SECTION_ACCENTS[t.key];
          const active = activeTab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`group flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all ${
                active ? `bg-white shadow-sm ring-1 ${accent.ring}` : "hover:bg-white/60"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                active ? `${accent.bg} ${accent.text}` : "bg-gray-200/70 text-gray-400 group-hover:text-gray-500"
              }`}>
                <Icon />
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-semibold ${active ? "text-gray-900" : "text-gray-500"}`}>
                  {t.label}
                </span>
                <span className="block truncate text-[11px] text-gray-400">{t.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <form id="add-customer-form" onSubmit={handleSubmit}>

        {activeTab === "general" && (
          <div className="space-y-5">
            <SectionCard accent="general" icon={IconUser} title="Customer Identity" subtitle="Core details used across manifests and invoices">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Customer Code" required>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerCode}
                      onChange={(e) => { setCustomerCode(e.target.value.toUpperCase()); setCodeIsAuto(false); }}
                      placeholder="Auto-generated — you can edit this"
                      required
                      disabled={codeLoading}
                      className={`${inputClass} pr-9 disabled:opacity-60`}
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      disabled={codeLoading}
                      title="Regenerate code"
                      aria-label="Regenerate code"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 disabled:opacity-50"
                    >
                      <IconRefresh spinning={codeLoading} />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      codeIsAuto ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {codeIsAuto ? "Auto-generated" : "Custom"}
                    </span>
                    <span className="text-xs text-gray-400">Editable anytime</span>
                  </div>
                </Field>

                <Field label="Customer Name" required>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alpha Pty Ltd" required className={inputClass} />
                </Field>

                <Field label="Customer Type">
                  <Select
                    value={customerType}
                    onChange={setCustomerType}
                    placeholder={customerTypes.length === 0 ? "Loading…" : "Select customer type"}
                    options={customerTypeOptions}
                  />
                  {customerTypes.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No types yet — add them in Master Data → Customer Types.
                    </p>
                  )}
                </Field>

                <Field label="Status" required>
                  <Select value={status} onChange={setStatus} placeholder="Select status"
                    options={["Active","Inactive","Suspended"]} required />
                </Field>
                <Field label="Email Address">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ops@company.co.za" className={inputClass} />
                </Field>
                <Field label="Phone Number">
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 011 555 0101" className={inputClass} />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Pickup Points">
                  <input type="text" value={pickupRaw} onChange={(e) => setPickupRaw(e.target.value)}
                    placeholder="e.g. JHB Warehouse, Midrand Depot" className={inputClass} />
                  <p className="mt-1 text-xs text-gray-400">Separate multiple pickup points with a comma</p>
                </Field>
              </div>
            </SectionCard>

            {/* Contact Persons */}
            <SectionCard
              accent="general"
              icon={IconUsers}
              title="Contact Persons"
              subtitle={`${contactPersons.length} added${primaryCount ? ` · ${primaryCount} primary` : ""}`}
              action={
                <button type="button" onClick={() => setContacts((p) => [...p, emptyContact()])}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100">
                  <IconPlus /> Add Contact
                </button>
              }
            >
              <div className="space-y-3">
                {contactPersons.map((cp, i) => (
                  <div key={i} className="flex gap-3 rounded-lg border border-gray-100 bg-white p-3 transition-shadow hover:shadow-sm">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      cp.isPrimary ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {initials(cp.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Field label="Full Name">
                          <input type="text" value={cp.name} onChange={(e) => updateContact(i,"name",e.target.value)}
                            placeholder="Contact name" className={inputClass} />
                        </Field>
                        <Field label="Email">
                          <input type="email" value={cp.email} onChange={(e) => updateContact(i,"email",e.target.value)}
                            placeholder="email@company.co.za" className={inputClass} />
                        </Field>
                        <Field label="Phone">
                          <input type="text" value={cp.phone} onChange={(e) => updateContact(i,"phone",e.target.value)}
                            placeholder="082 000 0000" className={inputClass} />
                        </Field>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => updateContact(i, "isPrimary", !cp.isPrimary)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            cp.isPrimary ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <IconStar filled={cp.isPrimary} /> {cp.isPrimary ? "Primary contact" : "Mark as primary"}
                        </button>
                        {contactPersons.length > 1 && (
                          <button type="button" onClick={() => setContacts((p) => p.filter((_,idx)=>idx!==i))}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50">
                            <IconTrash /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "address" && (
          <div className="space-y-5">
            <SectionCard accent="address" icon={IconMapPin} title="Delivery Address" subtitle="Where shipments are dropped off">
              <AddressSection values={deliveryAddress} onChange={updateDelivery} />
            </SectionCard>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-600 transition-colors hover:border-teal-200 hover:bg-teal-50/30">
              <input type="checkbox" checked={sameAsDelivery} onChange={(e) => setSame(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              Billing address is the same as delivery address
            </label>

            {!sameAsDelivery && (
              <SectionCard accent="address" icon={IconReceipt} title="Billing Address" subtitle="Where invoices are addressed">
                <AddressSection values={billingAddress} onChange={updateBilling} />
              </SectionCard>
            )}
          </div>
        )}

        {activeTab === "financial" && (
          <SectionCard accent="financial" icon={IconReceipt} title="Credit & Billing Terms" subtitle="Controls invoicing and account limits">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="VAT Number">
                <input type="text" value={vatNumber} onChange={(e) => setVat(e.target.value)}
                  placeholder="e.g. 4560000000" className={inputClass} />
              </Field>
              <Field label="Credit Limit (R)">
                <input type="number" min="0" step="0.01" value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)} placeholder="e.g. 50000" className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Credit Terms">
                  <input type="text" value={creditTerms} onChange={(e) => setCreditTerms(e.target.value)}
                    placeholder="e.g. Net 30 Days" className={inputClass} />
                </Field>
              </div>
            </div>
          </SectionCard>
        )}
      </form>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Local presentational helpers (kept in this file — no shared components touched)
// ---------------------------------------------------------------------------

function SectionCard({
  accent, icon: Icon, title, subtitle, action, children,
}: {
  accent: keyof typeof SECTION_ACCENTS;
  icon: React.FC;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const a = SECTION_ACCENTS[accent];
  return (
    <div className={`overflow-hidden rounded-xl border ${a.border} bg-white`}>
      <div className={`flex items-center justify-between gap-3 border-b ${a.border} ${a.bg} px-4 py-3`}>
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-md bg-white ${a.text}`}>
            <Icon />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5S18 16 19.5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.5 19c1.2-3.2 4-4.5 6.5-4.5s5.3 1.3 6.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 5.2c1.4.4 2.5 1.7 2.5 3.3s-1.1 2.9-2.5 3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 14.7c2 .5 3.6 1.9 4.5 4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconMapPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.5 7-11.5A7 7 0 1 0 5 9.5C5 14.5 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconReceipt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h12v18l-2.5-1.6L13 21l-1-1.6L11 21l-2.5-1.6L6 21V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconStar({ filled }: { filled?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path d="m12 3 2.7 5.9 6.3.7-4.7 4.4 1.3 6.3L12 17.2 6.4 20.3l1.3-6.3-4.7-4.4 6.3-.7L12 3Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconRefresh({ spinning }: { spinning?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      className={spinning ? "animate-spin" : ""}>
      <path d="M20 11a8 8 0 1 0-1.5 6.5M20 11V5m0 6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSpinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}