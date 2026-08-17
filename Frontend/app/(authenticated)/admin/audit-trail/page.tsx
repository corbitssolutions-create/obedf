"use client";

import React, { useState } from "react";
import { History, Search } from "lucide-react";

export default function AuditTrailPage() {
  const [logs] = useState([
    { id: "LOG-1092", user: "Thabo Mokoena", action: "Created Manifest TMF2507140001", timestamp: "14/07/2026 14:00", ip: "192.168.1.45" },
    { id: "LOG-1091", user: "John Dlamini", action: "Scanned parcel PRC00012479", timestamp: "14/07/2026 12:12", ip: "192.168.1.88" },
    { id: "LOG-1090", user: "Sipho Mthembu", action: "Completed Debrief DM00012345", timestamp: "14/07/2026 11:30", ip: "192.168.1.12" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-1">System activity logs and user action history</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">System Logs</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search audit log..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <th className="text-left py-3.5 px-4">Log ID</th>
              <th className="text-left py-3.5 px-4">User</th>
              <th className="text-left py-3.5 px-4">Action</th>
              <th className="text-left py-3.5 px-4">Timestamp</th>
              <th className="text-left py-3.5 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-blue-50/20">
                <td className="py-3.5 px-4 font-semibold text-blue-600">{log.id}</td>
                <td className="py-3.5 px-4 font-medium text-gray-900">{log.user}</td>
                <td className="py-3.5 px-4 text-gray-700">{log.action}</td>
                <td className="py-3.5 px-4 text-gray-500">{log.timestamp}</td>
                <td className="py-3.5 px-4 text-gray-400 font-mono">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
