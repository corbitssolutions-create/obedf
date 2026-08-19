"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Plus, Download, Filter, Search, X, ChevronDown, MoreHorizontal,
  FileText, Eye, Pencil, Printer, Send, CheckCircle2, Clock, AlertCircle,
  TrendingUp, TrendingDown, DollarSign, Calendar,
  User, Building2, Trash2, RotateCcw,
  XCircle, RefreshCw, Check
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Partially Paid" | "Overdue" | "Cancelled";

interface InvoiceLineItem {
  _id?: string;
  description: string;
  qty: number;
  rate: number;
  taxPct: number;
  amount?: number;
}

interface PaymentRecord {
  _id?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  recordedBy?: string;
}

interface Invoice {
  _id: string;
  invoiceNo: string;
  customer: string;
  customerAddress: string;
  customerContact: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  subtotal: number;
  taxTotal: number;
  balance: number;
  status: InvoiceStatus;
  branch: string;
  createdBy: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  paymentTerms: string;
  payments?: PaymentRecord[];
}

interface CustomerOption {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CFG: Record<InvoiceStatus, { cls: string; dot: string; label: string }> = {
  Draft:          { cls: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400",     label: "Draft"          },
  Sent:           { cls: "bg-blue-50 text-blue-700 border-blue-100",          dot: "bg-blue-500",     label: "Sent"           },
  Paid:           { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500",  label: "Paid"           },
  "Partially Paid":{ cls: "bg-purple-50 text-purple-700 border-purple-100",   dot: "bg-purple-500",   label: "Partially Paid" },
  Overdue:        { cls: "bg-red-50 text-red-700 border-red-100",             dot: "bg-red-500",      label: "Overdue"        },
  Cancelled:      { cls: "bg-gray-100 text-gray-500 border-gray-200",         dot: "bg-gray-300",     label: "Cancelled"      },
};

type TabKey = "All" | "Draft" | "Sent" | "Paid" | "Partially Paid" | "Overdue" | "Cancelled";
const TABS: TabKey[] = ["All", "Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Cancelled"];

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

function calcLineTotal(item: InvoiceLineItem) {
  const sub = Number(item.qty || 0) * Number(item.rate || 0);
  return sub + sub * (Number(item.taxPct || 0) / 100);
}

function calcInvoiceTotals(items: InvoiceLineItem[]) {
  const subtotal = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.rate || 0), 0);
  const tax      = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.rate || 0) * (Number(i.taxPct || 0) / 100), 0);
  const total    = subtotal + tax;
  return { subtotal, tax, total };
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Summary Cards ──────────────────────────────────────────────────────── */
function SummaryCards({ invoices }: { invoices: Invoice[] }) {
  const totalInvoiced  = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const totalPaid      = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0)
                       + invoices.filter((i) => i.status === "Partially Paid").reduce((s, i) => s + ((i.amount || 0) - (i.balance || 0)), 0);
  const outstanding    = invoices.filter((i) => i.status !== "Paid" && i.status !== "Cancelled").reduce((s, i) => s + (i.balance || 0), 0);
  const overdue        = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + (i.balance || 0), 0);

  const cards = [
    { label: "Total Invoiced",    value: fmtCompact(totalInvoiced), sub: `${invoices.length} invoices`,       icon: FileText,      iconBg: "bg-blue-50",    iconColor: "text-blue-600",    trend: "+18%", up: true  },
    { label: "Paid",              value: fmtCompact(totalPaid),     sub: "Collected to date",                 icon: CheckCircle2,  iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trend: "+11%", up: true  },
    { label: "Outstanding",       value: fmtCompact(outstanding),   sub: "Awaiting payment",                  icon: Clock,         iconBg: "bg-amber-50",   iconColor: "text-amber-600",   trend: `${invoices.filter((i) => (i.balance || 0) > 0 && i.status !== "Cancelled").length} invoices`, up: false },
    { label: "Overdue",           value: fmtCompact(overdue),       sub: "Past due date",                     icon: AlertCircle,   iconBg: "bg-red-50",     iconColor: "text-red-500",     trend: `${invoices.filter((i) => i.status === "Overdue").length} invoices`, up: false },
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
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
              <span className="text-xs text-gray-400">vs last month</span>
              <span className={`flex items-center gap-1 text-xs font-semibold ${c.up ? "text-emerald-600" : "text-orange-600"}`}>
                {c.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {c.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Create / Edit Invoice Modal ───────────────────────────────────────── */
function InvoiceFormModal({
  initialData,
  customers,
  onClose,
  onSave,
}: {
  initialData?: Invoice | null;
  customers: CustomerOption[];
  onClose: () => void;
  onSave: (inv: Partial<Invoice>, isDraft: boolean) => Promise<void>;
}) {
  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  const [customer, setCustomer]         = useState(initialData?.customer || "");
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || "");
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerContact || "");
  const [customerAddr, setCustomerAddr]   = useState(initialData?.customerAddress || "");
  const [issueDate, setIssueDate]       = useState(initialData?.issueDate || new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate]           = useState(initialData?.dueDate || "");
  const [terms, setTerms]               = useState(initialData?.paymentTerms || "Net 14 Days");
  const [branch, setBranch]             = useState(initialData?.branch || "Johannesburg DC");
  const [notes, setNotes]               = useState(initialData?.notes || "");
  const [lines, setLines]               = useState<InvoiceLineItem[]>(
    initialData?.lineItems && initialData.lineItems.length > 0
      ? initialData.lineItems
      : [{ description: "", qty: 1, rate: 0, taxPct: 15 }]
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

  const addLine  = () => setLines((p) => [...p, { description: "", qty: 1, rate: 0, taxPct: 15 }]);
  const removeLine = (i: number) => setLines((p) => p.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof InvoiceLineItem, value: string | number) =>
    setLines((p) => p.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const { subtotal, tax, total } = calcInvoiceTotals(lines);

  const handleSubmit = async (asDraft: boolean) => {
    if (!customer.trim()) {
      setErrorMsg("Please select or enter a customer name.");
      return;
    }
    if (lines.length === 0 || !lines[0].description.trim()) {
      setErrorMsg("Please add at least one valid line item description.");
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
          issueDate,
          dueDate: dueDate || issueDate,
          paymentTerms: terms,
          branch,
          notes,
          lineItems: lines,
          amount: total,
          subtotal,
          taxTotal: tax,
          status: asDraft ? "Draft" : (initialData?.status || "Sent"),
        },
        asDraft
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save invoice");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{initialData ? `Edit Invoice (${initialData.invoiceNo})` : "Create Invoice"}</h2>
              <p className="text-xs text-gray-400">Fill in customer and line item details</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Customer + Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  list="customer-list"
                  value={customer}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  placeholder="Search or select customer..."
                  className={`${inputCls} pl-9`}
                />
                <datalist id="customer-list">
                  {customers.map((c) => (
                    <option key={c._id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className={labelCls}>Issue Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} placeholder="YYYY-MM-DD or DD Mon YYYY" className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Due Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="YYYY-MM-DD or DD Mon YYYY" className={`${inputCls} pl-9`} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Payment Terms</label>
              <div className="relative">
                <select value={terms} onChange={(e) => setTerms(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                  {["Net 7 Days","Net 14 Days","Net 30 Days","COD","Prepaid"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Branch</label>
              <div className="relative">
                <select value={branch} onChange={(e) => setBranch(e.target.value)} className={`${inputCls} appearance-none pr-8`}>
                  {["Johannesburg DC","Pretoria DC","Cape Town DC","Durban DC","Head Office"].map((b) => <option key={b}>{b}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={`${labelCls} mb-0`}>Line Items <span className="text-red-400">*</span></label>
              <button onClick={addLine} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                <Plus className="h-3.5 w-3.5" /> Add Line
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="hidden grid-cols-[1fr_60px_80px_60px_80px_32px] gap-2 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                <span>Description</span><span>Qty</span><span>Rate (R)</span><span>VAT%</span><span className="text-right">Amount</span><span />
              </div>
              <div className="divide-y divide-gray-100">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_60px_80px_60px_80px_32px] sm:items-center">
                    <input value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Description..." className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                    <input type="number" min="1" value={line.qty} onChange={(e) => updateLine(i, "qty", Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                    <input type="number" min="0" step="0.01" value={line.rate} onChange={(e) => updateLine(i, "rate", Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                    <input type="number" min="0" max="100" value={line.taxPct} onChange={(e) => updateLine(i, "taxPct", Number(e.target.value))} className="w-full rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                    <span className="text-right text-sm font-semibold text-gray-800 sm:block hidden">{fmtCurrency(calcLineTotal(line))}</span>
                    <button onClick={() => removeLine(i)} disabled={lines.length === 1} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed mx-auto">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* Totals */}
            <div className="mt-3 ml-auto max-w-[280px] space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span className="font-medium">{fmtCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>VAT (15%)</span><span className="font-medium">{fmtCurrency(tax)}</span></div>
              <div className="flex justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900"><span>Total</span><span>{fmtCurrency(total)}</span></div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes / Instructions</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Payment reference, banking details, special instructions..." className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 shrink-0">
          <button onClick={onClose} disabled={submitting} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={() => handleSubmit(true)} disabled={submitting} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            {submitting ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={() => handleSubmit(false)} disabled={submitting} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition">
            <Send className="h-4 w-4" /> {submitting ? "Processing..." : (initialData ? "Update Invoice" : "Create Invoice")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Record Payment Modal ───────────────────────────────────────────────── */
function RecordPaymentModal({
  invoice,
  onClose,
  onRecord,
}: {
  invoice: Invoice;
  onClose: () => void;
  onRecord: (amount: number, method: string, ref: string, notes: string) => Promise<void>;
}) {
  const [amount, setAmount]       = useState(String(invoice.balance || invoice.amount || 0));
  const [method, setMethod]       = useState("EFT");
  const [ref, setRef]             = useState("");
  const [notes, setNotes]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pVal = Number(amount);
    if (isNaN(pVal) || pVal <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than zero.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");
      await onRecord(pVal, method, ref, notes);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Record Payment</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500">Invoice: <span className="font-bold text-gray-800">{invoice.invoiceNo}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">Remaining Balance: <span className="font-bold text-emerald-600">{fmtCurrency(invoice.balance)}</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (R) <span className="text-red-400">*</span></label>
            <input
              type="number"
              step="0.01"
              max={invoice.balance || invoice.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
            >
              {["EFT", "Credit Card", "Cash", "Cheque", "Direct Deposit"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Reference</label>
            <input
              type="text"
              placeholder="e.g. EFT-992011"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional payment notes..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
            >
              {submitting ? "Recording..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Invoice Preview Drawer ─────────────────────────────────────────────── */
function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const { subtotal, tax, total } = calcInvoiceTotals(invoice.lineItems || []);
  const paid = (invoice.amount || 0) - (invoice.balance || 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-[#060D24] to-[#0B1535] px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">TAX INVOICE</h2>
            <p className="text-xs text-blue-200 mt-0.5">{invoice.invoiceNo}</p>
          </div>
          <div className="text-right">
            <InvoiceStatusBadge status={invoice.status} />
            <p className="text-xs text-blue-200 mt-2">Issue Date: {invoice.issueDate}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Billed To</p>
            <p className="font-bold text-gray-900 text-sm mt-1">{invoice.customer}</p>
            <p className="text-gray-500 mt-0.5">{invoice.customerAddress || "No address specified"}</p>
            <p className="text-gray-500">{invoice.customerContact || ""}</p>
            <p className="text-gray-500">{invoice.customerEmail || ""}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Invoice Details</p>
            <p className="text-gray-600 mt-1">Due Date: <span className="font-semibold text-gray-800">{invoice.dueDate}</span></p>
            <p className="text-gray-600">Terms: <span className="font-semibold text-gray-800">{invoice.paymentTerms}</span></p>
            <p className="text-gray-600">Branch: <span className="font-semibold text-gray-800">{invoice.branch}</span></p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-center">VAT%</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {(invoice.lineItems || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 font-medium text-gray-900">{item.description}</td>
                  <td className="py-2.5 px-3 text-center">{item.qty}</td>
                  <td className="py-2.5 px-3 text-right">{fmtCurrency(item.rate)}</td>
                  <td className="py-2.5 px-3 text-center">{item.taxPct}%</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{fmtCurrency(calcLineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmtCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>VAT (15%)</span><span>{fmtCurrency(tax)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-sm border-t pt-1.5 border-gray-200">
              <span>Grand Total</span><span>{fmtCurrency(invoice.amount)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium"><span>Amount Paid</span><span>– {fmtCurrency(paid)}</span></div>
            )}
            <div className="flex justify-between rounded-lg bg-blue-600 px-3 py-2 text-white font-bold">
              <span>Balance Due</span><span>{fmtCurrency(invoice.balance)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3 text-xs text-amber-800">
            <p className="font-semibold text-amber-900 mb-0.5">Notes & Instructions:</p>
            <p className="leading-relaxed">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Details Drawer ─────────────────────────────────────────────────────── */
function InvoiceDetailsDrawer({
  invoice,
  onClose,
  onEdit,
  onRecordPayment,
  onStatusChange,
}: {
  invoice: Invoice;
  onClose: () => void;
  onEdit: () => void;
  onRecordPayment: () => void;
  onStatusChange: (status: InvoiceStatus) => Promise<void>;
}) {
  const [tab, setTab] = useState<"preview" | "activity">("preview");
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-mono text-base font-bold text-gray-900">{invoice.invoiceNo}</h2>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500 font-medium">{invoice.customer}</p>
            <p className="mt-0.5 text-xs text-gray-400">Due: {invoice.dueDate} · {invoice.paymentTerms}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition shrink-0">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-3 shrink-0 bg-gray-50/50">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <div className="relative ml-auto">
            <button onClick={() => setMoreOpen(!moreOpen)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
              <MoreHorizontal className="h-3.5 w-3.5" /> Change Status
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-xl py-1.5 text-xs">
                  {(["Draft", "Sent", "Paid", "Overdue", "Cancelled"] as InvoiceStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => { onStatusChange(st); setMoreOpen(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Check className={`h-3.5 w-3.5 ${invoice.status === st ? "text-blue-600" : "text-transparent"}`} /> Mark as {st}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {(["preview", "activity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-all ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "preview" ? "Invoice Preview" : "Payments & Activity"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === "preview" ? (
            <InvoicePreview invoice={invoice} />
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">Invoice Total</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{fmtCurrency(invoice.amount)}</p>
                </div>
                <div className={`rounded-xl border p-4 ${invoice.balance > 0 ? "bg-amber-50/50 border-amber-100" : "bg-emerald-50/50 border-emerald-100"}`}>
                  <p className="text-xs font-medium text-gray-500">Balance Due</p>
                  <p className={`mt-1 text-xl font-bold ${invoice.balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>{fmtCurrency(invoice.balance)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Payment History</h3>
                {invoice.payments && invoice.payments.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Ref</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoice.payments.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-gray-700">{new Date(p.paymentDate).toLocaleDateString()}</td>
                            <td className="py-2 px-3 text-gray-700">{p.paymentMethod}</td>
                            <td className="py-2 px-3 text-gray-500">{p.reference || "—"}</td>
                            <td className="py-2 px-3 text-right font-semibold text-emerald-700">{fmtCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No payments recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {invoice.status !== "Paid" && invoice.status !== "Cancelled" && (
          <div className="flex items-center gap-2.5 border-t border-gray-100 px-6 py-4 shrink-0 bg-gray-50/50">
            <button onClick={onEdit} className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              Edit Invoice
            </button>
            <button onClick={onRecordPayment} className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm">
              Record Payment
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function InvoicesPage() {
  const [invoices, setInvoices]         = useState<Invoice[]>([]);
  const [customers, setCustomers]       = useState<CustomerOption[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<TabKey>("All");
  const [searchQuery, setSearch]        = useState("");
  const [statusFilter, setStatus]       = useState<"" | InvoiceStatus>("");
  const [showCreate, setShowCreate]     = useState(false);
  const [editingInvoice, setEditing]    = useState<Invoice | null>(null);
  const [payingInvoice, setPaying]      = useState<Invoice | null>(null);
  const [selectedInvoice, setSelected]  = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget]= useState<Invoice | null>(null);
  const [notification, setNotification]= useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Invoice[] }>("/api/invoices?limit=200");
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data: CustomerOption[] }>("/api/customers/lookup");
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (e) {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [fetchInvoices, fetchCustomers]);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let r = [...invoices];
    if (activeTab !== "All") r = r.filter((i) => i.status === activeTab);
    if (statusFilter)        r = r.filter((i) => i.status === statusFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) r = r.filter((i) =>
      (i.invoiceNo || "").toLowerCase().includes(q) ||
      (i.customer || "").toLowerCase().includes(q) ||
      (i.branch || "").toLowerCase().includes(q)
    );
    return r;
  }, [invoices, activeTab, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* ── API Actions ── */
  const handleSaveInvoice = async (data: Partial<Invoice>, isDraft: boolean) => {
    if (editingInvoice) {
      const res = await apiPut<{ success: boolean; data: Invoice }>(`/api/invoices/${editingInvoice._id}`, data);
      if (res.success) {
        showToast("success", `Invoice ${res.data.invoiceNo} updated successfully`);
        fetchInvoices();
      }
    } else {
      const res = await apiPost<{ success: boolean; data: Invoice }>("/api/invoices", data);
      if (res.success) {
        showToast("success", `Invoice ${res.data.invoiceNo} created successfully`);
        fetchInvoices();
      }
    }
  };

  const handleRecordPayment = async (amount: number, method: string, reference: string, notes: string) => {
    if (!payingInvoice) return;
    const res = await apiPost<{ success: boolean; data: Invoice }>(`/api/invoices/${payingInvoice._id}/payment`, {
      amount,
      paymentMethod: method,
      reference,
      notes,
    });
    if (res.success) {
      showToast("success", `Payment of ${fmtCurrency(amount)} recorded for ${res.data.invoiceNo}`);
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === payingInvoice._id) {
        setSelected(res.data);
      }
    }
  };

  const handleStatusChange = async (inv: Invoice, newStatus: InvoiceStatus) => {
    const res = await apiPut<{ success: boolean; data: Invoice }>(`/api/invoices/${inv._id}`, { status: newStatus });
    if (res.success) {
      showToast("success", `Invoice ${inv.invoiceNo} marked as ${newStatus}`);
      fetchInvoices();
      if (selectedInvoice && selectedInvoice._id === inv._id) {
        setSelected(res.data);
      }
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiDelete<{ success: boolean }>(`/api/invoices/${deleteTarget._id}`);
      if (res.success) {
        showToast("success", `Invoice ${deleteTarget.invoiceNo} deleted`);
        fetchInvoices();
        setDeleteTarget(null);
        if (selectedInvoice && selectedInvoice._id === deleteTarget._id) {
          setSelected(null);
        }
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete invoice");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      {/* Toast Notification */}
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage, generate and track client invoice statements</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchInvoices} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => { setEditing(null); setShowCreate(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition"
          >
            <Plus className="h-4 w-4" /> Generate Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SummaryCards invoices={invoices} />
      </div>

      {/* Tabs & Table Section */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tab list */}
        <div className="flex border-b border-gray-200 px-5 overflow-x-auto">
          {TABS.map((tab) => {
            const count = tab === "All" ? invoices.length : invoices.filter((i) => i.status === tab).length;
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

        {/* Controls Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full sm:w-auto min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search invoice number, customer, branch..."
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
              {["Draft","Sent","Paid","Partially Paid","Overdue","Cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-xs">Loading invoice records...</div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">No invoices found matching criteria.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((inv) => (
                  <tr key={inv._id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono text-blue-600">{inv.invoiceNo}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{inv.customer}</td>
                    <td className="py-3.5 px-4 text-gray-500">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-gray-500">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900">{fmtCurrency(inv.amount)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">{fmtCurrency(inv.balance)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(inv)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          onClick={() => { setEditing(inv); setShowCreate(true); }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        {inv.status !== "Paid" && (
                          <button
                            onClick={() => setPaying(inv)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            <DollarSign className="h-3.5 w-3.5" /> Pay
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(inv)}
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

      {/* Modals & Drawers */}
      {showCreate && (
        <InvoiceFormModal
          initialData={editingInvoice}
          customers={customers}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSave={handleSaveInvoice}
        />
      )}

      {payingInvoice && (
        <RecordPaymentModal
          invoice={payingInvoice}
          onClose={() => setPaying(null)}
          onRecord={handleRecordPayment}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailsDrawer
          invoice={selectedInvoice}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selectedInvoice); setShowCreate(true); }}
          onRecordPayment={() => setPaying(selectedInvoice)}
          onStatusChange={(st) => handleStatusChange(selectedInvoice, st)}
        />
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
                <h3 className="font-bold text-gray-900 text-base">Delete Invoice</h3>
                <p className="text-xs text-gray-500">{deleteTarget.invoiceNo}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">Are you sure you want to delete this invoice? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInvoice}
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
