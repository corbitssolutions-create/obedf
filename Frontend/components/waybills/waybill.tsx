"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, User, MapPin, Package, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import {
  SearchBar, FilterSelect, DateRangeFilter, QuickDateSelect,
  ResetButton, SortIcon, Pagination, EmptyState, StatusBadge,
} from "../ui/TableToolbar";
import { ToastContainer, useToast } from "../ui/Toast";
import CreateWaybillPage, { WaybillFormData } from "./way-det";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Status = "Draft" | "Active" | "Cancelled" | "Delivered" | "Outstanding" | "Failed";

interface Waybill {
  _id:      string;   // Mongo ObjectId — used for edit/delete API calls
  id:       string;   // waybillNo — displayed in table
  customer: string;
  receiver: string;
  driver:   string;
  vehicle:  string;
  route:    string;
  parcels:  number;
  weight:   number;
  status:   Status;
  date:     string;
  raw:      any;      // full raw API response — used to pre-fill edit form
}

const STATUS_OPTIONS = [
  { label: "To Deliver",  value: "To Deliver"      },
  { label: "Delivered",   value: "Delivered"   },
  { label: "POD",      value: "POD"      },
    { label: "Partial PODed",      value: "Partial PODed"      },
    { label: "To Deliver",      value: "To Deliver"      },
    { label: "To Manifest",      value: "To Manifest"      },
    { label: "On Delivery",      value: "On Delivery"      },

];

/* ─── Delete Confirmation Dialog ────────────────────────────────────────── */
function DeleteDialog({
  waybillNo,
  onConfirm,
  onCancel,
  loading,
}: {
  waybillNo: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-7 w-7 text-red-500" />
          </span>
        </div>
        <h3 className="mb-2 text-center text-lg font-bold text-gray-900">Delete Waybill?</h3>
        <p className="mb-1 text-center text-sm text-gray-600">
          You are about to permanently delete waybill
        </p>
        <p className="mb-5 text-center text-base font-semibold text-blue-600">{waybillNo}</p>
        <p className="mb-6 text-center text-sm text-gray-500">
          This action <span className="font-semibold text-red-600">cannot be undone</span>.
          All data associated with this waybill will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
            ) : (
              <><Trash2 className="h-4 w-4" /> Yes, Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function WaybillsPage() {
  const { toasts, remove, success, error: toastError } = useToast();

  const [waybills,   setWaybills]   = useState<Waybill[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState<"list" | "create" | "edit">("list");
  const [editTarget, setEditTarget] = useState<Waybill | null>(null);

  // Delete state
  const [deleteTarget,  setDeleteTarget]  = useState<Waybill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter state
  const [customerFilter, setCustomerFilter] = useState("");
  const [driverFilter,   setDriverFilter]   = useState("");
  const [routeFilter,    setRouteFilter]    = useState("");

  // Role — read from localStorage (set at login)
  const [userRole, setUserRole] = useState<string>("");
  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUserRole(JSON.parse(u).role ?? "");
    } catch {}
  }, []);
  const isSuperAdmin = userRole === "Super Admin";

  /* ── Fetch ── */
  const fetchWaybills = useCallback(async () => {
    try {
      const data = await apiGet<{ success: boolean; data: any[] }>("/api/waybills?limit=1000");
      if (data.success) {
        setWaybills(
          (data.data || []).map((item: any) => {
            const w = item.parcels?.reduce((s: number, p: any) => s + (p.weight || 0), 0) || 0;
            return {
              _id:      item._id,
              id:       item.waybillNo,
              customer: item.sender,
              receiver: item.receiver,
              driver:   item.driver    || "—",
              vehicle:  item.vehicle   || "—",
              route:    item.deliveryPoint || "—",
              parcels:  item.quantity  || 1,
              weight:   Math.round(w * 10) / 10,
              status:   item.status,
              date:     new Date(item.date).toLocaleDateString("en-ZA", {
                day: "2-digit", month: "2-digit", year: "numeric",
              }),
              raw: item,
            };
          })
        );
      }
    } catch (err) {
      console.error("Error fetching waybills:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWaybills(); }, [fetchWaybills]);

  /* ── Build payload helper (shared by create + edit) ── */
  const buildPayload = (data: WaybillFormData) => ({
    billingAccount:        data.billingAccountId || undefined,
    sender:                data.sender,
    pickupPoint:           data.pickupPoint || data.sender,
    senderContact:         data.senderContact || undefined,
    senderAddress: [
      data.senderAddress.building,
      data.senderAddress.street,
      data.senderAddress.suburb,
      data.senderAddress.city,
      data.senderAddress.province,
      data.senderAddress.postalCode,
      data.senderAddress.country || "South Africa",
    ].filter(Boolean).join(", "),
    billingContactPerson:  data.billingContactPerson  || undefined,
    billingEmail:          data.billingEmail          || undefined,
    billingPhone:          data.billingPhone          || undefined,
    paymentType:           data.paymentType           || undefined,
    paymentCollectionType: data.paymentCollectionType || undefined,
    receiver:              data.receiver,
    deliveryPoint:         data.deliveryPoint         || undefined,
    receiverContact:       data.receiverContact       || undefined,
    receiverAddress: {
      building:   data.receiverAddress.building,
      street:     data.receiverAddress.street,
      suburb:     data.receiverAddress.suburb,
      city:       data.receiverAddress.city,
      province:   data.receiverAddress.province,
      postalCode: data.receiverAddress.postalCode,
      country:    data.receiverAddress.country || "South Africa",
    },
    billingSameAsReceiver: true,
    serviceType:           data.serviceType    || undefined,
    rateType:              data.rateType       || undefined,
    charges:               data.codAmount      || "0",
    specialInstructions:   data.specialInstructions || data.notes || undefined,
    quantity:              data.quantity,
    parcels: data.parcels.length > 0
      ? data.parcels.map(p => ({ id: p.id, weight: p.weight, length: p.length, width: p.width, height: p.height }))
      : [],
    extraCharges: data.extraCharges.map(c => ({
      extraChargeId: c.extraChargeId || undefined,
      chargeCode:    c.chargeCode    || undefined,
      chargeName:    c.description   || "",
      chargeType:    c.chargeType    || "Fixed",
      defaultAmount: c.defaultAmount ?? 0,
      amount:        c.amount        ?? 0,
    })),
  });

  /* ── Create ── */
  const handleCreate = async (data: WaybillFormData) => {
    try {
      const result = await apiPost<{ success: boolean; error?: string }>(
        "/api/waybills",
        { ...buildPayload(data), status: "Active" }
      );
      if (result.success) {
        await fetchWaybills();
        setView("list");
        success("Waybill Created", "New waybill has been saved successfully.");
      } else {
        toastError("Create Failed", result.error || "Failed to create waybill.");
      }
    } catch (err: any) {
      toastError("Create Failed", err.message || "An unexpected error occurred.");
    }
  };

  /* ── Edit ── */
  const handleEdit = async (data: WaybillFormData) => {
    if (!editTarget) return;
    try {
      const result = await apiPut<{ success: boolean; error?: string }>(
        `/api/waybills/${editTarget._id}`,
        buildPayload(data)
      );
      if (result.success) {
        await fetchWaybills();
        setView("list");
        setEditTarget(null);
        success("Waybill Updated", `${editTarget.id} has been updated successfully.`);
      } else {
        toastError("Update Failed", result.error || "Failed to update waybill.");
      }
    } catch (err: any) {
      toastError("Update Failed", err.message || "An unexpected error occurred.");
    }
  };

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`/api/waybills/${deleteTarget._id}`);
      setWaybills(p => p.filter(w => w._id !== deleteTarget._id));
      success("Waybill Deleted", `${deleteTarget.id} has been permanently deleted.`);
    } catch (err: any) {
      toastError("Delete Failed", err.message || "You may not have permission to delete waybills.");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  /* ── Table filters ── */
  const {
    paginated, filtered, total,
    rawSearch, handleSearch,
    filters, handleFilter, handleDateRange,
    sort, handleSort,
    page, setPage, pageSize, handlePageSize, totalPages,
    resetFilters, hasActiveFilters,
  } = useTableFilters<Waybill>({
    data: waybills,
    searchFields: ["id", "customer", "receiver", "driver", "vehicle", "route"],
    pageSize: 10,
    filterFn: (item) => {
      if (customerFilter && item.customer !== customerFilter) return false;
      if (driverFilter   && item.driver   !== driverFilter)   return false;
      if (routeFilter    && item.route    !== routeFilter)     return false;
      return true;
    },
  });

  const handleReset = () => {
    resetFilters();
    setCustomerFilter(""); setDriverFilter(""); setRouteFilter("");
  };

  /* ── Render create / edit form ── */
  if (view === "create") {
    return (
      <>
        <CreateWaybillPage onBack={() => setView("list")} onSubmit={handleCreate} />
        <ToastContainer toasts={toasts} onRemove={remove} />
      </>
    );
  }
  if (view === "edit" && editTarget) {
    return (
      <>
        <CreateWaybillPage
          onBack={() => { setView("list"); setEditTarget(null); }}
          onSubmit={handleEdit}
          editData={editTarget.raw}
        />
        <ToastContainer toasts={toasts} onRemove={remove} />
      </>
    );
  }

  /* ── Option lists ── */
  const customerOptions = Array.from(new Set(waybills.map(w => w.customer))).map(c => ({ label: c, value: c }));
  const driverOptions   = Array.from(new Set(waybills.map(w => w.driver))).map(d => ({ label: d, value: d }));
  const routeOptions    = Array.from(new Set(waybills.map(w => w.route))).map(r => ({ label: r, value: r }));
  const anyActive       = hasActiveFilters || !!customerFilter || !!driverFilter || !!routeFilter;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-white px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">WAYBILLS</h1>
            <p className="mt-0.5 text-sm text-gray-500">{total} total records</p>
          </div>
          <button onClick={() => setView("create")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto">
            <Plus className="h-4 w-4" /> New Waybill
          </button>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="w-full sm:max-w-md">
            <SearchBar value={rawSearch} onChange={handleSearch}
              placeholder="Search waybill no., customer, receiver…" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <FilterSelect value={String(filters.status ?? "")}
              onChange={v => handleFilter("status", v)} options={STATUS_OPTIONS} placeholder="All Statuses" />
            <FilterSelect value={customerFilter}
              onChange={v => { setCustomerFilter(v); setPage(1); }} options={customerOptions} placeholder="All Customers" />
            <FilterSelect value={driverFilter}
              onChange={v => { setDriverFilter(v); setPage(1); }} options={driverOptions} placeholder="All Drivers" />
            <FilterSelect value={routeFilter}
              onChange={v => { setRouteFilter(v); setPage(1); }} options={routeOptions} placeholder="All Routes" />
            <div className="col-span-2 sm:col-span-1">
              <QuickDateSelect onSelect={(from, to) => handleDateRange({ from, to })} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="w-full sm:w-auto">
              <DateRangeFilter
                from={filters.dateRange.from} to={filters.dateRange.to}
                onFromChange={v => handleDateRange({ ...filters.dateRange, from: v })}
                onToChange={v   => handleDateRange({ ...filters.dateRange, to:   v })}
              />
            </div>
            <ResetButton onClick={handleReset} active={anyActive} />
          </div>
        </div>

        {anyActive && (
          <p className="mb-3 text-xs font-medium text-blue-600">
            {filtered.length} of {total} records match
          </p>
        )}

        {/* ── Desktop table ── */}
        <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {([ ["id","Waybill No."], ["customer","Customer"], ["receiver","Receiver"],
                    ["driver","Driver"], ["route","Route"], ["parcels","Parcels"],
                    ["status","Status"], ["date","Date"],
                ] as [keyof Waybill, string][]).map(([key, label]) => (
                  <th key={key} onClick={() => handleSort(key)}
                    className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                    {label}<SortIcon sortState={sort} column={key} />
                  </th>
                ))}
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <EmptyState message="No waybills match your filters." colSpan={9} />
                : paginated.map((wb, idx) => (
                  <tr key={wb._id}
                    className={`text-sm text-gray-700 hover:bg-gray-50/60 ${idx !== paginated.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-blue-600">{wb.id}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{wb.customer}</td>
                    <td className="px-5 py-3.5">{wb.receiver}</td>
                    <td className="px-5 py-3.5 text-gray-500">{wb.driver}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{wb.route}</td>
                    <td className="px-5 py-3.5 text-center">{wb.parcels}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={wb.status} /></td>
                    <td className="px-5 py-3.5 text-gray-500">{wb.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {/* Edit — all authenticated users */}
                        <button
                          onClick={() => { setEditTarget(wb); setView("edit"); }}
                          className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
                          <Pencil className="h-3 w-3" /> 
                        </button>
                        {/* Delete — Super Admin only */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => setDeleteTarget(wb)}
                            className="flex items-center gap-1 rounded-md border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors">
                            <Trash2 className="h-3 w-3" /> 
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="space-y-3 md:hidden">
          {paginated.length === 0 ? (
            <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">
              No waybills match your filters.
            </div>
          ) : paginated.map(wb => (
            <div key={wb._id} className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-blue-600">{wb.id}</span>
                <StatusBadge status={wb.status} />
              </div>
              <p className="text-sm font-medium text-gray-900">{wb.customer}</p>
              <p className="text-xs text-gray-500">To: {wb.receiver}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5"><User    className="h-3.5 w-3.5 text-gray-400" />{wb.driver}</div>
                <div className="flex items-center gap-1.5"><MapPin   className="h-3.5 w-3.5 text-gray-400" /><span className="font-mono">{wb.route}</span></div>
                <div className="flex items-center gap-1.5"><Package  className="h-3.5 w-3.5 text-gray-400" />{wb.parcels} parcels</div>
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" />{wb.date}</div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditTarget(wb); setView("edit"); }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {isSuperAdmin && (
                  <button onClick={() => setDeleteTarget(wb)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-100 py-2 text-xs font-medium text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-4 overflow-x-auto">
          <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
            total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteDialog
          waybillNo={deleteTarget.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
