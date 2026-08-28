"use client";

import React, { useState, useEffect } from "react";
import {
  ScanLine,
  PackageSearch,
  PlusCircle,
  Trash2,
  FileText,
  Truck,
  User as UserIcon,
  ClipboardList,
  DollarSign,
  Package,
  Save,
  Printer,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Box,
  Weight,
  Receipt,
  Fuel,
  Coins,
  Plus,
  AlertCircle,
  CalendarDays
} from "lucide-react";

// Import apiGet - make sure this path is correct for your project
// If you don't have this, you'll need to create it or use fetch directly
import { apiGet } from "@/lib/api";

// Types
export interface WaybillOption {
  id: string;
  receiver: string;
  parcels: number;
  weight: number;
  parcelIds?: string[];
  sender?: string;
  serviceType?: string;
}

export interface ManifestFormData {
  manifestId?: string;
  date: string;
  driver: string;
  vehicle: string;
  route: string;
  subcontractor: string;
  status: string;
  assignedWaybillIds: string[];
  totalParcels: number;
  totalWeight: number;
  transportType?: "fleet" | "subcontractor";
  trailer?: string;
  assistantDriver?: string;
  branch?: string;
  plannedDeparture?: string;
  plannedArrival?: string;
  referenceNotes?: string;
}

interface CreateManifestPageProps {
  onBack: () => void;
  onSubmit: (data: ManifestFormData) => void;
  manifestId?: string;
  waybillPool: WaybillOption[];
  title?: string;
  subtitle?: string;
}

// Interfaces for API responses
interface DriverLookup {
  _id: string;
  fullName: string;
  status: string;
  currentVehicle?: { registrationNumber: string } | null;
}

interface VehicleLookup {
  _id: string;
  registrationNumber: string;
  make?: string;
  status: string;
}

interface RouteLookup {
  _id: string;
  name: string;
  code?: string;
  origin: string;
  destination: string;
}

interface ContractorLookup {
  _id: string;
  name: string;
}

interface ScanLogRow {
  id: string;
  receiver: string;
  parcels: number;
  weight: number;
  time: string;
}

interface ParcelLogRow {
  parcelId: string;
  waybillId: string;
  weight: number;
  time: string;
}

// Helper functions
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDisplayDateSlash(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function nowTime(): string {
  return new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

// Styling constants
const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-colors";

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 appearance-none pr-8 transition-colors";

const cardClass = "rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow";

// Sub-components
function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ 
  icon, 
  number, 
  title, 
  noMargin 
}: { 
  icon?: React.ReactNode; 
  number?: number; 
  title: string; 
  noMargin?: boolean 
}) {
  return (
    <div className={`flex items-center gap-2 ${noMargin ? "" : "mb-4"}`}>
      {number !== undefined ? (
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {number}
        </span>
      ) : (
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          {icon}
        </span>
      )}
      <h3 className="text-sm font-semibold text-blue-600">{title}</h3>
    </div>
  );
}

function SummaryRow({ 
  icon, 
  label, 
  value, 
  muted 
}: { 
  icon?: React.ReactNode; 
  label: string; 
  value: string | number; 
  muted?: boolean 
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-sm text-gray-500">
        {icon} {label}
      </span>
      <span className={`text-base font-semibold ${muted ? "text-gray-500" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}

function RecentWaybillsTable({ rows }: { rows: ScanLogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 px-4 py-6 text-center text-sm text-gray-400">
        <ScanLine className="mx-auto h-6 w-6 text-gray-300 mb-1" />
        No waybills scanned yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <div className="min-w-[420px]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Waybill No.</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Receiver</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Parcels</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Weight (kg)</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Time</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.id}-${idx}`} className={idx !== rows.length - 1 ? "border-b border-gray-50" : ""}>
                <td className="px-3 py-2 font-medium text-blue-600">{r.id}</td>
                <td className="px-3 py-2 text-gray-700">{r.receiver}</td>
                <td className="px-3 py-2 text-center text-gray-700">{r.parcels}</td>
                <td className="px-3 py-2 text-center text-gray-700">{r.weight.toFixed(2)}</td>
                <td className="px-3 py-2 text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {r.time}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <CheckCircle className="h-3 w-3" /> Loaded
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentParcelsTable({ rows }: { rows: ParcelLogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 px-4 py-6 text-center text-sm text-gray-400">
        <PackageSearch className="mx-auto h-6 w-6 text-gray-300 mb-1" />
        No parcels scanned yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <div className="min-w-[420px]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Parcel No.</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Waybill No.</th>
              <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Weight (kg)</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Time</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.parcelId}-${idx}`} className={idx !== rows.length - 1 ? "border-b border-gray-50" : ""}>
                <td className="px-3 py-2 font-medium text-gray-900">{r.parcelId}</td>
                <td className="px-3 py-2 text-blue-600">{r.waybillId}</td>
                <td className="px-3 py-2 text-center text-gray-700">{r.weight.toFixed(2)}</td>
                <td className="px-3 py-2 text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {r.time}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <CheckCircle className="h-3 w-3" /> Loaded
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Component
export default function CreateManifestPage({
  onBack,
  onSubmit,
  manifestId,
  waybillPool,
  title,
  subtitle,
}: CreateManifestPageProps) {
  // State
  const [manifestDate] = useState(() => todayISO());
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [subcontractorId, setSubId] = useState("");

  const [driverLabel, setDriverLabel] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [routeLabel, setRouteLabel] = useState("");
  const [subLabel, setSubLabel] = useState("None (Own Fleet)");

  const [drivers, setDrivers] = useState<DriverLookup[]>([]);
  const [vehicles, setVehicles] = useState<VehicleLookup[]>([]);
  const [routes, setRoutes] = useState<RouteLookup[]>([]);
  const [contractors, setContractors] = useState<ContractorLookup[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [transportType, setTransportType] = useState<"fleet" | "subcontractor">("fleet");
  const [trailer, setTrailer] = useState("");
  const [assistantDriver, setAssistantDriver] = useState("");
  const [branch, setBranch] = useState("Johannesburg DC");
  const [plannedDeparture, setPlannedDeparture] = useState("");
  const [plannedArrival, setPlannedArrival] = useState("");
  const [referenceNotes, setReferenceNotes] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanTab, setScanTab] = useState<"waybill" | "parcel">("waybill");
  const [waybillScanValue, setWaybillScanValue] = useState("");
  const [parcelScanValue, setParcelScanValue] = useState("");
  const [manualEntryValue, setManualEntryValue] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [tableSearch, setTableSearch] = useState("");
  const [subToggle, setSubToggle] = useState(true);

  const [scanLog, setScanLog] = useState<ScanLogRow[]>([]);
  const [parcelLog, setParcelLog] = useState<ParcelLogRow[]>([]);
  const [duplicateScans, setDuplicateScans] = useState(0);
  const [scanErrors, setScanErrors] = useState(0);
  const [unknownParcels, setUnknownParcels] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effects
  useEffect(() => {
    setLookupLoading(true);
    Promise.all([
      apiGet<{ success: boolean; data: DriverLookup[] }>("/api/drivers/lookup"),
      apiGet<{ success: boolean; data: VehicleLookup[] }>("/api/vehicles/lookup"),
      apiGet<{ success: boolean; data: RouteLookup[] }>("/api/routes/lookup"),
      apiGet<{ success: boolean; data: ContractorLookup[] }>("/api/contractors/lookup"),
    ])
      .then(([dr, ve, ro, co]) => {
        setDrivers(dr.data ?? []);
        setVehicles(ve.data ?? []);
        setRoutes(ro.data ?? []);
        setContractors(co.data ?? []);
        if (dr.data?.length) {
          setDriverId(dr.data[0]._id);
          setDriverLabel(dr.data[0].fullName);
        }
        if (ve.data?.length) {
          setVehicleId(ve.data[0]._id);
          setVehicleLabel(ve.data[0].registrationNumber);
        }
        if (ro.data?.length) {
          setRouteId(ro.data[0]._id);
          setRouteLabel(ro.data[0].name);
        }
      })
      .catch(() => {
        // Fallback data if API fails
        setDrivers([{ _id: "1", fullName: "John Dlamini", status: "active" }]);
        setVehicles([{ _id: "1", registrationNumber: "CA 123 456", status: "active" }]);
        setRoutes([{ _id: "1", name: "JHB - CPT", origin: "Johannesburg", destination: "Cape Town" }]);
        setContractors([]);
      })
      .finally(() => setLookupLoading(false));
  }, []);

  useEffect(() => {
    const d = drivers.find((x) => x._id === driverId);
    if (!d) return;
    setDriverLabel(d.fullName);
    if (d.currentVehicle?.registrationNumber) {
      const v = vehicles.find((x) => x.registrationNumber === d.currentVehicle!.registrationNumber);
      if (v) {
        setVehicleId(v._id);
        setVehicleLabel(v.registrationNumber);
      }
    }
  }, [driverId, drivers, vehicles]);

  useEffect(() => {
    if (transportType === "fleet") {
      setSubId("");
      setSubLabel("None (Own Fleet)");
    }
  }, [transportType]);

  // Computed values
  const chosen = waybillPool.filter((w) => selected.has(w.id));
  const filteredChosen = chosen.filter((w) => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      w.id.toLowerCase().includes(q) ||
      w.receiver.toLowerCase().includes(q) ||
      (w.sender ?? "").toLowerCase().includes(q)
    );
  });
  const totalParcels = chosen.reduce((s, w) => s + w.parcels, 0);
  const totalWeight = chosen.reduce((s, w) => s + w.weight, 0);

  // Handlers
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const removeWaybill = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const flash = (type: "success" | "error", message: string) => {
    setScanFeedback({ type, message });
    window.clearTimeout((flash as any)._t);
    (flash as any)._t = window.setTimeout(() => setScanFeedback(null), 3000);
  };

  const addWaybillById = (rawId: string, src: string) => {
    const id = rawId.trim();
    if (!id) return;
    const match = waybillPool.find((w) => w.id.toLowerCase() === id.toLowerCase());
    if (!match) {
      flash("error", `No waybill found for "${id}".`);
      setScanErrors((c) => c + 1);
      return;
    }
    if (selected.has(match.id)) {
      flash("error", `Waybill ${match.id} already on this manifest.`);
      setDuplicateScans((c) => c + 1);
      return;
    }
    setSelected((prev) => new Set(prev).add(match.id));
    setScanLog((prev) => [
      {
        id: match.id,
        receiver: match.receiver,
        parcels: match.parcels,
        weight: match.weight,
        time: nowTime(),
      },
      ...prev,
    ]);
    flash("success", `${src}: added ${match.id} (${match.parcels} parcels).`);
  };

  const handleParcelScan = () => {
    const code = parcelScanValue.trim();
    if (!code) return;
    const match = waybillPool.find(
      (w) =>
        (w.parcelIds ?? []).some((p) => p.toLowerCase() === code.toLowerCase()) ||
        code.toLowerCase().startsWith(w.id.toLowerCase())
    );
    if (!match) {
      flash("error", `No waybill matched to parcel "${code}".`);
      setUnknownParcels((c) => c + 1);
      setParcelScanValue("");
      return;
    }
    if (selected.has(match.id)) {
      flash("error", `Waybill ${match.id} already on manifest.`);
      setDuplicateScans((c) => c + 1);
      setParcelScanValue("");
      return;
    }
    setSelected((prev) => new Set(prev).add(match.id));
    setScanLog((prev) => [
      {
        id: match.id,
        receiver: match.receiver,
        parcels: match.parcels,
        weight: match.weight,
        time: nowTime(),
      },
      ...prev,
    ]);
    setParcelLog((prev) => [
      { parcelId: code, waybillId: match.id, weight: match.weight, time: nowTime() },
      ...prev,
    ]);
    flash("success", `Parcel → waybill ${match.id} added.`);
    setParcelScanValue("");
  };

  const resetForm = () => {
    setSelected(new Set());
    setWaybillScanValue("");
    setParcelScanValue("");
    setManualEntryValue("");
    setScanFeedback(null);
    setScanLog([]);
    setParcelLog([]);
    setDuplicateScans(0);
    setScanErrors(0);
    setUnknownParcels(0);
  };

  const handleSubmit = () => {
    if (chosen.length === 0) return;
    setIsSubmitting(true);
    onSubmit({
      manifestId,
      date: manifestDate,
      driver: driverLabel,
      vehicle: vehicleLabel,
      route: routeLabel,
      subcontractor: subLabel,
      status: "On Delivery",
      assignedWaybillIds: Array.from(selected),
      totalParcels,
      totalWeight: Math.round(totalWeight * 100) / 100,
      transportType,
      trailer,
      assistantDriver,
      branch,
      plannedDeparture,
      plannedArrival,
      referenceNotes,
    });
    setTimeout(() => {
      resetForm();
      setIsSubmitting(false);
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50/60 px-3 py-4 md:px-6 md:py-5">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
              {title || "Capture Delivery Manifest"}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 md:text-sm">
              {subtitle || "Create and load waybills and parcels onto this manifest."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={handleSubmit}
            disabled={chosen.length === 0 || isSubmitting}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
              chosen.length === 0 || isSubmitting
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Complete
          </button>
        </div>
      </div>

      {lookupLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-gray-500">Loading drivers, vehicles, routes…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-5">
            {/* 1. Manifest Details */}
            <div className={cardClass}>
              <SectionTitle number={1} title="Manifest Details" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Field label="Manifest No. (Auto)">
                  <div className={`${inputClass} bg-gray-50 text-gray-500`}>
                    {manifestId ?? "DM00012345"}
                  </div>
                </Field>
                <Field label="Manifest Date" required>
                  <div className={`${inputClass} flex items-center justify-between bg-white text-gray-700`}>
                    <span>{formatDisplayDateSlash(manifestDate)}</span>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                </Field>
                <Field label="Branch" required>
                  <input value={branch} onChange={(e) => setBranch(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Route" required>
                  <div className="relative">
                    <select
                      value={routeId}
                      onChange={(e) => {
                        setRouteId(e.target.value);
                        const r = routes.find((x) => x._id === e.target.value);
                        if (r) setRouteLabel(r.name);
                      }}
                      className={selectClass}
                    >
                      {routes.length === 0 && <option>JHB - CPT</option>}
                      {routes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  </div>
                </Field>
                <Field label="Status">
                  <div className="flex h-[38px] items-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      In Progress
                    </span>
                  </div>
                </Field>

                <Field label="Planned Departure">
                  <div className={`${inputClass} flex items-center justify-between bg-white text-gray-700`}>
                    <span>{plannedDeparture || "13/07/2026 08:00"}</span>
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={plannedDeparture}
                    onChange={(e) => setPlannedDeparture(e.target.value)}
                    className="sr-only"
                  />
                </Field>
                <Field label="Planned Arrival">
                  <div className={`${inputClass} flex items-center justify-between bg-white text-gray-700`}>
                    <span>{plannedArrival || "14/07/2026 18:00"}</span>
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={plannedArrival}
                    onChange={(e) => setPlannedArrival(e.target.value)}
                    className="sr-only"
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label="Reference / Notes">
                    <textarea
                      value={referenceNotes}
                      onChange={(e) => setReferenceNotes(e.target.value)}
                      rows={1}
                      placeholder="Enter reference or notes…"
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* 2. Transport Details */}
            <div className={cardClass}>
              <SectionTitle number={2} title="Transport Details" />

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Transport Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setTransportType("fleet")}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        transportType === "fleet"
                          ? "border-blue-300 bg-blue-50/60"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Truck
                        className={`h-5 w-5 flex-shrink-0 ${
                          transportType === "fleet" ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Company Fleet</p>
                        <p className="text-xs text-gray-500">Use company vehicles and drivers</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransportType("subcontractor")}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        transportType === "subcontractor"
                          ? "border-blue-300 bg-blue-50/60"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <UserIcon
                        className={`h-5 w-5 flex-shrink-0 ${
                          transportType === "subcontractor" ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">Subcontractor</p>
                        <p className="text-xs text-gray-500">Use subcontractor services</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-blue-600">
                    {transportType === "fleet" ? "Company Fleet Details" : "Subcontractor Details"}
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Driver" required>
                      <div className="relative">
                        <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={selectClass}>
                          {drivers.length === 0 && <option>John Dlamini</option>}
                          {drivers.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.fullName} ({d.status})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      </div>
                    </Field>

                    <Field label="Vehicle" required>
                      <div className="relative">
                        <select
                          value={vehicleId}
                          onChange={(e) => {
                            setVehicleId(e.target.value);
                            const v = vehicles.find((x) => x._id === e.target.value);
                            if (v) setVehicleLabel(v.registrationNumber);
                          }}
                          className={selectClass}
                        >
                          {vehicles.length === 0 && <option>CA 123 456</option>}
                          {vehicles.map((v) => (
                            <option key={v._id} value={v._id}>
                              {v.registrationNumber}
                              {v.make ? ` — ${v.make}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      </div>
                    </Field>

                    <Field label="Trailer">
                      <input
                        value={trailer}
                        onChange={(e) => setTrailer(e.target.value)}
                        placeholder="CA 789 101"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Assistant Driver">
                      <input
                        value={assistantDriver}
                        onChange={(e) => setAssistantDriver(e.target.value)}
                        placeholder="Sipho Mthembu"
                        className={inputClass}
                      />
                    </Field>

                    {transportType === "subcontractor" ? (
                      <Field label="Subcontractor">
                        <div className="relative">
                          <select
                            value={subcontractorId}
                            onChange={(e) => {
                              setSubId(e.target.value);
                              if (!e.target.value) {
                                setSubLabel("None (Own Fleet)");
                                return;
                              }
                              const c = contractors.find((x) => x._id === e.target.value);
                              if (c) setSubLabel(c.name);
                            }}
                            className={selectClass}
                          >
                            <option value="">Select subcontractor…</option>
                            {contractors.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        </div>
                      </Field>
                    ) : (
                      <Field label="Route" required>
                        <div className="relative">
                          <select
                            value={routeId}
                            onChange={(e) => {
                              setRouteId(e.target.value);
                              const r = routes.find((x) => x._id === e.target.value);
                              if (r) setRouteLabel(r.name);
                            }}
                            className={selectClass}
                          >
                            {routes.length === 0 && <option>JHB - CPT</option>}
                            {routes.map((r) => (
                              <option key={r._id} value={r._id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        </div>
                      </Field>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Loading / Scanning */}
            <div className={cardClass}>
              <SectionTitle number={3} title="Loading / Scanning" />

              <div className="mb-4 inline-flex w-full rounded-lg border border-gray-200 p-1 sm:w-auto">
                <button
                  onClick={() => setScanTab("waybill")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-initial ${
                    scanTab === "waybill"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ScanLine className="h-3.5 w-3.5" /> Scan Waybills
                </button>
                <button
                  onClick={() => setScanTab("parcel")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-initial ${
                    scanTab === "parcel"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <PackageSearch className="h-3.5 w-3.5" /> Scan Parcels
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Waybill scan column */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-blue-600">
                    Scan waybill barcode or enter waybill no.
                  </label>
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={waybillScanValue}
                      onChange={(e) => setWaybillScanValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addWaybillById(waybillScanValue, "Scan");
                          setWaybillScanValue("");
                        }
                      }}
                      placeholder="Enter waybill number or scan barcode"
                      className={inputClass}
                    />
                    <button
                      onClick={() => {
                        addWaybillById(waybillScanValue, "Scan");
                        setWaybillScanValue("");
                      }}
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Scan
                    </button>
                  </div>

                  <p className="mb-2 text-xs font-semibold text-blue-600">Recently Scanned Waybills</p>
                  <RecentWaybillsTable rows={scanLog} />
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Total Waybills Loaded: {chosen.length}
                  </p>
                </div>

                {/* Parcel scan column */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-blue-600">
                    Scan parcel barcode or enter parcel no.
                  </label>
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={parcelScanValue}
                      onChange={(e) => setParcelScanValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleParcelScan();
                      }}
                      placeholder="Enter parcel number or scan barcode"
                      className={inputClass}
                    />
                    <button
                      onClick={handleParcelScan}
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      Scan
                    </button>
                  </div>

                  <p className="mb-2 text-xs font-semibold text-blue-600">Recently Scanned Parcels</p>
                  <RecentParcelsTable rows={parcelLog} />
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Total Parcels Scanned: {parcelLog.length}
                  </p>
                </div>
              </div>

              {scanFeedback && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    scanFeedback.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {scanFeedback.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {scanFeedback.message}
                </div>
              )}

              {/* Manual entry */}
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <PlusCircle className="h-4 w-4" /> Add Waybill Manually
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualEntryValue}
                    onChange={(e) => setManualEntryValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addWaybillById(manualEntryValue, "Manual");
                        setManualEntryValue("");
                      }
                    }}
                    placeholder="Enter waybill ID…"
                    className={inputClass}
                  />
                  <button
                    onClick={() => {
                      addWaybillById(manualEntryValue, "Manual");
                      setManualEntryValue("");
                    }}
                    className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Waybills in this Manifest */}
            <div className={cardClass}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SectionTitle
                  number={4}
                  title={`Waybills in this Manifest (${chosen.length})`}
                  noMargin
                />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Search waybills..."
                      className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 sm:w-52"
                    />
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Bulk <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <div className="min-w-[820px]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/70">
                        <th className="w-8 px-2 py-3"></th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Waybill No.
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Sender
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Receiver
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Service
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Parcels
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Loaded
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Weight (kg)
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredChosen.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                            <Package className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            No waybills loaded yet. Scan or add a waybill above.
                          </td>
                        </tr>
                      ) : (
                        filteredChosen.map((w, idx) => (
                          <tr
                            key={w.id}
                            className={`text-sm text-gray-700 ${
                              idx !== filteredChosen.length - 1 ? "border-b border-gray-50" : ""
                            }`}
                          >
                            <td className="px-2 py-3 text-gray-400">
                              <ChevronRight className="h-3.5 w-3.5" />
                            </td>
                            <td className="px-4 py-3 font-medium text-blue-600">{w.id}</td>
                            <td className="px-4 py-3">{w.sender ?? "—"}</td>
                            <td className="px-4 py-3">{w.receiver}</td>
                            <td className="px-4 py-3">{w.serviceType ?? "Standard"}</td>
                            <td className="px-4 py-3 text-center">{w.parcels}</td>
                            <td className="px-4 py-3 text-center">
                              {w.parcels} / {w.parcels}
                            </td>
                            <td className="px-4 py-3 text-center">{w.weight.toFixed(1)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                <CheckCircle className="h-3 w-3" /> Complete
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-3">
                                <Eye className="h-4 w-4 text-blue-500 cursor-pointer hover:text-blue-600" />
                                <button
                                  onClick={() => removeWaybill(w.id)}
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredChosen.length > 0 && (
                      <tfoot>
                        <tr className="border-t border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-900">
                          <td className="px-2 py-3" />
                          <td className="px-4 py-3" colSpan={4}>
                            TOTAL
                          </td>
                          <td className="px-4 py-3 text-center">{totalParcels}</td>
                          <td className="px-4 py-3 text-center">
                            {totalParcels} / {totalParcels}
                          </td>
                          <td className="px-4 py-3 text-center">{totalWeight.toFixed(1)}</td>
                          <td className="px-4 py-3" colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className={cardClass}>
              <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Manifest Summary" />
              <div className="space-y-3">
                <SummaryRow
                  icon={<FileText className="h-4 w-4" />}
                  label="Waybills Loaded"
                  value={chosen.length}
                />
                <SummaryRow
                  icon={<Package className="h-4 w-4" />}
                  label="Parcels Loaded"
                  value={totalParcels}
                />
                <SummaryRow
                  icon={<Box className="h-4 w-4" />}
                  label="Total Pieces"
                  value={totalParcels}
                />
                <SummaryRow
                  icon={<Weight className="h-4 w-4" />}
                  label="Total Weight"
                  value={`${totalWeight.toFixed(2)} kg`}
                />
                <SummaryRow
                  icon={<Box className="h-4 w-4" />}
                  label="Total Cubic"
                  value="0.00 m³"
                />
                <div className="my-1 border-t border-gray-100" />
                <SummaryRow
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Duplicate Scans"
                  value={duplicateScans}
                  muted
                />
                <SummaryRow
                  icon={<XCircle className="h-4 w-4" />}
                  label="Scan Errors"
                  value={scanErrors}
                  muted
                />
                <SummaryRow
                  icon={<AlertCircle className="h-4 w-4" />}
                  label="Unknown Parcels"
                  value={unknownParcels}
                  muted
                />
              </div>
            </div>

            <div className={cardClass}>
              <div className="mb-4 flex items-center justify-between">
                <SectionTitle
                  icon={<DollarSign className="h-4 w-4" />}
                  title={`Costing Summary${transportType === "subcontractor" ? " (Subcontractor)" : ""}`}
                  noMargin
                />
                <button
                  onClick={() => setSubToggle((v) => !v)}
                  className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                    subToggle ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      subToggle ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Subcontractor</span>
                  <span>-</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Service Type</span>
                  <span>-</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Rate Type</span>
                  <span>-</span>
                </div>
                <div className="my-1 border-t border-gray-100" />
                {[
                  { icon: <Receipt className="h-3.5 w-3.5" />, label: "Base Cost" },
                  { icon: <Fuel className="h-3.5 w-3.5" />, label: "Fuel Surcharge" },
                  { icon: <Coins className="h-3.5 w-3.5" />, label: "Toll Fees" },
                  { icon: <Plus className="h-3.5 w-3.5" />, label: "Other Charges" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center justify-between text-gray-500">
                    <span className="flex items-center gap-1.5">
                      {icon} {label}
                    </span>
                    <span>-</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 font-semibold text-gray-900">
                  <span>Total Buying Cost (ZAR)</span>
                  <span>-</span>
                </div>
                <div className="mt-2 space-y-2 rounded-lg bg-green-50/60 p-3">
                  <div className="flex items-center justify-between text-green-700">
                    <span className="font-medium">Customer Revenue (ZAR)</span>
                    <span>-</span>
                  </div>
                  <div className="flex items-center justify-between text-green-700">
                    <span className="font-medium">Gross Profit (ZAR)</span>
                    <span>-</span>
                  </div>
                  <div className="flex items-center justify-between text-green-700">
                    <span className="font-medium">GP %</span>
                    <span>-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
