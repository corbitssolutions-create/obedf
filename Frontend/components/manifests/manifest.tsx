"use client";

import { useState, useEffect } from "react";
import { Plus, User, Truck, MapPin, Package, Weight } from "lucide-react";
import { apiGet, apiPost, API_BASE } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import {
  SearchBar, FilterSelect, DateRangeFilter, QuickDateSelect,
  ResetButton, SortIcon, Pagination, EmptyState, StatusBadge,
} from "../ui/TableToolbar";
import CreateManifestPage, { ManifestFormData, WaybillOption } from "./create-mani";
import ManifestDetailPage from "./manifest-detail";

type Status = "Open" | "On Delivery" | "Delivered" | "Cancelled";

interface Manifest {
  _id: string;  // MongoDB ObjectId — used for the detail fetch
  id: string;   // manifestNo — displayed in the table
  date: string;
  driver: string;
  vehicle: string;
  route: string;
  origin: string;
  destination: string;
  dispatcher: string;
  waybills: number;
  parcels: number;
  weight: number;
  status: Status;
}

const STATUS_OPTIONS = [
  { label: "On Delivery", value: "On Delivery" },
  { label: "Open", value: "Open" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

export default function ManifestsPage() {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [waybillPool, setWaybillPool] = useState<WaybillOption[]>([]);
  const [rawWaybills, setRawWaybills] = useState<any[]>([]); // To map waybillNo back to _id on submit
  const [loading, setLoading] = useState(true);

  // Controls whether we show the manifest list, the full-page "Create Manifest"
  // screen, or the full-page "Detail / Debrief" screen.
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedManifest, setSelectedManifest] = useState<{ id: string; manifestNo: string } | null>(null);

  const [driverFilter, setDriverFilter] = useState("");
  const [dispatcherFilter, setDispatcherFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");

  const fetchData = async () => {
    try {
      const [dataMani, dataWb] = await Promise.all([
        apiGet<{ success: boolean; data: any[] }>("/api/manifests?limit=1000"),
        apiGet<{ success: boolean; data: any[] }>("/api/waybills?limit=1000"),
      ]);

      if (dataMani.success) {
        const mappedMani: Manifest[] = (dataMani.data || []).map((item: any) => ({
          _id: item._id,
          id: item.manifestNo,
          date: new Date(item.date).toLocaleDateString("en-ZA", { day: "2-digit", month: "2-digit", year: "numeric" }),
          driver: item.driver, vehicle: item.vehicle, route: item.route,
          origin: "Johannesburg",
          destination: item.route?.split(" - ")[1] || "—",
          dispatcher: "System",
          waybills: item.waybills?.length || 0,
          parcels: item.totalParcels || 0,
          weight: item.totalWeight || 0,
          status: item.status,
        }));
        setManifests(mappedMani);
      }

      if (dataWb.success) {
        setRawWaybills(dataWb.data || []);
        const unassigned = (dataWb.data || []).filter((wb: any) =>
          ["Active", "Outstanding", "Draft"].includes(wb.status)
        );
        const mappedPool: WaybillOption[] = unassigned.map((wb: any) => {
          const waybillWeight = wb.parcels?.reduce((sum: number, p: any) => sum + (p.weight || 0), 0) || 0;
          return {
            id: wb.waybillNo, receiver: wb.receiver,
            parcels: wb.quantity || 1,
            weight: Math.round(waybillWeight * 10) / 10,
            parcelIds: wb.parcels?.map((p: any) => p.id) || [],
          };
        });
        setWaybillPool(mappedPool);
      }
    } catch (err) {
      console.error("Error loading manifest data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const {
    paginated,
    filtered,
    total,
    rawSearch,
    handleSearch,
    filters,
    handleFilter,
    handleDateRange,
    sort,
    handleSort,
    page,
    setPage,
    pageSize,
    handlePageSize,
    totalPages,
    resetFilters,
    hasActiveFilters,
  } = useTableFilters<Manifest>({
    data: manifests,
    searchFields: ["id", "driver", "vehicle", "route", "origin", "destination", "dispatcher"],
    pageSize: 10,
    filterFn: (item, _f) => {
      if (driverFilter && item.driver !== driverFilter) return false;
      if (dispatcherFilter && item.dispatcher !== dispatcherFilter) return false;
      if (routeFilter && item.route !== routeFilter) return false;
      return true;
    },
  });

  const handleReset = () => {
    resetFilters();
    setDriverFilter("");
    setDispatcherFilter("");
    setRouteFilter("");
  };

  const anyActive =
    hasActiveFilters || !!driverFilter || !!dispatcherFilter || !!routeFilter;

  const handleCreateManifest = async (data: ManifestFormData) => {
    try {
      const token = localStorage.getItem("token");

      // Map Waybill numbers (like "WB000007") back to MongoDB ObjectIds
      const dbWaybillIds = data.assignedWaybillIds.map((no) => {
        const match = rawWaybills.find((w) => w.waybillNo === no);
        return match ? match._id : null;
      }).filter(Boolean);

      const res = await fetch(`${API_BASE}/api/manifests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driver: data.driver,
          vehicle: data.vehicle,
          route: data.route,
          subcontractor: data.subcontractor,
          waybills: dbWaybillIds,
        }),
      });

      const result = await res.json();
      if (result.success) {
        await fetchData(); // Reload both lists
        setView("list"); // back to the manifest list after a successful save
      } else {
        alert(result.error || "Failed to create manifest");
      }
    } catch (err) {
      console.error("Error creating manifest:", err);
      alert("Error connecting to server to create manifest");
    }
  };

  const driverOptions = Array.from(new Set(manifests.map((m) => m.driver))).map((d) => ({
    label: d,
    value: d,
  }));

  const dispatcherOptions = Array.from(new Set(manifests.map((m) => m.dispatcher))).map((d) => ({
    label: d,
    value: d,
  }));

  const routeOptions = Array.from(new Set(manifests.map((m) => m.route))).map((r) => ({
    label: r,
    value: r,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 sm:px-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const openDetail = (m: Manifest) => {
    setSelectedManifest({ id: m._id, manifestNo: m.id });
    setView("detail");
  };
  // Instead of a popup, this now takes over the whole content area,
  // exactly like navigating to a new page. "Back" returns to the list.
  if (view === "create") {
    return (
      <CreateManifestPage
        onBack={() => setView("list")}
        onSubmit={handleCreateManifest}
        waybillPool={waybillPool}
      />
    );
  }

  // ---------- Full-page "Manifest Detail / Debrief" screen ----------
  if (view === "detail" && selectedManifest) {
    return (
      <ManifestDetailPage
        manifestId={selectedManifest.id}
        manifestNo={selectedManifest.manifestNo}
        onBack={() => setView("list")}
      />
    );
  }

  // ---------- Manifest list ----------
  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">MANIFESTS</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
        </div>
        <button
          onClick={() => setView("create")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Manifest
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={rawSearch}
            onChange={handleSearch}
            placeholder="Search manifest, driver, route, destination..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect
            value={filters.status}
            onChange={(v) => handleFilter("status", v)}
            options={STATUS_OPTIONS}
            placeholder="All Statuses"
          />
          <FilterSelect
            value={driverFilter}
            onChange={(v) => { setDriverFilter(v); setPage(1); }}
            options={driverOptions}
            placeholder="All Drivers"
          />
          <FilterSelect
            value={dispatcherFilter}
            onChange={(v) => { setDispatcherFilter(v); setPage(1); }}
            options={dispatcherOptions}
            placeholder="All Dispatchers"
          />
          <FilterSelect
            value={routeFilter}
            onChange={(v) => { setRouteFilter(v); setPage(1); }}
            options={routeOptions}
            placeholder="All Routes"
          />
          <div className="col-span-2 sm:col-span-1">
            <QuickDateSelect onSelect={(from, to) => handleDateRange({ from, to })} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="w-full sm:w-auto">
            <DateRangeFilter
              from={filters.dateRange.from}
              to={filters.dateRange.to}
              onFromChange={(v) => handleDateRange({ ...filters.dateRange, from: v })}
              onToChange={(v) => handleDateRange({ ...filters.dateRange, to: v })}
            />
          </div>
          <ResetButton onClick={handleReset} active={anyActive} />
        </div>
      </div>

      {anyActive && (
        <p className="mb-3 text-xs font-medium text-blue-600">
          {filtered.length} of {total} records match current filters
        </p>
      )}

      {/* ---------- Desktop / tablet: full table ---------- */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[960px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {(
                [
                  ["id",          "Manifest No."],
                  ["date",        "Date"],
                  ["driver",      "Driver"],
                  ["vehicle",     "Vehicle"],
                  ["route",       "Route"],
                  ["destination", "Destination"],
                  ["dispatcher",  "Dispatcher"],
                  ["waybills",    "Waybills"],
                  ["parcels",     "Parcels"],
                  ["weight",      "Weight (kg)"],
                  ["status",      "Status"],
                ] as [keyof Manifest, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:bg-gray-100"
                >
                  {label}
                  <SortIcon sortState={sort} column={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <EmptyState message="No manifests match your filters." colSpan={11} />
            ) : (
              paginated.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`text-sm text-gray-700 transition-colors hover:bg-gray-50/60 ${
                    idx !== paginated.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => openDetail(m)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {m.id}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{m.date}</td>
                  <td className="px-5 py-3.5">{m.driver}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{m.vehicle}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{m.route}</td>
                  <td className="px-5 py-3.5">{m.destination}</td>
                  <td className="px-5 py-3.5">{m.dispatcher}</td>
                  <td className="px-5 py-3.5 text-center">{m.waybills}</td>
                  <td className="px-5 py-3.5 text-center">{m.parcels}</td>
                  <td className="px-5 py-3.5 text-center">{m.weight.toFixed(1)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile: card list ---------- */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">
            No manifests match your filters.
          </div>
        ) : (
          paginated.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <button
                  onClick={() => openDetail(m)}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  {m.id}
                </button>
                <StatusBadge status={m.status} />
              </div>

              <p className="text-sm font-medium text-gray-900">
                {m.origin} → {m.destination}
              </p>
              <p className="text-xs text-gray-500">
                {m.date} • Dispatched by {m.dispatcher}
              </p>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  {m.driver}
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span className="font-mono">{m.vehicle}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span className="font-mono">{m.route}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  {m.waybills} waybills / {m.parcels} parcels
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  {m.weight.toFixed(1)} kg total
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          total={filtered.length}
          onPage={setPage}
          onPageSize={handlePageSize}
        />
      </div>
    </div>
  );
}