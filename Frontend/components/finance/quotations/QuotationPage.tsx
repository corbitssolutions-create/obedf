"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Plus, Download, Filter, Search, X, ChevronDown, MoreHorizontal,
  FileSignature, Eye, Pencil, Trash2, Printer, Send, CheckCircle2,
  Clock, AlertCircle, TrendingUp, Calendar, User, MapPin, Building2,
  RefreshCw, Check, XCircle, FileText
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type QuoteStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Expired";

interface QuotationLineItem {
  _id?: string;
  description: string;
  qty: number;
  rate: number;
  taxPct: number;
  discount: number;
  amount?: number;
}

interface Quotation {
  _id: string;
  quoteNo: string;
  customer: string;
  customerAddress: string;
  customerContact: string;
  customerEmail: string;
  route: string;
  issueDate: string;
  validUntil: string;
  rate: number; // Grand total
  subtotal: number;
  taxTotal: number;
  discount: number;
  status: QuoteStatus;
  branch: string;
  createdBy: string;
  lineItems: QuotationLineItem[];
  notes?: string;
}

interface CustomerOption {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/* ─── Status Config ──────────────────────────────────────────────────────── */
const STATUS_CFG: Record<QuoteStatus, { cls: string; dot: string; label: string }> = {
  Approved: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", label: "Approved" },
  Pending:  { cls: "bg-amber-50 text-amber-700 border-amber-100",         dot: "bg-amber-500",    label: "Pending"  },
  Draft:    { cls: "bg-gray-100 text-gray-600 border-gray-200",           dot: "bg-gray-400",     label: "Draft"    },
  Rejected: { cls: "bg-red-50 text-red-700 border-red-100",               dot: "bg-red-500",      label: "Rejected" },
  Expired:  { cls: "bg-purple-50 text-purple-700 border-purple-100",     dot: "bg-purple-500",   label: "Expired font-semibold" },
};

type TabKey = "All" | "Draft" | "Pending" | "Approved" | "Rejected" | "Expired";
const TABS: TabKey[] = ["All", "Draft", "Pending", "Approved", "Rejected", "Expired"];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtCurrency(n: number = 0) {
  return `R ${Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCompact(n: number = 0) {
  const val = Number(n || 0);
  if (val >= 1_000_000) return `R ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `R ${(val / 1_000).toFixed(0)}K`;
  return fmtCurrency(val);
}

function calcLineAmount(item: QuotationLineItem) {
  const sub = Number(item.qty || 0) * Number(item.rate || 0) - Number(item.discount || 0);
  return Math.max(0, sub) * (1 + Number(item.taxPct || 0) / 100);
}

function calcQuotationTotals(items: QuotationLineItem[], overallDiscount: number = 0) {
  const subtotal = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.rate || 0), 0);
  const totalDiscount = items.reduce((s, i) => s + Number(i.discount || 0), 0) + Number(overallDiscount || 0);
  const taxTotal = items.reduce((s, i) => {
    const lineSub = Number(i.qty || 0) * Number(i.rate || 0) - Number(i.discount || 0);
    return s + Math.max(0, lineSub) * (Number(i.taxPct || 0) / 100);
  }, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount) + taxTotal;
  return { subtotal, totalDiscount, taxTotal, grandTotal };
}

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Summary Cards ──────────────────────────────────────────────────────── */
function SummaryCards({ quotes }: { quotes: Quotation[] }) {
  const total          = quotes.length;
  const approved       = quotes.filter((q) => q.status === "Approved");
  const pending        = quotes.filter((q) => q.status === "Pending");
  const totalValue     = quotes.reduce((s, q) => s + (q.rate || 0), 0);

  const cards = [
    { label: "Total Quotations", value: String(total), sub: `${total} proposals`, icon: FileSignature, iconBg: "bg-blue-50", iconColor: "text-blue-600", trend: "+14%" },
    { label: "Approved Quotes",  value: String(approved.length), sub: fmtCompact(approved.reduce((s, q) => s + (q.rate || 0), 0)), icon: CheckCircle2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trend: "+8%" },
    { label: "Pending Approval", value: String(pending.length), sub: fmtCompact(pending.reduce((s, q) => s + (q.rate || 0), 0)), icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600", trend: `${pending.length} quotes` },
    { label: "Total Quoted Value", value: fmtCompact(totalValue), sub: "Across all status", icon: TrendingUp, iconBg: "bg-purple-50", iconColor: "text-purple-600", trend: "+22%" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">{c.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-gray-900 leading-tight tracking-tight">{c.value}</p>
                <p className="mt-1 text-xs text-gray-400">{c.sub}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
                <Icon className={`h-5 w-5 ${c.iconColor}`} strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-xs font-semibold text-gray-400">
              <span>vs last month</span>
              <span className="text-blue-600">{c.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Form Modal ─────────────────────────────────────────────────────────── */
function QuotationFormModal({
  initialData,
  customers,
  onClose,
  onSave,
}: {
  initialData?: Quotation | null;
  customers: CustomerOption[];
  onClose: () => void;
  onSave: (data: Partial<Quotation>, asDraft: boolean) => Promise<void>;
}) {
  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  const [customer, setCustomer]         = useState(initialData?.customer || "");
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || "");
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerContact || "");
  const [customerAddr, setCustomerAddr]   = useState(initialData?.customerAddress || "");
  const [route, setRoute]               = useState(initialData?.route || "JHB - CPT");
  const [issueDate, setIssueDate]       = useState(initialData?.issueDate || new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil]     = useState(initialData?.validUntil || "");
  const [branch, setBranch]             = useState(initialData?.branch || "Johannesburg DC");
  const [notes, setNotes]               = useState(initialData?.notes || "");
  const [lines, setLines]               = useState<QuotationLineItem[]>(
    initialData?.lineItems && initialData.lineItems.length > 0
      ? initialData.lineItems
      : [{ description: "", qty: 1, rate: 0, taxPct: 15, discount: 0 }]
  );
  const [submitting, setSubmitting]     = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");

  const handleSelectCustomer = (name: string) => {
    setCustomer(name);
    const found = customers.find((c) => c.name === name);
    if (found) {
      if (found.email) setCustomerEmail(found.email);
      if (found.phone) setCustomerPhone(found.phone);
      if (found.address) setCustomerAddr(found.address);
    }
  };

  const addLine  = () => setLines((p) => [...p, { description: "", qty: 1, rate: 0, taxPct: 15, discount: 0 }]);
  const removeLine = (i: number) => setLines((p) => p.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof QuotationLineItem, value: string | number) =>
    setLines((p) => p.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const { subtotal, totalDiscount, taxTotal, grandTotal } = calcQuotationTotals(lines);

  const handleSubmit = async (asDraft: boolean) => {
    if (!customer.trim()) {
      setErrorMsg("Please select or enter a customer.");
      return;
    }
    if (lines.length === 0 || !lines[0].description.trim()) {
      setErrorMsg("Please add at least one line item description.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await onSave(
        {
          customer,
          customerAddress: customerAddr,
          customerContact: customerPhone,
          customerEmail,
          route,
          issueDate,
          validUntil: validUntil || issueDate,
          branch,
          notes,
          lineItems: lines,
          rate: grandTotal,
          subtotal,
          taxTotal,
          discount: totalDiscount,
          status: asDraft ? "Draft" : (initialData?.status || "Pending"),
        },
        asDraft
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save quotation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{initialData ? `Edit Quotation (${initialData.quoteNo})` : "Create New Quotation"}</h2>
              <p className="text-xs text-gray-400">Fill in proposal details, rates, and line items</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Customer + Route */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
              <input
                list="quote-cust-list"
                value={customer}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                placeholder="Search or enter customer name..."
                className={inputCls}
              />
              <datalist id="quote-cust-list">
                {customers.map((c) => (
                  <option key={c._id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelCls}>Transport Route / Scope</label>
              <select value={route} onChange={(e) => setRoute(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                {["JHB - CPT", "JHB - DBN", "JHB - PTA", "JHB - PE", "DBN - CPT", "PTA - DBN", "Local Distribution"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Issue Date <span className="text-red-400">*</span></label>
              <input type="text" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} placeholder="YYYY-MM-DD" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Valid Until <span className="text-red-400">*</span></label>
              <input type="text" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} placeholder="YYYY-MM-DD" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Branch</label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className={inputCls}>
                {["Johannesburg DC", "Pretoria DC", "Cape Town DC", "Durban DC", "Head Office"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={`${labelCls} mb-0`}>Quotation Line Items <span className="text-red-400">*</span></label>
              <button onClick={addLine} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                <Plus className="h-3.5 w-3.5" /> Add Line
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
              <div className="hidden sm:grid grid-cols-[1fr_50px_70px_60px_60px_75px_32px] gap-2 bg-gray-50 px-3 py-2 font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                <span>Description</span><span>Qty</span><span>Rate (R)</span><span>Disc(R)</span><span>VAT%</span><span className="text-right">Total</span><span />
              </div>
              <div className="divide-y divide-gray-100">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_50px_70px_60px_60px_75px_32px] gap-2 p-3 sm:items-center">
                    <input value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Service description..." className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-400" />
                    <input type="number" min="1" value={line.qty} onChange={(e) => updateLine(i, "qty", Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400" />
                    <input type="number" min="0" step="0.01" value={line.rate} onChange={(e) => updateLine(i, "rate", Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-right focus:outline-none focus:border-blue-400" />
                    <input type="number" min="0" step="0.01" value={line.discount} onChange={(e) => updateLine(i, "discount", Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-right focus:outline-none focus:border-blue-400" />
                    <input type="number" min="0" max="100" value={line.taxPct} onChange={(e) => updateLine(i, "taxPct", Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-400" />
                    <span className="text-right font-semibold text-gray-800 hidden sm:block">{fmtCurrency(calcLineAmount(line))}</span>
                    <button onClick={() => removeLine(i)} disabled={lines.length === 1} className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:text-red-500 disabled:opacity-30 mx-auto">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-3 ml-auto max-w-[260px] space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmtCurrency(subtotal)}</span></div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium"><span>Discount</span><span>– {fmtCurrency(totalDiscount)}</span></div>
              )}
              <div className="flex justify-between text-gray-600"><span>VAT (15%)</span><span>{fmtCurrency(taxTotal)}</span></div>
              <div className="flex justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 font-bold text-gray-900">
                <span>Quoted Rate</span><span>{fmtCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Special Terms & Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Validity terms, inclusions, fuel clause..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 shrink-0">
          <button onClick={onClose} disabled={submitting} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => handleSubmit(true)} disabled={submitting} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">Save Draft</button>
          <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm">
            <Send className="h-3.5 w-3.5" /> {submitting ? "Saving..." : (initialData ? "Update Quotation" : "Submit Quotation")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function QuotationPage() {
  const [quotes, setQuotes]             = useState<Quotation[]>([]);
  const [customers, setCustomers]       = useState<CustomerOption[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<TabKey>("All");
  const [searchQuery, setSearch]        = useState("");
  const [statusFilter, setStatus]       = useState<"" | QuoteStatus>("");
  const [showCreate, setShowCreate]     = useState(false);
  const [editingQuote, setEditing]      = useState<Quotation | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Quotation[] }>("/api/quotations?limit=200");
      if (res.success && res.data) {
        setQuotes(res.data);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: CustomerOption[] }>("/api/customers/lookup");
      if (res.success && res.data) setCustomers(res.data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
  }, [fetchQuotations, fetchCustomers]);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let r = [...quotes];
    if (activeTab !== "All") r = r.filter((q) => q.status === activeTab);
    if (statusFilter)        r = r.filter((q) => q.status === statusFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) r = r.filter((item) =>
      (item.quoteNo || "").toLowerCase().includes(q) ||
      (item.customer || "").toLowerCase().includes(q) ||
      (item.route || "").toLowerCase().includes(q)
    );
    return r;
  }, [quotes, activeTab, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* ── Actions ── */
  const handleSaveQuotation = async (data: Partial<Quotation>, asDraft: boolean) => {
    if (editingQuote) {
      const res = await apiPut<{ success: boolean; data: Quotation }>(`/api/quotations/${editingQuote._id}`, data);
      if (res.success) {
        showToast("success", `Quotation ${res.data.quoteNo} updated successfully`);
        fetchQuotations();
      }
    } else {
      const res = await apiPost<{ success: boolean; data: Quotation }>("/api/quotations", data);
      if (res.success) {
        showToast("success", `Quotation ${res.data.quoteNo} created successfully`);
        fetchQuotations();
      }
    }
  };

  const handleStatusChange = async (quote: Quotation, newStatus: QuoteStatus) => {
    const res = await apiPut<{ success: boolean; data: Quotation }>(`/api/quotations/${quote._id}`, { status: newStatus });
    if (res.success) {
      showToast("success", `Quotation ${quote.quoteNo} marked as ${newStatus}`);
      fetchQuotations();
      if (selectedQuote && selectedQuote._id === quote._id) setSelectedQuote(res.data);
    }
  };

  const handleDeleteQuotation = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiDelete<{ success: boolean }>(`/api/quotations/${deleteTarget._id}`);
      if (res.success) {
        showToast("success", `Quotation ${deleteTarget.quoteNo} deleted`);
        fetchQuotations();
        setDeleteTarget(null);
        if (selectedQuote && selectedQuote._id === deleteTarget._id) setSelectedQuote(null);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete quotation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-xl ${
          notification.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {notification.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quotation Maintenance</h1>
          <p className="mt-1 text-sm text-gray-500">Manage freight rate quotes, client proposals, and contract agreements</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchQuotations} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => { setEditing(null); setShowCreate(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition"
          >
            <Plus className="h-4 w-4" /> Create New Quote
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SummaryCards quotes={quotes} />
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-5 overflow-x-auto">
          {TABS.map((tab) => {
            const count = tab === "All" ? quotes.length : quotes.filter((q) => q.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`flex items-center gap-2 py-3.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeTab === tab ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search quote no, customer, route..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              {["Draft", "Pending", "Approved", "Rejected", "Expired"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-xs">Loading quotations...</div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">No quotations found matching criteria.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Quote No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 text-right">Quoted Rate</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((q) => (
                  <tr key={q._id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono text-blue-600">{q.quoteNo}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{q.customer}</td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">{q.route || "—"}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">{fmtCurrency(q.rate)}</td>
                    <td className="py-3.5 px-4 text-gray-500">{q.validUntil}</td>
                    <td className="py-3.5 px-4 text-center">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedQuote(q)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          onClick={() => { setEditing(q); setShowCreate(true); }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {paginated.length} of {filtered.length} entries</span>
          <div className="flex gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-gray-200 px-3 py-1 text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-1 font-semibold text-gray-700">
              Page {safePage} of {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-gray-200 px-3 py-1 text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showCreate && (
        <QuotationFormModal
          initialData={editingQuote}
          customers={customers}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSave={handleSaveQuotation}
        />
      )}

      {/* View Drawer */}
      {selectedQuote && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelectedQuote(null)} />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-mono text-base font-bold text-gray-900">{selectedQuote.quoteNo}</h2>
                  <QuoteStatusBadge status={selectedQuote.status} />
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900">{selectedQuote.customer}</p>
                <p className="text-xs text-gray-400 mt-0.5">Route: {selectedQuote.route} · Valid Until: {selectedQuote.validUntil}</p>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="bg-gradient-to-r from-[#060D24] to-[#0B1535] p-5 rounded-xl text-white space-y-2">
                <p className="text-xs text-blue-200 font-medium">TOTAL QUOTED RATE</p>
                <p className="text-2xl font-bold">{fmtCurrency(selectedQuote.rate)}</p>
                <p className="text-xs text-blue-200">Issue Date: {selectedQuote.issueDate}</p>
              </div>

              <div className="border rounded-lg overflow-hidden border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {(selectedQuote.lineItems || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-medium text-gray-900">{item.description}</td>
                        <td className="py-2.5 px-3 text-center">{item.qty}</td>
                        <td className="py-2.5 px-3 text-right">{fmtCurrency(item.rate)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{fmtCurrency(calcLineAmount(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedQuote.notes && (
                <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-gray-700">
                  <p className="font-semibold text-blue-900 mb-0.5">Special Terms & Notes:</p>
                  <p className="leading-relaxed">{selectedQuote.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50">
              <div className="flex gap-1.5">
                {(["Draft", "Pending", "Approved", "Rejected"] as QuoteStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedQuote, st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      selectedQuote.status === st ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setEditing(selectedQuote); setSelectedQuote(null); setShowCreate(true); }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Delete Quotation</h3>
                <p className="text-xs text-gray-500">{deleteTarget.quoteNo}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">Are you sure you want to delete this quotation? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuotation}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
