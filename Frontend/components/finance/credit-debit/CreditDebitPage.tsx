"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Plus, Trash2, Search, Calendar, Printer, Mail, ChevronDown,
  Send, Save, X, Paperclip, Info, FileText,
} from "lucide-react";
import { apiPost, apiPut } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type NoteType = "Credit" | "Debit";
type NoteStatus = "Draft" | "Pending" | "Applied" | "Cancelled";
type AdjustmentAgainst = "Invoice" | "Waybill";

interface WaybillRow {
  id: string;
  waybillNo: string;
  date: string;
  from: string;
  to: string;
  originalAmount: number;
  adjustmentAmount: number;
}

interface LineRow {
  id: string;
  description: string;
  originalAmount: number;
  adjustmentAmount: number;
  vatRate: number;
}

interface CreditDebitNoteFormData {
  _id?: string;
  noteType: NoteType;
  noteNo: string;
  date: string;
  branch: string;
  status: NoteStatus;
  adjustmentAgainst: AdjustmentAgainst;
  billingAccount: string;
  customer: string;
  currency: string;
  invoiceNo: string;
  invoiceDate: string;
  waybillNo: string;
  reference: string;
  exchangeRate: number;
  waybills: WaybillRow[];
  lines: LineRow[];
  comments: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtAmount(n: number = 0) {
  return Number(n || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const VAT_RATES = [15, 0, 10];
const BRANCHES = ["Head Office", "Johannesburg DC", "Pretoria DC", "Cape Town DC", "Durban DC"];
const CURRENCIES = ["ZAR - South African Rand", "USD - US Dollar", "EUR - Euro", "GBP - British Pound"];
const BILLING_ACCOUNTS = [
  { code: "BA-10023", name: "Value World (Pty) Ltd" },
  { code: "BA-10041", name: "Northgate Traders" },
  { code: "BA-10058", name: "Coastal Freight Co." },
];

const STATUS_CONFIG: Record<NoteStatus, string> = {
  Draft: "bg-blue-50 text-blue-600",
  Pending: "bg-amber-50 text-amber-700",
  Applied: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-red-50 text-red-600",
};

/* ─── Field primitives ───────────────────────────────────────────────────── */
const labelCls = "block text-sm font-semibold text-gray-800 mb-1.5";
const inputCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition";
const inputDisabledCls = "w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500";

function SectionHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-blue-600">{children}</h2>
      {action}
    </div>
  );
}

function Required() {
  return <span className="text-red-500">*</span>;
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function CreditDebitNotePage({
  initialData,
  onCancel,
  onSaved,
}: {
  initialData?: Partial<CreditDebitNoteFormData> | null;
  onCancel?: () => void;
  onSaved?: (data: any) => void;
}) {
  const [noteType, setNoteType] = useState<NoteType>(initialData?.noteType || "Credit");
  const [date, setDate] = useState(initialData?.date || "30/07/2026");
  const [branch, setBranch] = useState(initialData?.branch || "Head Office");
  const [status] = useState<NoteStatus>(initialData?.status || "Draft");
  const [adjustmentAgainst, setAdjustmentAgainst] = useState<AdjustmentAgainst>(initialData?.adjustmentAgainst || "Invoice");
  const [billingAccount, setBillingAccount] = useState(
    initialData?.billingAccount || `${BILLING_ACCOUNTS[0].code} - ${BILLING_ACCOUNTS[0].name}`
  );
  const [customer, setCustomer] = useState(initialData?.customer || BILLING_ACCOUNTS[0].name);
  const [currency, setCurrency] = useState(initialData?.currency || CURRENCIES[0]);
  const [invoiceNo, setInvoiceNo] = useState(initialData?.invoiceNo || "");
  const [invoiceDate, setInvoiceDate] = useState(initialData?.invoiceDate || "");
  const [waybillNo, setWaybillNo] = useState(initialData?.waybillNo || "");
  const [reference, setReference] = useState(initialData?.reference || "");
  const [exchangeRate, setExchangeRate] = useState(initialData?.exchangeRate ?? 1);
  const [comments, setComments] = useState(initialData?.comments || "");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [waybills, setWaybills] = useState<WaybillRow[]>(
    initialData?.waybills || [
      { id: uid(), waybillNo: "WB-2026-007891", date: "28/07/2026", from: "Johannesburg DC", to: "Cape Town DC", originalAmount: 8000, adjustmentAmount: 500 },
    ]
  );

  const [lines, setLines] = useState<LineRow[]>(
    initialData?.lines || [
      { id: uid(), description: "Fuel Levy", originalAmount: 500, adjustmentAmount: 200, vatRate: 15 },
      { id: uid(), description: "Handling Fee", originalAmount: 300, adjustmentAmount: 100, vatRate: 15 },
    ]
  );

  /* ── Derived totals ── */
  const lineTotals = useMemo(
    () =>
      lines.map((l) => {
        const vatAmount = (l.adjustmentAmount * l.vatRate) / 100;
        return { ...l, vatAmount, total: l.adjustmentAmount + vatAmount };
      }),
    [lines]
  );

  const subtotal = useMemo(() => lines.reduce((s, l) => s + (l.adjustmentAmount || 0), 0), [lines]);
  const totalVat = useMemo(() => lineTotals.reduce((s, l) => s + l.vatAmount, 0), [lineTotals]);
  const grandTotal = subtotal + totalVat;

  /* ── Waybill row handlers ── */
  const addWaybill = () =>
    setWaybills((w) => [...w, { id: uid(), waybillNo: "", date: "", from: "", to: "", originalAmount: 0, adjustmentAmount: 0 }]);
  const removeWaybill = (id: string) => setWaybills((w) => w.filter((r) => r.id !== id));

  /* ── Line row handlers ── */
  const addLine = () =>
    setLines((l) => [...l, { id: uid(), description: "", originalAmount: 0, adjustmentAmount: 0, vatRate: 15 }]);
  const removeLine = (id: string) => setLines((l) => l.filter((r) => r.id !== id));
  const updateLine = (id: string, patch: Partial<LineRow>) =>
    setLines((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  /* ── Save ── */
  const buildPayload = (asDraft: boolean) => ({
    noteType,
    date,
    branch,
    status: asDraft ? "Draft" : "Pending",
    adjustmentAgainst,
    billingAccount,
    customer,
    currency,
    invoiceNo,
    invoiceDate,
    waybillNo,
    reference,
    exchangeRate,
    waybills,
    lines,
    comments,
    subtotal,
    totalVat,
    grandTotal,
  });

  const handleSave = async (asDraft: boolean) => {
    if (!billingAccount) {
      setErrorMsg("Please select a billing account.");
      return;
    }
    if (!reference.trim()) {
      setErrorMsg("Please provide a reference / reason.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");
      const payload = buildPayload(asDraft);
      const res = initialData?._id
        ? await apiPut<{ success: boolean; data: any }>(`/api/credit-debit-notes/${initialData._id}`, payload)
        : await apiPost<{ success: boolean; data: any }>("/api/credit-debit-notes", payload);
      if (res.success) {
        onSaved?.(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save Credit/Debit note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create Debit / Credit Note</h1>
          <p className="mt-0.5 text-sm text-gray-500">Create a new debit note or credit note</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Note Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionHeader>Note Information</SectionHeader>

          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="sm:col-span-1">
              <label className={labelCls}>Note Type <Required /></label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNoteType("Credit")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition ${
                    noteType === "Credit" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Credit Note
                </button>
                <button
                  type="button"
                  onClick={() => setNoteType("Debit")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-semibold transition ${
                    noteType === "Debit" ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Debit Note
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Note No.</label>
              <input disabled value={initialData?.noteNo || `${noteType === "Credit" ? "CN" : "DN"}-2026-000123`} className={inputDisabledCls} />
            </div>

            <div>
              <label className={labelCls}>Date <Required /></label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} pl-9`} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Branch <Required /></label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className={`${inputCls} appearance-none`}>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Status</label>
              <span className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ${STATUS_CONFIG[status]}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className={labelCls}>Adjustment Against <Required /></label>
              <div className="flex items-center gap-5 py-2">
                {(["Invoice", "Waybill"] as AdjustmentAgainst[]).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={adjustmentAgainst === opt}
                      onChange={() => setAdjustmentAgainst(opt)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Billing Account <Required /></label>
              <div className="flex items-center gap-2">
                <select
                  value={billingAccount}
                  onChange={(e) => {
                    setBillingAccount(e.target.value);
                    const match = BILLING_ACCOUNTS.find((a) => `${a.code} - ${a.name}` === e.target.value);
                    if (match) setCustomer(match.name);
                  }}
                  className={`${inputCls} appearance-none`}
                >
                  {BILLING_ACCOUNTS.map((a) => (
                    <option key={a.code} value={`${a.code} - ${a.name}`}>{a.code} - {a.name}</option>
                  ))}
                </select>
                <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Customer</label>
              <input disabled value={customer} className={inputDisabledCls} />
            </div>

            <div>
              <label className={labelCls}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputCls} appearance-none`}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div>
              <label className={labelCls}>Invoice No. <Required /></label>
              <div className="relative">
                <input
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="INV-2026-000000"
                  className={`${inputCls} pr-9`}
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Invoice Date</label>
              <div className="relative">
                <input value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={`${inputCls} pr-9`} />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Waybill No. (Optional)</label>
              <div className="relative">
                <input
                  value={waybillNo}
                  onChange={(e) => setWaybillNo(e.target.value)}
                  placeholder="WB-2026-000000"
                  className={`${inputCls} pr-9`}
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Reference / Reason <Required /></label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Overcharge on fuel levy"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Exchange Rate</label>
              <input
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">1 {currency.split(" - ")[0]} = {exchangeRate.toFixed(4)} ZAR</p>
            </div>
          </div>
        </div>

        {/* Affected Waybills */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionHeader
            action={
              <button
                onClick={addWaybill}
                className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add Waybill
              </button>
            }
          >
            Affected Waybill(s)
          </SectionHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">#</th>
                  <th className="py-2.5 px-3">Waybill No.</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">From</th>
                  <th className="py-2.5 px-3">To</th>
                  <th className="py-2.5 px-3 text-right">Original Amount (Excl. VAT)</th>
                  <th className="py-2.5 px-3 text-right">Adjustment Amount (Excl. VAT)</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waybills.map((w, idx) => (
                  <tr key={w.id}>
                    <td className="py-3 px-3 text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-blue-600">{w.waybillNo || "—"}</td>
                    <td className="py-3 px-3 text-gray-600">{w.date || "—"}</td>
                    <td className="py-3 px-3 text-gray-600">{w.from || "—"}</td>
                    <td className="py-3 px-3 text-gray-600">{w.to || "—"}</td>
                    <td className="py-3 px-3 text-right text-gray-700">{fmtAmount(w.originalAmount)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900">{fmtAmount(w.adjustmentAmount)}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => removeWaybill(w.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {waybills.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-gray-400">No waybills added.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-400">Showing {waybills.length} of {waybills.length} waybill(s)</p>
        </div>

        {/* Adjustment Lines */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionHeader
            action={
              <button
                onClick={addLine}
                className="flex items-center gap-1.5 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add Line
              </button>
            }
          >
            Adjustment Lines (Details)
          </SectionHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-lg">#</th>
                  <th className="py-2.5 px-3">Charge Description</th>
                  <th className="py-2.5 px-3 text-right">Original Amount (Excl. VAT)</th>
                  <th className="py-2.5 px-3 text-right">Adjustment Amount (Excl. VAT)</th>
                  <th className="py-2.5 px-3 text-center">VAT Rate</th>
                  <th className="py-2.5 px-3 text-right">VAT Amount</th>
                  <th className="py-2.5 px-3 text-right">Total (Incl. VAT)</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineTotals.map((l, idx) => (
                  <tr key={l.id}>
                    <td className="py-3 px-3 text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <input
                        value={l.description}
                        onChange={(e) => updateLine(l.id, { description: e.target.value })}
                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 font-semibold text-gray-900 focus:border-gray-300 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700">{fmtAmount(l.originalAmount)}</td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={l.adjustmentAmount}
                        onChange={(e) => updateLine(l.id, { adjustmentAmount: Number(e.target.value) })}
                        className="w-28 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select
                        value={l.vatRate}
                        onChange={(e) => updateLine(l.id, { vatRate: Number(e.target.value) })}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none"
                      >
                        {VAT_RATES.map((r) => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700">{fmtAmount(l.vatAmount)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900">{fmtAmount(l.total)}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => removeLine(l.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-sm text-gray-400">No adjustment lines added.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-400">Showing {lines.length} of {lines.length} line(s)</p>
        </div>

        {/* Comments & Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SectionHeader>Comments &amp; Attachments</SectionHeader>

            <label className={labelCls}>Comments</label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments about this note..."
              className={`${inputCls} resize-none`}
            />

            <label className={`${labelCls} mt-4`}>Attachments</label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Paperclip className="h-4 w-4" /> Choose File
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || "")}
                />
              </label>
              <span className="text-sm text-gray-400">{attachmentName || "No file chosen"}</span>
              <span className="ml-auto text-xs text-gray-400">PDF, JPG, PNG (Max. 5MB)</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <SectionHeader>Summary</SectionHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal (Excl. VAT)</span>
                <span className="font-medium text-gray-900">{fmtAmount(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Total VAT</span>
                <span className="font-medium text-gray-900">{fmtAmount(totalVat)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-base font-bold text-gray-900">Grand Total (Incl. VAT)</span>
                <span className="text-xl font-bold text-red-600">{fmtAmount(grandTotal)}</span>
              </div>
              <div className="flex items-start gap-2 pt-1 text-xs font-medium text-red-500">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  This is a {noteType.toLowerCase()} note. Amount will be {noteType === "Credit" ? "deducted from" : "added to"} the invoice.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
            <Printer className="h-4 w-4" /> Preview / Print
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
            <Mail className="h-4 w-4" /> Email to Customer
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            More Actions <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
