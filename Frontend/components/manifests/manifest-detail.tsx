"use client";

import { useState, useEffect } from "react";
import {
  FilePlus2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  ScanLine,
  Undo2,
  XCircle,
  PackageX,
  ArrowRight,
} from "lucide-react";
import { apiGet } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type ParcelStatus = "Delivered" | "Returned" | "Damaged" | "Missing" | "Pending";

interface Parcel {
  id: string;
  status: ParcelStatus;
  reason?: string;
  comments?: string;
}

interface WaybillRow {
  _id: string;
  waybillNo: string;
  receiver: string;
  loaded: number;
  delivered: number;
  returned: number;
  damaged: number;
  missing: number;
  status: string;
  parcels: Parcel[];
}

interface ExceptionEntry {
  id: string;
  code: string; // parcel no or waybill no
  reason: string;
  timestamp: string;
}

interface ManifestDetail {
  _id: string;
  manifestNo: string;
  date: string;
  branch: string;
  route: string;
  driver: string;
  vehicle: string;
  departedAt: string;
  returnedAt: string;
  status: string;
  waybills: WaybillRow[];
  exceptions: ExceptionEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const STATUS_COLORS: Record<string, string> = {
  "In Debrief": "bg-amber-50 text-amber-700 border border-amber-200",
  "Partial": "bg-amber-50 text-amber-700 border border-amber-200",
  "Delivered": "bg-green-50 text-green-700 border border-green-200",
  "Completed": "bg-green-50 text-green-700 border border-green-200",
  "Open": "bg-gray-100 text-gray-600",
};

const PARCEL_STATUS_COLORS: Record<ParcelStatus, string> = {
  Delivered: "bg-green-50 text-green-700",
  Returned: "bg-red-50 text-red-600",
  Damaged: "bg-amber-50 text-amber-700",
  Missing: "bg-purple-50 text-purple-700",
  Pending: "bg-gray-100 text-gray-500",
};

const cardClass = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function ParcelStatusPill({ status }: { status: ParcelStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${PARCEL_STATUS_COLORS[status]}`}>
      {status}
    </span>
  );
}

// ─── Info cell in the header band ─────────────────────────────────────────────

function InfoCell({
  label,
  value,
  withIcon,
}: {
  label: string;
  value: string;
  withIcon?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      {withIcon ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5">
          <span className="truncate text-sm font-medium text-gray-800">{value}</span>
          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
        </div>
      ) : (
        <p className="truncate text-sm font-semibold text-gray-800">{value}</p>
      )}
    </div>
  );
}

// ─── Parcel sub-row (inside expanded waybill) ─────────────────────────────────

function ParcelDetailRow({
  parcel,
  onReverse,
}: {
  parcel: Parcel;
  onReverse: (parcelId: string) => void;
}) {
  const canReverse = parcel.status === "Returned" || parcel.status === "Damaged" || parcel.status === "Missing";
  return (
    <tr className="border-b border-gray-50 bg-blue-50/20 text-sm">
      <td className="py-2.5 pl-14 pr-3 font-mono font-medium text-gray-700">{parcel.id}</td>
      <td className="px-3 py-2.5">
        <ParcelStatusPill status={parcel.status} />
      </td>
      <td className="px-3 py-2.5 text-gray-600">{parcel.reason ?? "-"}</td>
      <td className="px-3 py-2.5 text-center text-gray-600">{parcel.comments ?? "-"}</td>
      <td className="px-3 py-2.5 text-right">
        {canReverse ? (
          <button
            onClick={() => onReverse(parcel.id)}
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <Undo2 className="h-3 w-3" />
            Reverse
          </button>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
      </td>
    </tr>
  );
}

// ─── Waybill row (collapsible) ────────────────────────────────────────────────

function WaybillTableRow({
  wb,
  expanded,
  onToggle,
  onReverseParcel,
}: {
  wb: WaybillRow;
  expanded: boolean;
  onToggle: () => void;
  onReverseParcel: (waybillId: string, parcelId: string) => void;
}) {
  return (
    <>
      <tr className="cursor-pointer border-b border-gray-50 text-sm hover:bg-blue-50/30" onClick={onToggle}>
        <td className="w-8 py-3.5 pl-3 text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-3 py-3.5 font-semibold text-blue-600">{wb.waybillNo}</td>
        <td className="px-3 py-3.5 text-gray-700">{wb.receiver}</td>
        <td className="px-3 py-3.5 text-center text-gray-700">{wb.loaded}</td>
        <td className="px-3 py-3.5 text-center text-gray-700">{wb.delivered}</td>
        <td className={`px-3 py-3.5 text-center font-semibold ${wb.returned > 0 ? "text-red-600" : "text-gray-700"}`}>
          {wb.returned}
        </td>
        <td className="px-3 py-3.5 text-center text-gray-700">{wb.damaged}</td>
        <td className="px-3 py-3.5 text-center text-gray-700">{wb.missing}</td>
        <td className="px-3 py-3.5">
          <StatusPill status={wb.status} />
        </td>
        <td className="px-3 py-3.5 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50"
          >
            <Eye className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={10} className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-2 pl-14 pr-3 text-left">Parcel No.</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Reason</th>
                  <th className="px-3 py-2 text-center">Comments</th>
                  <th className="px-3 py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wb.parcels.map((p) => (
                  <ParcelDetailRow key={p.id} parcel={p} onReverse={(pid) => onReverseParcel(wb._id, pid)} />
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Sidebar stat row ─────────────────────────────────────────────────────────

function SideStatRow({
  icon,
  label,
  value,
  valueClass = "text-gray-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-sm text-gray-600">
        {icon}
        {label}
      </div>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

// ─── Recent exception item ────────────────────────────────────────────────────

const EXCEPTION_BORDER: Record<string, string> = {
  Damaged: "border-amber-400",
  "Customer Refused": "border-red-400",
  "Incorrect Address": "border-purple-400",
  Missing: "border-purple-400",
  "Customer Closed": "border-orange-400",
};

function RecentExceptionItem({ exc }: { exc: ExceptionEntry }) {
  const borderClass = EXCEPTION_BORDER[exc.reason] ?? "border-gray-300";
  return (
    <div className={`border-l-4 ${borderClass} py-1 pl-3`}>
      <p className="text-sm font-semibold text-gray-800">{exc.code}</p>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">{exc.reason}</p>
        <p className="whitespace-nowrap text-xs text-gray-400">{fmtTime(exc.timestamp)}</p>
      </div>
    </div>
  );
}

// ─── Mock data (used until the API responds) ──────────────────────────────────

function mockManifest(id: string): ManifestDetail {
  return {
    _id: id,
    manifestNo: "DM00012345",
    date: "2026-07-13",
    branch: "Johannesburg DC",
    route: "JHB - CPT",
    driver: "John Dlamini",
    vehicle: "CA 123 456",
    departedAt: "2026-07-13T08:00:00",
    returnedAt: "2026-07-14T17:45:00",
    status: "In Debrief",
    exceptions: [
      { id: "e1", code: "PRC0000004", reason: "Damaged", timestamp: "2026-07-14T14:18:00" },
      { id: "e2", code: "PRC0000003", reason: "Customer Refused", timestamp: "2026-07-14T14:20:00" },
      { id: "e3", code: "WB00012346", reason: "Incorrect Address", timestamp: "2026-07-14T14:15:00" },
      { id: "e4", code: "PRC0000006", reason: "Missing", timestamp: "2026-07-14T14:10:00" },
      { id: "e5", code: "PRC0000007", reason: "Customer Closed", timestamp: "2026-07-14T14:05:00" },
    ],
    waybills: [
      {
        _id: "w1",
        waybillNo: "WB00012345",
        receiver: "Jet Park DC",
        loaded: 25,
        delivered: 23,
        returned: 2,
        damaged: 0,
        missing: 0,
        status: "Partial",
        parcels: [
          { id: "PRC0000001", status: "Delivered" },
          { id: "PRC0000002", status: "Delivered" },
          { id: "PRC0000003", status: "Returned", reason: "Customer Refused", comments: "Customer refused delivery" },
          { id: "PRC0000004", status: "Damaged", reason: "Damaged", comments: "Box damaged" },
          { id: "PRC0000005", status: "Delivered" },
        ],
      },
      {
        _id: "w2",
        waybillNo: "WB00012346",
        receiver: "Cape Town DC",
        loaded: 18,
        delivered: 17,
        returned: 1,
        damaged: 0,
        missing: 0,
        status: "Partial",
        parcels: [],
      },
      {
        _id: "w3",
        waybillNo: "WB00012347",
        receiver: "Durban DC",
        loaded: 12,
        delivered: 10,
        returned: 0,
        damaged: 1,
        missing: 0,
        status: "Partial",
        parcels: [],
      },
      {
        _id: "w4",
        waybillNo: "WB00012348",
        receiver: "Bloemfontein DC",
        loaded: 10,
        delivered: 6,
        returned: 4,
        damaged: 0,
        missing: 0,
        status: "Partial",
        parcels: [],
      },
      {
        _id: "w5",
        waybillNo: "WB00012349",
        receiver: "Polokwane DC",
        loaded: 15,
        delivered: 15,
        returned: 0,
        damaged: 0,
        missing: 0,
        status: "Delivered",
        parcels: [],
      },
    ],
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  manifestNo: string;
  manifestId: string;
  onBack: () => void;
}

export default function ManifestDetailPage({ manifestNo, manifestId, onBack }: Props) {
  const [manifest, setManifest] = useState<ManifestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWbs, setExpandedWbs] = useState<Set<string>>(new Set(["w1"]));

  const [waybillInput, setWaybillInput] = useState("");
  const [exceptionType, setExceptionType] = useState<"Parcel" | "Waybill">("Parcel");
  const [scanInput, setScanInput] = useState("");
  const [reason, setReason] = useState("");
  const [lastAction, setLastAction] = useState<{ code: string; reason: string; timestamp: string } | null>({
    code: "PRC0000004",
    reason: "Returned – Damaged",
    timestamp: "2026-07-14T14:18:00",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiGet<{ success: boolean; data: any }>(
          `/api/manifests/${manifestId}`
        );
        if (res.success && res.data) {
          const raw = res.data;

          // Map raw API waybills → WaybillRow shape the UI expects.
          // The DB waybill has: waybillNo, receiver, quantity, status, parcels[]
          // Loaded = quantity; delivered/returned/damaged/missing derived from status.
          const waybills: WaybillRow[] = (raw.waybills ?? []).map((wb: any) => {
            const qty: number = wb.quantity ?? wb.parcels?.length ?? 0;
            const isDelivered = wb.status === "Delivered";
            const parcels: Parcel[] = (wb.parcels ?? []).map((p: any) => ({
              id: p.id ?? p._id ?? "—",
              status: "Pending" as ParcelStatus,
              reason: undefined,
              comments: undefined,
            }));
            return {
              _id: wb._id,
              waybillNo: wb.waybillNo,
              receiver: wb.receiver,
              loaded: qty,
              delivered: isDelivered ? qty : 0,
              returned: 0,
              damaged: 0,
              missing: 0,
              status: wb.status,
              parcels,
            };
          });

          const mapped: ManifestDetail = {
            _id: raw._id,
            manifestNo: raw.manifestNo,
            date: raw.date ?? raw.createdAt,
            branch: raw.branch ?? "—",
            route: raw.route ?? "—",
            driver: raw.driver ?? "—",
            vehicle: raw.vehicle ?? "—",
            departedAt: raw.departedAt ?? raw.createdAt,
            returnedAt: raw.returnedAt ?? raw.updatedAt,
            status: raw.status ?? "Open",
            waybills,
            exceptions: raw.exceptions ?? [],
          };
          setManifest(mapped);
        } else {
          setManifest(mockManifest(manifestId));
        }
      } catch {
        // fall back to mock data so the UI still renders
        setManifest(mockManifest(manifestId));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [manifestId]);

  const toggleWb = (id: string) =>
    setExpandedWbs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleReverseParcel = (waybillId: string, parcelId: string) => {
    setManifest((m) => {
      if (!m) return m;
      const waybills = m.waybills.map((wb) => {
        if (wb._id !== waybillId) return wb;
        const parcels = wb.parcels.map((p) =>
          p.id === parcelId ? { ...p, status: "Delivered" as ParcelStatus, reason: undefined, comments: undefined } : p
        );
        return { ...wb, parcels };
      });
      return { ...m, waybills };
    });
  };

  const handleRecordException = () => {
    if (!scanInput || !reason) return;
    const entry = { code: scanInput, reason, timestamp: new Date().toISOString() };
    setLastAction(entry);
    setManifest((m) =>
      m
        ? {
            ...m,
            exceptions: [{ id: `e${Date.now()}`, ...entry }, ...m.exceptions],
          }
        : m
    );
    setScanInput("");
    setReason("");
  };

  const handleUndo = () => setLastAction(null);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = manifest
    ? (() => {
        const wbs = manifest.waybills;
        const totalWbs = wbs.length;
        const completed = wbs.filter((w) => w.status === "Delivered").length;
        const exceptionsCount = manifest.exceptions.length;
        const totalLoaded = wbs.reduce((s, w) => s + w.loaded, 0);
        const totalDelivered = wbs.reduce((s, w) => s + w.delivered, 0);
        const totalReturned = wbs.reduce((s, w) => s + w.returned, 0);
        const totalDamaged = wbs.reduce((s, w) => s + w.damaged, 0);
        const totalMissing = wbs.reduce((s, w) => s + w.missing, 0);
        return { totalWbs, completed, exceptionsCount, totalLoaded, totalDelivered, totalReturned, totalDamaged, totalMissing };
      })()
    : null;

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/60">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm">Loading manifest…</span>
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50/60">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">{error ?? "Manifest not found."}</p>
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/60 px-6 py-6">
      {/* ── Page header ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Manifest Debrief</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Scan waybills for successful delivery. Scan parcels or waybills under exceptions/returns.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <FilePlus2 className="h-4 w-4 text-gray-500" />
            Save Draft
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            <Printer className="h-4 w-4 text-gray-500" />
            Print Debrief
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
            <CheckCircle2 className="h-4 w-4" />
            Complete Debrief
          </button>
        </div>
      </div>

      {/* ── 1. Manifest Details ── */}
      <div className={`mb-5 ${cardClass}`}>
        <h2 className="mb-4 text-sm font-bold text-blue-600">1. Manifest Details</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-9">
          <InfoCell label="Manifest No." value={manifest.manifestNo} />
          <InfoCell label="Manifest Date" value={fmtDate(manifest.date)} withIcon />
          <InfoCell label="Branch" value={manifest.branch} />
          <InfoCell label="Route" value={manifest.route} />
          <InfoCell label="Driver" value={manifest.driver} />
          <InfoCell label="Vehicle" value={manifest.vehicle} />
          <InfoCell label="Departed" value={fmtDateTime(manifest.departedAt)} withIcon />
          <InfoCell label="Returned" value={fmtDateTime(manifest.returnedAt)} withIcon />
          <div className="min-w-0">
            <p className="mb-1 text-xs font-medium text-gray-500">Status</p>
            <StatusPill status={manifest.status} />
          </div>
        </div>
      </div>

      {/* ── 2 & 3. Scan sections ── */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 2. Record Delivered Waybills */}
        <div className={cardClass}>
          <h2 className="mb-4 text-sm font-bold text-blue-600">2. Record Delivered Waybills (Success)</h2>
          <p className="mb-1.5 text-xs font-medium text-gray-500">Scan Waybill</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={waybillInput}
                onChange={(e) => setWaybillInput(e.target.value)}
                placeholder="Scan or enter waybill number"
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-3 pr-9 text-sm placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <ScanLine className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
            </div>
            <button
              onClick={() => setWaybillInput("")}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* 3. Exceptions / Returns */}
        <div className={cardClass}>
          <h2 className="mb-4 text-sm font-bold text-red-600">3. Exceptions / Returns</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">Type</p>
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                <button
                  onClick={() => setExceptionType("Parcel")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    exceptionType === "Parcel" ? "bg-red-500 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  Parcel
                </button>
                <button
                  onClick={() => setExceptionType("Waybill")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    exceptionType === "Waybill" ? "bg-red-500 text-white" : "bg-white text-gray-600"
                  }`}
                >
                  Waybill
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">Scan Barcode</p>
              <div className="flex gap-1.5">
                <input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan parcel barcode"
                  className="w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
                <button className="flex-shrink-0 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                  Scan
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">Reason for Exception</p>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                <option value="">Select reason</option>
                <option value="Customer Refused">Customer Refused</option>
                <option value="Damaged">Damaged</option>
                <option value="Missing">Missing</option>
                <option value="Incorrect Address">Incorrect Address</option>
                <option value="Customer Closed">Customer Closed</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRecordException}
            className="mt-3 w-full rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 sm:w-auto sm:px-5"
          >
            Record Exception
          </button>

          {lastAction && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                <span>
                  <span className="font-semibold">{lastAction.code}</span> recorded as {lastAction.reason}
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <span className="whitespace-nowrap text-xs text-green-700">{fmtTime(lastAction.timestamp)}</span>
                <button onClick={handleUndo} className="text-xs font-semibold text-blue-600 hover:underline">
                  Undo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Layout: waybills table + sidebar ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* 4. Waybills table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-bold text-blue-600">
              4. Waybills in this Manifest ({manifest.waybills.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="w-8 py-3 pl-3" />
                  <th className="whitespace-nowrap px-3 py-3">Waybill No.</th>
                  <th className="whitespace-nowrap px-3 py-3">Receiver</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center">Loaded</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center">Delivered</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center">Returned</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center">Damaged</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center">Missing</th>
                  <th className="whitespace-nowrap px-3 py-3">Status</th>
                  <th className="whitespace-nowrap px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {manifest.waybills.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-sm text-gray-400">
                      No waybills assigned to this manifest.
                    </td>
                  </tr>
                ) : (
                  manifest.waybills.map((wb) => (
                    <WaybillTableRow
                      key={wb._id}
                      wb={wb}
                      expanded={expandedWbs.has(wb._id)}
                      onToggle={() => toggleWb(wb._id)}
                      onReverseParcel={handleReverseParcel}
                    />
                  ))
                )}
              </tbody>
              {stats && manifest.waybills.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/70 text-sm font-bold text-gray-800">
                    <td colSpan={3} className="py-3 pl-3">
                      TOTAL
                    </td>
                    <td className="px-3 py-3 text-center">{stats.totalLoaded}</td>
                    <td className="px-3 py-3 text-center">{stats.totalDelivered}</td>
                    <td className="px-3 py-3 text-center text-red-600">{stats.totalReturned}</td>
                    <td className="px-3 py-3 text-center">{stats.totalDamaged}</td>
                    <td className="px-3 py-3 text-center">{stats.totalMissing}</td>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          {/* Manifest Status card */}
          <div className={cardClass}>
            <h3 className="mb-2 text-sm font-bold text-blue-600">Manifest Status</h3>
            <div className="divide-y divide-gray-100">
              <SideStatRow
                icon={<FilePlus2 className="h-4 w-4 text-gray-400" />}
                label="Waybills"
                value={stats?.totalWbs ?? 0}
              />
              <SideStatRow
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                label="Completed"
                value={stats?.completed ?? 0}
                valueClass="text-green-700"
              />
              <SideStatRow
                icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                label="Exceptions"
                value={stats?.exceptionsCount ?? 0}
                valueClass="text-red-600"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm text-gray-600">Status</span>
              <StatusPill status={manifest.status} />
            </div>
          </div>

          {/* Recent Exceptions card */}
          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-bold text-gray-800">Recent Exceptions</h3>
            <div className="space-y-3">
              {manifest.exceptions.slice(0, 5).map((exc) => (
                <RecentExceptionItem key={exc.id} exc={exc} />
              ))}
              {manifest.exceptions.length === 0 && (
                <p className="flex items-center gap-2 py-2 text-sm text-gray-400">
                  <PackageX className="h-4 w-4" />
                  No exceptions recorded.
                </p>
              )}
            </div>
            <button className="mt-3 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
              View all exceptions
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}