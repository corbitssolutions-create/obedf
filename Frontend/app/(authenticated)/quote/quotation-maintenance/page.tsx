"use client";

import React, { useState } from "react";
import { Plus, Search, FileSignature, CheckCircle, Clock } from "lucide-react";

export default function QuotationMaintenancePage() {
  const [quotes] = useState([
    { quoteNo: "QT-8801", customer: "Makro Logistics", route: "JHB - CPT", rate: "R 24,500.00", validUntil: "30/07/2026", status: "Approved" },
    { quoteNo: "QT-8802", customer: "Pick n Pay Central", route: "JHB - DBN", rate: "R 18,200.00", validUntil: "25/07/2026", status: "Draft" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation Maintenance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage rate quotes and customer proposals</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm">
          <Plus className="w-4 h-4" />
          Create New Quote
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">All Quotations</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search quote..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <th className="text-left py-3.5 px-4">Quote No</th>
              <th className="text-left py-3.5 px-4">Customer</th>
              <th className="text-left py-3.5 px-4">Route</th>
              <th className="text-left py-3.5 px-4">Rate</th>
              <th className="text-left py-3.5 px-4">Valid Until</th>
              <th className="text-left py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {quotes.map((q) => (
              <tr key={q.quoteNo} className="hover:bg-blue-50/20">
                <td className="py-3.5 px-4 font-semibold text-blue-600">{q.quoteNo}</td>
                <td className="py-3.5 px-4 font-medium text-gray-900">{q.customer}</td>
                <td className="py-3.5 px-4 text-gray-600">{q.route}</td>
                <td className="py-3.5 px-4 font-semibold text-gray-900">{q.rate}</td>
                <td className="py-3.5 px-4 text-gray-500">{q.validUntil}</td>
                <td className="py-3.5 px-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    q.status === "Approved" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {q.status}
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
