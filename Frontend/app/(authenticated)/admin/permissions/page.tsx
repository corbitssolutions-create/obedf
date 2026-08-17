"use client";

import React, { useState } from "react";
import { Shield, Search, Lock } from "lucide-react";

export default function PermissionsPage() {
  const [permissions] = useState([
    { module: "Operations", action: "Create Manifest", role: "Dispatcher", status: "Active" },
    { module: "Billing", action: "Generate Invoice", role: "Finance Manager", status: "Active" },
    { module: "Admin", action: "Manage Users", role: "Super Admin", status: "Active" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">Configure role permissions and module access</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <th className="text-left py-3.5 px-4">Module</th>
              <th className="text-left py-3.5 px-4">Action</th>
              <th className="text-left py-3.5 px-4">Assigned Role</th>
              <th className="text-left py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {permissions.map((p, idx) => (
              <tr key={idx} className="hover:bg-blue-50/20">
                <td className="py-3.5 px-4 font-semibold text-gray-900">{p.module}</td>
                <td className="py-3.5 px-4 text-gray-700">{p.action}</td>
                <td className="py-3.5 px-4 font-medium text-blue-600">{p.role}</td>
                <td className="py-3.5 px-4">
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                    {p.status}
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
