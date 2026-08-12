"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Plus, Download, Filter, Search, X, ChevronDown, MoreHorizontal,
  FileText, Eye, Pencil, Trash2, ArrowDownLeft, ArrowUpRight,
  DollarSign, AlertCircle, CheckCircle2, Clock, RotateCcw,
  Calendar, Building2, User, Hash, AlignLeft, ChevronRight,
  Banknote, TrendingUp, TrendingDown, Minus, Printer,
  XCircle, CheckCheck, RefreshCw,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type NoteType = "Credit" | "Debit";
type NoteStatus = "Applied" | "Pending" | "Draft" | "Cancelled";
type ReasonType =
  | "Pricing Adjustment"
  | "Damaged Goods"
  | "Returned Goods"
  | "Quantity Adjustment"
  | "Freight Adjustment"
  | "Other";

interface CreditDebitNote {
  id: string;
  noteNo: string;
  type: NoteType;
  customer: string;
  invoiceRef: string;
  date: string;
  amount: number;
  status: NoteStatus;
  reason: ReasonType;
  description: string;
  branch: string;
  createdBy: string;
  appliedDate?: string;
}

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const MOCK_NOTES: CreditDebitNote[] = [
  { id: "1",  noteNo: "CN-2026-00124", type: "Credit", customer: "Build It Centurion",     invoiceRef: "INV-2026-00891", date: "29 Jul 2026", amount: 4250,  status: "Applied",   reason: "Pricing Adjustment",  description: "Rate correction for overcharged freight services on July delivery run.", branch: "Johannesburg DC", createdBy: "Admin User", appliedDate: "30 Jul 2026" },
  { id: "2",  noteNo: "DN-2026-00087", type: "Debit",  customer: "Takealot Midrand",        invoiceRef: "INV-2026-00782", date: "28 Jul 2026", amount: 2850,  status: "Pending",   reason: "Freight Adjustment",  description: "Additional handling charges for oversized cargo on manifest DM-00451.", branch: "Pretoria DC",    createdBy: "Finance User", appliedDate: undefined },
  { id: "3",  noteNo: "CN-2026-00123", type: "Credit", customer: "Westgate Mall",           invoiceRef: "INV-2026-00765", date: "27 Jul 2026", amount: 1850,  status: "Applied",   reason: "Damaged Goods",      description: "Credit issued for 3 parcels damaged in transit, as per POD-00221.", branch: "Cape Town DC",   createdBy: "Admin User", appliedDate: "28 Jul 2026" },
  { id: "4",  noteNo: "DN-2026-00086", type: "Debit",  customer: "Soshanguve Retail",       invoiceRef: "INV-2026-00741", date: "26 Jul 2026", amount: 3200,  status: "Draft",     reason: "Quantity Adjustment", description: "Additional parcels delivered outside original waybill scope.", branch: "Johannesburg DC", createdBy: "Finance User", appliedDate: undefined },
  { id: "5",  noteNo: "CN-2026-00122", type: "Credit", customer: "Pretoria CBD Store",      invoiceRef: "INV-2026-00730", date: "25 Jul 2026", amount: 950,   status: "Applied",   reason: "Returned Goods",     description: "5 units returned to sender, full freight credit applied.", branch: "Pretoria DC",    createdBy: "Admin User", appliedDate: "26 Jul 2026" },
  { id: "6",  noteNo: "CN-2026-00121", type: "Credit", customer: "Makro Silverton",         invoiceRef: "INV-2026-00715", date: "24 Jul 2026", amount: 6700,  status: "Applied",   reason: "Pricing Adjustment",  description: "Contract rate applied retrospectively for bulk delivery agreement.", branch: "Johannesburg DC", createdBy: "Admin User", appliedDate: "25 Jul 2026" },
  { id: "7",  noteNo: "DN-2026-00085", type: "Debit",  customer: "Checkers Montecasino",    invoiceRef: "INV-2026-00698", date: "23 Jul 2026", amount: 1450,  status: "Pending",   reason: "Other",              description: "Fuel surcharge adjustment for remote delivery area.", branch: "Johannesburg DC", createdBy: "Finance User", appliedDate: undefined },
  { id: "8",  noteNo: "CN-2026-00120", type: "Credit", customer: "Build It Centurion",      invoiceRef: "INV-2026-00681", date: "22 Jul 2026", amount: 2100,  status: "Cancelled", reason: "Other",              description: "Duplicate note created in error — voided.", branch: "Pretoria DC",    createdBy: "Admin User", appliedDate: undefined },
  { id: "9",  noteNo: "CN-2026-00119", type: "Credit", customer: "Clicks Hatfield",         invoiceRef: "INV-2026-00655", date: "20 Jul 2026", amount: 780,   status: "Applied",   reason: "Freight Adjustment",  description: "Partial credit for late delivery compensation.", branch: "Pretoria DC",    createdBy: "Finance User", appliedDate: "21 Jul 2026" },
  { id: "10", noteNo: "DN-2026-00084", type: "Debit",  customer: "Takealot Midrand",        invoiceRef: "INV-2026-00640", date: "19 Jul 2026", amount: 5400,  status: "Applied",   reason: "Freight Adjustment",  description: "Fuel surcharge not included in original invoice.", branch: "Johannesburg DC", createdBy: "Admin User", appliedDate: "21 Jul 2026" },
  { id: "11", noteNo: "CN-2026-00118", type: "Credit", customer: "Woolworths Menlyn",       invoiceRef: "INV-2026-00625", date: "18 Jul 2026", amount: 3300,  status: "Draft",     reason: "Pricing Adjustment",  description: "Pending approval for bulk rate retrospective adjustment.", branch: "Pretoria DC",    createdBy: "Finance User", appliedDate: undefined },
  { id: "12", noteNo: "DN-2026-00083", type: "Debit",  customer: "Spar Arcadia",            invoiceRef: "INV-2026-00610", date: "17 Jul 2026", amount: 875,   status: "Pending",   reason: "Quantity Adjustment", description: "2 extra pallets loaded, not included in original manifest.", branch: "Johannesburg DC", createdBy: "Admin User", appliedDate: undefined },
];

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<NoteStatus, { cls: string; dot: string; label: string }> = {
  Applied:   { cls: "bg-emerald-50 text-emerald-700 border-emerald-100",   dot: "bg-emerald-500",  label: "Applied"   },
  Pending:   { cls: "bg-amber-50 text-amber-700 border-amber-100",         dot: "bg-amber-500",    label: "Pending"   },
  Draft:     { cls: "bg-gray-100 text-gray-600 border-gray-200",           dot: "bg-gray-400",     label: "Draft"     },
  Cancelled: { cls: "bg-red-50 text-red-600 border-red-100",               dot: "bg-red-400",      label: "Cancelled" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtCurrency(n: number) {
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: NoteStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: NoteType }) {
  if (type === "Credit") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <ArrowDownLeft className="h-3 w-3" />
        Credit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 border border-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
      <ArrowUpRight className="h-3 w-3" />
      Debit
    </span>
  );
}

/* ─── TABS ───────────────────────────────────────────────────────────────── */
type TabKey = "All" | "Credit Notes" | "Debit Notes" | "Draft" | "Applied" | "Cancelled";
const TABS: TabKey[] = ["All", "Credit Notes", "Debit Notes", "Draft", "Applied", "Cancelled"];

/* ─── Summary Cards ──────────────────────────────────────────────────────── */
function SummaryCards({ notes }: { notes: CreditDebitNote[] }) {
  const total       = notes.length;
  const credits     = notes.filter((n) => n.type === "Credit");
  const debits      = notes.filter((n) => n.type === "Debit");
  const outstanding = notes
    .filter((n) => n.status === "Pending")
    .reduce((s, n) => s + n.amount, 0);

  const cards = [
    {
      label: "Total Notes",
      value: String(total),
      sub: "+12 this month",
      icon: FileText,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: "+12",
      trendUp: true,
    },
    {
      label: "Credit Notes",
      value: String(credits.length),
      sub: "Total credited",
      icon: ArrowDownLeft,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend: fmtCurrency(credits.reduce((s, n) => s + n.amount, 0)),
      trendUp: true,
    },
    {
      label: "Debit Notes",
      value: String(debits.length),
      sub: "Total debited",
      icon: ArrowUpRight,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      trend: fmtCurrency(debits.reduce((s, n) => s + n.amount, 0)),
      trendUp: false,
    },
    {
      label: "Outstanding Amount",
      value: fmtCurrency(outstanding),
      sub: "Pending approval",
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      trend: `${notes.filter((n) => n.status === "Pending").length} pending`,
      trendUp: false,
    },
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
                <p className="mt-1.5 text-2xl font-bold text-gray-900 leading-tight">{c.value}</p>
                <p className="mt-1 text-xs text-gray-400">{c.sub}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
                <Icon className={`h-5 w-5 ${c.iconColor}`} strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
              <span className="text-xs text-gray-400">This month</span>
              <span className={`flex items-center gap-1 text-xs font-semibold ${c.trendUp ? "text-emerald-600" : "text-orange-600"}`}>
                {c.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {c.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Create Note Modal ──────────────────────────────────────────────────── */
interface CreateNoteModalProps {
  onClose: () => void;
  onSave: (note: Partial<CreditDebitNote>) => void;
}

function CreateNoteModal({ onClose, onSave }: CreateNoteModalProps) {
  const [noteType, setNoteType]     = useState<NoteType>("Credit");
  const [customer, setCustomer]     = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [date, setDate]             = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason]         = useState<ReasonType | "">("");
  const [amount, setAmount]         = useState("");
  const [description, setDescription] = useState("");

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  const handleSubmit = (asDraft: boolean) => {
    onSave({
      noteNo: noteType === "Credit" ? `CN-2026-${String(Math.floor(Math.random() * 900 + 100)).padStart(5, "0")}` : `DN-2026-${String(Math.floor(Math.random() * 900 + 100)).padStart(5, "0")}`,
      type: noteType,
      customer,
      invoiceRef,
      date: new Date(date).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
      amount: parseFloat(amount) || 0,
      status: asDraft ? "Draft" : "Pending",
      reason: (reason as ReasonType) || "Other",
      description,
      branch: "Johannesburg DC",
      createdBy: "Admin User",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Banknote className="h-4.5 w-4.5 text-white h-[18px] w-[18px]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create Note</h2>
              <p className="text-xs text-gray-400">Add a new credit or debit note</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Note Type Toggle */}
          <div>
            <label className={labelCls}>Note Type <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNoteType("Credit")}
                className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${noteType === "Credit" ? "border-emerald-400 bg-emerald-50/60" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${noteType === "Credit" ? "bg-emerald-500" : "bg-gray-100"}`}>
                  <ArrowDownLeft className={`h-4 w-4 ${noteType === "Credit" ? "text-white" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${noteType === "Credit" ? "text-emerald-700" : "text-gray-700"}`}>Credit Note</p>
                  <p className="text-xs text-gray-400 mt-0.5">Reduce amount owed</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setNoteType("Debit")}
                className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${noteType === "Debit" ? "border-orange-400 bg-orange-50/60" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${noteType === "Debit" ? "bg-orange-500" : "bg-gray-100"}`}>
                  <ArrowUpRight className={`h-4 w-4 ${noteType === "Debit" ? "text-white" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${noteType === "Debit" ? "text-orange-700" : "text-gray-700"}`}>Debit Note</p>
                  <p className="text-xs text-gray-400 mt-0.5">Increase amount owed</p>
                </div>
              </button>
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                placeholder="Search or enter customer name..."
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          {/* Invoice Reference */}
          <div>
            <label className={labelCls}>Invoice Reference</label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="e.g. INV-2026-00891"
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          {/* Date + Reason side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} pl-9`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Reason <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReasonType)}
                  className={`${inputCls} appearance-none pr-8`}
                >
                  <option value="">Select reason...</option>
                  {(["Pricing Adjustment","Damaged Goods","Returned Goods","Quantity Adjustment","Freight Adjustment","Other"] as ReasonType[]).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>Amount <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">R</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${inputCls} pl-7`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide a brief description of the reason for this note..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={() => handleSubmit(true)} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition"
          >
            <CheckCheck className="h-4 w-4" />
            Create Note
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Note Details Drawer ────────────────────────────────────────────────── */
function NoteDetailsDrawer({ note, onClose }: { note: CreditDebitNote; onClose: () => void }) {
  const timeline = [
    { label: "Created",  date: note.date,           done: true,  icon: FileText   },
    { label: "Reviewed", date: note.date,           done: note.status !== "Draft",  icon: Eye   },
    { label: "Applied",  date: note.appliedDate,    done: note.status === "Applied", icon: CheckCircle2 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{note.noteNo}</h2>
              <TypeBadge type={note.type} />
              <StatusBadge status={note.status} />
            </div>
            <p className="mt-1.5 text-sm text-gray-500">{note.reason}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shrink-0">
            <X className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Amount Highlight */}
          <div className={`rounded-xl border p-4 ${note.type === "Credit" ? "bg-emerald-50/60 border-emerald-100" : "bg-orange-50/60 border-orange-100"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${note.type === "Credit" ? "text-emerald-600" : "text-orange-600"}`}>{note.type} Amount</p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${note.type === "Credit" ? "text-emerald-700" : "text-orange-700"}`}>{fmtCurrency(note.amount)}</p>
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Note Details</h3>
            {[
              { icon: User,      label: "Customer",          value: note.customer    },
              { icon: Hash,      label: "Invoice Reference", value: note.invoiceRef  },
              { icon: Calendar,  label: "Date",              value: note.date        },
              { icon: Building2, label: "Branch",            value: note.branch      },
              { icon: User,      label: "Created By",        value: note.createdBy   },
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

          {/* Description */}
          {note.description && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Description</h3>
              <p className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700 leading-relaxed">{note.description}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Activity Timeline</h3>
            <div className="relative ml-3.5">
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-100" />
              <div className="space-y-5">
                {timeline.map((step, i) => {
                  const Icon = step.icon;
                  const active = step.done;
                  return (
                    <div key={i} className="relative flex items-start gap-4 pl-7">
                      <div className={`absolute left-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${active ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
                        <Icon className={`h-3 w-3 ${active ? "text-blue-600" : "text-gray-300"}`} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                        {step.date ? (
                          <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                        ) : (
                          <p className="text-xs text-gray-300 mt-0.5">Awaiting</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center gap-2.5 border-t border-gray-100 px-6 py-4 shrink-0">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          {note.status !== "Applied" && note.status !== "Cancelled" && (
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition">
              <CheckCheck className="h-4 w-4" />
              Apply Note
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Row actions dropdown ───────────────────────────────────────────────── */
function RowActions({ note, onView }: { note: CreditDebitNote; onView: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button onClick={onView} className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition">
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
        <button className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-xl py-1.5">
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Download className="h-3.5 w-3.5 text-gray-400" /> Download PDF
            </button>
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Printer className="h-3.5 w-3.5 text-gray-400" /> Print Note
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              <XCircle className="h-3.5 w-3.5" /> Cancel Note
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function CreditDebitPage() {
  const [notes, setNotes] = useState<CreditDebitNote[]>(MOCK_NOTES);
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | NoteType>("");
  const [statusFilter, setStatusFilter] = useState<"" | NoteStatus>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CreditDebitNote | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  /* ── Filter logic ── */
  const filtered = useMemo(() => {
    let result = [...notes];

    // Tab filter
    if (activeTab === "Credit Notes") result = result.filter((n) => n.type === "Credit");
    else if (activeTab === "Debit Notes") result = result.filter((n) => n.type === "Debit");
    else if (activeTab === "Draft") result = result.filter((n) => n.status === "Draft");
    else if (activeTab === "Applied") result = result.filter((n) => n.status === "Applied");
    else if (activeTab === "Cancelled") result = result.filter((n) => n.status === "Cancelled");

    // Type filter
    if (typeFilter) result = result.filter((n) => n.type === typeFilter);

    // Status filter
    if (statusFilter) result = result.filter((n) => n.status === statusFilter);

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (n) =>
          n.noteNo.toLowerCase().includes(q) ||
          n.customer.toLowerCase().includes(q) ||
          n.invoiceRef.toLowerCase().includes(q) ||
          n.reason.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notes, activeTab, typeFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSaveNote = useCallback((note: Partial<CreditDebitNote>) => {
    setNotes((prev) => [
      { ...note, id: String(Date.now()) } as CreditDebitNote,
      ...prev,
    ]);
    setPage(1);
  }, []);

  const hasFilters = !!typeFilter || !!statusFilter || !!searchQuery;

  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {/* Breadcrumb */}
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
            <span>Finance</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-gray-600">Credit &amp; Debit Notes</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Credit &amp; Debit Notes</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer credits, debits and financial adjustments</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <Download className="h-4 w-4 text-gray-500" />
            Export
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
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition"
          >
            <Plus className="h-4 w-4" />
            Create Note
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <SummaryCards notes={notes} />

      {/* ── Tabs ── */}
      <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-0 border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count =
            tab === "All" ? notes.length
            : tab === "Credit Notes" ? notes.filter((n) => n.type === "Credit").length
            : tab === "Debit Notes"  ? notes.filter((n) => n.type === "Debit").length
            : notes.filter((n) => n.status === (tab as NoteStatus)).length;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar (search + filters) ── */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search note number, customer, invoice..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Desktop filter row */}
          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as "" | NoteType); setPage(1); }} className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-7 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition">
                  <option value="">Note Type</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as "" | NoteStatus); setPage(1); }} className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-7 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition">
                  <option value="">All Statuses</option>
                  <option value="Applied">Applied</option>
                  <option value="Pending">Pending</option>
                  <option value="Draft">Draft</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {hasFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition">
                  <RefreshCw className="h-3.5 w-3.5" /> Reset
                </button>
              )}
            </div>
          )}
        </div>

        {hasFilters && (
          <p className="text-xs font-medium text-blue-600">
            {filtered.length} of {notes.length} records match current filters
          </p>
        )}
      </div>

      {/* ── Main Table (desktop) ── */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {["Note No.", "Type", "Customer", "Invoice Ref.", "Date", "Amount", "Status", "Actions"].map((col) => (
                <th key={col} className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {col}
                </th>
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
                    <p className="text-sm font-medium text-gray-500">No notes match your filters</p>
                    <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Clear filters</button>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((note) => (
                <tr
                  key={note.id}
                  className="group text-sm text-gray-700 transition-colors hover:bg-blue-50/30 cursor-pointer"
                  onClick={() => setSelectedNote(note)}
                >
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedNote(note); }}
                      className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {note.noteNo}
                    </button>
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <TypeBadge type={note.type} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-gray-800">{note.customer}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-gray-500">{note.invoiceRef}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{note.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${note.type === "Credit" ? "text-emerald-700" : "text-orange-700"}`}>
                      {fmtCurrency(note.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge status={note.status} />
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <RowActions note={note} onView={() => setSelectedNote(note)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="mt-4 space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">No notes match your filters</p>
          </div>
        ) : (
          paginated.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-blue-600">{note.noteNo}</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-800 truncate">{note.customer}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{note.invoiceRef} · {note.date}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <TypeBadge type={note.type} />
                  <StatusBadge status={note.status} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                <span className={`text-base font-bold ${note.type === "Credit" ? "text-emerald-700" : "text-orange-700"}`}>
                  {fmtCurrency(note.amount)}
                </span>
                <span className="text-xs text-gray-400">{note.reason}</span>
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
              return (
                <button key={p} onClick={() => setPage(p)} className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition ${safePage === p ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages} className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
          </div>
        </div>
      )}

      {/* ── Create Note Modal ── */}
      {showCreateModal && (
        <CreateNoteModal onClose={() => setShowCreateModal(false)} onSave={handleSaveNote} />
      )}

      {/* ── Note Details Drawer ── */}
      {selectedNote && (
        <NoteDetailsDrawer note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}
    </div>
  );
}
