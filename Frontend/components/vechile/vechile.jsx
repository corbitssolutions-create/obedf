"use client";

import { useState } from "react";
import { Plus, Truck, User, Hash } from "lucide-react";
import { useTableFilters } from "../hooks/useTableFilters";
import AddVehicleModal from "./AddVehicleModal";
import {
  SearchBar,
  FilterSelect,
  ResetButton,
  SortIcon,
  Pagination,
  EmptyState,
  StatusBadge,
} from "../ui/TableToolbar";

const initialVehicles = [
  { reg: "CAA 125 GP", make: "Scania P Series",   type: "10 Ton Truck", fleet: "FLT-001", driver: "John Dube",        status: "Utilizing"  },
  { reg: "CAA 446 GP", make: "Mercedes Actros",   type: "8 Ton Truck",  fleet: "FLT-002", driver: "Sipho Nkosi",      status: "Utilizing"  },
  { reg: "CAA 706 GP", make: "Hino 500",           type: "8 Ton Truck",  fleet: "FLT-003", driver: "Pieter Botha",     status: "Utilizing"  },
  { reg: "CAA 101 GP", make: "Isuzu FTR",          type: "14 Ton Truck", fleet: "FLT-004", driver: "Peter Venter",     status: "Utilizing"  },
  { reg: "CAA 661 GP", make: "Scania G Series",    type: "12 Ton Truck", fleet: "FLT-005", driver: "Thabo Mokoena",    status: "Utilizing"  },
  { reg: "CAB 200 GP", make: "MAN TGS",            type: "10 Ton Truck", fleet: "FLT-006", driver: "—",                status: "Available"  },
  { reg: "CAB 301 GP", make: "Volvo FH",           type: "18 Ton Truck", fleet: "FLT-007", driver: "—",                status: "Available"  },
  { reg: "CAB 410 GP", make: "Hino 300 Series",    type: "4 Ton Truck",  fleet: "FLT-008", driver: "—",                status: "Maintenance"},
  { reg: "CAB 521 GP", make: "DAF XF",             type: "18 Ton Truck", fleet: "FLT-009", driver: "Lebo Molefe",      status: "Available"  },
  { reg: "CAB 612 GP", make: "Freightliner Cascadia",type:"12 Ton Truck",fleet: "FLT-010", driver: "Ruan Potgieter",   status: "Utilizing"  },
  { reg: "CAC 101 GP", make: "Scania R Series",    type: "18 Ton Truck", fleet: "FLT-011", driver: "—",                status: "Maintenance"},
  { reg: "CAC 202 GP", make: "Isuzu NPR",          type: "3 Ton Truck",  fleet: "FLT-012", driver: "Mpho Sithole",     status: "Utilizing"  },
];

const STATUS_OPTIONS = [
  { label: "Utilizing",   value: "Utilizing"   },
  { label: "Available",   value: "Available"   },
  { label: "Maintenance", value: "Maintenance" },
];

const TYPE_OPTIONS = [...new Set(initialVehicles.map((v) => v.type))].map((t) => ({
  label: t, value: t,
}));

const DRIVER_OPTIONS = [
  { label: "Driver Assigned",    value: "assigned"   },
  { label: "No Driver Assigned", value: "unassigned" },
];

export default function VehiclesList() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [driverFilter, setDriverFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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
  } = useTableFilters({
    data: vehicles,
    searchFields: ["reg", "make", "type", "fleet", "driver"],
    pageSize: 10,
    filterFn: (item, _f) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (driverFilter === "assigned"   && item.driver === "—") return false;
      if (driverFilter === "unassigned" && item.driver !== "—") return false;
      return true;
    },
  });

  const handleReset = () => {
    resetFilters();
    setDriverFilter("");
    setTypeFilter("");
  };

  const anyActive = hasActiveFilters || !!driverFilter || !!typeFilter;

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">VEHICLES</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New Vehicle
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={rawSearch}
            onChange={handleSearch}
            placeholder="Search reg, make, fleet, driver..."
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
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setPage(1); }}
            options={TYPE_OPTIONS}
            placeholder="All Types"
          />
          <FilterSelect
            value={driverFilter}
            onChange={(v) => { setDriverFilter(v); setPage(1); }}
            options={DRIVER_OPTIONS}
            placeholder="Driver Assignment"
          />
          <div className="col-span-2 sm:col-span-1">
            <ResetButton onClick={handleReset} active={anyActive} />
          </div>
        </div>
      </div>

      {anyActive && (
        <p className="mb-3 text-xs font-medium text-blue-600">
          {filtered.length} of {total} records match current filters
        </p>
      )}

      {/* ---------- Desktop / tablet: full table ---------- */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[780px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {[
                ["reg",    "Registration"],
                ["fleet",  "Fleet No."],
                ["make",   "Vehicle Make"],
                ["type",   "Type"],
                ["driver", "Driver"],
                ["status", "Status"],
              ].map(([key, label]) => (
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
              <EmptyState message="No vehicles match your filters." colSpan={6} />
            ) : (
              paginated.map((v, idx) => (
                <tr
                  key={v.reg}
                  className={`text-sm text-gray-700 transition-colors hover:bg-gray-50/60 ${
                    idx !== paginated.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <a href="#" className="font-mono font-semibold text-blue-600 hover:underline">
                      {v.reg}
                    </a>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{v.fleet}</td>
                  <td className="px-5 py-3.5 font-medium">{v.make}</td>
                  <td className="px-5 py-3.5 text-gray-600">{v.type}</td>
                  <td className="px-5 py-3.5">
                    {v.driver !== "—" ? (
                      <span className="text-blue-600">{v.driver}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile: card list instead of a squeezed 6-column table ---------- */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">
            No vehicles match your filters.
          </div>
        ) : (
          paginated.map((v) => (
            <div key={v.reg} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <a href="#" className="font-mono text-sm font-semibold text-blue-600 hover:underline">
                  {v.reg}
                </a>
                <StatusBadge status={v.status} />
              </div>

              <p className="text-sm font-medium text-gray-900">{v.make}</p>
              <p className="text-xs text-gray-500">{v.type}</p>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  <span className="font-mono">{v.fleet}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  {v.type}
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  {v.driver !== "—" ? (
                    <span className="text-blue-600">{v.driver}</span>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
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

      <AddVehicleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(newEntry) => setVehicles((prev) => [newEntry, ...prev])}
      />
    </div>
  );
}