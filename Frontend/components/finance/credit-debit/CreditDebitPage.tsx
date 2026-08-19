"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Plus, Download, Filter, Search, X, ChevronDown, MoreHorizontal,
  FileText, Eye, Pencil, Trash2, ArrowDownLeft, ArrowUpRight,
  DollarSign, AlertCircle, CheckCircle2, Clock, RotateCcw,
  Calendar, Building2, User, Hash, AlignLeft, ChevronRight,
  Banknote, TrendingUp, TrendingDown, Minus, Printer,
  XCircle, CheckCheck, RefreshCw, Check
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

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
  _id: string;
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

interface CustomerOption {
  _id: string;
  name: string;
}

interface InvoiceOption {
  _id: string;
  invoiceNo: string;
  customer: string;
}

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<NoteStatus, { cls: string; dot: string; label: string }> = {
  Applied:   { cls: "bg-emerald-50 text-emerald-700 border-emerald-100",   dot: "bg-emerald-500",  label: "Applied"   },
  Pending:   { cls: "bg-amber-50 text-amber-700 border-amber-100",         dot: "bg-amber-500",    label: "Pending"   },
  Draft:     { cls: "bg-gray-100 text-gray-600 border-gray-200",           dot: "bg-gray-400",     label: "Draft"     },
  Cancelled: { cls: "bg-red-50 text-red-600 border-red-100",               dot: "bg-red-400",      label: "Cancelled" },
};

function fmtCurrency(n: number = 0) {
  return `R ${Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: NoteStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
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

type TabKey = "All" | "Credit Notes" | "Debit Notes" | "Draft" | "Applied" | "Cancelled";
const TABS: TabKey[] = ["All", "Credit Notes", "Debit Notes", "Draft", "Applied", "Cancelled"];

/* ─── Summary Cards ──────────────────────────────────────────────────────── */
function SummaryCards({ notes }: { notes: CreditDebitNote[] }) {
  const total       = notes.length;
  const credits     = notes.filter((n) => n.type === "Credit");
  const debits      = notes.filter((n) => n.type === "Debit");
  const outstanding = notes
    .filter((n) => n.status === "Pending")
    .reduce((s, n) => s + (n.amount || 0), 0);

  const cards = [
    {
      label: "Total Notes",
      value: String(total),
      sub: `${total} records`,
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
      trend: fmtCurrency(credits.reduce((s, n) => s + (n.amount || 0), 0)),
      trendUp: true,
    },
    {
      label: "Debit Notes",
      value: String(debits.length),
      sub: "Total debited",
      icon: ArrowUpRight,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
      trend: fmtCurrency(debits.reduce((s, n) => s + (n.amount || 0), 0)),
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
                <p className="mt-1.5 text-2xl font-bold text-gray-900 leading-tight tracking-tight">{c.value}</p>
                <p className="mt-1 text-xs text-gray-400">{c.sub}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
                <Icon className={`h-5 w-5 ${c.iconColor}`} strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
              <span className="text-xs text-gray-400 font-medium">{c.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Create / Edit Note Modal ───────────────────────────────────────────── */
function NoteFormModal({
  initialData,
  customers,
  invoices,
  onClose,
  onSave,
}: {
  initialData?: CreditDebitNote | null;
  customers: CustomerOption[];
  invoices: InvoiceOption[];
  onClose: () => void;
  onSave: (data: Partial<CreditDebitNote>, asDraft: boolean) => Promise<void>;
}) {
  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  const [type, setType]             = useState<NoteType>(initialData?.type || "Credit");
  const [customer, setCustomer]     = useState(initialData?.customer || "");
  const [invoiceRef, setInvoiceRef] = useState(initialData?.invoiceRef || "");
  const [date, setDate]             = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [amount, setAmount]         = useState(initialData?.amount ? String(initialData.amount) : "");
  const [reason, setReason]         = useState<ReasonType>(initialData?.reason || "Pricing Adjustment");
  const [description, setDesc]      = useState(initialData?.description || "");
  const [branch, setBranch]         = useState(initialData?.branch || "Johannesburg DC");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");

  const handleSubmit = async (asDraft: boolean) => {
    if (!customer.trim()) {
      setErrorMsg("Please select or enter a customer.");
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid positive note amount.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await onSave(
        {
          type,
          customer: customer.trim(),
          invoiceRef: invoiceRef.trim(),
          date,
          amount: numAmount,
          reason,
          description: description.trim(),
          branch,
          status: asDraft ? "Draft" : (initialData?.status || "Pending"),
        },
        asDraft
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save Credit/Debit note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${type === "Credit" ? "bg-emerald-600" : "bg-orange-600"}`}>
              {type === "Credit" ? <ArrowDownLeft className="h-5 w-5 text-white" /> : <ArrowUpRight className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{initialData ? `Edit ${initialData.noteNo}` : `Generate ${type} Note`}</h2>
              <p className="text-xs text-gray-400">Specify adjustment details and amounts</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <label className={labelCls}>Note Type <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("Credit")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 font-bold transition ${
                  type === "Credit" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" /> Credit Note
              </button>
              <button
                type="button"
                onClick={() => setType("Debit")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 font-bold transition ${
                  type === "Debit" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" /> Debit Note
              </button>
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className={labelCls}>Customer <span className="text-red-400">*</span></label>
            <input
              list="note-cust-list"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Search or enter customer name..."
              className={inputCls}
            />
            <datalist id="note-cust-list">
              {customers.map((c) => (
                <option key={c._id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Invoice Reference + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Invoice Reference</label>
              <input
                list="note-inv-list"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="e.g. INV-2026-00891"
                className={inputCls}
              />
              <datalist id="note-inv-list">
                {invoices.map((inv) => (
                  <option key={inv._id} value={inv.invoiceNo}>{inv.customer}</option>
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelCls}>Note Date <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="YYYY-MM-DD or DD Mon YYYY"
                className={inputCls}
              />
            </div>
          </div>

          {/* Amount + Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount (R) <span className="text-red-400">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Reason <span className="text-red-400">*</span></label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReasonType)}
                className={`${inputCls} appearance-none pr-8`}
              >
                {[
                  "Pricing Adjustment",
                  "Damaged Goods",
                  "Returned Goods",
                  "Quantity Adjustment",
                  "Freight Adjustment",
                  "Other",
                ].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className={labelCls}>Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className={inputCls}
            >
              {["Johannesburg DC", "Pretoria DC", "Cape Town DC", "Durban DC", "Head Office"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description / Details</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Provide context or explanation for this note..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} disabled={submitting} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => handleSubmit(true)} disabled={submitting} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm ${
              type === "Credit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {submitting ? "Processing..." : (initialData ? "Update Note" : `Create ${type} Note`)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */
export default function CreditDebitPage() {
  const [notes, setNotes]               = useState<CreditDebitNote[]>([]);
  const [customers, setCustomers]       = useState<CustomerOption[]>([]);
  const [invoices, setInvoices]         = useState<InvoiceOption[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<TabKey>("All");
  const [searchQuery, setSearch]        = useState("");
  const [statusFilter, setStatus]       = useState<"" | NoteStatus>("");
  const [typeFilter, setTypeFilter]     = useState<"" | NoteType>("");
  const [showCreate, setShowCreate]     = useState(false);
  const [editingNote, setEditing]       = useState<CreditDebitNote | null>(null);
  const [selectedNote, setSelected]     = useState<CreditDebitNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreditDebitNote | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: CreditDebitNote[] }>("/api/credit-debit-notes?limit=200");
      if (res.success && res.data) {
        setNotes(res.data);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to fetch Credit/Debit notes");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        apiGet<{ success: boolean; data: CustomerOption[] }>("/api/customers/lookup"),
        apiGet<{ success: boolean; data: InvoiceOption[] }>("/api/invoices?limit=200"),
      ]);
      if (cRes.success && cRes.data) setCustomers(cRes.data);
      if (iRes.success && iRes.data) setInvoices(iRes.data);
    } catch (e) {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchLookups();
  }, [fetchNotes, fetchLookups]);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let r = [...notes];
    if (activeTab === "Credit Notes") r = r.filter((n) => n.type === "Credit");
    else if (activeTab === "Debit Notes")  r = r.filter((n) => n.type === "Debit");
    else if (activeTab !== "All")         r = r.filter((n) => n.status === activeTab);

    if (statusFilter) r = r.filter((n) => n.status === statusFilter);
    if (typeFilter)   r = r.filter((n) => n.type === typeFilter);

    const q = searchQuery.trim().toLowerCase();
    if (q) r = r.filter((n) =>
      (n.noteNo || "").toLowerCase().includes(q) ||
      (n.customer || "").toLowerCase().includes(q) ||
      (n.invoiceRef || "").toLowerCase().includes(q) ||
      (n.description || "").toLowerCase().includes(q)
    );
    return r;
  }, [notes, activeTab, statusFilter, typeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* ── Actions ── */
  const handleSaveNote = async (data: Partial<CreditDebitNote>, asDraft: boolean) => {
    if (editingNote) {
      const res = await apiPut<{ success: boolean; data: CreditDebitNote }>(`/api/credit-debit-notes/${editingNote._id}`, data);
      if (res.success) {
        showToast("success", `Note ${res.data.noteNo} updated`);
        fetchNotes();
      }
    } else {
      const res = await apiPost<{ success: boolean; data: CreditDebitNote }>("/api/credit-debit-notes", data);
      if (res.success) {
        showToast("success", `${res.data.type} Note ${res.data.noteNo} generated`);
        fetchNotes();
      }
    }
  };

  const handleStatusChange = async (note: CreditDebitNote, newStatus: NoteStatus) => {
    const updatePayload: Partial<CreditDebitNote> = { status: newStatus };
    if (newStatus === "Applied") {
      updatePayload.appliedDate = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
    }
    const res = await apiPut<{ success: boolean; data: CreditDebitNote }>(`/api/credit-debit-notes/${note._id}`, updatePayload);
    if (res.success) {
      showToast("success", `Note ${note.noteNo} marked as ${newStatus}`);
      fetchNotes();
      if (selectedNote && selectedNote._id === note._id) setSelected(res.data);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiDelete<{ success: boolean }>(`/api/credit-debit-notes/${deleteTarget._id}`);
      if (res.success) {
        showToast("success", `Note ${deleteTarget.noteNo} deleted`);
        fetchNotes();
        setDeleteTarget(null);
        if (selectedNote && selectedNote._id === deleteTarget._id) setSelected(null);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to delete note");
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Credit / Debit Notes</h1>
          <p className="mt-1 text-sm text-gray-500">Manage billing adjustments, freight credits, and debit adjustments</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchNotes} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => { setEditing(null); setShowCreate(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-900/20 transition"
          >
            <Plus className="h-4 w-4" /> Generate Note
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        <SummaryCards notes={notes} />
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-5 overflow-x-auto">
          {TABS.map((tab) => {
            let count = notes.length;
            if (tab === "Credit Notes") count = notes.filter((n) => n.type === "Credit").length;
            else if (tab === "Debit Notes") count = notes.filter((n) => n.type === "Debit").length;
            else if (tab !== "All") count = notes.filter((n) => n.status === tab).length;

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
              placeholder="Search note number, customer, invoice ref, description..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 bg-white focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="Credit">Credit Notes</option>
              <option value="Debit">Debit Notes</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              {["Draft", "Pending", "Applied", "Cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-xs">Loading note records...</div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">No Credit/Debit notes found matching criteria.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Note No</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((note) => (
                  <tr key={note._id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold font-mono text-blue-600">{note.noteNo}</td>
                    <td className="py-3.5 px-4">
                      <TypeBadge type={note.type} />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{note.customer}</td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono">{note.invoiceRef || "—"}</td>
                    <td className="py-3.5 px-4 text-gray-600">{note.reason}</td>
                    <td className={`py-3.5 px-4 text-right font-bold ${note.type === "Credit" ? "text-emerald-600" : "text-orange-600"}`}>
                      {fmtCurrency(note.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={note.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(note)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          onClick={() => { setEditing(note); setShowCreate(true); }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        {note.status !== "Applied" && (
                          <button
                            onClick={() => handleStatusChange(note, "Applied")}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCheck className="h-3.5 w-3.5" /> Apply
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(note)}
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
        <NoteFormModal
          initialData={editingNote}
          customers={customers}
          invoices={invoices}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSave={handleSaveNote}
        />
      )}

      {/* View Drawer */}
      {selectedNote && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-base font-bold text-gray-900">{selectedNote.noteNo}</h2>
                  <TypeBadge type={selectedNote.type} />
                  <StatusBadge status={selectedNote.status} />
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-800">{selectedNote.customer}</p>
                <p className="text-xs text-gray-400 mt-0.5">Date: {selectedNote.date}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Ref:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedNote.invoiceRef || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reason:</span>
                  <span className="font-semibold text-gray-800">{selectedNote.reason}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
                  <span className="font-bold text-gray-900">Total Amount:</span>
                  <span className={`font-bold ${selectedNote.type === "Credit" ? "text-emerald-600" : "text-orange-600"}`}>
                    {fmtCurrency(selectedNote.amount)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-1">Description / Notes</h4>
                <p className="text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3 leading-relaxed">
                  {selectedNote.description || "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-gray-500 border-t border-gray-100 pt-3">
                <div><span>Branch:</span> <p className="font-semibold text-gray-800">{selectedNote.branch}</p></div>
                <div><span>Created By:</span> <p className="font-semibold text-gray-800">{selectedNote.createdBy}</p></div>
                {selectedNote.appliedDate && (
                  <div className="col-span-2"><span>Applied Date:</span> <p className="font-semibold text-emerald-700">{selectedNote.appliedDate}</p></div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
              {selectedNote.status !== "Applied" && (
                <button
                  onClick={() => handleStatusChange(selectedNote, "Applied")}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Apply Note
                </button>
              )}
              <button
                onClick={() => { setEditing(selectedNote); setSelected(null); setShowCreate(true); }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit Note
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
                <h3 className="font-bold text-gray-900 text-base">Delete Note</h3>
                <p className="text-xs text-gray-500">{deleteTarget.noteNo}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">Are you sure you want to delete this Credit/Debit note? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNote}
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
