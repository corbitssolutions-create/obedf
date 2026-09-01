"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Plus, Trash2, Pencil, ScanLine,
  Package2, Layers, Weight as WeightIcon, User2,
} from "lucide-react";
import { apiGet } from "@/lib/api";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface Parcel {
  id: string;
  productCode: string;
  description: string;
  qty: number;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface Address {
  building: string;
  street: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface ExtraChargeRow {
  id: string;            // local UI key
  extraChargeId?: string; // master ref (may be absent for ad-hoc rows)
  chargeCode?: string;
  description: string;
  chargeType: "Fixed" | "Percentage";
  defaultAmount: number;
  amount: number;        // editable per-waybill value
}

export interface WaybillFormData {
  waybillNo: string;
  waybillDate: string;
  requiredDeliveryDate: string;
  quantity: number;
  incoterms: string;

  billingAccountId: string;
  billingAccountLabel: string;

  // Auto-populated billing contact
  billingContactPerson: string;
  billingEmail: string;
  billingPhone: string;

  // Auto-populated defaults
  serviceType: string;
  rateType: string;
  paymentType: string;
  paymentCollectionType: string;

  totalWeight: number;
  specialInstructions: string;
  referenceNo: string;
  additionalReference: string;
  codAmount: string;

  sender: string;
  pickupPoint: string;
  senderContactPerson: string;
  senderContact: string;
  senderAddress: Address;

  receiver: string;
  deliveryPoint: string;
  receiverContactPerson: string;
  receiverContact: string;
  receiverAddress: Address;

  parcels: Parcel[];

  freightRateBasis: string;
  freightRate: number;
  extraCharges: ExtraChargeRow[];
  vatPercent: number;

  paymentTerms: string;
  creditDays: number;
  notes: string;
}

interface CreateWaybillPageProps {
  onBack: () => void;
  onSubmit: (data: WaybillFormData) => void;
  editData?: any;   // raw API waybill object — when present, form is in edit mode
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Constants                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

const PROVINCES   = ["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Free State","Limpopo","Mpumalanga","North West","Northern Cape"];
const PAY_TERMS   = ["7 Days","14 Days","30 Days","60 Days","Cash on Delivery"];
const DRAFT_KEY   = "waybill-draft-v3";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function fmtDate(d: Date) {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}
function emptyAddress(): Address {
  return { building:"", street:"", suburb:"", city:"", province:"", postalCode:"", country:"South Africa" };
}

/** Parse a raw API waybill response into WaybillFormData for pre-filling the edit form */
function rawToFormData(raw: any): WaybillFormData {
  // Parse senderAddress (stored as plain string "building, street, suburb, city, province, postal, country")
  const senderParts = (raw.senderAddress || "").split(",").map((s: string) => s.trim());

  // receiverAddress is stored as an object
  const ra = raw.receiverAddress ?? {};

  // Extra charges
  const extraCharges: ExtraChargeRow[] = (raw.extraCharges || []).map((c: any, i: number) => ({
    id:            `edit-${i}-${Date.now()}`,
    extraChargeId: c.extraChargeId || c._id,
    chargeCode:    c.chargeCode    || "",
    description:   c.chargeName   || c.description || "",
    chargeType:    (c.chargeType as "Fixed" | "Percentage") || "Fixed",
    defaultAmount: c.defaultAmount ?? 0,
    amount:        c.amount        ?? 0,
  }));

  return {
    waybillNo:              raw.waybillNo       || "",
    waybillDate:            raw.date ? fmtDate(new Date(raw.date)) : fmtDate(new Date()),
    requiredDeliveryDate:   fmtDate(new Date()),
    quantity:               raw.quantity        || 1,
    incoterms:              raw.incoterms       || "",

    billingAccountId:       raw.billingAccount?._id   || raw.billingAccount || "",
    billingAccountLabel:    raw.billingAccount?.billingAccountName || "",

    billingContactPerson:   raw.billingContactPerson  || "",
    billingEmail:           raw.billingEmail          || "",
    billingPhone:           raw.billingPhone          || "",

    serviceType:            raw.serviceType            || "",
    rateType:               raw.rateType               || "",
    paymentType:            raw.paymentType            || "",
    paymentCollectionType:  raw.paymentCollectionType  || "",

    totalWeight:            0,
    specialInstructions:    raw.specialInstructions    || "",
    referenceNo:            raw.referenceNo            || "",
    additionalReference:    raw.additionalReference    || "",
    codAmount:              raw.charges                || "0.00",

    sender:                 raw.sender                 || "",
    pickupPoint:            raw.pickupPoint            || "",
    senderContactPerson:    raw.senderContact          || "",
    senderContact:          raw.senderContact          || "",
    senderAddress: {
      building:   senderParts[0] || "",
      street:     senderParts[1] || "",
      suburb:     senderParts[2] || "",
      city:       senderParts[3] || "",
      province:   senderParts[4] || "",
      postalCode: senderParts[5] || "",
      country:    senderParts[6] || "South Africa",
    },

    receiver:               raw.receiver               || "",
    deliveryPoint:          raw.deliveryPoint          || "",
    receiverContactPerson:  raw.receiverContact        || "",
    receiverContact:        raw.receiverContact        || "",
    receiverAddress: {
      building:   ra.building   || "",
      street:     ra.street     || "",
      suburb:     ra.suburb     || "",
      city:       ra.city       || "",
      province:   ra.province   || "",
      postalCode: ra.postalCode || "",
      country:    ra.country    || "South Africa",
    },

    parcels: (raw.parcels || []).map((p: any) => ({
      id:          p.id          || "",
      productCode: p.productCode || "",
      description: p.description || "",
      qty:         p.qty         || 1,
      weight:      p.weight      || 0,
      length:      p.length      || 0,
      width:       p.width       || 0,
      height:      p.height      || 0,
    })),

    freightRateBasis:  raw.freightRateBasis  || "Per KG",
    freightRate:       raw.freightRate       || 3.5,
    extraCharges,
    vatPercent:        raw.vatPercent        || 15,
    paymentTerms:      raw.paymentTerms      || "30 Days",
    creditDays:        raw.creditDays        || 30,
    notes:             raw.notes            || "",
  };
}
function emptyForm(): WaybillFormData {
  const today = new Date();
  const del   = new Date(); del.setDate(today.getDate() + 2);
  return {
    waybillNo: "", waybillDate: fmtDate(today),
    requiredDeliveryDate: fmtDate(del),
    quantity: 1, incoterms: "", // populated dynamically from /api/master/incoterms
    billingAccountId: "", billingAccountLabel: "",
    billingContactPerson: "", billingEmail: "", billingPhone: "",
    serviceType: "", rateType: "", paymentType: "", paymentCollectionType: "",
    totalWeight: 0, specialInstructions: "",
    referenceNo: "", additionalReference: "", codAmount: "0.00",
    sender: "", pickupPoint: "", senderContactPerson: "", senderContact: "", senderAddress: emptyAddress(),
    receiver: "", deliveryPoint: "", receiverContactPerson: "", receiverContact: "", receiverAddress: emptyAddress(),
    parcels: [],
    freightRateBasis: "Per KG", freightRate: 3.5,
    extraCharges: [], vatPercent: 15,
    paymentTerms: "30 Days", creditDays: 30, notes: "",
  };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function CreateWaybillPage({ onBack, onSubmit, editData }: CreateWaybillPageProps) {
  const isEditMode = !!editData;

  const [form, setForm] = useState<WaybillFormData>(() =>
    isEditMode ? rawToFormData(editData) : emptyForm()
  );

  // Lookup data
  const [customers,           setCustomers]           = useState<{ id:string; name:string; contactPerson:string; contact:string; address:Address }[]>([]);
  const [billingAccounts,     setBillingAccounts]     = useState<any[]>([]);
  const [serviceTypeLookup,   setServiceTypeLookup]   = useState<{label:string;value:string}[]>([]);
  const [rateTypeLookup,      setRateTypeLookup]      = useState<{label:string;value:string}[]>([]);
  const [incotermOptions,     setIncotermOptions]     = useState<{label:string;value:string}[]>([]);
  const [masterDefaultCharges,setMasterDefaultCharges]= useState<ExtraChargeRow[]>([]);

  // ── Branch state ─────────────────────────────────────────────────────────
  // From Branch - detected from sender postal code
  const [fromBranch, setFromBranch] = useState<{_id:string;code:string;name:string}|null>(null);
  const [fromBranchLoading, setFromBranchLoading] = useState(false);
  const [fromBranchError,   setFromBranchError]   = useState<string>("");
  
  // To Branch - detected from receiver postal code
  const [toBranch, setToBranch]     = useState<{_id:string;code:string;name:string}|null>(null);
  const [toBranchLoading, setToBranchLoading] = useState(false);
  const [toBranchError,   setToBranchError]   = useState<string>("");

  // UI state
  const [panel,        setPanel]       = useState<"none"|"manual"|"scan">("none");
  const [editingId,    setEditingId]   = useState<string|null>(null);
  const [scanValue,    setScanValue]   = useState("");
  const [scanMsg,      setScanMsg]     = useState<string|null>(null);
  const [showErrors,   setShowErrors]  = useState(false);
  const [draftBanner,  setDraftBanner] = useState<"none"|"offer"|"dismissed">("none");
  const [loadingDefs,  setLoadingDefs] = useState(false);

  const scanRef     = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<{value:string;time:number}|null>(null);
  const draftChecked = useRef(false);
  const [manualDraft, setManualDraft] = useState({ id:"", productCode:"", description:"", qty:"1", weight:"", length:"", width:"", height:"" });

  /* ── Initial data load ── */
  useEffect(() => {
    Promise.all([
      apiGet<any>("/api/customers/lookup"),
      apiGet<any>("/api/billing-accounts/lookup"),
      apiGet<any>("/api/master/service-types/lookup"),
      apiGet<any>("/api/master/rate-types/lookup"),
      apiGet<any>("/api/master/incoterms/lookup"),
      apiGet<any>("/api/master/extra-charges/defaults"),
    ]).then(([cu, ba, st, rt, inc, ec]) => {
      setCustomers((cu.data||[]).map((c:any) => ({
        id: c._id, name: c.name,
        contactPerson: c.contactPerson ?? "",
        contact:       c.contact       ?? c.phone ?? "",
        address: {
          building:   c.address?.building   ?? "",
          street:     c.address?.street     ?? "",
          suburb:     c.address?.suburb     ?? "",
          city:       c.address?.city       ?? "",
          province:   c.address?.province   ?? "",
          postalCode: c.address?.postalCode ?? "",
          country:    c.address?.country    ?? "South Africa",
        },
      })));
      setBillingAccounts(ba.data || []);
      setServiceTypeLookup((st.data||[]).map((x:any) => ({ label:`${x.code} — ${x.name}`, value: x.code })));
      setRateTypeLookup(   (rt.data||[]).map((x:any) => ({ label:`${x.code} — ${x.name}`, value: x.code })));

      // Build dynamic incoterm options sorted by sortOrder
      const incOpts = (inc.data||[])
        .filter((x:any) => x.isActive !== false)
        .sort((a:any, b:any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((x:any) => ({ label: `${x.code} — ${x.name}`, value: x.code }));
      setIncotermOptions(incOpts);

      // Build master default extra charges (isActive + isDefault)
      const defaultCharges: ExtraChargeRow[] = (ec.data||[]).map((c:any, i:number) => ({
        id:            `master-${i}-${Date.now()}`,
        extraChargeId: c._id,
        chargeCode:    c.chargeCode ?? "",
        description:   c.chargeName ?? "",
        chargeType:    (c.chargeType as "Fixed"|"Percentage") ?? "Fixed",
        defaultAmount: c.defaultAmount ?? 0,
        amount:        c.defaultAmount ?? 0, // pre-fill with default amount
      }));
      setMasterDefaultCharges(defaultCharges);

      // Pre-populate new waybill form with master default charges + first incoterm
      setForm(p => ({
        ...p,
        extraCharges: defaultCharges,
        // Set incoterms to first active entry if form hasn't been touched
        incoterms: p.incoterms === "" && incOpts.length > 0 ? incOpts[0].value : p.incoterms,
      }));
    }).catch(() => {});
  }, []);

  /* ── Draft recovery (create mode only) ── */
  useEffect(() => {
    if (isEditMode) return; // never restore draft in edit mode
    if (draftChecked.current) return;
    draftChecked.current = true;
    try { if (localStorage.getItem(DRAFT_KEY)) setDraftBanner("offer"); } catch {}
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) return; // don't overwrite draft with edit data
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form })); } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [form, isEditMode]);

  /* ── Sync form when editData changes ── */
  useEffect(() => {
    if (isEditMode && editData) {
      setForm(rawToFormData(editData));
    }
  }, [editData, isEditMode]);

  const handleBillingAccountChange = useCallback(async (baId: string) => {
    // Find the selected account from already-fetched lookup
    const ba = billingAccounts.find((b:any) => b._id === baId);
    const label = ba ? `${ba.billingAccountCode} — ${ba.billingAccountName}` : "";

    if (!baId) {
      setForm(p => ({
        ...p,
        billingAccountId: "", billingAccountLabel: "",
        billingContactPerson: "", billingEmail: "", billingPhone: "",
        serviceType: "", rateType: "", paymentType: "", paymentCollectionType: "",
        // Fall back to master default charges when no billing account selected
        extraCharges: masterDefaultCharges,
      }));
      return;
    }

    setLoadingDefs(true);
    try {
      // Fetch full defaults from the dedicated endpoint
      const res = await apiGet<{ success:boolean; data:any }>(`/api/billing-accounts/${baId}/defaults`);
      const d = res.data ?? {};

      // Build extra charge rows from account (or company) defaults
      // Priority: account/company charges → master default charges (isDefault+isActive)
      const charges: ExtraChargeRow[] = (d.extraCharges || []).map((c:any, i:number) => ({
        id:            `ba-${i}-${Date.now()}`,
        extraChargeId: c.extraChargeId ?? c._id,
        chargeCode:    c.chargeCode ?? "",
        description:   c.chargeName ?? "",
        chargeType:    (c.chargeType as "Fixed"|"Percentage") ?? "Fixed",
        defaultAmount: c.defaultAmount ?? 0,
        amount:        c.amount ?? c.defaultAmount ?? 0,
      }));

      // If neither account nor company has configured charges, fall back to master defaults
      const resolvedCharges = charges.length > 0 ? charges : masterDefaultCharges;

      setForm(p => ({
        ...p,
        billingAccountId:     baId,
        billingAccountLabel:  label,
        billingContactPerson: d.billingContactPerson  || p.billingContactPerson,
        billingEmail:         d.billingEmail          || p.billingEmail,
        billingPhone:         d.billingPhone          || p.billingPhone,
        serviceType:          d.defaultServiceType?.code || p.serviceType,
        rateType:             d.defaultRateType?.code    || p.rateType,
        paymentType:          d.defaultPaymentType       || p.paymentType,
        paymentCollectionType: d.defaultPaymentCollectionType || p.paymentCollectionType,
        extraCharges: resolvedCharges,

        // ── Auto-populate Sender Information from Billing Account ───────────
        sender:               d.senderName          || p.sender,
        pickupPoint:          d.senderName          || p.pickupPoint,
        senderContactPerson:  d.senderContactPerson || p.senderContactPerson,
        senderContact:        d.senderPhone         || p.senderContact,
        senderAddress: d.senderAddress ? {
          building:   d.senderAddress.building   || p.senderAddress.building,
          street:     d.senderAddress.street     || p.senderAddress.street,
          suburb:     d.senderAddress.suburb     || p.senderAddress.suburb,
          city:       d.senderAddress.city       || p.senderAddress.city,
          province:   d.senderAddress.province   || p.senderAddress.province,
          postalCode: d.senderAddress.postalCode || p.senderAddress.postalCode,
          country:    d.senderAddress.country    || p.senderAddress.country,
        } : p.senderAddress,
      }));
    } catch {
      setForm(p => ({ ...p, billingAccountId: baId, billingAccountLabel: label }));
    } finally {
      setLoadingDefs(false);
    }
  }, [billingAccounts, masterDefaultCharges]);

  /* ── From Branch lookup by sender postal code ── */
  const lookupFromBranch = useCallback(async (postalCode: string) => {
    const code = postalCode.trim();
    if (!code) { 
      setFromBranch(null); 
      setFromBranchError(""); 
      return; 
    }
    setFromBranchLoading(true); 
    setFromBranchError("");
    try {
      const res = await apiGet<{ success: boolean; data: any }>(
        `/api/master/postal-codes/lookup-branch/${encodeURIComponent(code)}`
      );
      if (res.success && res.data.branch) {
        setFromBranch(res.data.branch);
      } else {
        setFromBranch(null);
        setFromBranchError(`Postal code ${code} not assigned to any branch`);
      }
    } catch {
      setFromBranch(null);
      setFromBranchError(`Postal code ${code} not found in master`);
    } finally {
      setFromBranchLoading(false);
    }
  }, []);

  /* ── To Branch lookup by receiver postal code ── */
  const lookupToBranch = useCallback(async (postalCode: string) => {
    const code = postalCode.trim();
    if (!code) { setToBranch(null); setToBranchError(""); return; }
    setToBranchLoading(true); setToBranchError("");
    try {
      const res = await apiGet<{ success: boolean; data: any }>(
        `/api/master/postal-codes/lookup-branch/${encodeURIComponent(code)}`
      );
      if (res.success && res.data.branch) {
        setToBranch(res.data.branch);
      } else {
        setToBranch(null);
        setToBranchError(`Postal code ${code} not assigned to any branch`);
      }
    } catch {
      setToBranch(null);
      setToBranchError(`Postal code ${code} not found in master`);
    } finally {
      setToBranchLoading(false);
    }
  }, []);

  /* ── Form helpers ── */
  const update = <K extends keyof WaybillFormData>(field: K, value: WaybillFormData[K]) =>
    setForm(p => ({ ...p, [field]: value }));

  const updateAddr = (which: "senderAddress"|"receiverAddress", field: keyof Address, val: string) => {
    setForm(p => ({ ...p, [which]: { ...p[which], [field]: val } }));
    // When sender postal code changes → look up From Branch
    if (which === "senderAddress" && field === "postalCode") {
      lookupFromBranch(val);
    }
    // When receiver postal code changes → look up To Branch
    if (which === "receiverAddress" && field === "postalCode") {
      lookupToBranch(val);
    }
  };

  const handleSenderSelect = (name: string) => {
    const c = customers.find(x => x.name === name);
    setForm(p => ({
      ...p, sender: name,
      pickupPoint:         c?.name          ?? name,   // default pickup = sender name
      senderContactPerson: c?.contactPerson ?? "",
      senderContact:       c?.contact       ?? "",
      senderAddress:       c?.address       ?? emptyAddress(),
    }));
    // Trigger From Branch lookup when customer's postal code is known
    if (c?.address?.postalCode) {
      lookupFromBranch(c.address.postalCode);
    }
  };

  const handleReceiverSelect = (name: string) => {
    const c = customers.find(x => x.name === name);
    setForm(p => ({
      ...p, receiver: name,
      deliveryPoint:         c?.name          ?? name,
      receiverContactPerson: c?.contactPerson ?? "",
      receiverContact:       c?.contact       ?? "",
      receiverAddress:       c?.address       ?? emptyAddress(),
    }));
    // Trigger To Branch lookup when customer's postal code is known
    if (c?.address?.postalCode) {
      lookupToBranch(c.address.postalCode);
    }
  };

  /* ── Parcel helpers ── */
  const parcelsFull = form.quantity > 0 && form.parcels.length >= form.quantity;

  const addParcel = (p: Parcel) => {
    if (!p.id.trim()) return;
    setForm(prev => prev.parcels.some(x => x.id === p.id) ? prev : { ...prev, parcels: [...prev.parcels, p] });
  };

  const removeParcel = (id: string) =>
    setForm(p => ({ ...p, parcels: p.parcels.filter(x => x.id !== id) }));

  const updateParcelField = (id: string, field: keyof Parcel, raw: string) =>
    setForm(p => ({
      ...p,
      parcels: p.parcels.map(x => {
        if (x.id !== id) return x;
        if (field === "productCode" || field === "description") return { ...x, [field]: raw };
        return { ...x, [field]: parseFloat(raw) || 0 };
      }),
    }));

  const generateParcels = () => {
    if (!(form.quantity > 0)) return;
    setForm(p => ({
      ...p,
      parcels: Array.from({ length: p.quantity }, (_, i) => ({
        id: `PRC${String(10001 + i)}`, productCode: "", description: "",
        qty: 1, weight: 0, length: 0, width: 0, height: 0,
      })),
    }));
    setPanel("none");
  };

  /* ── Scan helpers ── */
  const isOtherInputActive = () => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return (tag === "input" && el !== scanRef.current) || tag === "select" || tag === "textarea";
  };

  useEffect(() => {
    if (panel !== "scan") return;
    const focus = () => { if (!isOtherInputActive()) scanRef.current?.focus(); };
    focus();
    const t = setInterval(focus, 500);
    return () => clearInterval(t);
  }, [panel]);

  const handleScanResult = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const now = Date.now();
    if (lastScanRef.current?.value === value && now - lastScanRef.current.time < 1000) return;
    lastScanRef.current = { value, time: now };
    if (form.parcels.some(p => p.id === value)) { setScanMsg(`${value} already added`); return; }
    if (parcelsFull) { setScanMsg(`Limit reached (${form.quantity}). Increase No. of Parcels.`); return; }
    addParcel({ id: value, productCode: "", description: "", qty: 1, weight: 0, length: 0, width: 0, height: 0 });
    setScanMsg(`${value} added ✓`);
  };

  /* ── Extra charge helpers ── */
  const updateCharge = (id: string, field: keyof ExtraChargeRow, raw: string) =>
    setForm(p => ({
      ...p,
      extraCharges: p.extraCharges.map(c =>
        c.id === id
          ? { ...c, [field]: field === "amount" || field === "defaultAmount" ? parseFloat(raw) || 0 : raw }
          : c
      ),
    }));

  const removeCharge = (id: string) =>
    setForm(p => ({ ...p, extraCharges: p.extraCharges.filter(c => c.id !== id) }));

  const addAdHocCharge = () =>
    setForm(p => ({
      ...p,
      extraCharges: [
        ...p.extraCharges,
        { id: `adhoc-${Date.now()}`, description: "", chargeType: "Fixed", defaultAmount: 0, amount: 0 },
      ],
    }));

  /* ── LIVE TOTALS (recalculate on every render) ── */
  const totalPieces   = form.parcels.reduce((s, p) => s + (p.qty    || 0), 0);
  const totalWeight   = form.parcels.reduce((s, p) => s + (p.weight || 0), 0);

  const roadFreightTotal = totalWeight * (form.freightRate || 0);

  const extraChargesTotal = form.extraCharges.reduce((s, c) => {
    if (c.chargeType === "Percentage") return s + roadFreightTotal * ((c.amount || 0) / 100);
    return s + (c.amount || 0);
  }, 0);

  const subtotalExclVat = roadFreightTotal + extraChargesTotal;
  const vatAmount       = subtotalExclVat * ((form.vatPercent || 0) / 100);
  const grandTotal      = subtotalExclVat + vatAmount;

  /* ── Draft actions ── */
  const restoreDraft = () => {
    try {
      const s = localStorage.getItem(DRAFT_KEY);
      if (s) { const p = JSON.parse(s); if (p?.form) setForm(p.form); }
    } catch {}
    setDraftBanner("dismissed");
  };
  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setDraftBanner("dismissed");
  };
  const saveDraft = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form })); alert("Draft saved."); } catch {}
  };
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  /* ── Validation ── */
  const addrOk = (a: Address) => !!(a.building && a.street && a.suburb && a.city && a.province && a.postalCode);
  const missing: string[] = [];
  if (!form.sender)   missing.push("Sender");
  if (!form.pickupPoint) missing.push("Pickup Point");
  if (!form.receiver) missing.push("Receiver");
  if (!addrOk(form.receiverAddress)) missing.push("Receiver Address");
  if (!(form.quantity > 0)) missing.push("No. of Parcels");
  const isValid = missing.length === 0;

  const handleSubmit = () => {
    if (!isValid) { setShowErrors(true); return; }
    onSubmit({ ...form, totalWeight, quantity: form.quantity });
    clearDraft();
  };

  const handleClear = () => {
    if (!confirm("Clear all fields? This cannot be undone.")) return;
    clearDraft(); setForm(emptyForm()); setShowErrors(false);
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  JSX                                                                     */
  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-6 sm:px-8">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isEditMode ? ` ${editData?.waybillNo ?? ""}` : "Create Waybill"}
            </h1>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
              <button onClick={onBack} className="hover:text-gray-600">Waybills</button>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-500">{isEditMode ? "Edit" : "Create"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleClear}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50">
            Undo
          </button>
          {!isEditMode && (
            <button onClick={saveDraft}
              className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">
              Save Draft
            </button>
          )}
          <button onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
            {isEditMode ? "Save Changes" : "Save & Create"} <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Draft banner */}
      {draftBanner === "offer" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50 px-5 py-3 text-sm">
          <span className="text-amber-800">Saved draft found. Restore it?</span>
          <div className="flex gap-2">
            <button onClick={restoreDraft} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">Restore</button>
            <button onClick={discardDraft} className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">Discard</button>
          </div>
        </div>
      )}

      {/* Validation errors */}
      {showErrors && !isValid && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
          Please complete: <span className="font-medium">{missing.join(", ")}</span>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-5">

        {/* ── Waybill Information ── */}
        <Card title="Waybill Information">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-5">
            <WField label="Waybill No. (Auto-generated)">
              <input value={form.waybillNo || "Auto"} readOnly
                className={`${inputCls} cursor-not-allowed bg-gray-50 font-semibold text-gray-900`} />
            </WField>
            <WField label="Waybill Date">
              <input value={form.waybillDate} onChange={e => update("waybillDate", e.target.value)} className={inputCls} />
            </WField>
            <WField label="Required Delivery Date">
              <input value={form.requiredDeliveryDate} onChange={e => update("requiredDeliveryDate", e.target.value)} className={inputCls} />
            </WField>
            <WField label="No. of Parcels" required>
              <input type="number" min={1} value={form.quantity}
                onChange={e => update("quantity", Math.max(1, parseInt(e.target.value)||1))} className={inputCls} />
            </WField>
            <WField label="Incoterms">
              <WSelect
                value={form.incoterms}
                onChange={v => update("incoterms", v)}
                placeholder={incotermOptions.length === 0 ? "Loading…" : "Select incoterm…"}
                options={incotermOptions}
              />
            </WField>

            {/* Billing Account — spans 2 rows, shows auto-populated contact */}
            <div className="sm:row-span-2">
              <WField label="Billing Account" required>
                <div className="relative">
                  <WSelect
                    value={form.billingAccountId}
                    onChange={handleBillingAccountChange}
                    placeholder="Select billing account…"
                    options={billingAccounts.map((b:any) => ({
                      label: `${b.billingAccountCode} — ${b.billingAccountName}`,
                      value: b._id,
                    }))}
                  />
                  {loadingDefs && (
                    <span className="absolute right-8 top-2.5 text-xs text-blue-500 animate-pulse">Loading…</span>
                  )}
                </div>
              </WField>
              {/* Auto-populated contact info — read-only display */}
              <div className="mt-3 space-y-2 rounded-lg border border-blue-50 bg-blue-50/40 p-3 text-sm">
                <InfoRow label="Billing Contact" value={form.billingContactPerson} />
                <InfoRow label="Billing Email"   value={form.billingEmail} />
                <InfoRow label="Billing Phone"   value={form.billingPhone} />
              </div>
            </div>

            {/* ── From Branch — auto from sender postal code ── */}
            <WField label="From Branch (Collection)">
              <div className={`${inputCls} cursor-not-allowed min-h-[38px] flex items-center gap-2 ${
                fromBranch ? "bg-gray-50" :
                fromBranchError ? "bg-amber-50 border-amber-200" :
                "bg-gray-50"
              }`}>
                {fromBranchLoading ? (
                  <span className="text-xs text-blue-500 animate-pulse">🔍 Looking up postal code…</span>
                ) : fromBranch ? (
                  <>
                    <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {fromBranch.code}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{fromBranch.name}</span>
                  </>
                ) : fromBranchError ? (
                  <span className="text-xs text-amber-600">⚠ {fromBranchError}</span>
                ) : (
                  <span className="text-gray-400 text-xs">
                    ↓ Auto-filled when you enter the sender postal code below
                  </span>
                )}
              </div>
            </WField>

            {/* ── To Branch — auto from receiver postal code ── */}
            <WField label="To Branch (Delivery)">
              <div className={`${inputCls} cursor-not-allowed min-h-[38px] flex items-center gap-2 ${
                toBranch ? "bg-gray-50" :
                toBranchError ? "bg-amber-50 border-amber-200" :
                "bg-gray-50"
              }`}>
                {toBranchLoading ? (
                  <span className="text-xs text-blue-500 animate-pulse">🔍 Looking up postal code…</span>
                ) : toBranch ? (
                  <>
                    <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {toBranch.code}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{toBranch.name}</span>
                  </>
                ) : toBranchError ? (
                  <span className="text-xs text-amber-600">⚠ {toBranchError}</span>
                ) : (
                  <span className="text-gray-400 text-xs">
                    ↓ Auto-filled when you enter the receiver postal code below
                  </span>
                )}
              </div>
            </WField>

            {/* ── Live shipment type indicator ── */}
            {(fromBranch || toBranch) && (
              <div className="sm:col-span-2">
                {fromBranch && toBranch ? (
                  fromBranch._id === toBranch._id ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <p className="text-sm font-semibold text-green-700">Local Delivery</p>
                      <p className="text-xs text-green-600">— Same branch, status will be set to <strong>To Deliver</strong></p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <p className="text-sm font-semibold text-blue-700">Inter-Branch Delivery</p>
                      <p className="text-xs text-blue-600">
                        — {fromBranch.code} → {toBranch.code}, status will be set to <strong>To Manifest</strong>
                      </p>
                    </div>
                  )
                ) : null}
              </div>
            )}

            {/* Service Type — auto-populated, editable */}
            <WField label="Service Type">
              <WSelect value={form.serviceType} onChange={v => update("serviceType", v)}
                placeholder="Select service type"
                options={serviceTypeLookup} />
            </WField>

            {/* Rate Type — auto-populated, editable */}
            <WField label="Rate Type">
              <WSelect value={form.rateType} onChange={v => update("rateType", v)}
                placeholder="Select rate type"
                options={rateTypeLookup} />
            </WField>

            {/* Payment Type — auto-populated, editable */}
            <WField label="Payment Type">
              <WSelect value={form.paymentType} onChange={v => update("paymentType", v)}
                placeholder="Select payment type"
                options={["Account","Cash on Delivery","Prepaid","Credit Card","EFT","Collect"]} />
            </WField>

            {/* Payment Collection Type — auto-populated */}
            <WField label="Delivery Type">
              <WSelect value={form.paymentCollectionType} onChange={v => update("paymentCollectionType", v)}
                placeholder="— Select —"
                options={["Cash on Delivery","Account"]} />
            </WField>

            <WField label="Total Weight (kg)">
              <input value={totalWeight.toFixed(2)} readOnly
                className={`${inputCls} cursor-not-allowed bg-gray-50`} />
            </WField>

            <div className="sm:row-span-2">
              <WField label="Special Instructions">
                <textarea value={form.specialInstructions}
                  onChange={e => update("specialInstructions", e.target.value)}
                  rows={6} className={`${inputCls} h-full resize-none`} />
              </WField>
            </div>

            <WField label="Reference No.">
              <input value={form.referenceNo} onChange={e => update("referenceNo", e.target.value)} className={inputCls} />
            </WField>
            <WField label="Additional Reference">
              <input value={form.additionalReference} onChange={e => update("additionalReference", e.target.value)} className={inputCls} />
            </WField>
            <WField label="COD Amount (ZAR)">
              <input type="number" step="0.01" value={form.codAmount}
                onChange={e => update("codAmount", e.target.value)} className={inputCls} />
            </WField>
          </div>
        </Card>

        {/* ── Sender / Receiver ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Sender (From)" icon>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <WField label="Sender Name" required>
                <WSelect value={form.sender} onChange={handleSenderSelect}
                  placeholder="Select sender" options={customers.map(c => c.name)} />
              </WField>
              <WField label="Pickup Point" required>
                <input value={form.pickupPoint} onChange={e => update("pickupPoint", e.target.value)}
                  placeholder="e.g. Johannesburg Warehouse" className={inputCls} />
              </WField>
              <WField label="Contact Person">
                <input value={form.senderContactPerson}
                  onChange={e => update("senderContactPerson", e.target.value)} className={inputCls} />
              </WField>
              <WField label="Contact Number">
                <input value={form.senderContact}
                  onChange={e => update("senderContact", e.target.value)} className={inputCls} />
              </WField>
            </div>
            <p className="mb-2 mt-4 text-xs font-semibold text-blue-700">Address</p>
            <AddrFields value={form.senderAddress} onChange={(f,v) => updateAddr("senderAddress", f, v)} />
          </Card>

          <Card title="Receiver (To)" icon>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <WField label="Site Name" required>
                <WSelect value={form.receiver} onChange={handleReceiverSelect}
                  placeholder="Select customer" options={customers.map(c => c.name)} />
              </WField>
              <WField label="Customer Name">
                <input value={form.deliveryPoint} onChange={e => update("deliveryPoint", e.target.value)}
                  placeholder="e.g. Cape Town Branch" className={inputCls} />
              </WField>
              <WField label="Contact Person">
                <input value={form.receiverContactPerson}
                  onChange={e => update("receiverContactPerson", e.target.value)} className={inputCls} />
              </WField>
              <WField label="Contact Number">
                <input value={form.receiverContact}
                  onChange={e => update("receiverContact", e.target.value)} className={inputCls} />
              </WField>
            </div>
            <p className="mb-2 mt-4 text-xs font-semibold text-blue-700">Address</p>
            <AddrFields value={form.receiverAddress} onChange={(f,v) => updateAddr("receiverAddress", f, v)} />
          </Card>
        </div>

        {/* ── Parcel Details / Billing ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* Parcel Details */}
          <Card title="Parcel Details" headerExtra={
            <div className="flex flex-wrap gap-2">
              <button onClick={generateParcels}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-blue-900 hover:bg-gray-50">
                <Package2 className="h-4 w-4" /> Generate Parcels
              </button>
              <button onClick={() => setPanel(p => p === "manual" ? "none" : "manual")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-blue-900 hover:bg-gray-50">
                <Plus className="h-4 w-4" /> Add Manually
              </button>
              <button onClick={() => { setPanel(p => p === "scan" ? "none" : "scan"); setScanMsg(null); }}
                className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-medium text-white hover:bg-blue-800">
                <ScanLine className="h-3.5 w-3.5" /> Scan
              </button>
            </div>
          }>
            {/* Manual add panel */}
            {panel === "manual" && (
              <div className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <input placeholder="Parcel No." value={manualDraft.id}
                    onChange={e => { setManualDraft(prev => ({ ...prev, id: e.target.value })); }}
                    className={`${inputCls} sm:col-span-2`} />
                  <input placeholder="Product Code" value={manualDraft.productCode}
                    onChange={e => { setManualDraft(prev => ({ ...prev, productCode: e.target.value })); }}
                    className={inputCls} />
                  <input type="number" placeholder="Qty" value={manualDraft.qty}
                    onChange={e => { setManualDraft(prev => ({ ...prev, qty: e.target.value })); }}
                    className={inputCls} />
                </div>
                <input placeholder="Description" value={manualDraft.description}
                  onChange={e => { setManualDraft(prev => ({ ...prev, description: e.target.value })); }}
                  className={inputCls} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["weight","length","width","height"] as const).map(f => (
                    <input key={f} type="number" placeholder={`${f.charAt(0).toUpperCase()+f.slice(1)}${f==="weight"?" kg":" cm"}`}
                      value={(manualDraft as any)[f]}
                      onChange={e => { setManualDraft(prev => ({ ...prev, [f]: e.target.value })); }}
                      className={inputCls} />
                  ))}
                </div>
                <button onClick={() => {
                  if (parcelsFull) return;
                  const d = manualDraft;
                  const id = d.id.trim() || `PRC${String(10001 + form.parcels.length)}`;
                  addParcel({ id, productCode: d.productCode.trim(), description: d.description.trim(),
                    qty: parseInt(d.qty)||1, weight: parseFloat(d.weight)||0,
                    length: parseFloat(d.length)||0, width: parseFloat(d.width)||0, height: parseFloat(d.height)||0 });
                  setManualDraft({ id:"", productCode:"", description:"", qty:"1", weight:"", length:"", width:"", height:"" });
                }} disabled={parcelsFull}
                  className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-gray-300">
                  <Plus className="h-4 w-4" /> Add Parcel
                </button>
              </div>
            )}

            {/* Scan panel */}
            {panel === "scan" && (
              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-3 flex items-center justify-center gap-2 text-gray-400">
                  <ScanLine className="h-5 w-5" />
                  <span className="text-sm font-medium">{parcelsFull ? "All parcels scanned" : "Waiting for scanner…"}</span>
                </div>
                <input ref={scanRef} value={scanValue}
                  onChange={e => setScanValue(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); handleScanResult(scanValue); setScanValue(""); } }}
                  disabled={parcelsFull} autoFocus placeholder="Scan barcode…"
                  className={`${inputCls} text-center disabled:bg-gray-100`} />
                {scanMsg && <p className="mt-2 text-center text-xs text-emerald-600">{scanMsg}</p>}
              </div>
            )}

            {/* Parcel table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold uppercase tracking-wide text-gray-900">
                    {["#","Parcel No.","Product Code","Description","Qty","Weight (kg)","Dimensions (cm)",""].map(h => (
                      <th key={h} className="px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.parcels.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-400">
                      <Package2 className="mx-auto mb-1.5 h-5 w-5 text-gray-300" /> No parcels yet.
                    </td></tr>
                  ) : form.parcels.map((p, idx) => {
                    const ed = editingId === p.id;
                    return (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                        <td className="px-3 py-2 text-gray-900">{idx+1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{p.id}</td>
                        <td className="px-1 py-1.5 text-gray-900">{ed
                          ? <input value={p.productCode} onChange={e => updateParcelField(p.id,"productCode",e.target.value)} className="w-24 rounded border border-gray-200 px-2 py-1 text-xs text-gray-900" />
                          : <span className="text-gray-900">{p.productCode||"—"}</span>}
                        </td>
                        <td className="px-1 py-1.5">{ed
                          ? <input value={p.description} onChange={e => updateParcelField(p.id,"description",e.target.value)} className="w-28 rounded border border-gray-200 px-2 py-1 text-xs text-gray-900" />
                          : <span className="text-gray-900">{p.description||"—"}</span>}
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <CellInput value={p.qty}    onChange={v => updateParcelField(p.id,"qty",v)} />
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <CellInput value={p.weight} onChange={v => updateParcelField(p.id,"weight",v)} />
                        </td>
                        <td className="px-1 py-1.5">
                          {ed ? <div className="flex items-center gap-1">
                            {(["length","width","height"] as const).map((f,i) => (
                              <span key={f} className="flex items-center gap-0.5">
                                {i>0 && <span className="text-gray-300 text-xs">×</span>}
                                <CellInput value={p[f]} onChange={v => updateParcelField(p.id,f,v)} />
                              </span>
                            ))}
                          </div> : <span className="text-gray-900">{p.length}×{p.width}×{p.height}</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditingId(ed ? null : p.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => removeParcel(p.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Parcel stats */}
            <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl bg-gray-50/70 px-4 py-3">
              <IconStat icon={Package2}   label="Total Parcels" value={String(form.parcels.length)} />
              <IconStat icon={Layers}     label="Total Pieces"  value={String(totalPieces)} />
              <IconStat icon={WeightIcon} label="Total Weight"  value={`${totalWeight.toFixed(2)} kg`} />
            </div>
          </Card>

          {/* Billing Details / Charges */}
          <Card title="Billing Details / Charges">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

              {/* Road freight */}
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="mb-2 text-xs font-semibold text-blue-700">Road Freight Charge</p>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-900">
                      <th className="pb-1.5 font-bold">Description</th>
                      <th className="pb-1.5 font-bold">Rate Type</th>
                      <th className="pb-1.5 font-bold">Rate (R)</th>
                      <th className="pb-1.5 text-right font-bold">Amount (R)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-900">Road Freight</td>
                      <td className="py-1 text-gray-900">{form.freightRateBasis}</td>
                      <td className="py-1">
                        <input type="number" step="0.01" value={form.freightRate}
                          onChange={e => update("freightRate", parseFloat(e.target.value)||0)}
                          className="w-16 rounded-md border border-gray-200 px-1.5 py-1 text-xs text-gray-900" />
                      </td>
                      <td className="py-1 text-right font-medium text-gray-900">{roadFreightTotal.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-xs font-semibold text-blue-700">Road Freight Total</span>
                  <span className="rounded-md bg-gray-50 px-2.5 py-1 text-sm font-bold text-gray-900">{roadFreightTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Extra charges — auto-populated, editable */}
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-700">
                    Extra Charges
                    {form.billingAccountId && (
                      <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600">auto-populated</span>
                    )}
                  </p>
                  <button onClick={addAdHocCharge}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-900">
                      <th className="pb-1.5 font-bold">Description</th>
                      <th className="pb-1.5 font-bold">Type</th>
                      <th className="pb-1.5 text-right font-bold">Amount</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {form.extraCharges.length === 0 && (
                      <tr><td colSpan={4} className="py-3 text-center text-gray-400">No charges. Click + to add.</td></tr>
                    )}
                    {form.extraCharges.map(c => (
                      <tr key={c.id}>
                        <td className="py-1">
                          <input value={c.description}
                            onChange={e => updateCharge(c.id, "description", e.target.value)}
                            className="w-full rounded border border-transparent px-1 py-0.5 text-gray-900 hover:border-gray-200 focus:border-gray-200 focus:outline-none" />
                        </td>
                        <td className="py-1">
                          <select value={c.chargeType}
                            onChange={e => updateCharge(c.id, "chargeType", e.target.value)}
                            className="rounded border border-gray-200 px-1 py-0.5 text-xs text-gray-700">
                            <option value="Fixed">Fixed</option>
                            <option value="Percentage">%</option>
                          </select>
                        </td>
                        <td className="py-1 text-right">
                          <input type="number" step="0.01" value={c.amount}
                            onChange={e => updateCharge(c.id, "amount", e.target.value)}
                            className="w-16 rounded-md border border-gray-200 px-1.5 py-1 text-right text-xs text-gray-900" />
                        </td>
                        <td className="py-1 pl-1">
                          <button onClick={() => removeCharge(c.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-xs font-semibold text-blue-700">Extra Charges Total</span>
                  <span className="rounded-md bg-gray-50 px-2.5 py-1 text-sm font-bold text-gray-900">{extraChargesTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* LIVE totals summary strip */}
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50/70 p-3">
              <TotalStat label="Road Freight"     value={roadFreightTotal.toFixed(2)} />
              <span className="text-gray-300">+</span>
              <TotalStat label="Extra Charges"    value={extraChargesTotal.toFixed(2)} />
              <span className="text-gray-300">=</span>
              <TotalStat label="Subtotal (excl. VAT)" value={subtotalExclVat.toFixed(2)} />
              <TotalStat label={`VAT @ ${form.vatPercent}%`} value={vatAmount.toFixed(2)} />
              <div className="ml-auto rounded-lg bg-blue-700 px-4 py-2 text-white">
                <p className="text-[10px] uppercase tracking-wide text-blue-100">Grand Total (ZAR)</p>
                <p className="text-lg font-bold leading-tight">{grandTotal.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Payment Terms / Notes ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Notes">
            <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
              rows={4} placeholder="Enter any notes…" className={`${inputCls} resize-none`} />
          </Card>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-wrap justify-end gap-2 pb-4">
          <button onClick={handleClear}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50">Clear</button>
          {!isEditMode && (
            <button onClick={saveDraft}
              className="rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50">Save Draft</button>
          )}
          <button onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800">
            {isEditMode ? "Save Changes" : "Save & Create"} <ChevronDown className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Small presentational components                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300";

function Card({ title, children, icon, headerExtra }: {
  title: string; children: React.ReactNode; icon?: boolean; headerExtra?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-blue-900">
          {icon && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white">
              <User2 className="h-3.5 w-3.5" />
            </span>
          )}
          {title}
        </h2>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}

function WField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-blue-800">
        {label}{required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}

function WSelect({ value, onChange, placeholder, options }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: (string | { label: string; value: string })[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`${inputCls} appearance-none`}>
      <option value="">{placeholder}</option>
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.value;
        const lbl = typeof opt === "string" ? opt : opt.label;
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
  );
}

function CellInput({ value, onChange }: { value: number; onChange: (v: string) => void }) {
  return (
    <input type="number" value={value || ""} onChange={e => onChange(e.target.value)}
      placeholder="0"
      className="w-14 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-center text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100" />
  );
}

function IconStat({ icon: Icon, label, value }: { icon: typeof Package2; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-bold text-blue-900">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TotalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center">
      <p className="text-[10px] font-bold text-blue-900">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">{label}</p>
      <p className="text-xs text-gray-700">{value || <span className="text-gray-400">—</span>}</p>
    </div>
  );
}

function AddrFields({ value, onChange }: { value: Address; onChange: (field: keyof Address, val: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {(["building","street","suburb","city","province","postalCode"] as (keyof Address)[]).map(f => (
        <WField key={f} label={f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g," $1")} required>
          {f === "province"
            ? <WSelect value={value[f]} onChange={v => onChange(f,v)} placeholder="Select province" options={PROVINCES} />
            : <input value={value[f]} onChange={e => onChange(f, e.target.value)} className={inputCls} />
          }
        </WField>
      ))}
    </div>
  );
}
