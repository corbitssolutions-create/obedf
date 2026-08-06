"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Building2, Save, Plus, Trash2, Upload, X, ImageIcon } from "lucide-react";
import { apiGet, apiPost, apiPut, API_BASE, authHeader } from "@/lib/api";
import { Field, inputClass, ModalShell, Select } from "@/components/ui/FormControls";
import AddressSection, { AddressData, emptyAddress, makeAddressUpdater } from "@/components/ui/AddressSection";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Department   { _id?: string; code: string; name: string; manager: string; status: string; }
interface CostCentre   { _id?: string; code: string; name: string; department: string; status: string; }
interface BusinessUnit { _id?: string; code: string; name: string; status: string; }
interface CompanyExtraCharge { extraCharge: string; amount: number; status: string; }
interface LookupOpt { label: string; value: string; }

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function CompanyPage() {
  const [company,  setCompany]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  // Logo
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Basic info
  const [companyName,        setCompanyName] = useState("");
  const [tradingName,        setTradingName] = useState("");
  const [registrationNumber, setRegNo]       = useState("");
  const [vatNumber,          setVat]         = useState("");
  const [taxNumber,          setTax]         = useState("");
  const [email,              setEmail]       = useState("");
  const [phoneNumber,        setPhone]       = useState("");
  const [website,            setWebsite]     = useState("");

  // Physical address
  const [physicalAddress, setPhysicalAddress] = useState<AddressData>(emptyAddress());
  const updateAddress = makeAddressUpdater(setPhysicalAddress);

  // Org structure
  const [departments,   setDepartments]   = useState<Department[]>([]);
  const [costCentres,   setCostCentres]   = useState<CostCentre[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [deptModal, setDeptModal] = useState(false);
  const [ccModal,   setCcModal]   = useState(false);
  const [buModal,   setBuModal]   = useState(false);

  // ── Waybill defaults ────────────────────────────────────────────────────
  const [defRateTypeId,    setDefRateTypeId]    = useState("");
  const [defServiceTypeId, setDefServiceTypeId] = useState("");
  const [defPaymentType,   setDefPaymentType]   = useState("");
  const [defPayCollType,   setDefPayCollType]   = useState("");

  // ── Company-level extra charges ─────────────────────────────────────────
  const [companyExtraCharges, setCompanyExtraCharges] = useState<CompanyExtraCharge[]>([]);

  // Lookup lists for dropdowns
  const [rateTypeLookup,    setRateTypeLookup]    = useState<LookupOpt[]>([]);
  const [serviceTypeLookup, setServiceTypeLookup] = useState<LookupOpt[]>([]);
  const [extraChargeMaster, setExtraChargeMaster] = useState<LookupOpt[]>([]);

  /* ── Fetch company record ─────────────────────────────────────────────── */
  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ success: boolean; data: any }>("/api/company");
      const c = res.data;
      if (c) {
        setCompany(c);
        setCompanyName(c.companyName || "");
        setTradingName(c.tradingName || "");
        setRegNo(c.registrationNumber || "");
        setVat(c.vatNumber || "");
        setTax(c.taxNumber || "");
        setEmail(c.email || "");
        setPhone(c.phoneNumber || "");
        setWebsite(c.website || "");

        const addr = c.physicalAddress || {};
        setPhysicalAddress({
          building:   addr.building   || addr.line1 || "",
          street:     addr.street     || addr.line2 || "",
          suburb:     addr.suburb     || "",
          city:       addr.city       || "",
          province:   addr.province   || "",
          postalCode: addr.postalCode || "",
          country:    addr.country    || "South Africa",
        });

        if (c.logo) setLogoPreview(c.logo.startsWith("http") ? c.logo : `${API_BASE}${c.logo}`);
        setDepartments(c.departments   || []);
        setCostCentres(c.costCentres   || []);
        setBusinessUnits(c.businessUnits || []);

        // Waybill defaults
        setDefRateTypeId(
          typeof c.defaultRateType === "object" ? (c.defaultRateType?._id ?? "") : (c.defaultRateType ?? "")
        );
        setDefServiceTypeId(
          typeof c.defaultServiceType === "object" ? (c.defaultServiceType?._id ?? "") : (c.defaultServiceType ?? "")
        );
        setDefPaymentType(c.defaultPaymentType || "");
        setDefPayCollType(c.defaultPaymentCollectionType || "");

        // Company extra charges
        setCompanyExtraCharges(
          (c.companyExtraCharges || []).map((ec: any) => ({
            extraCharge: typeof ec.extraCharge === "object" ? (ec.extraCharge?._id ?? "") : (ec.extraCharge ?? ""),
            amount:      ec.amount  ?? 0,
            status:      ec.status  ?? "Active",
          }))
        );
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  /* ── Fetch lookup lists ───────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      apiGet<any>("/api/master/rate-types/lookup"),
      apiGet<any>("/api/master/service-types/lookup"),
      apiGet<any>("/api/master/extra-charges/lookup"),
    ]).then(([rt, st, ec]) => {
      setRateTypeLookup(   (rt.data || []).map((x: any) => ({ label: `${x.code} — ${x.name}`,         value: x._id })));
      setServiceTypeLookup((st.data || []).map((x: any) => ({ label: `${x.code} — ${x.name}`,         value: x._id })));
      setExtraChargeMaster((ec.data || []).map((x: any) => ({ label: `${x.chargeCode} — ${x.chargeName}`, value: x._id })));
    }).catch(() => {});
  }, []);

  /* ── Logo handlers ────────────────────────────────────────────────────── */
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2 MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  const removeLogo = () => {
    setLogoFile(null); setLogoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Extra charge helpers ─────────────────────────────────────────────── */
  const addCompanyCharge = () =>
    setCompanyExtraCharges(p => [...p, { extraCharge: "", amount: 0, status: "Active" }]);

  const updateCompanyCharge = (idx: number, field: keyof CompanyExtraCharge, val: any) =>
    setCompanyExtraCharges(p => p.map((c, i) => i === idx ? { ...c, [field]: val } : c));

  const removeCompanyCharge = (idx: number) =>
    setCompanyExtraCharges(p => p.filter((_, i) => i !== idx));

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!companyName.trim()) { setError("Company name is required"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      let logoUrl = company?.logo || "";
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        const uploadRes = await fetch(`${API_BASE}/api/company/upload-logo`, {
          method: "POST", headers: authHeader(), body: fd,
        });
        const uploadData = await uploadRes.json();
        logoUrl = uploadRes.ok && uploadData.url ? uploadData.url : await fileToBase64(logoFile);
      }

      const payload = {
        companyName, tradingName, registrationNumber, vatNumber, taxNumber,
        email, phoneNumber, website,
        logo: logoUrl || undefined,
        physicalAddress,
        // Waybill defaults
        defaultRateType:              defRateTypeId    || undefined,
        defaultServiceType:           defServiceTypeId || undefined,
        defaultPaymentType:           defPaymentType   || undefined,
        defaultPaymentCollectionType: defPayCollType   || undefined,
        // Company extra charges (only rows that have an extraCharge selected)
        companyExtraCharges: companyExtraCharges.filter(c => c.extraCharge),
      };

      if (company?._id) await apiPut(`/api/company/${company._id}`, payload);
      else              await apiPost("/api/company", payload);

      setSuccess("Company profile saved successfully.");
      setLogoFile(null);
      fetchCompany();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-8">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-sm text-gray-500">Organisation details, waybill defaults &amp; extra charges</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {error   && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      {success && <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{success}</div>}

      <div className="space-y-6">

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Section title="Company Logo">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                : <ImageIcon className="h-10 w-10 text-gray-300" />}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">Upload your company logo. Recommended: PNG or SVG, max 2 MB.</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Upload className="h-4 w-4" /> {logoPreview ? "Change Logo" : "Upload Logo"}
                </button>
                {logoPreview && (
                  <button type="button" onClick={removeLogo}
                    className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
                    <X className="h-4 w-4" /> Remove
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              {logoFile && <p className="text-xs text-green-600">Selected: {logoFile.name}</p>}
            </div>
          </div>
        </Section>

        {/* ── Company Details ───────────────────────────────────────────── */}
        <Section title="Company Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Company Name" required>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. FreightFlow (Pty) Ltd" className={inputClass} />
            </Field>
            <Field label="Trading Name">
              <input type="text" value={tradingName} onChange={e => setTradingName(e.target.value)}
                placeholder="e.g. FreightFlow" className={inputClass} />
            </Field>
            <Field label="Registration Number">
              <input type="text" value={registrationNumber} onChange={e => setRegNo(e.target.value)}
                placeholder="e.g. 2020/123456/07" className={inputClass} />
            </Field>
            <Field label="VAT Number">
              <input type="text" value={vatNumber} onChange={e => setVat(e.target.value)}
                placeholder="e.g. 4560000000" className={inputClass} />
            </Field>
            <Field label="Tax Number">
              <input type="text" value={taxNumber} onChange={e => setTax(e.target.value)}
                placeholder="e.g. 9012345678" className={inputClass} />
            </Field>
            <Field label="Website">
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://www.company.co.za" className={inputClass} />
            </Field>
            <Field label="Email Address">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="e.g. info@company.co.za" className={inputClass} />
            </Field>
            <Field label="Phone Number">
              <input type="text" value={phoneNumber} onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 011 123 4567" className={inputClass} />
            </Field>
          </div>
        </Section>

        {/* ── Physical Address ──────────────────────────────────────────── */}
        <Section title="Physical Address">
          <AddressSection title="" values={physicalAddress} onChange={updateAddress} />
        </Section>

        {/* ── Waybill Defaults ─────────────────────────────────────────── */}
        <Section title="Waybill Defaults"
          subtitle="These values auto-populate on every new Waybill when the Billing Account has no specific configuration.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Default Rate Type">
              <Select value={defRateTypeId} onChange={setDefRateTypeId}
                placeholder="— Select rate type —" options={rateTypeLookup} />
            </Field>
            <Field label="Default Service Type">
              <Select value={defServiceTypeId} onChange={setDefServiceTypeId}
                placeholder="— Select service type —" options={serviceTypeLookup} />
            </Field>
            <Field label="Default Payment Type">
              <input type="text" value={defPaymentType} onChange={e => setDefPaymentType(e.target.value)}
                placeholder="e.g. Account, COD, Prepaid" className={inputClass} />
            </Field>
            <Field label="Default Payment Collection Type">
              <Select value={defPayCollType} onChange={setDefPayCollType}
                placeholder="— Select —"
                options={["Cash on Delivery", "Cash on Collection"]} />
            </Field>
          </div>
        </Section>

        {/* ── Company Extra Charges ─────────────────────────────────────── */}
        <Section title="Company Default Extra Charges"
          subtitle="Fallback charges applied to every Waybill when the Billing Account has no account-level charges configured."
          action={
            <button onClick={addCompanyCharge}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">
              <Plus className="h-3.5 w-3.5" /> Add Charge
            </button>
          }>
          {companyExtraCharges.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
              No company-level extra charges configured. Click "Add Charge" to add one.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Extra Charge</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-36">Amount (R)</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-32">Status</th>
                    <th className="w-12 px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {companyExtraCharges.map((charge, idx) => (
                    <tr key={idx} className={idx !== companyExtraCharges.length - 1 ? "border-b border-gray-50" : ""}>
                      <td className="px-4 py-2">
                        <Select
                          value={charge.extraCharge}
                          onChange={v => updateCompanyCharge(idx, "extraCharge", v)}
                          placeholder="— Select charge —"
                          options={extraChargeMaster}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="0" step="0.01"
                          value={charge.amount}
                          onChange={e => updateCompanyCharge(idx, "amount", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          value={charge.status}
                          onChange={v => updateCompanyCharge(idx, "status", v)}
                          placeholder="Status"
                          options={["Active", "Inactive"]}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => removeCompanyCharge(idx)}
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
        </Section>

        {/* ── Departments ───────────────────────────────────────────────── */}
        <Section title="Departments"
          action={
            <button onClick={() => setDeptModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          }>
          <SubTable
            headers={["Code", "Name", "Manager", "Status"]}
            rows={departments.map(d => [d.code, d.name, d.manager || "—", d.status])}
            onDelete={i => setDepartments(p => p.filter((_, idx) => idx !== i))}
          />
        </Section>

        {/* ── Cost Centres ──────────────────────────────────────────────── */}
        <Section title="Cost Centres"
          action={
            <button onClick={() => setCcModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          }>
          <SubTable
            headers={["Code", "Name", "Department", "Status"]}
            rows={costCentres.map(c => [c.code, c.name, c.department || "—", c.status])}
            onDelete={i => setCostCentres(p => p.filter((_, idx) => idx !== i))}
          />
        </Section>

        {/* ── Business Units ────────────────────────────────────────────── */}
        <Section title="Business Units"
          action={
            <button onClick={() => setBuModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          }>
          <SubTable
            headers={["Code", "Name", "Status"]}
            rows={businessUnits.map(b => [b.code, b.name, b.status])}
            onDelete={i => setBusinessUnits(p => p.filter((_, idx) => idx !== i))}
          />
        </Section>

      </div>

      {/* Quick-add modals */}
      <QuickAddModal isOpen={deptModal} title="Add Department" fields={["Code", "Name", "Manager"]}
        onClose={() => setDeptModal(false)}
        onAdd={v => { setDepartments(p => [...p, { code: v[0], name: v[1], manager: v[2], status: "Active" }]); setDeptModal(false); }} />
      <QuickAddModal isOpen={ccModal} title="Add Cost Centre" fields={["Code", "Name", "Department"]}
        onClose={() => setCcModal(false)}
        onAdd={v => { setCostCentres(p => [...p, { code: v[0], name: v[1], department: v[2], status: "Active" }]); setCcModal(false); }} />
      <QuickAddModal isOpen={buModal} title="Add Business Unit" fields={["Code", "Name"]}
        onClose={() => setBuModal(false)}
        onAdd={v => { setBusinessUnits(p => [...p, { code: v[0], name: v[1], status: "Active" }]); setBuModal(false); }} />
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fileToBase64(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function Section({
  title, subtitle, children, action,
}: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SubTable({ headers, rows, onDelete }: { headers: string[]; rows: string[][]; onDelete: (i: number) => void }) {
  if (!rows.length) return <p className="text-sm text-gray-400">No records. Click Add to create one.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/70 text-xs font-semibold uppercase text-gray-600">
          <tr>
            {headers.map(h => <th key={h} className="px-4 py-2.5 text-left">{h}</th>)}
            <th className="w-14 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
              {r.map((cell, j) => <td key={j} className="px-4 py-2.5 text-gray-700">{cell}</td>)}
              <td className="px-4 py-2.5">
                <button onClick={() => onDelete(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuickAddModal({ isOpen, title, fields, onClose, onAdd }: {
  isOpen: boolean; title: string; fields: string[];
  onClose: () => void; onAdd: (vals: string[]) => void;
}) {
  const [vals, setVals] = useState<string[]>(fields.map(() => ""));
  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
      <button type="submit" form="quick-add"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Add</button>
    </>
  );
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="max-w-md">
      <form id="quick-add"
        onSubmit={e => { e.preventDefault(); onAdd(vals); setVals(fields.map(() => "")); }}
        className="space-y-3">
        {fields.map((f, i) => (
          <Field key={f} label={f} required>
            <input type="text" value={vals[i]}
              onChange={e => { const v = [...vals]; v[i] = e.target.value; setVals(v); }}
              required className={inputClass} />
          </Field>
        ))}
      </form>
    </ModalShell>
  );
}
