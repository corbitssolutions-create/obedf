"use client";

import React, { useState } from "react";
import {
  FileText,
  Printer,
  CheckCircle2,
  ScanLine,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  HelpCircle,
  Timer,
  ShieldCheck,
  Package,
  Lock,
} from "lucide-react";

type ScanRow = {
  time: string;
  barcode: string;
  type: "Parcel" | "Waybill";
  waybillNo: string;
  result: "Received" | "Damaged";
};

type WaybillRow = {
  waybillNo: string;
  expected: number;
  received: number;
  status: "Complete" | "Partial" | "Not Received";
  exceptionCount?: number;
  exceptions: string;
};

type ExceptionRow = {
  parcelNo: string;
  waybillNo: string;
  issue: "Missing" | "Damaged" | "Unknown";
  action: string;
  actionColor: string;
};

const recentlyScanned: ScanRow[] = [
  { time: "09:22:18", barcode: "PRC00012348", type: "Parcel", waybillNo: "WB00012347", result: "Received" },
  { time: "09:21:45", barcode: "PRC00012347", type: "Parcel", waybillNo: "WB00012347", result: "Received" },
  { time: "09:21:10", barcode: "PRC00012346", type: "Parcel", waybillNo: "WB00012346", result: "Received" },
  { time: "09:20:55", barcode: "WB00012345", type: "Waybill", waybillNo: "-", result: "Received" },
  { time: "09:20:30", barcode: "PRC00012345", type: "Parcel", waybillNo: "WB00012345", result: "Received" },
  { time: "09:19:58", barcode: "PRC00012344", type: "Parcel", waybillNo: "WB00012345", result: "Damaged" },
];

const waybills: WaybillRow[] = [
  { waybillNo: "WB00012345", expected: 25, received: 25, status: "Complete", exceptions: "-" },
  { waybillNo: "WB00012346", expected: 18, received: 17, status: "Partial", exceptionCount: 1, exceptions: "1 Missing" },
  { waybillNo: "WB00012347", expected: 12, received: 12, status: "Complete", exceptions: "-" },
  { waybillNo: "WB00012348", expected: 10, received: 10, status: "Complete", exceptions: "-" },
  { waybillNo: "WB00012349", expected: 15, received: 0, status: "Not Received", exceptions: "-" },
];

const exceptions: ExceptionRow[] = [
  { parcelNo: "PRC00012346", waybillNo: "WB00012346", issue: "Missing", action: "Mark Missing", actionColor: "text-blue-600" },
  { parcelNo: "PRC00012350", waybillNo: "WB00012346", issue: "Missing", action: "Mark Missing", actionColor: "text-blue-600" },
  { parcelNo: "PRC00012351", waybillNo: "WB00012347", issue: "Missing", action: "Mark Missing", actionColor: "text-blue-600" },
  { parcelNo: "PRC00012344", waybillNo: "WB00012345", issue: "Damaged", action: "Capture Damage", actionColor: "text-blue-600" },
  { parcelNo: "PRC00012352", waybillNo: "WB00012348", issue: "Damaged", action: "Capture Damage", actionColor: "text-blue-600" },
  { parcelNo: "PRC00012360", waybillNo: "-", issue: "Unknown", action: "Assign Waybill", actionColor: "text-blue-600" },
];

function StatusBadge({ status }: { status: WaybillRow["status"] }) {
  if (status === "Complete") {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-medium px-2 py-1 rounded">
        <CheckCircle className="w-3.5 h-3.5" />
        Complete
      </span>
    );
  }
  if (status === "Partial") {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-medium px-2 py-1 rounded">
        <AlertCircle className="w-3.5 h-3.5" />
        Partial (1)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-2 py-1 rounded">
      <AlertCircle className="w-3.5 h-3.5" />
      Not Received
    </span>
  );
}

function IssueBadge({ issue }: { issue: ExceptionRow["issue"] }) {
  const styles: Record<ExceptionRow["issue"], string> = {
    Missing: "bg-red-50 text-red-600",
    Damaged: "bg-orange-50 text-orange-600",
    Unknown: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${styles[issue]}`}>{issue}</span>
  );
}

function SummaryRow({
  label,
  value,
  valueColor = "text-gray-900",
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-lg font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}

export default function TransferReceiptBranchTransferDebrief() {
  const [activeTab, setActiveTab] = useState<"All" | "Missing" | "Damaged" | "Unknown">("All");

  const filteredExceptions =
    activeTab === "All" ? exceptions : exceptions.filter((e) => e.issue === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Transfer Receipt / Branch Transfer Debrief
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Receive and confirm waybills and parcels from branch transfer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText className="w-4 h-4 text-blue-600" />
            Save Progress
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Printer className="w-4 h-4 text-gray-600" />
            Print Receipt
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <CheckCircle2 className="w-4 h-4" />
            Complete Receipt
          </button>
        </div>
      </div>

      {/* Row: Transfer Details + Receipt Summary */}
      <div className="grid grid-cols-2 gap-5 mb-5 items-start">
        {/* Transfer Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            1. Transfer Details
          </h2>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Transfer No.</div>
              <div className="text-sm font-semibold text-gray-900">BT00012345</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Departure Date</div>
              <div className="text-sm font-semibold text-gray-900">13/07/2026 08:00</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Vehicle</div>
              <div className="text-sm font-semibold text-gray-900">CA 123 456</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Origin Branch</div>
              <div className="text-sm font-semibold text-gray-900">Johannesburg DC</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Arrival Date</div>
              <div className="text-sm font-semibold text-gray-900">14/07/2026 18:00</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Trailer</div>
              <div className="text-sm font-semibold text-gray-900">CA 789 101</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Receiving Branch</div>
              <div className="text-sm font-semibold text-gray-900">Cape Town DC</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Driver</div>
              <div className="text-sm font-semibold text-gray-900">John Dlamini</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Status</div>
              <span className="inline-block bg-orange-50 text-orange-600 text-xs font-semibold px-2 py-1 rounded">
                Awaiting Receipt
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            2. Receipt Summary
          </h2>
          <div className="grid grid-cols-3 gap-x-6">
            <div className="divide-y divide-gray-50">
              <SummaryRow label="Expected Waybills" value="118" />
              <SummaryRow label="Received Waybills" value="115" valueColor="text-emerald-600" />
              <SummaryRow label="Partial Waybills" value="2" valueColor="text-orange-500" />
              <SummaryRow label="Missing Waybills" value="1" valueColor="text-red-500" />
            </div>
            <div className="divide-y divide-gray-50">
              <SummaryRow label="Expected Parcels" value="2,520" />
              <SummaryRow label="Received Parcels" value="2,516" valueColor="text-emerald-600" />
              <SummaryRow label="Missing Parcels" value="4" valueColor="text-red-500" />
              <SummaryRow label="Extra Parcels" value="0" />
            </div>
            <div>
              <div className="divide-y divide-gray-50">
                <SummaryRow label="Damaged Parcels" value="2" />
                <SummaryRow label="Unknown Parcels" value="0" />
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-lg font-semibold text-emerald-600">99%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${i < 23 ? "bg-emerald-500" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-2">Last scanned: 14/07/2026 09:22</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Scan + Recently Scanned */}
      <div className="grid grid-cols-2 gap-5 mb-5 items-start">
        {/* Scan Waybill or Parcel */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <ScanLine className="w-4 h-4" />
            3. Scan Waybill or Parcel
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <ScanLine className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                readOnly
                placeholder="Scan waybill or parcel barcode or enter number..."
                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-3 text-sm text-gray-500"
              />
            </div>
            <button className="bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-md whitespace-nowrap">
              Receive
            </button>
          </div>
          <p className="text-xs text-gray-400">Scan a waybill or parcel to record as received.</p>
        </div>

        {/* Recently Scanned */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            4. Recently Scanned
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left font-medium pb-2">Time</th>
                  <th className="text-left font-medium pb-2">Barcode</th>
                  <th className="text-left font-medium pb-2">Type</th>
                  <th className="text-left font-medium pb-2">Waybill No.</th>
                  <th className="text-left font-medium pb-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentlyScanned.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{row.time}</td>
                    <td className="py-2 text-gray-600">{row.barcode}</td>
                    <td className="py-2">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                          row.type === "Parcel" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">{row.waybillNo}</td>
                    <td className="py-2">
                      {row.result === "Received" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-medium px-2 py-0.5 rounded">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Received
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-2 py-0.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Damaged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row: Waybills table + Parcel Exceptions */}
      <div className="grid grid-cols-2 gap-5 mb-5 items-start">
        {/* Waybills in this Transfer */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              5. Waybills in this Transfer (118)
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  readOnly
                  placeholder="Search waybill..."
                  className="border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-gray-500 w-36"
                />
              </div>
              <button className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1.5 text-xs text-gray-600">
                All Status
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left font-medium pb-2">Waybill No.</th>
                  <th className="text-left font-medium pb-2">Parcels (Expected)</th>
                  <th className="text-left font-medium pb-2">Parcels (Received)</th>
                  <th className="text-left font-medium pb-2">Status</th>
                  <th className="text-left font-medium pb-2">Exceptions</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {waybills.map((row) => (
                  <tr key={row.waybillNo} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-800 font-medium">{row.waybillNo}</td>
                    <td className="py-2.5 text-gray-600">{row.expected}</td>
                    <td className="py-2.5 text-gray-600">{row.received}</td>
                    <td className="py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-2.5">
                      <span className={row.exceptions === "-" ? "text-gray-400" : "text-red-500 font-medium"}>
                        {row.exceptions}
                      </span>
                    </td>
                    <td className="py-2.5 text-right pr-1">
                      <ChevronRight className="w-4 h-4 text-gray-300 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-2.5 font-semibold text-gray-700">TOTAL</td>
                  <td className="pt-2.5 font-semibold text-gray-700">80</td>
                  <td className="pt-2.5 font-semibold text-gray-700">64</td>
                  <td className="pt-2.5 text-gray-400">-</td>
                  <td className="pt-2.5 text-gray-400">-</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Parcel Exceptions */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            6. Parcel Exceptions (6)
          </h2>
          <div className="flex items-center gap-6 border-b border-gray-100 mb-3 text-sm">
            {(["All", "Missing", "Damaged", "Unknown"] as const).map((tab) => {
              const count = tab === "All" ? 6 : tab === "Missing" ? 4 : tab === "Damaged" ? 2 : 0;
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 -mb-px border-b-2 font-medium ${
                    active
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left font-medium pb-2">Parcel No.</th>
                  <th className="text-left font-medium pb-2">Waybill No.</th>
                  <th className="text-left font-medium pb-2">Issue</th>
                  <th className="text-left font-medium pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredExceptions.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-800">{row.parcelNo}</td>
                    <td className="py-2.5 text-gray-600">{row.waybillNo}</td>
                    <td className="py-2.5">
                      <IssueBadge issue={row.issue} />
                    </td>
                    <td className="py-2.5">
                      <button className={`text-xs font-medium border border-blue-200 rounded px-2 py-1 ${row.actionColor}`}>
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transfer Outcome */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-blue-700 mb-4">7. Transfer Outcome (After Completion)</h2>
        <div className="grid grid-cols-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Waybills Complete</div>
              <div className="text-lg font-semibold text-gray-900">115</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Waybills Partial</div>
              <div className="text-lg font-semibold text-gray-900">2</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Waybills Missing</div>
              <div className="text-lg font-semibold text-gray-900">1</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Unknown Waybills</div>
              <div className="text-lg font-semibold text-gray-900">0</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Timer className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Damaged Parcels</div>
              <div className="text-lg font-semibold text-gray-900">2</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Transfer Status</div>
              <div className="text-base font-semibold text-emerald-600">Ready to Close</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}