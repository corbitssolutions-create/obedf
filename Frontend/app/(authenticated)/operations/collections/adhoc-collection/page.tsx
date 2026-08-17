"use client";

import React, { useState } from "react";
import { Plus, Search, Truck, Calendar, MapPin, CheckCircle, Clock, FileText } from "lucide-react";

export default function AdhocCollectionPage() {
  const [collections] = useState([
    { id: "ADH001", customer: "Makro Woodmead", address: "Woodmead Dr, Sandton", driver: "John Dlamini", status: "Scheduled", items: 4, date: "14/07/2026" },
    { id: "ADH002", customer: "Takealot DC", address: "Midrand Industrial", driver: "Sipho Mthembu", status: "In Transit", items: 12, date: "14/07/2026" },
    { id: "ADH003", customer: "Builders Warehouse", address: "Fourways, Sandton", driver: "Peter Venter", status: "Completed", items: 8, date: "13/07/2026" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adhoc Collection</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and track unscheduled customer pickups</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm">
          <Plus className="w-4 h-4" />
          New Adhoc Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Scheduled Pickups</div>
            <div className="text-xl font-bold text-gray-900">8 Requests</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">In Transit</div>
            <div className="text-xl font-bold text-gray-900">3 Vehicles</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Completed Today</div>
            <div className="text-xl font-bold text-gray-900">14 Pickups</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="font-bold text-gray-900 text-sm">Adhoc Requests Log</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search pickup..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <th className="text-left py-3 px-4">Request ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Address</th>
                <th className="text-left py-3 px-4">Assigned Driver</th>
                <th className="text-left py-3 px-4">Parcels</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collections.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/20">
                  <td className="py-3 px-4 font-semibold text-blue-600">{item.id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{item.customer}</td>
                  <td className="py-3 px-4 text-gray-600">{item.address}</td>
                  <td className="py-3 px-4 text-gray-700">{item.driver}</td>
                  <td className="py-3 px-4 text-gray-700">{item.items}</td>
                  <td className="py-3 px-4 text-gray-500">{item.date}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      item.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                      item.status === "In Transit" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
