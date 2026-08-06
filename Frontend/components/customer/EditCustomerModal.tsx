"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../ui/AddressSection";
import { apiPut, apiGet } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ContactPerson {
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface CustomerTypeOption {
  _id: string;
  code: string;
  name: string;
}

interface Customer {
  _id: string;
  customerCode?: string;
  name: string;
  customerType?: string;
  email?: string;
  phone?: string;
  contactPersons?: ContactPerson[];
  billingAddress?: any;
  deliveryAddress?: any;
  vatNumber?: string;
  creditLimit?: number;
  creditTerms?: string;
  pickupPoints?: string[];
  status: string;
}

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer;
  onClose: () => void;
  onUpdated: () => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function normaliseAddress(raw: any): AddressData {
  if (!raw) return emptyAddress();
  return {
    addressLine1: raw.addressLine1 || raw.line1 || "",
    addressLine2: raw.addressLine2 || raw.line2 || "",
    city:         raw.city         || "",
    province:     raw.province     || "",
    postalCode:   raw.postalCode   || "",
    country:      raw.country      || "South Africa",
  };
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function EditCustomerModal({
  isOpen, customer, onClose, onUpdated,
}: EditCustomerModalProps) {

  /* form fields */
  const [customerCode,   setCustomerCode]  = useState(customer.customerCode ?? "");
  const [name,           setName]          = useState(customer.name);
  const [customerType,   setCustomerType]  = useState(customer.customerType ?? "");
  const [email,          setEmail]         = useState(customer.email ?? "");
  const [phone,          setPhone]         = useState(customer.phone ?? "");
  const [contactPersons, setContacts]      = useState<ContactPerson[]>(
    customer.contactPersons?.length
      ? customer.contactPersons
      : [{ name: "", email: "", phone: "", isPrimary: false }]
  );
  const [billingAddress,  setBilling]   = useState<AddressData>(normaliseAddress(customer.billingAddress));
  const [deliveryAddress, setDelivery]  = useState<AddressData>(normaliseAddress(customer.deliveryAddress));
  const [sameAsDelivery,  setSame]      = useState(false);
  const [vatNumber,      setVat]        = useState(customer.vatNumber ?? "");
  const [creditLimit,    setCreditLimit]= useState(customer.creditLimit?.toString() ?? "");
  const [creditTerms,    setCreditTerms]= useState(customer.creditTerms ?? "");
  const [pickupRaw,      setPickupRaw]  = useState((customer.pickupPoints ?? []).join(", "));
  const [status,         setStatus]     = useState(customer.status);

  /* UI state */
  const [activeTab,   setActiveTab]   = useState<"general" | "address" | "financial">("general");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");

  /* customer types loaded from DB */
  const [customerTypes, setCustomerTypes] = useState<CustomerTypeOption[]>([]);

  const updateBilling  = makeAddressUpdater(setBilling);
  const updateDelivery = makeAddressUpdater(setDelivery);

  /* load customer types whenever modal opens */
  useEffect(() => {
    if (!isOpen) return;
    apiGet<{ success: boolean; data: CustomerTypeOption[] }>("/api/master/customer-types/lookup")
      .then((res) => setCustomerTypes(res.data ?? []))
      .catch(() => {});
  }, [isOpen]);

  /* sync fields when a different customer is passed in */
  useEffect(() => {
    setCustomerCode(customer.customerCode ?? "");
    setName(customer.name);
    setCustomerType(customer.customerType ?? "");
    setEmail(customer.email ?? "");
    setPhone(customer.phone ?? "");
    setContacts(
      customer.contactPersons?.length
        ? customer.contactPersons
        : [{ name: "", email: "", phone: "", isPrimary: false }]
    );
    setBilling(normaliseAddress(customer.billingAddress));
    setDelivery(normaliseAddress(customer.deliveryAddress));
    setVat(customer.vatNumber ?? "");
    setCreditLimit(customer.creditLimit?.toString() ?? "");
    setCreditTerms(customer.creditTerms ?? "");
    setPickupRaw((customer.pickupPoints ?? []).join(", "));
    setStatus(customer.status);
    setError(""); setActiveTab("general");
  }, [customer]);

  /* contact helpers */
  const updateContact = (i: number, f: keyof ContactPerson, v: string | boolean) =>
    setContacts((p) => p.map((c, idx) => (idx === i ? { ...c, [f]: v } : c)));

  /* submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const effectiveBilling = sameAsDelivery ? deliveryAddress : billingAddress;
      await apiPut(`/api/customers/${customer._id}`, {
        customerCode:   customerCode.trim().toUpperCase() || undefined,
        name:           name.trim(),
        customerType:   customerType || undefined,
        email:          email        || undefined,
        phone:          phone        || undefined,
        contactPersons: contactPersons.filter((c) => c.name.trim()),
        billingAddress:  effectiveBilling,
        deliveryAddress: deliveryAddress,
        vatNumber:      vatNumber   || undefined,
        creditLimit:    creditLimit ? parseFloat(creditLimit) : undefined,
        creditTerms:    creditTerms || undefined,
        pickupPoints:   pickupRaw.split(",").map((s) => s.trim()).filter(Boolean),
        status,
      });
      onUpdated(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* build customer type options — DB first, static fallback */
  const customerTypeOptions =
    customerTypes.length > 0
      ? customerTypes.map((t) => t.name)
      : ["Corporate", "Individual", "Government", "SME", "Retail", "Wholesale", "NGO"];

  /* tabs */
  const tabs = [
    { key: "general",   label: "General"   },
    { key: "address",   label: "Address"   },
    { key: "financial", label: "Financial" },
  ] as const;

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="edit-customer-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit — ${customer.name}`}
      footer={footer}
      size="max-w-3xl"
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <form id="edit-customer-form" onSubmit={handleSubmit}>

        {/* ── General ───────────────────────────────────────────────────── */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer Code">
                <input type="text" value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                  className={inputClass} />
              </Field>
              <Field label="Customer Name" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  required className={inputClass} />
              </Field>

              {/* Customer Type — live from DB */}
              <Field label="Customer Type">
                <Select
                  value={customerType}
                  onChange={setCustomerType}
                  placeholder="Select customer type"
                  options={customerTypeOptions}
                />
                {customerTypes.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No types in DB — add them via Master Data → Customer Types.
                  </p>
                )}
              </Field>

              <Field label="Status" required>
                <Select value={status} onChange={setStatus} placeholder="Select status"
                  options={["Active", "Inactive", "Suspended"]} required />
              </Field>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputClass} />
              </Field>
              <Field label="Phone">
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className={inputClass} />
              </Field>
            </div>

            <Field label="Pickup Points">
              <input type="text" value={pickupRaw}
                onChange={(e) => setPickupRaw(e.target.value)}
                placeholder="Comma-separated" className={inputClass} />
            </Field>

            {/* Contact Persons */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Contact Persons
                </p>
                <button type="button"
                  onClick={() => setContacts((p) => [...p, { name: "", email: "", phone: "", isPrimary: false }])}
                  className="text-xs font-medium text-blue-600 hover:underline">
                  + Add
                </button>
              </div>
              <div className="space-y-3">
                {contactPersons.map((cp, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/40 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Field label="Name">
                        <input type="text" value={cp.name}
                          onChange={(e) => updateContact(i, "name", e.target.value)}
                          className={inputClass} />
                      </Field>
                      <Field label="Email">
                        <input type="email" value={cp.email}
                          onChange={(e) => updateContact(i, "email", e.target.value)}
                          className={inputClass} />
                      </Field>
                      <Field label="Phone">
                        <input type="text" value={cp.phone}
                          onChange={(e) => updateContact(i, "phone", e.target.value)}
                          className={inputClass} />
                      </Field>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500">
                        <input type="checkbox" checked={cp.isPrimary}
                          onChange={(e) => updateContact(i, "isPrimary", e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600" />
                        Primary
                      </label>
                      {contactPersons.length > 1 && (
                        <button type="button"
                          onClick={() => setContacts((p) => p.filter((_, idx) => idx !== i))}
                          className="text-xs text-red-500 hover:underline">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Address ───────────────────────────────────────────────────── */}
        {activeTab === "address" && (
          <div className="space-y-4">
            <AddressSection title="Delivery Address" values={deliveryAddress} onChange={updateDelivery} />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={sameAsDelivery}
                onChange={(e) => setSame(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              Billing address same as delivery address
            </label>
            {!sameAsDelivery && (
              <AddressSection title="Billing Address" values={billingAddress} onChange={updateBilling} />
            )}
          </div>
        )}

        {/* ── Financial ─────────────────────────────────────────────────── */}
        {activeTab === "financial" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="VAT Number">
              <input type="text" value={vatNumber} onChange={(e) => setVat(e.target.value)}
                className={inputClass} />
            </Field>
            <Field label="Credit Limit (R)">
              <input type="number" min="0" step="0.01" value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)} className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Credit Terms">
                <input type="text" value={creditTerms}
                  onChange={(e) => setCreditTerms(e.target.value)}
                  placeholder="e.g. Net 30 Days" className={inputClass} />
              </Field>
            </div>
          </div>
        )}

      </form>
    </ModalShell>
  );
}
