"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus } from "lucide-react";

export default function RolesPage() {
  const [roles] = useState([
    { name: "Super Admin", users: 3, description: "Full system control and configuration" },
    { name: "Dispatcher", users: 12, description: "Manifest creation and load dispatching" },
    { name: "Driver", users: 28, description: "Delivery execution and debriefing" },
    { name: "Finance Manager", users: 5, description: "Invoicing and credit note management" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system access roles and responsibilities</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm">
          <Plus className="w-4 h-4" />
          Add New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map((role) => (
          <div key={role.name} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900 text-base">{role.name}</h3>
              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                {role.users} Users
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
