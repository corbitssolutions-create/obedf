"use client";

import React from "react";
import {
  FileText,
  Printer,
  Upload,
  Send,
  AlertTriangle,
  X,
  Box,
  PackageCheck,
  Search,
  Weight,
  ArrowUpFromLine,
  Info,
  RefreshCw,
  ScanLine,
  ClipboardList,
  Truck,
  CheckSquare,
  ClipboardCheck,
  ClipboardEdit,
  PackageX,
  ChevronDown,
  Calendar,
} from "lucide-react";

type ScanRow = {
  time: string;
  parcelNo: string;
  waybillNo: string;
  result: string;
  condition: string;
};

type MissingParcel = {
  parcelNo: string;
  waybillNo: string;
  consignee: string;
  expected: string;
};

type WaybillRow = {
  no: number;
  waybillNo: string;
  consignor: string;
  consigneeBranch: string;
  parcelsExpected: number;
  parcelsScanned: number;
  status: "Completed" | "Missing";
};

const recentlyScanned: ScanRow[] = [
  { time: "12:12:45", parcelNo: "PRC00012479", waybillNo: "WB00012347", result: "Scanned", condition: "Good" },
  { time: "12:12:12", parcelNo: "PRC00012478", waybillNo: "WB00012347", result: "Scanned", condition: "Good" },
  { time: "12:11:40", parcelNo: "PRC00012477", waybillNo: "WB00012347", result: "Scanned", condition: "Good" },
  { time: "12:11:08", parcelNo: "PRC00012476", waybillNo: "WB00012347", result: "Scanned", condition: "Good" },
  { time: "12:10:35", parcelNo: "PRC00012475", waybillNo: "WB00012347", result: "Scanned", condition: "Good" },
  { time: "12:10:05", parcelNo: "PRC00012474", waybillNo: "WB00012346", result: "Scanned", condition: "Good" },
  { time: "12:09:33", parcelNo: "PRC00012473", waybillNo: "WB00012346", result: "Scanned", condition: "Good" },
  { time: "12:09:01", parcelNo: "PRC00012472", waybillNo: "WB00012346", result: "Scanned", condition: "Good" },
  { time: "12:08:28", parcelNo: "PRC00012471", waybillNo: "WB00012345", result: "Scanned", condition: "Good" },
  { time: "12:07:55", parcelNo: "PRC00012470", waybillNo: "WB00012345", result: "Scanned", condition: "Good" },
];

const missingParcels: MissingParcel[] = [
  { parcelNo: "PRC00012501", waybillNo: "WB00012350", consignee: "Builders Warehouse", expected: "Cape Town DC" },
  { parcelNo: "PRC00012502", waybillNo: "WB00012351", consignee: "Takealot", expected: "Cape Town DC" },
  { parcelNo: "PRC00012503", waybillNo: "WB00012352", consignee: "Pick n Pay", expected: "Cape Town DC" },
  { parcelNo: "PRC00012504", waybillNo: "WB00012353", consignee: "Game Stores", expected: "Cape Town DC" },
  { parcelNo: "PRC00012505", waybillNo: "WB00012354", consignee: "Makro (Pty) Ltd", expected: "Cape Town DC" },
  { parcelNo: "PRC00012506", waybillNo: "WB00012355", consignee: "Builders Warehouse", expected: "Cape Town DC" },
  { parcelNo: "PRC00012507", waybillNo: "WB00012356", consignee: "Takealot", expected: "Cape Town DC" },
  { parcelNo: "PRC00012508", waybillNo: "WB00012357", consignee: "Pick n Pay", expected: "Cape Town DC" },
];

const waybills: WaybillRow[] = [
  { no: 1, waybillNo: "WB00012345", consignor: "Mekro (Pty) Ltd", consigneeBranch: "Cape Town DC", parcelsExpected: 25, parcelsScanned: 25, status: "Completed" },
  { no: 2, waybillNo: "WB00012346", consignor: "Builders Warehouse", consigneeBranch: "Cape Town DC", parcelsExpected: 18, parcelsScanned: 18, status: "Completed" },
  { no: 3, waybillNo: "WB00012347", consignor: "Takealot", consigneeBranch: "Cape Town DC", parcelsExpected: 25, parcelsScanned: 25, status: "Completed" },
  { no: 4, waybillNo: "WB00012348", consignor: "Pick n Pay", consigneeBranch: "Cape Town DC", parcelsExpected: 10, parcelsScanned: 10, status: "Completed" },
  { no: 5, waybillNo: "WB00012349", consignor: "Game Stores", consigneeBranch: "Cape Town DC", parcelsExpected: 15, parcelsScanned: 15, status: "Completed" },
];

const workflowSteps = [
  { label: "Draft", sub: "Create manifest", icon: FileText, state: "done" },
  { label: "Review", sub: "Review details", icon: ClipboardCheck, state: "done" },
  { label: "Scan & Load", sub: "Scan waybills & parcels", icon: ScanLine, state: "active" },
  { label: "Ready for Transfer", sub: "Lock & Seal", icon: ClipboardEdit, state: "todo" },
  { label: "In Transit", sub: "On the way", icon: Truck, state: "todo" },
  { label: "Received", sub: "At destination", icon: ClipboardList, state: "todo" },
  { label: "Completed", sub: "Closed", icon: CheckSquare, state: "todo" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-gray-500 mb-1">{children}</label>;
}

function StaticInput({
  value,
  icon,
}: {
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 bg-white flex items-center justify-between">
        <span>{value}</span>
        {icon}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor = "text-gray-900",
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${iconBg} ${iconColor} shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 leading-tight">{label}</div>
        <div className={`text-lg font-semibold leading-tight ${valueColor}`}>{value}</div>
      </div>
    </div>
  );
}

export default function SenderBranchTransferManifest() {
  const totalExpected = 2520;
  const totalScanned = 2512;
  const notScanned = 8;
  const pct = ((totalScanned / totalExpected) * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            SENDER BRANCH TRANSFER MANIFEST
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage manifest for transfer to another branch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText className="w-4 h-4" />
            Save Draft
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Printer className="w-4 h-4" />
            Print Manifest
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <Send className="w-4 h-4" />
            Transfer / Dispatch
          </button>
        </div>
      </div>

      {/* Alert banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          PARCEL ALERT: 8 parcel(s) expected but not scanned. Please scan remaining parcels before transferring.
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-red-700">
            View Missing Parcels
          </button>
          <X className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* Row: Manifest Details + Transfer Summary */}
      <div className="grid grid-cols-3 gap-5 mb-5 items-start">
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
            <span className="text-blue-600">1.</span> Manifest Details
          </h2>
          <div className="grid grid-cols-3 gap-x-4 gap-y-4">
            <div>
              <FieldLabel>Manifest No.</FieldLabel>
              <StaticInput value="TMF2507140001" />
            </div>
            <div>
              <FieldLabel>Manifest Date</FieldLabel>
              <StaticInput value="14/07/2026" icon={<Calendar className="w-4 h-4 text-gray-400" />} />
            </div>
            <div>
              <FieldLabel>From Branch (Sender)</FieldLabel>
              <StaticInput value="Johannesburg DC" icon={<ChevronDown className="w-4 h-4 text-gray-400" />} />
            </div>
            <div>
              <FieldLabel>To Branch (Receiver)</FieldLabel>
              <StaticInput value="Cape Town DC" icon={<ChevronDown className="w-4 h-4 text-gray-400" />} />
            </div>
            <div>
              <FieldLabel>Transfer Type</FieldLabel>
              <StaticInput value="Branch Transfer" icon={<ChevronDown className="w-4 h-4 text-gray-400" />} />
            </div>
            <div />
            <div>
              <FieldLabel>Departure Date</FieldLabel>
              <StaticInput value="14/07/2026 14:00" icon={<Calendar className="w-4 h-4 text-gray-400" />} />
            </div>
            <div>
              <FieldLabel>Expected Arrival Date</FieldLabel>
              <StaticInput value="15/07/2026 08:00" icon={<Calendar className="w-4 h-4 text-gray-400" />} />
            </div>
            <div>
              <FieldLabel>Vehicle No.</FieldLabel>
              <StaticInput value="CA 123 456" />
            </div>
            <div>
              <FieldLabel>Trailer No.</FieldLabel>
              <StaticInput value="CA 789 101" />
            </div>
            <div>
              <FieldLabel>Driver</FieldLabel>
              <StaticInput value="John Dlamini" />
            </div>
            <div>
              <FieldLabel>Assistant Driver</FieldLabel>
              <StaticInput value="Sipho Mthembu" />
            </div>
            <div>
              <FieldLabel>Created By</FieldLabel>
              <StaticInput value="Thabo Mokoena" />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <div className="border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                  In Progress
                </span>
              </div>
            </div>
            <div>
              <FieldLabel>Total Waybills</FieldLabel>
              <StaticInput value="118" />
            </div>
            <div>
              <FieldLabel>Total Parcels (Expected)</FieldLabel>
              <StaticInput value="2,520" />
            </div>
          </div>
          <div className="mt-4">
            <FieldLabel>Remarks / Special Instructions</FieldLabel>
            <div className="relative">
              <textarea
                readOnly
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-800 resize-none"
                rows={2}
                value="Handle with care. Ensure all parcels are properly secured. Seal vehicle after loading."
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-400">78 / 250</span>
            </div>
          </div>
        </div>

        {/* Transfer Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-4">2. Transfer Summary</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-3 mb-4">
            <StatCard
              icon={<FileText className="w-4 h-4" />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              label="Total Waybills"
              value="118"
            />
            <StatCard
              icon={<Box className="w-4 h-4" />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="Total Parcels (Expected)"
              value="2,520"
            />
            <StatCard
              icon={<PackageCheck className="w-4 h-4" />}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="Total Parcels (Scanned)"
              value="2,512"
              valueColor="text-emerald-600"
            />
            <StatCard
              icon={<Search className="w-4 h-4" />}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="Not Scanned"
              value="8"
              valueColor="text-red-500"
            />
            <StatCard
              icon={<Weight className="w-4 h-4" />}
              iconBg="bg-gray-100"
              iconColor="text-gray-600"
              label="Total Parcels"
              value="1,890.60 kg"
            />
            <StatCard
              icon={<ArrowUpFromLine className="w-4 h-4" />}
              iconBg="bg-gray-100"
              iconColor="text-gray-600"
              label="Total Volume"
              value="12.85 m³"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <div className="text-xs text-gray-400 mb-2">Transfer Information</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transfer Mode</span>
                  <span className="text-gray-800 font-medium">Road</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transit Time (Est.)</span>
                  <span className="text-gray-800 font-medium">18h 0m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance (Est.)</span>
                  <span className="text-gray-800 font-medium">1,400 km</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Manifest Status</span>
            </div>
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded mb-2">
              In Progress
            </span>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">{pct}%</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <div className="text-xs text-gray-400">Seal No.</div>
              <div className="text-gray-800 font-medium">SL250714001</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Seal Date & Time</div>
              <div className="text-gray-800 font-medium">14/07/2026 13:45</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Scan / Recently Scanned / Missing Parcels */}
      <div className="grid grid-cols-3 gap-5 mb-5 items-start">
        {/* Scan Waybill or Parcel */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-blue-700 mb-4">3. Scan Waybill or Parcel</h2>
          <div className="flex gap-2 mb-3">
            <button className="flex-1 border border-gray-300 rounded-md py-2 text-sm font-medium text-gray-600 bg-white">
              Scan Waybill
            </button>
            <button className="flex-1 rounded-md py-2 text-sm font-medium text-white bg-blue-600">
              Scan Parcel
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 relative">
              <ScanLine className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                readOnly
                placeholder="Scan parcel barcode or enter parcel no."
                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-500"
              />
            </div>
            <button className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md">Scan</button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            You can also click "Receive Damaged" if parcel is not in good condition.
          </p>
          <button className="w-full flex items-center justify-center gap-2 border border-orange-200 bg-orange-50 text-orange-600 text-sm font-medium rounded-md py-2 mb-4">
            <PackageX className="w-4 h-4" />
            Receive Damaged Parcel
          </button>

          <div className="border-t border-gray-100 pt-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Last Scan</div>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>
                <div className="text-xs text-gray-400">Parcel No.</div>
                <div className="text-gray-800">PRC00012479</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Scanned At</div>
                <div className="text-gray-800">14/07/2026 12:12:45</div>
              </div>
              <div>
                <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded">
                  Scanned
                </span>
              </div>
              <div />
              <div>
                <div className="text-xs text-gray-400">Waybill No.</div>
                <div className="text-gray-800">WB00012347</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Scanned */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-blue-700">4. Recently Scanned (Last 10)</h2>
            <button className="text-xs text-blue-600 font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left font-medium pb-2">Time</th>
                  <th className="text-left font-medium pb-2">Parcel No.</th>
                  <th className="text-left font-medium pb-2">Waybill No.</th>
                  <th className="text-left font-medium pb-2">Result</th>
                  <th className="text-left font-medium pb-2">Condition</th>
                </tr>
              </thead>
              <tbody>
                {recentlyScanned.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-600">{row.time}</td>
                    <td className="py-1.5 text-gray-600">{row.parcelNo}</td>
                    <td className="py-1.5 text-gray-600">{row.waybillNo}</td>
                    <td className="py-1.5">
                      <span className="text-emerald-600 font-medium">{row.result}</span>
                    </td>
                    <td className="py-1.5">
                      <span className="text-emerald-600 font-medium">{row.condition}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing Parcels */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-blue-700">5. Missing Parcels</h2>
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">8</span>
          </div>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left font-medium pb-2">Parcel No.</th>
                  <th className="text-left font-medium pb-2">Waybill No.</th>
                  <th className="text-left font-medium pb-2">Consignee</th>
                  <th className="text-left font-medium pb-2">Expected</th>
                </tr>
              </thead>
              <tbody>
                {missingParcels.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-600">{row.parcelNo}</td>
                    <td className="py-1.5 text-gray-600">{row.waybillNo}</td>
                    <td className="py-1.5 text-gray-600">{row.consignee}</td>
                    <td className="py-1.5 text-gray-600">{row.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-md px-3 py-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div className="text-xs text-red-600">
              <div className="font-semibold">8 parcel(s) expected but not scanned.</div>
              <div>Please scan all remaining parcels before transferring the manifest.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row: Waybills table + Manifest Totals + Actions */}
      <div className="grid grid-cols-3 gap-5 mb-5 items-start">
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-blue-700">6. Waybills in Transfer Manifest (118)</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  readOnly
                  placeholder="Search waybill..."
                  className="border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-gray-500 w-44"
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
                  <th className="text-left font-medium pb-2">#</th>
                  <th className="text-left font-medium pb-2">Waybill No.</th>
                  <th className="text-left font-medium pb-2">Consignor</th>
                  <th className="text-left font-medium pb-2">Consignee Branch</th>
                  <th className="text-left font-medium pb-2">Parcels (Expected)</th>
                  <th className="text-left font-medium pb-2">Parcels (Scanned)</th>
                  <th className="text-left font-medium pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {waybills.map((row) => (
                  <tr key={row.no} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{row.no}</td>
                    <td className="py-2 text-gray-600">{row.waybillNo}</td>
                    <td className="py-2 text-gray-600">{row.consignor}</td>
                    <td className="py-2 text-gray-600">{row.consigneeBranch}</td>
                    <td className="py-2 text-gray-600">{row.parcelsExpected}</td>
                    <td className="py-2 text-gray-600">{row.parcelsScanned}</td>
                    <td className="py-2">
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-2 font-semibold text-gray-700" colSpan={4}>
                    TOTAL
                  </td>
                  <td className="pt-2 font-semibold text-gray-700">118</td>
                  <td className="pt-2 font-semibold text-gray-700">110</td>
                  <td className="pt-2">
                    <span className="inline-block bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded">
                      8 Missing
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Manifest Totals */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-blue-700 mb-4">7. Manifest Totals</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-gray-100 rounded-md p-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs text-gray-400">Total Waybills</div>
                  <div className="text-base font-semibold text-gray-900">118</div>
                </div>
              </div>
              <div className="border border-gray-100 rounded-md p-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs text-gray-400">Total Parcels (Expected)</div>
                  <div className="text-base font-semibold text-gray-900">2,520</div>
                </div>
              </div>
              <div className="border border-gray-100 rounded-md p-3 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs text-gray-400">Total Parcels (Scanned)</div>
                  <div className="text-base font-semibold text-gray-900">2,512</div>
                </div>
              </div>
              <div className="border border-gray-100 rounded-md p-3 flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-400">Total Weight</div>
                  <div className="text-base font-semibold text-gray-900">1,890.60 kg</div>
                </div>
              </div>
              <div className="border border-gray-100 rounded-md p-3 flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-400">Total Volume</div>
                  <div className="text-base font-semibold text-gray-900">12.85 m³</div>
                </div>
              </div>
              <div className="border border-red-100 bg-red-50 rounded-md p-3 flex items-center gap-2">
                <PackageX className="w-4 h-4 text-red-500" />
                <div>
                  <div className="text-xs text-red-400">Not Scanned Parcels</div>
                  <div className="text-base font-semibold text-red-600">8</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-blue-700 mb-2">8. Actions</h2>
            <p className="text-xs text-gray-500 mb-4">
              You must scan all parcels. Once all parcels are scanned, you can transfer this manifest.
            </p>
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium rounded-md py-2 mb-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Totals
            </button>
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-md py-2 cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Transfer / Dispatch
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">(Available after scanning all parcels)</p>
          </div>
        </div>
      </div>

      {/* Workflow + Important Notes */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-6">Workflow</h2>
          <div className="flex items-start">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              const isDone = step.state === "done";
              const isActive = step.state === "active";
              return (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center w-24 text-center">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
                        isActive
                          ? "border-blue-600 text-blue-600 bg-blue-50"
                          : isDone
                          ? "border-gray-300 text-gray-400 bg-white"
                          : "border-gray-200 text-gray-300 bg-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div
                      className={`text-xs font-medium mt-2 ${
                        isActive ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-[11px] text-gray-400">{step.sub}</div>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <div className="flex-1 border-t-2 border-dotted border-gray-200 mt-5 mx-1" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-100 p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-blue-700 flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" />
              Important Notes
            </h2>
            <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
              <li>Scan all waybills and parcels before transferring.</li>
              <li>Ensure all parcels are loaded and seal is applied.</li>
              <li>Manifest will be available to the receiving branch after dispatch.</li>
              <li>Print manifest and attach to shipment documents.</li>
            </ul>
          </div>
          <div className="flex justify-end mt-4">
            <Truck className="w-16 h-16 text-blue-300" />
          </div>
        </div>
      </div>
    </div>
  );
}