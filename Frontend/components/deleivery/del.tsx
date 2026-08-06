"use client";

import { useState } from "react";
import { Truck, MapPin, Clock, User } from "lucide-react";
import { useTableFilters } from "../hooks/useTableFilters";
import {
  SearchBar,
  FilterSelect,
  ResetButton,
  SortIcon,
  Pagination,
  EmptyState,
  StatusBadge,
} from "../ui/TableToolbar";

type DeliveryStatus = "In Transit" | "Out for Delivery" | "Delivered" | "Returned";

interface Delivery {
  pod: string;
  customer: string;
  driver: string;
  route: string;
  destination: string;
  estTime: string;
  status: DeliveryStatus;
}

const deliveries: Delivery[] = [
  { pod: "WB100125-1", customer: "Shoprite M45",   driver: "John Dube",      route: "JHB - PTA", destination: "Pretoria",       estTime: "12:30", status: "In Transit"      },
  { pod: "WB100125-2", customer: "Checkers Park",  driver: "Sipho Nkosi",    route: "JHB - DBN", destination: "Durban",         estTime: "13:20", status: "In Transit"      },
  { pod: "WB100124-1", customer: "East Gate WM1",  driver: "Pieter Botha",   route: "JHB - CTN", destination: "Cape Town",      estTime: "13:45", status: "Out for Delivery" },
  { pod: "WB100123-1", customer: "BuildCo PTA",    driver: "Peter Venter",   route: "JHB - PE",  destination: "Port Elizabeth", estTime: "14:10", status: "Delivered"        },
  { pod: "WB100122-1", customer: "Metro DC PTA",   driver: "Thabo Mokoena",  route: "JHB - EL",  destination: "East London",    estTime: "15:00", status: "Returned"         },
  { pod: "WB100121-1", customer: "Alpha Pty Ltd",  driver: "John Dube",      route: "JHB - PTA", destination: "Pretoria",       estTime: "15:30", status: "Delivered"        },
  { pod: "WB100120-1", customer: "Retail Giant",   driver: "Sipho Nkosi",    route: "JHB - DBN", destination: "Durban",         estTime: "16:00", status: "In Transit"      },
  { pod: "WB100119-1", customer: "Makro WH3",      driver: "Pieter Botha",   route: "JHB - CTN", destination: "Cape Town",      estTime: "16:45", status: "Out for Delivery" },
];

const STATUS_OPTIONS = [
  { label: "In Transit",       value: "In Transit"       },
  { label: "Out for Delivery", value: "Out for Delivery" },
  { label: "Delivered",        value: "Delivered"        },
  { label: "Returned",         value: "Returned"         },
];

const DRIVER_OPTIONS = [...new Set(deliveries.map((d) => d.driver))].map((d) => ({
  label: d, value: d,
}));

const ROUTE_OPTIONS = [...new Set(deliveries.map((d) => d.route))].map((r) => ({
  label: r, value: r,
}));

export default function DeliveriesRealTime() {
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [driverFilter, setDriverFilter] = useState("");
  const [routeFilter,  setRouteFilter]  = useState("");

  const {
    paginated,
    filtered,
    total,
    rawSearch,
    handleSearch,
    filters,
    handleFilter,
    sort,
    handleSort,
    page,
    setPage,
    pageSize,
    handlePageSize,
    totalPages,
    resetFilters,
    hasActiveFilters,
  } = useTableFilters<Delivery>({
    data: deliveries,
    searchFields: ["pod", "customer", "driver", "route", "destination"],
    pageSize: 10,
    filterFn: (item, _f) => {
      if (driverFilter && item.driver !== driverFilter) return false;
      if (routeFilter  && item.route  !== routeFilter)  return false;
      return true;
    },
  });

  const handleReset = () => {
    resetFilters();
    setDriverFilter("");
    setRouteFilter("");
  };

  const toggleRow = (pod: string) =>
    setSelected((prev) => ({ ...prev, [pod]: !prev[pod] }));

  const anyActive = hasActiveFilters || !!driverFilter || !!routeFilter;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wide text-slate-800">
            Deliveries (Real-Time)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{total} total entries</p>
        </div>

        {/* Live Updates toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-sm font-medium text-slate-600">Live Updates</span>
          <button
            onClick={() => setLiveUpdates((v) => !v)}
            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
              liveUpdates ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                liveUpdates ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={rawSearch}
            onChange={handleSearch}
            placeholder="Search POD, customer, driver, destination..."
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
            options={DRIVER_OPTIONS}
            placeholder="All Drivers"
          />
          <FilterSelect
            value={routeFilter}
            onChange={(v) => { setRouteFilter(v); setPage(1); }}
            options={ROUTE_OPTIONS}
            placeholder="All Routes"
          />
          <div className="col-span-2 sm:col-span-1">
            <ResetButton onClick={handleReset} active={anyActive} />
          </div>
        </div>
      </div>

      {anyActive && (
        <p className="mb-3 text-xs font-medium text-blue-600">
          {filtered.length} of {total} entries match current filters
        </p>
      )}

      {/* ---------- Desktop / tablet: full table ---------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="w-8 py-3 pr-2" />
              {(
                [
                  ["pod",         "POD"],
                  ["customer",    "Customer"],
                  ["driver",      "Driver"],
                  ["route",       "Route"],
                  ["destination", "Destination"],
                  ["estTime",     "Est. Time"],
                  ["status",      "Status"],
                ] as [keyof Delivery, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-700"
                >
                  {label}
                  <SortIcon sortState={sort} column={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <EmptyState message="No deliveries match your filters." colSpan={8} />
            ) : (
              paginated.map((d) => (
                <tr
                  key={d.pod}
                  className="border-b border-slate-50 text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50/60"
                >
                  <td className="py-3.5 pr-2">
                    <input
                      type="checkbox"
                      checked={!!selected[d.pod]}
                      onChange={() => toggleRow(d.pod)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-200"
                    />
                  </td>
                  <td className="py-3.5 pr-4">
                    <a href="#" className="font-mono text-xs font-semibold text-blue-500 hover:underline">
                      {d.pod}
                    </a>
                  </td>
                  <td className="py-3.5 pr-4">{d.customer}</td>
                  <td className="py-3.5 pr-4">{d.driver}</td>
                  <td className="py-3.5 pr-4 font-mono text-xs text-gray-600">{d.route}</td>
                  <td className="py-3.5 pr-4">{d.destination}</td>
                  <td className="py-3.5 pr-4 font-mono text-xs">{d.estTime}</td>
                  <td className="py-3.5 pr-4">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile: card list instead of a squeezed 8-column table ---------- */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-slate-100 py-10 text-center text-sm text-slate-500">
            No deliveries match your filters.
          </div>
        ) : (
          paginated.map((d) => (
            <div key={d.pod} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={!!selected[d.pod]}
                    onChange={() => toggleRow(d.pod)}
                    className="h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-500 focus:ring-blue-200"
                  />
                  <a href="#" className="font-mono text-xs font-semibold text-blue-500 hover:underline">
                    {d.pod}
                  </a>
                </label>
                <StatusBadge status={d.status} />
              </div>

              <p className="mt-2 text-sm font-medium text-slate-800">{d.customer}</p>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  {d.driver}
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="font-mono">{d.route}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  {d.destination}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="font-mono">{d.estTime}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-end overflow-x-auto">
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