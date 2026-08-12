"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Plus, Download, Filter, Search, X, ChevronDown, MoreHorizontal,
  FileText, Eye, Pencil, Printer, Send, CheckCircle2, Clock, AlertCircle,
  ChevronRight, TrendingUp, TrendingDown, DollarSign, Calendar,
  User, Building2, Hash, RefreshCw, XCircle, RotateCcw, Package,
  Truck, AlignLeft, MapPin, Phone, Mail, ArrowLeft,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Partially Paid" | "Overdue" | "Cancelled";

interface InvoiceLineItem {
  description: string;
  qty: number;
  rate: number;
  taxPct: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  customer: string;
  customerAddress: string;
  customerContact: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  balance: number;
  status: InvoiceStatus;
  branch: string;
  createdBy: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  paymentTerms: string;
}

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const MOCK_INVOICES: Invoice[] = [
  {
    id: "1", invoiceNo: "INV-2026-00891", customer: "Build It Centurion",
    customerAddress: "123 Centurion Drive, Centurion, 0157", customerContact: "+27 12 643 2100",
    customerEmail: "accounts@buildit-centurion.co.za", issueDate: "29 Jul 2026", dueDate: "12 Aug 2026",
    amount: 42500, balance: 42500, status: "Sent", branch: "Pretoria DC",
    createdBy: "Admin User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Delivery Service — JHB to Centurion", qty: 5, rate: 2500, taxPct: 15 },
      { description: "Freight Charges — Bulk Pallet Load", qty: 1, rate: 8500, taxPct: 15 },
      { description: "Handling & Packaging", qty: 3, rate: 1200, taxPct: 15 },
    ],
    notes: "Please quote invoice number on all EFT payments.",
  },
  {
    id: "2", invoiceNo: "INV-2026-00890", customer: "Takealot Midrand",
    customerAddress: "45 Allandale Road, Midrand, 1685", customerContact: "+27 10 249 5000",
    customerEmail: "finance@takealot.com", issueDate: "28 Jul 2026", dueDate: "11 Aug 2026",
    amount: 28400, balance: 0, status: "Paid", branch: "Johannesburg DC",
    createdBy: "Finance User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Delivery Service — JHB Distribution Run", qty: 8, rate: 1800, taxPct: 15 },
      { description: "Fuel Surcharge", qty: 1, rate: 3500, taxPct: 15 },
      { description: "After-Hours Delivery Premium", qty: 2, rate: 1850, taxPct: 15 },
    ],
  },
  {
    id: "3", invoiceNo: "INV-2026-00889", customer: "Pretoria CBD Store",
    customerAddress: "78 Church Street, Pretoria CBD, 0002", customerContact: "+27 12 323 4567",
    customerEmail: "admin@pretoriacbd.co.za", issueDate: "27 Jul 2026", dueDate: "10 Aug 2026",
    amount: 18750, balance: 6250, status: "Partially Paid", branch: "Pretoria DC",
    createdBy: "Admin User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Delivery Service — CBD Express", qty: 3, rate: 2200, taxPct: 15 },
      { description: "Overnight Storage Fee", qty: 5, rate: 850, taxPct: 15 },
      { description: "Same-Day Delivery Surcharge", qty: 2, rate: 1400, taxPct: 15 },
    ],
    notes: "Partial payment of R12,500.00 received on 05 Aug 2026.",
  },
  {
    id: "4", invoiceNo: "INV-2026-00888", customer: "Westgate Mall",
    customerAddress: "Hendrik Potgieter Street, Roodepoort, 1724", customerContact: "+27 11 475 3200",
    customerEmail: "finance@westgatemall.co.za", issueDate: "25 Jul 2026", dueDate: "08 Aug 2026",
    amount: 31200, balance: 31200, status: "Overdue", branch: "Johannesburg DC",
    createdBy: "Finance User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Delivery Service — West Rand Route", qty: 6, rate: 2800, taxPct: 15 },
      { description: "Tail-Lift Vehicle Surcharge", qty: 1, rate: 4200, taxPct: 15 },
      { description: "Re-Delivery Fee", qty: 1, rate: 600, taxPct: 15 },
    ],
    notes: "Payment overdue. Third payment reminder sent on 10 Aug 2026.",
  },
  {
    id: "5", invoiceNo: "INV-2026-00887", customer: "Makro Silverton",
    customerAddress: "45 Silverton Road, Pretoria East, 0184", customerContact: "+27 12 804 5000",
    customerEmail: "accounts@makro.co.za", issueDate: "24 Jul 2026", dueDate: "07 Aug 2026",
    amount: 55800, balance: 0, status: "Paid", branch: "Pretoria DC",
    createdBy: "Admin User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Bulk Freight — Full Truck Load", qty: 1, rate: 32000, taxPct: 15 },
      { description: "Offloading Labour", qty: 4, rate: 1200, taxPct: 15 },
      { description: "Waiting Time (per hour)", qty: 3, rate: 850, taxPct: 15 },
      { description: "Fuel Surcharge — Long Haul", qty: 1, rate: 4750, taxPct: 15 },
    ],
  },
  {
    id: "6", invoiceNo: "INV-2026-00886", customer: "Clicks Hatfield",
    customerAddress: "Burnett Street, Hatfield, Pretoria, 0083", customerContact: "+27 12 362 8800",
    customerEmail: "logistics@clicks.co.za", issueDate: "22 Jul 2026", dueDate: "05 Aug 2026",
    amount: 9600, balance: 9600, status: "Draft", branch: "Pretoria DC",
    createdBy: "Finance User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Delivery Service — Hatfield Area", qty: 4, rate: 1400, taxPct: 15 },
      { description: "Cold-Chain Surcharge", qty: 1, rate: 4000, taxPct: 15 },
    ],
    notes: "Draft — awaiting approval before sending.",
  },
  {
    id: "7", invoiceNo: "INV-2026-00885", customer: "Spar Arcadia",
    customerAddress: "Park Street, Arcadia, Pretoria, 0083", customerContact: "+27 12 344 5500",
    customerEmail: "admin@spar-arcadia.co.za", issueDate: "20 Jul 2026", dueDate: "03 Aug 2026",
    amount: 14200, balance: 0, status: "Paid", branch: "Pretoria DC",
    createdBy: "Admin User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Delivery Service — Arcadia Route", qty: 3, rate: 2100, taxPct: 15 },
      { description: "Refrigerated Transport Surcharge", qty: 1, rate: 6800, taxPct: 15 },
      { description: "Documentation Fee", qty: 1, rate: 1100, taxPct: 15 },
    ],
  },
  {
    id: "8", invoiceNo: "INV-2026-00884", customer: "Woolworths Menlyn",
    customerAddress: "Lois Avenue & Atterbury Road, Menlyn, 0181", customerContact: "+27 12 348 7700",
    customerEmail: "finance@woolworths.co.za", issueDate: "18 Jul 2026", dueDate: "01 Aug 2026",
    amount: 22100, balance: 22100, status: "Overdue", branch: "Pretoria DC",
    createdBy: "Finance User", paymentTerms: "Net 14 Days",
    lineItems: [
      { description: "Premium Delivery Service", qty: 7, rate: 1900, taxPct: 15 },
      { description: "Priority Lane Surcharge", qty: 1, rate: 3400, taxPct: 15 },
      { description: "Insurance Rider", qty: 7, rate: 100, taxPct: 15 },
    ],
    notes: "OVERDUE — escalate to collections.",
  },
];

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
function fmtCurrency(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCompact(n: number) {
  if (n >= 1_000_000) return `R ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `R ${(n / 1_000).toFixed(0)}K`;
  return fmtCurrency(n);
}

function calcLineTotal(item: InvoiceLineItem) {
  const sub = item.qty * item.rate;
  return sub + sub * (item.taxPct / 100);
}

function calcInvoiceTotals(items: InvoiceLineItem[]) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const tax      = items.reduce((s, i) => s + i.qty * i.rate * (i.taxPct / 100), 0);
  const total    = subtotal + tax;
  return { subtotal, tax, total };
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Summary Cards ──────────────────────────────────────────────────────── */
function SummaryCards({ invoices }: { invoices: Invoice[] }) {
  const totalInvoiced  = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid      = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0)
                       + invoices.filter((i) => i.status === "Partially Paid").reduce((s, i) => s + (i.amount - i.balance), 0);
  const outstanding    = invoices.filter((i) => i.status !== "Paid" && i.status !== "Cancelled").reduce((s, i) => s + i.balance, 0);
  const overdue        = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.balance, 0);

  const cards = [
    { label: "Total Invoiced",    value: fmtCompact(totalInvoiced), sub: `${invoices.length} invoices`,       icon: FileText,      iconBg: "bg-blue-50",    iconColor: "text-blue-600",    trend: "+18%", up: true  },
    { label: "Paid",              value: fmtCompact(totalPaid),     sub: "Collected to date",                 icon: CheckCircle2,  iconBg: "bg-emerald-50", iconColor: "text-emerald-600", trend: "+11%", up: true  },
    { label: "Outstanding",       value: fmtCompact(outstanding),   sub: "Awaiting payment",                  icon: Clock,         iconBg: "bg-amber-50",   iconColor: "text-amber-600",   trend: `${invoices.filter((i) => i.balance > 0 && i.status !== "Cancelled").length} invoices`, up: false },
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

/* ─── Create Invoice Modal ───────────────────────────────────────────────── */
function CreateInvoiceModal({ onClose, onSave }: { onClose: () => void; onSave: (inv: Partial<Invoice>) => void }) {
  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  const [customer, setCustomer]   = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate,   setDueDate]   = useState("");
  const [terms,     setTerms]     = useState("Net 14 Days");
  const [notes,     setNotes]     = useState("");
  const [lines, setLines] = useState<InvoiceLineItem[]>([
    { description: "", qty: 1, rate: 0, taxPct: 15 },
  ]);

  const addLine  = () => setLines((p) => [...p, { description: "", qty: 1, rate: 0, taxPct: 15 }]);
  const removeLine = (i: number) => setLines((p) => p.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof InvoiceLineItem, value: string | number) =>
    setLines((p) => p.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const { subtotal, tax, total } = calcInvoiceTotals(lines);

  const handleSubmit = (asDraft: boolean) => {
    const padded = String(Math.floor(Math.random() * 90000 + 10000)).padStart(5, "0");
    onSave({
      invoiceNo: `INV-2026-${padded}`,
      customer,
      customerAddress: "—",
      customerContact: "—",
      customerEmail: "—",
      issueDate: new Date(issueDate).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
      dueDate: dueDate ? new Date(dueDate).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—",
      amount: total,
      balance: total,
      status: asDraft ? "Draft" : "Sent",
      branch: "Johannesburg DC",
      createdBy: "Admin User",
      lineItems: lines,
      notes,
      paymentTerms: terms,
    });
    onClose();
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
              <h2 className="text-base font-bold text-gray-900">Create Invoice</h2>
              <p className="text-xs text-gray-400">Fill in customer and line item details</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Customer + Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Search or enter customer name..." className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Issue Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Due Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${inputCls} pl-9`} />
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
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={() => handleSubmit(true)} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Save Draft</button>
          <button onClick={() => handleSubmit(false)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition">
            <Send className="h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Invoice Preview (inside drawer) ───────────────────────────────────── */
function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const { subtotal, tax, total } = calcInvoiceTotals(invoice.lineItems);
  const paid = invoice.amount - invoice.balance;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Invoice Header */}
      <div className="bg-gradient-to-r from-[#060D24] to-[#0B1535] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-1">FreightFlow</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              123 Logistics Park, Johannesburg<br />
              Gauteng, 2000 · South Africa<br />
              +27 11 000 0000 · info@freightflow.co.za
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white tracking-tight">INVOICE</p>
            <p className="mt-1 font-mono text-sm font-semibold text-blue-300">{invoice.invoiceNo}</p>
            <div className="mt-2 space-y-0.5 text-xs text-slate-400">
              <p>Issue: <span className="text-slate-200 font-medium">{invoice.issueDate}</span></p>
              <p>Due:   <span className={`font-semibold ${invoice.status === "Overdue" ? "text-red-300" : "text-slate-200"}`}>{invoice.dueDate}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
        <p className="font-bold text-gray-900">{invoice.customer}</p>
        <p className="text-sm text-gray-500 mt-0.5">{invoice.customerAddress}</p>
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{invoice.customerContact}</span>
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{invoice.customerEmail}</span>
        </div>
      </div>

      {/* Line Items table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Description</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Qty</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Rate</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">VAT</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.lineItems.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50/40 transition-colors">
                <td className="px-5 py-3.5 text-gray-800">{item.description}</td>
                <td className="px-3 py-3.5 text-center text-gray-600">{item.qty}</td>
                <td className="px-3 py-3.5 text-right text-gray-600">{fmtCurrency(item.rate)}</td>
                <td className="px-3 py-3.5 text-center text-gray-500">{item.taxPct}%</td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{fmtCurrency(calcLineTotal(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-5 py-4 border-t border-gray-100">
        <div className="ml-auto max-w-[260px] space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium">{fmtCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>VAT (15%)</span>
            <span className="font-medium">{fmtCurrency(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold text-gray-800">
            <span>Total</span>
            <span>{fmtCurrency(total)}</span>
          </div>
          {paid > 0 && (
            <div className="flex justify-between text-sm text-emerald-700">
              <span>Paid</span>
              <span className="font-semibold">– {fmtCurrency(paid)}</span>
            </div>
          )}
          <div className="flex justify-between rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">
            <span>Balance Due</span>
            <span className="text-base">{fmtCurrency(invoice.balance)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/40">
          <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
          <p className="text-xs text-gray-600 leading-relaxed">{invoice.notes}</p>
        </div>
      )}

      {/* Footer strip */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
        <p className="text-xs text-center text-gray-400">
          Payment terms: <span className="font-semibold text-gray-600">{invoice.paymentTerms}</span> · Thank you for your business.
        </p>
      </div>
    </div>
  );
}

/* ─── Activity Timeline ──────────────────────────────────────────────────── */
function ActivityTimeline({ invoice }: { invoice: Invoice }) {
  const isSent    = ["Sent","Paid","Partially Paid","Overdue"].includes(invoice.status);
  const isPaid    = ["Paid","Partially Paid"].includes(invoice.status);
  const isOverdue = invoice.status === "Overdue";

  const steps = [
    { label: "Invoice Created",   date: invoice.issueDate,             done: true,     icon: FileText      },
    { label: "Invoice Sent",      date: isSent ? invoice.issueDate : undefined,
      done: isSent,                                                                     icon: Send          },
    { label: "Payment Reminder",  date: isOverdue ? `${invoice.dueDate} (Overdue)` : undefined,
      done: isOverdue,                                                                  icon: AlertCircle   },
    { label: "Payment Received",  date: isPaid ? invoice.dueDate : undefined,
      done: isPaid,                                                                     icon: CheckCircle2  },
  ];

  return (
    <div className="relative ml-3.5">
      <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-100" />
      <div className="space-y-5">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="relative flex items-start gap-4 pl-7">
              <div className={`absolute left-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${step.done ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
                <Icon className={`h-3 w-3 ${step.done ? "text-blue-600" : "text-gray-300"}`} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-semibold ${step.done ? (step.label === "Payment Reminder" ? "text-red-600" : "text-gray-900") : "text-gray-400"}`}>{step.label}</p>
                {step.date
                  ? <p className={`text-xs mt-0.5 ${step.label === "Payment Reminder" ? "text-red-400" : "text-gray-400"}`}>{step.date}</p>
                  : <p className="text-xs mt-0.5 text-gray-300">Awaiting</p>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Invoice Details Drawer ─────────────────────────────────────────────── */
function InvoiceDetailsDrawer({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [tab, setTab] = useState<"preview" | "activity">("preview");
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">

        {/* Drawer Header */}
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

        {/* Quick actions strip */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-3 shrink-0 bg-gray-50/50">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <Send className="h-3.5 w-3.5" /> Send
          </button>
          <div className="relative ml-auto">
            <button onClick={() => setMoreOpen(!moreOpen)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
              <MoreHorizontal className="h-3.5 w-3.5" /> More
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-xl py-1.5">
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Pencil className="h-3.5 w-3.5 text-gray-400" /> Edit Invoice
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <RotateCcw className="h-3.5 w-3.5 text-gray-400" /> Mark as Paid
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <XCircle className="h-3.5 w-3.5" /> Cancel Invoice
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {(["preview", "activity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-all ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "preview" ? "Invoice Preview" : "Activity"}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "preview" ? (
            <InvoicePreview invoice={invoice} />
          ) : (
            <div className="space-y-6">
              {/* Balance summary */}
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
              {/* Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Invoice Details</h3>
                {[
                  { icon: User,      label: "Customer",      value: invoice.customer       },
                  { icon: MapPin,    label: "Address",       value: invoice.customerAddress },
                  { icon: Phone,     label: "Contact",       value: invoice.customerContact },
                  { icon: Building2, label: "Branch",        value: invoice.branch         },
                  { icon: User,      label: "Created By",    value: invoice.createdBy      },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <Icon className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Timeline */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Activity Timeline</h3>
                <ActivityTimeline invoice={invoice} />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {invoice.status !== "Paid" && invoice.status !== "Cancelled" && (
          <div className="flex items-center gap-2.5 border-t border-gray-100 px-6 py-4 shrink-0">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition">
              <CheckCircle2 className="h-4 w-4" /> Record Payment
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Row Actions dropdown ───────────────────────────────────────────────── */
function InvoiceRowActions({ inv, onView }: { inv: Invoice; onView: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button onClick={onView} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition">
          <Eye className="h-3.5 w-3.5" /> View
        </button>
        <button className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button onClick={() => setOpen(!open)} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-xl py-1.5">
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Download className="h-3.5 w-3.5 text-gray-400" /> Download PDF</button>
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Printer className="h-3.5 w-3.5 text-gray-400" /> Print</button>
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Send className="h-3.5 w-3.5 text-gray-400" /> Send to Customer</button>
            <div className="my-1 border-t border-gray-100" />
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><XCircle className="h-3.5 w-3.5" /> Cancel Invoice</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function InvoicesPage() {
  const [invoices, setInvoices]     = useState<Invoice[]>(MOCK_INVOICES);
  const [activeTab, setActiveTab]   = useState<TabKey>("All");
  const [searchQuery, setSearch]    = useState("");
  const [statusFilter, setStatus]   = useState<"" | InvoiceStatus>("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected]     = useState<Invoice | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 10;

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let r = [...invoices];

    if (activeTab !== "All") r = r.filter((i) => i.status === activeTab);
    if (statusFilter)        r = r.filter((i) => i.status === statusFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) r = r.filter((i) =>
      i.invoiceNo.toLowerCase().includes(q) ||
      i.customer.toLowerCase().includes(q) ||
      i.branch.toLowerCase().includes(q)
    );
    return r;
  }, [invoices, activeTab, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSave = useCallback((inv: Partial<Invoice>) => {
    setInvoices((p) => [{ ...inv, id: String(Date.now()) } as Invoice, ...p]);
    setPage(1);
  }, []);

  const hasFilters = !!statusFilter || !!searchQuery;
  const resetAll   = () => { setSearch(""); setStatus(""); setPage(1); };

  const tabCount = (t: TabKey) =>
    t === "All" ? invoices.length : invoices.filter((i) => i.status === t).length;

  return (
    <div className="min-h-screen bg-[#F7F8FC]">

      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
            <span>Finance</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-gray-600">Invoices</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer billing and invoice records</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <Download className="h-4 w-4 text-gray-500" /> Export
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium shadow-sm transition ${showFilters ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            <Filter className="h-4 w-4" />
            Filter
            {hasFilters && <span className="flex h-2 w-2 rounded-full bg-blue-500" />}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <SummaryCards invoices={invoices} />

      {/* ── Tabs ── */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${activeTab === tab ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
              {tabCount(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search invoice number, customer..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select value={statusFilter} onChange={(e) => { setStatus(e.target.value as "" | InvoiceStatus); setPage(1); }} className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-7 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition">
                  <option value="">All Statuses</option>
                  {(["Draft","Sent","Paid","Partially Paid","Overdue","Cancelled"] as InvoiceStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {hasFilters && (
                <button onClick={resetAll} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition">
                  <RefreshCw className="h-3.5 w-3.5" /> Reset
                </button>
              )}
            </div>
          )}
        </div>
        {hasFilters && (
          <p className="text-xs font-medium text-blue-600">{filtered.length} of {invoices.length} records match current filters</p>
        )}
      </div>

      {/* ── Desktop Table ── */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[960px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {["Invoice", "Customer", "Issue Date", "Due Date", "Amount", "Balance", "Status", "Actions"].map((col) => (
                <th key={col} className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Search className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No invoices match your filters</p>
                    <button onClick={resetAll} className="text-xs text-blue-600 hover:underline">Clear filters</button>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((inv) => (
                <tr key={inv.id} onClick={() => setSelected(inv)}
                  className="group text-sm text-gray-700 transition-colors hover:bg-blue-50/30 cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <button onClick={(e) => { e.stopPropagation(); setSelected(inv); }}
                      className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >{inv.invoiceNo}</button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-gray-800">{inv.customer}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{inv.branch}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{inv.issueDate}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium ${inv.status === "Overdue" ? "text-red-600" : "text-gray-500"}`}>{inv.dueDate}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">{fmtCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${inv.balance === 0 ? "text-emerald-600" : inv.status === "Overdue" ? "text-red-600" : "text-amber-700"}`}>
                      {fmtCurrency(inv.balance)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <InvoiceRowActions inv={inv} onView={() => setSelected(inv)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="mt-4 space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">No invoices match your filters</p>
          </div>
        ) : (
          paginated.map((inv) => (
            <div key={inv.id} onClick={() => setSelected(inv)}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-blue-600">{inv.invoiceNo}</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-800 truncate">{inv.customer}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Issued: {inv.issueDate} · Due: {inv.dueDate}</p>
                </div>
                <InvoiceStatusBadge status={inv.status} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                <div>
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-base font-bold text-gray-900">{fmtCurrency(inv.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Balance</p>
                  <p className={`text-base font-bold ${inv.balance === 0 ? "text-emerald-600" : inv.status === "Overdue" ? "text-red-600" : "text-amber-700"}`}>{fmtCurrency(inv.balance)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {filtered.length > PAGE_SIZE && (
        <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{(safePage - 1) * PAGE_SIZE + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(safePage * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1} className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = safePage <= 3 ? i + 1 : safePage + i - 2;
              if (p > totalPages) return null;
              return <button key={p} onClick={() => setPage(p)} className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition ${safePage === p ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>;
            })}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onSave={handleSave} />}

      {/* ── Detail Drawer ── */}
      {selected && <InvoiceDetailsDrawer invoice={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
