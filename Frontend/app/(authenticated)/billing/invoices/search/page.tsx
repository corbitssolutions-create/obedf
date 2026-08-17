"use client";

import React, { useState } from "react";
import { Search, Filter, Download, FileText } from "lucide-react";

export default function SearchInvoicesPage() {
  const [invoices] = useState([
    { invoiceNo: "INV-2026-001", customer: "Makro (Pty) Ltd", date: "12/07/2026", amount: "R 45,200.00", status: "Paid" },
    { invoiceNo: "INV-2026-002", customer: "Takealot Online", date: "13/07/2026", amount: "R 128,450.00", status: "Pending" },
    { invoiceNo: "INV-2026-003", customer: "Builders Warehouse", date: "14/07/2026", amount: "R 18,900.00", status: "Overdue" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Search, filter, and export billing statements</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            placeholder="Search by Invoice No. or Customer..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <th className="text-left py-3.5 px-4">Invoice No</th>
              <th className="text-left py-3.5 px-4">Customer</th>
              <th className="text-left py-3.5 px-4">Date</th>
              <th className="text-left py-3.5 px-4">Amount</th>
              <th className="text-left py-3.5 px-4">Status</th>
              <th className="text-right py-3.5 px-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <tr key={inv.invoiceNo} className="hover:bg-blue-50/20">
                <td className="py-3.5 px-4 font-semibold text-blue-600">{inv.invoiceNo}</td>
                <td className="py-3.5 px-4 font-medium text-gray-900">{inv.customer}</td>
                <td className="py-3.5 px-4 text-gray-600">{inv.date}</td>
                <td className="py-3.5 px-4 font-semibold text-gray-900">{inv.amount}</td>
                <td className="py-3.5 px-4">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    inv.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                    inv.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="text-blue-600 hover:underline text-xs font-semibold">View Invoice</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
