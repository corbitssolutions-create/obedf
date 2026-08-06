"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

interface Waybill { _id: string; status: string; }

interface ManifestItem {
  _id: string;
  manifestNo: string;
  driver: string;
  vehicle: string;
  route: string;
  status: string;
  totalParcels: number;
  waybills: Waybill[];
}

export default function TodayDeliveries() {
  const [deliveries, setDeliveries] = useState<ManifestItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    apiGet<{ success: boolean; data: ManifestItem[] }>("/api/manifests?limit=10&sort=createdAt:desc")
      .then((res) => { if (res.success) setDeliveries(res.data ?? []); })
      .catch((e) => setError(e.message ?? "Could not load deliveries"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-6 flex min-h-[200px] items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
        {error} — Make sure the backend server is running on port 5000.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">Today's Deliveries</h2>
      </div>

      {deliveries.length === 0 ? (
        <div className="p-8 text-center font-medium text-gray-400">
          No active manifests registered.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Manifest No.", "Driver", "Vehicle", "Route", "Status", "Progress"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.map((item, idx) => {
                  const total     = item.waybills?.length || 0;
                  const completed = item.waybills?.filter((w) => w.status === "Delivered").length || 0;
                  const pct       = total > 0 ? (completed / total) * 100 : 0;
                  return (
                    <tr key={item._id || idx} className="border-t border-gray-100 transition hover:bg-gray-50">
                      <td className="px-6 py-5 font-semibold text-blue-600">{item.manifestNo}</td>
                      <td className="px-6 py-5 font-medium text-gray-800">{item.driver}</td>
                      <td className="px-6 py-5 text-gray-700">{item.vehicle}</td>
                      <td className="px-6 py-5 text-gray-700">{item.route}</td>
                      <td className="px-6 py-5">
                        <span className={`font-semibold ${item.status === "Delivered" ? "text-green-600" : "text-amber-600"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <span className="min-w-[55px] font-semibold text-gray-800">{completed}/{total}</span>
                          <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 md:hidden">
            {deliveries.map((item, idx) => {
              const total     = item.waybills?.length || 0;
              const completed = item.waybills?.filter((w) => w.status === "Delivered").length || 0;
              const pct       = total > 0 ? (completed / total) * 100 : 0;
              return (
                <div key={item._id || idx} className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="font-semibold text-blue-600">{item.manifestNo}</span>
                    <span className={`text-sm font-semibold ${item.status === "Delivered" ? "text-green-600" : "text-amber-600"}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div><span className="font-medium">Driver:</span> {item.driver}</div>
                    <div><span className="font-medium">Vehicle:</span> {item.vehicle}</div>
                    <div className="col-span-2"><span className="font-medium">Route:</span> {item.route}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-800">{completed}/{total}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
