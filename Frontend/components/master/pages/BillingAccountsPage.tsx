"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useTableFilters } from "../../hooks/useTableFilters";
import { ModalShell, Field, Select, inputClass } from "../../ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "../../ui/AddressSection";
import { SearchBar, FilterSelect, ResetButton, SortIcon, Pagination, EmptyState, StatusBadge } from "../../ui/TableToolbar";

/* ─── Types ──────────────────────────────────────────────────────────────── */
/** One row in the account-level extra charges table — references ExtraCharge master */
interface AccountExtraCharge {
  _id?: string;
  extraCharge: string;   // ExtraCharge master _id
  amount: number;
  status: "Active" | "Inactive";
}

interface BillingAccount {
  _id: string;
  billingAccountCode: string;
  billingAccountName: string;
  customer?: { _id: string; name: string };
  contactPerson?: string;
  email?: string;
  accountStatus: string;
  creditLimit?: number;
  billingContactPerson?: string;
  billingEmail?: string;
  billingPhone?: string;
  defaultRateType?: { _id: string; code: string; name: string };
  defaultServiceType?: { _id: string; code: string; name: string };
  defaultPaymentType?: string;
  paymentCollectionType?: string;
  extraCharges?: AccountExtraCharge[];
  // Sender auto-population fields
  senderName?: string;
  senderContactPerson?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderAddress?: {
    building?: string;
    street?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
}

interface LookupItem { _id: string; label: string; }

const STATUS_OPTS = [
  { label: "Active",    value: "Active"    },
  { label: "Inactive",  value: "Inactive"  },
  { label: "Suspended", value: "Suspended" },
  { label: "Closed",    value: "Closed"    },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function BillingAccountsPage() {
  const [accounts,   setAccounts]   = useState<BillingAccount[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [isAddOpen,  setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<BillingAccount | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{ success: boolean; data: BillingAccount[] }>(
        "/api/billing-accounts?limit=500&sort=billingAccountName:asc"
      );
      setAccounts(res.data ?? []);
    } catch (e: any) { setError(e.message ?? "Failed to load billing accounts"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete billing account "${name}"?`)) return;
    try {
      await apiDelete(`/api/billing-accounts/${id}`);
      setAccounts(p => p.filter(a => a._id !== id));
    } catch (e: any) { alert(e.message ?? "Delete failed"); }
  };

  const {
    paginated, filtered, total, rawSearch, handleSearch,
    filters, handleFilter, sort, handleSort,
    page, setPage, pageSize, handlePageSize, totalPages,
    resetFilters, hasActiveFilters,
  } = useTableFilters<BillingAccount>({
    data: accounts,
    searchFields: ["billingAccountCode", "billingAccountName", "contactPerson", "email"],
    pageSize: 10,
  });

  if (loading) return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">BILLING ACCOUNTS</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} records</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> Add Billing Account
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search code, name, contact…" />
        </div>
        <FilterSelect value={filters.accountStatus as string} onChange={v => handleFilter("accountStatus", v)}
          options={STATUS_OPTS} placeholder="All Statuses" />
        <ResetButton onClick={resetFilters} active={hasActiveFilters} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([ ["billingAccountCode","Code"], ["billingAccountName","Account Name"],
                  ["contactPerson","Contact"], ["email","Email"],
                  ["creditLimit","Credit Limit"], ["accountStatus","Status"],
              ] as [keyof BillingAccount, string][]).map(([k, l]) => (
                <th key={k} onClick={() => handleSort(k)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {l}<SortIcon sortState={sort} column={k} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Customer</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <EmptyState message="No billing accounts found." colSpan={8} />
              : paginated.map((a, i) => (
                <tr key={a._id}
                  className={`text-sm text-gray-700 hover:bg-gray-50/60 ${i !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{a.billingAccountCode}</td>
                  <td className="px-5 py-3.5 font-medium">{a.billingAccountName}</td>
                  <td className="px-5 py-3.5">{a.contactPerson || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500">{a.email || "—"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">{a.creditLimit ? `R ${a.creditLimit.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={a.accountStatus} /></td>
                  <td className="px-5 py-3.5">{a.customer?.name || "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditTarget(a)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(a._id, a.billingAccountName)}
                        className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.map(a => (
          <div key={a._id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-blue-600">{a.billingAccountCode}</p>
                <p className="text-sm font-medium text-gray-900">{a.billingAccountName}</p>
              </div>
              <StatusBadge status={a.accountStatus} />
            </div>
            <p className="text-xs text-gray-500">{a.customer?.name} • {a.contactPerson}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditTarget(a)}
                className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
              <button onClick={() => handleDelete(a._id, a.billingAccountName)}
                className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
          total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <BillingAccountModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onSaved={fetchAccounts} />
      {editTarget && (
        <BillingAccountModal isOpen account={editTarget}
          onClose={() => setEditTarget(null)} onSaved={fetchAccounts} />
      )}
    </div>
  );
}

/* ─── Add / Edit Modal ───────────────────────────────────────────────────── */
interface ModalProps { isOpen: boolean; account?: BillingAccount; onClose: () => void; onSaved: () => void; }

const TABS = [
  { key: "general",   label: "General"          },
  { key: "defaults",  label: "Waybill Defaults"  },
  { key: "financial", label: "Financial"         },
  { key: "contact",   label: "Contact & Address" },
] as const;

function BillingAccountModal({ isOpen, account, onClose, onSaved }: ModalProps) {
  const editing = !!account;
  const acc = account as any;

  /* ── General ── */
  const [code,         setCode]         = useState(acc?.billingAccountCode ?? "");
  const [name,         setName]         = useState(acc?.billingAccountName ?? "");
  const [customerId,   setCustomerId]   = useState(typeof acc?.customer === "object" ? acc?.customer?._id ?? "" : "");
  const [branchId,     setBranchId]     = useState(typeof acc?.branch    === "object" ? acc?.branch?._id    ?? "" : acc?.branch ?? "");
  const [status,       setStatus]       = useState(acc?.accountStatus ?? "Active");
  const [billingCycle, setBillingCycle] = useState(acc?.billingCycle ?? "Monthly");
  const [invoiceFreq,  setInvoiceFreq]  = useState(acc?.invoiceFrequency ?? "Monthly");
  const [invoiceDel,   setInvoiceDel]   = useState(acc?.invoiceDeliveryMethod ?? "Email");
  const [rateCardId,   setRateCardId]   = useState(typeof acc?.defaultRateCard === "object" ? acc?.defaultRateCard?._id ?? "" : acc?.defaultRateCard ?? "");

  /* ── Financial ── */
  const [currencyId,    setCurrencyId]    = useState(typeof acc?.currency     === "object" ? acc?.currency?._id     ?? "" : acc?.currency ?? "");
  const [payTermsId,    setPayTermsId]    = useState(typeof acc?.paymentTerms === "object" ? acc?.paymentTerms?._id ?? "" : acc?.paymentTerms ?? "");
  const [creditLimit,   setCreditLimit]   = useState(acc?.creditLimit?.toString() ?? "");
  const [creditTerms,   setCreditTerms]   = useState(acc?.creditTerms ?? "");
  const [vatNumber,     setVatNumber]     = useState(acc?.vatNumber ?? "");
  const [effectiveDate, setEffDate]       = useState(acc?.effectiveDate?.slice(0, 10) ?? "");
  const [expiryDate,    setExpDate]       = useState(acc?.expiryDate?.slice(0, 10) ?? "");
  const [notes,         setNotes]         = useState(acc?.notes ?? "");

  /* ── Contact ── */
  const [contactPerson, setContact]   = useState(acc?.contactPerson ?? "");
  const [email,         setEmail]     = useState(acc?.email ?? "");
  const [telephone,     setTelephone] = useState(acc?.telephone ?? "");

  // ── Sender Information (auto-populates Waybill Sender section) ────────────
  const [senderName,          setSenderName]          = useState(acc?.senderName          ?? "");
  const [senderContactPerson, setSenderContactPerson] = useState(acc?.senderContactPerson ?? "");
  const [senderPhone,         setSenderPhone]         = useState(acc?.senderPhone         ?? "");
  const [senderEmail,         setSenderEmail]         = useState(acc?.senderEmail         ?? "");
  const [senderAddress,       setSenderAddress]       = useState<AddressData>({
    building:   acc?.senderAddress?.building   || "",
    street:     acc?.senderAddress?.street     || "",
    suburb:     acc?.senderAddress?.suburb     || "",
    city:       acc?.senderAddress?.city       || "",
    province:   acc?.senderAddress?.province   || "",
    postalCode: acc?.senderAddress?.postalCode || "",
    country:    acc?.senderAddress?.country    || "South Africa",
  });
  const updateSenderAddress = makeAddressUpdater(setSenderAddress);

  /* ── Waybill defaults ── */
  const [billingContact,        setBillingContact]        = useState(acc?.billingContactPerson ?? "");
  const [billingEmail,          setBillingEmail]          = useState(acc?.billingEmail ?? "");
  const [billingPhone,          setBillingPhone]          = useState(acc?.billingPhone ?? "");
  const [defaultRateTypeId,     setDefaultRateTypeId]     = useState(typeof acc?.defaultRateType    === "object" ? acc?.defaultRateType?._id    ?? "" : "");
  const [defaultServiceTypeId,  setDefaultServiceTypeId]  = useState(typeof acc?.defaultServiceType === "object" ? acc?.defaultServiceType?._id ?? "" : "");
  const [defaultPaymentType,    setDefaultPaymentType]    = useState(acc?.defaultPaymentType ?? "");
  const [paymentCollectionType, setPaymentCollectionType] = useState(acc?.paymentCollectionType ?? "");

  /* ── Account extra charges (ref-based) ── */
  const [extraCharges, setExtraCharges] = useState<AccountExtraCharge[]>(
    (acc?.extraCharges ?? []).map((c: any) => ({
      _id:         c._id,
      extraCharge: typeof c.extraCharge === "object" ? c.extraCharge?._id ?? "" : c.extraCharge ?? "",
      amount:      c.amount  ?? 0,
      status:      c.status  ?? "Active",
    }))
  );

  /* ── Billing address ── */
  const [address, setAddress] = useState<AddressData>(emptyAddress());
  const updateAddress = makeAddressUpdater(setAddress);

  /* ── Lookup lists ── */
  const [customers,         setCustomers]         = useState<LookupItem[]>([]);
  const [branches,          setBranches]          = useState<LookupItem[]>([]);
  const [currencies,        setCurrencies]        = useState<LookupItem[]>([]);
  const [payTerms,          setPayTerms]          = useState<LookupItem[]>([]);
  const [rateCards,         setRateCards]         = useState<LookupItem[]>([]);
  const [rateTypes,         setRateTypes]         = useState<LookupItem[]>([]);
  const [serviceTypes,      setServiceTypes]      = useState<LookupItem[]>([]);
  const [extraChargeMaster, setExtraChargeMaster] = useState<LookupItem[]>([]);

  const [activeTab,  setActiveTab]  = useState<typeof TABS[number]["key"]>("general");
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  /* ── Load lookups when modal opens ── */
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      apiGet<any>("/api/customers/lookup"),
      apiGet<any>("/api/branches/lookup"),
      apiGet<any>("/api/master/currencies/lookup"),
      apiGet<any>("/api/master/payment-terms/lookup"),
      apiGet<any>("/api/master/rate-cards/lookup"),
      apiGet<any>("/api/master/rate-types/lookup"),
      apiGet<any>("/api/master/service-types/lookup"),
      apiGet<any>("/api/master/extra-charges/lookup"),
    ]).then(([cu, br, cy, pt, rc, rt, st, ec]) => {
      setCustomers(        (cu.data||[]).map((x:any) => ({ _id: x._id, label: x.name })));
      setBranches(         (br.data||[]).map((x:any) => ({ _id: x._id, label: `${x.code} — ${x.name}` })));
      setCurrencies(       (cy.data||[]).map((x:any) => ({ _id: x._id, label: `${x.code} — ${x.name}` })));
      setPayTerms(         (pt.data||[]).map((x:any) => ({ _id: x._id, label: `${x.code} — ${x.name}` })));
      setRateCards(        (rc.data||[]).map((x:any) => ({ _id: x._id, label: x.name })));
      setRateTypes(        (rt.data||[]).map((x:any) => ({ _id: x._id, label: `${x.code} — ${x.name}` })));
      setServiceTypes(     (st.data||[]).map((x:any) => ({ _id: x._id, label: `${x.code} — ${x.name}` })));
      setExtraChargeMaster((ec.data||[]).map((x:any) => ({ _id: x._id, label: `${x.chargeCode} — ${x.chargeName}` })));
    }).catch(() => {});
  }, [isOpen]);

  /* ── Sync state when account changes ── */
  useEffect(() => {
    const a = account as any;
    setCode(a?.billingAccountCode ?? "");
    setName(a?.billingAccountName ?? "");
    setCustomerId(typeof a?.customer === "object" ? a?.customer?._id ?? "" : "");
    setBranchId(  typeof a?.branch   === "object" ? a?.branch?._id   ?? "" : a?.branch ?? "");
    setStatus(a?.accountStatus ?? "Active");
    setBillingCycle(a?.billingCycle ?? "Monthly");
    setInvoiceFreq( a?.invoiceFrequency ?? "Monthly");
    setInvoiceDel(  a?.invoiceDeliveryMethod ?? "Email");
    setRateCardId(  typeof a?.defaultRateCard  === "object" ? a?.defaultRateCard?._id  ?? "" : a?.defaultRateCard  ?? "");
    setCurrencyId(  typeof a?.currency         === "object" ? a?.currency?._id         ?? "" : a?.currency         ?? "");
    setPayTermsId(  typeof a?.paymentTerms     === "object" ? a?.paymentTerms?._id     ?? "" : a?.paymentTerms     ?? "");
    setCreditLimit(a?.creditLimit?.toString() ?? "");
    setCreditTerms(a?.creditTerms ?? "");
    setVatNumber(  a?.vatNumber   ?? "");
    setContact(    a?.contactPerson ?? "");
    setEmail(      a?.email         ?? "");
    setTelephone(  a?.telephone     ?? "");
    setSenderName(         a?.senderName          ?? "");
    setSenderContactPerson(a?.senderContactPerson ?? "");
    setSenderPhone(        a?.senderPhone         ?? "");
    setSenderEmail(        a?.senderEmail         ?? "");
    setSenderAddress({
      building:   a?.senderAddress?.building   || "",
      street:     a?.senderAddress?.street     || "",
      suburb:     a?.senderAddress?.suburb     || "",
      city:       a?.senderAddress?.city       || "",
      province:   a?.senderAddress?.province   || "",
      postalCode: a?.senderAddress?.postalCode || "",
      country:    a?.senderAddress?.country    || "South Africa",
    });
    setEffDate(a?.effectiveDate?.slice(0, 10) ?? "");
    setExpDate(a?.expiryDate?.slice(0, 10)    ?? "");
    setNotes(a?.notes ?? "");
    setBillingContact(       a?.billingContactPerson ?? "");
    setBillingEmail(         a?.billingEmail         ?? "");
    setBillingPhone(         a?.billingPhone         ?? "");
    setDefaultRateTypeId(    typeof a?.defaultRateType    === "object" ? a?.defaultRateType?._id    ?? "" : "");
    setDefaultServiceTypeId( typeof a?.defaultServiceType === "object" ? a?.defaultServiceType?._id ?? "" : "");
    setDefaultPaymentType(   a?.defaultPaymentType    ?? "");
    setPaymentCollectionType(a?.paymentCollectionType ?? "");
    setExtraCharges(
      (a?.extraCharges ?? []).map((c: any) => ({
        _id:         c._id,
        extraCharge: typeof c.extraCharge === "object" ? c.extraCharge?._id ?? "" : c.extraCharge ?? "",
        amount:      c.amount ?? 0,
        status:      c.status ?? "Active",
      }))
    );
    const addr = a ?? {};
    setAddress({
      building:   addr.billingAddressLine1 || "",
      street:     addr.billingAddressLine2 || "",
      suburb:     addr.suburb     || "",
      city:       addr.city       || "",
      province:   addr.province   || "",
      postalCode: addr.postalCode || "",
      country:    addr.country    || "South Africa",
    });
    setFormError(""); setActiveTab("general");
  }, [account, isOpen]);

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !customerId) {
      setActiveTab("general");
      setFormError("Account Code, Account Name and Customer are required.");
      return;
    }
    setSubmitting(true); setFormError("");
    try {
      const payload: Record<string, any> = {
        billingAccountCode:    code.trim().toUpperCase(),
        billingAccountName:    name.trim(),
        customer:              customerId,
        branch:                branchId     || undefined,
        currency:              currencyId   || undefined,
        defaultRateCard:       rateCardId   || undefined,
        creditLimit:           creditLimit  ? parseFloat(creditLimit) : undefined,
        creditTerms:           creditTerms  || undefined,
        paymentTerms:          payTermsId   || undefined,
        billingCycle,
        invoiceFrequency:      invoiceFreq,
        invoiceDeliveryMethod: invoiceDel,
        vatNumber:             vatNumber    || undefined,
        contactPerson:         contactPerson || undefined,
        email:                 email        || undefined,
        telephone:             telephone    || undefined,
        // Sender information — auto-populates Waybill Sender section
        senderName:            senderName            || undefined,
        senderContactPerson:   senderContactPerson   || undefined,
        senderPhone:           senderPhone           || undefined,
        senderEmail:           senderEmail           || undefined,
        senderAddress: (senderName || senderAddress.building || senderAddress.street) ? {
          building:   senderAddress.building   || undefined,
          street:     senderAddress.street     || undefined,
          suburb:     senderAddress.suburb     || undefined,
          city:       senderAddress.city       || undefined,
          province:   senderAddress.province   || undefined,
          postalCode: senderAddress.postalCode || undefined,
          country:    senderAddress.country    || "South Africa",
        } : undefined,
        /* waybill defaults */
        billingContactPerson:  billingContact         || undefined,
        billingEmail:          billingEmail           || undefined,
        billingPhone:          billingPhone           || undefined,
        defaultRateType:       defaultRateTypeId      || undefined,
        defaultServiceType:    defaultServiceTypeId   || undefined,
        defaultPaymentType:    defaultPaymentType     || undefined,
        paymentCollectionType: paymentCollectionType  || undefined,
        /* account extra charges — only rows with a charge selected */
        extraCharges: extraCharges.filter(c => c.extraCharge).map(c => ({
          extraCharge: c.extraCharge,
          amount:      c.amount,
          status:      c.status,
        })),
        /* billing address */
        billingAddressLine1: address.building   || undefined,
        billingAddressLine2: address.street     || undefined,
        suburb:              address.suburb     || undefined,
        city:                address.city       || undefined,
        province:            address.province   || undefined,
        postalCode:          address.postalCode || undefined,
        country:             address.country    || "South Africa",
        effectiveDate:       effectiveDate      || undefined,
        expiryDate:          expiryDate         || undefined,
        notes:               notes              || undefined,
        accountStatus:       status,
      };
      if (editing) await apiPut(`/api/billing-accounts/${account!._id}`, payload);
      else         await apiPost("/api/billing-accounts", payload);
      onSaved(); onClose();
    } catch (e: any) { setFormError(e.message ?? "Save failed"); }
    finally { setSubmitting(false); }
  };

  const toOpts = (items: LookupItem[]) => items.map(x => ({ label: x.label, value: x._id }));

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="ba-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : editing ? "Save Changes" : "Create Account"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose}
      title={editing ? `Edit — ${account!.billingAccountName}` : "Add Billing Account"}
      footer={footer} size="max-w-3xl">

      {formError && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {formError}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all
              ${activeTab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form id="ba-form" onSubmit={handleSubmit}>

        {/* ── General ─────────────────────────────────────────────── */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Account Code" required>
              <input type="text" value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. BA-001" required className={inputClass} />
            </Field>
            <Field label="Account Name" required>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Alpha Main Account" required className={inputClass} />
            </Field>
            <Field label="Customer" required>
              <Select value={customerId} onChange={setCustomerId}
                placeholder="Select customer…" options={toOpts(customers)} required />
            </Field>
            <Field label="Branch">
              <Select value={branchId} onChange={setBranchId}
                placeholder="— Select branch —" options={toOpts(branches)} />
            </Field>
            <Field label="Billing Cycle">
              <Select value={billingCycle} onChange={setBillingCycle} placeholder="Select"
                options={["Daily","Weekly","Bi-Weekly","Monthly","On Delivery"]} />
            </Field>
            <Field label="Invoice Frequency">
              <Select value={invoiceFreq} onChange={setInvoiceFreq} placeholder="Select"
                options={["Per Waybill","Per Trip","Weekly","Monthly"]} />
            </Field>
            <Field label="Invoice Delivery">
              <Select value={invoiceDel} onChange={setInvoiceDel} placeholder="Select"
                options={["Email","Post","Portal","Manual"]} />
            </Field>
            <Field label="Account Status" required>
              <Select value={status} onChange={setStatus} placeholder="Select status"
                options={["Active","Inactive","Suspended","Closed"]} required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Default Rate Card">
                <Select value={rateCardId} onChange={setRateCardId}
                  placeholder="— No rate card —" options={toOpts(rateCards)} />
              </Field>
            </div>
          </div>
        )}

        {/* ── Waybill Defaults ──────────────────────────────────── */}
        {activeTab === "defaults" && (
          <div className="space-y-6">

            {/* Billing contact */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Billing Contact (auto-populates on Waybill)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Billing Contact Person">
                  <input type="text" value={billingContact}
                    onChange={e => setBillingContact(e.target.value)}
                    placeholder="e.g. Jane Doe" className={inputClass} />
                </Field>
                <Field label="Billing Email Address">
                  <input type="email" value={billingEmail}
                    onChange={e => setBillingEmail(e.target.value)}
                    placeholder="e.g. billing@company.co.za" className={inputClass} />
                </Field>
                <Field label="Billing Phone Number">
                  <input type="text" value={billingPhone}
                    onChange={e => setBillingPhone(e.target.value)}
                    placeholder="e.g. 011 555 0202" className={inputClass} />
                </Field>
              </div>
            </div>

            {/* Default config */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Default Configuration
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Default Rate Type">
                  <Select value={defaultRateTypeId} onChange={setDefaultRateTypeId}
                    placeholder="— Select —" options={toOpts(rateTypes)} />
                </Field>
                <Field label="Default Service Type">
                  <Select value={defaultServiceTypeId} onChange={setDefaultServiceTypeId}
                    placeholder="— Select —" options={toOpts(serviceTypes)} />
                </Field>
                <Field label="Payment Type">
                  <Select value={defaultPaymentType} onChange={setDefaultPaymentType}
                    placeholder="— Select payment type —"
                    options={["Account", "Cash on Delivery", "Prepaid", "Credit Card", "EFT", "Collect"]} />
                </Field>
                <Field label="Payment Collection Type">
                  <Select value={paymentCollectionType} onChange={setPaymentCollectionType}
                    placeholder="— Select —"
                    options={["Cash on Delivery", "Cash on Collection"]} />
                </Field>
              </div>
            </div>

            {/* Account extra charges — ref-based */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account Extra Charges
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Overrides company-level charges on Waybill. Leave empty to use company defaults.
                  </p>
                </div>
                <button type="button"
                  onClick={() => setExtraCharges(p => [...p, { extraCharge: "", amount: 0, status: "Active" }])}
                  className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">
                  <Plus className="h-3 w-3" /> Add Charge
                </button>
              </div>

              {extraCharges.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
                  No account-level charges. Company defaults will be used.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Extra Charge</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 w-36">Amount (R)</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500 w-32">Status</th>
                        <th className="w-12 px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {extraCharges.map((charge, idx) => (
                        <tr key={idx} className={idx !== extraCharges.length - 1 ? "border-b border-gray-50" : ""}>
                          <td className="px-4 py-2">
                            <Select
                              value={charge.extraCharge}
                              onChange={v => setExtraCharges(p => p.map((c, i) => i === idx ? { ...c, extraCharge: v } : c))}
                              placeholder="— Select charge —"
                              options={toOpts(extraChargeMaster)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" min="0" step="0.01"
                              value={charge.amount}
                              onChange={e => setExtraCharges(p => p.map((c, i) => i === idx ? { ...c, amount: parseFloat(e.target.value) || 0 } : c))}
                              placeholder="0.00" className={inputClass} />
                          </td>
                          <td className="px-4 py-2">
                            <Select
                              value={charge.status}
                              onChange={v => setExtraCharges(p => p.map((c, i) => i === idx ? { ...c, status: v as "Active" | "Inactive" } : c))}
                              placeholder="Status" options={["Active", "Inactive"]} />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button type="button"
                              onClick={() => setExtraCharges(p => p.filter((_, i) => i !== idx))}
                              className="rounded-md border border-red-100 p-1.5 text-red-400 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Financial ───────────────────────────────────────────── */}
        {activeTab === "financial" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Currency">
              <Select value={currencyId} onChange={setCurrencyId}
                placeholder="— Select currency —" options={toOpts(currencies)} />
            </Field>
            <Field label="Payment Terms">
              <Select value={payTermsId} onChange={setPayTermsId}
                placeholder="— Select terms —" options={toOpts(payTerms)} />
            </Field>
            <Field label="Credit Limit (R)">
              <input type="number" min="0" step="0.01" value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                placeholder="e.g. 50000" className={inputClass} />
            </Field>
            <Field label="Credit Terms">
              <input type="text" value={creditTerms} onChange={e => setCreditTerms(e.target.value)}
                placeholder="e.g. Net 30" className={inputClass} />
            </Field>
            <Field label="VAT Number">
              <input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)}
                placeholder="e.g. 4560000000" className={inputClass} />
            </Field>
            <Field label="Effective Date">
              <input type="date" value={effectiveDate} onChange={e => setEffDate(e.target.value)}
                className={inputClass} />
            </Field>
            <Field label="Expiry Date">
              <input type="date" value={expiryDate} onChange={e => setExpDate(e.target.value)}
                className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} className={`${inputClass} resize-none`} />
              </Field>
            </div>
          </div>
        )}

        {/* ── Contact & Address ────────────────────────────────────── */}
        {activeTab === "contact" && (
          <div className="space-y-5">

            {/* Account Contact */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Account Contact
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Contact Person">
                  <input type="text" value={contactPerson} onChange={e => setContact(e.target.value)}
                    placeholder="e.g. John Smith" className={inputClass} />
                </Field>
                <Field label="Email Address">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. billing@company.co.za" className={inputClass} />
                </Field>
                <Field label="Telephone">
                  <input type="text" value={telephone} onChange={e => setTelephone(e.target.value)}
                    placeholder="e.g. 011 555 0101" className={inputClass} />
                </Field>
              </div>
            </div>

            {/* Billing Address */}
            <AddressSection
              title="Billing Address"
              values={address}
              onChange={updateAddress}
            />

            {/* Sender Information — auto-populates Waybill Sender section */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Sender Information
                </p>
                <p className="mt-0.5 text-xs text-blue-600">
                  When this Billing Account is selected on a Waybill, the fields below will
                  automatically populate the <strong>Sender (From)</strong> section.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Sender Name / Company">
                  <input type="text" value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="e.g. ABC Traders (Pty) Ltd" className={inputClass} />
                </Field>
                <Field label="Sender Contact Person">
                  <input type="text" value={senderContactPerson}
                    onChange={e => setSenderContactPerson(e.target.value)}
                    placeholder="e.g. Jane Doe" className={inputClass} />
                </Field>
                <Field label="Sender Phone">
                  <input type="text" value={senderPhone}
                    onChange={e => setSenderPhone(e.target.value)}
                    placeholder="e.g. 082 000 0000" className={inputClass} />
                </Field>
                <Field label="Sender Email">
                  <input type="email" value={senderEmail}
                    onChange={e => setSenderEmail(e.target.value)}
                    placeholder="e.g. dispatch@abc.co.za" className={inputClass} />
                </Field>
              </div>
              <div className="mt-4">
                <AddressSection
                  title="Sender Address"
                  values={senderAddress}
                  onChange={updateSenderAddress}
                />
              </div>
            </div>

          </div>
        )}

      </form>
    </ModalShell>
  );
}
