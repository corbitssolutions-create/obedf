"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPut, apiGet } from "@/lib/api";
import { Building2, Check } from "lucide-react";

interface BranchLookup {
  _id: string;
  code: string;
  name: string;
  isHeadOffice?: boolean;
}

export interface UserRecord {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  phoneNumber?: string;
  status: string;
  branches?: { _id: string; code: string; name: string }[];
  createdAt?: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  user: UserRecord;
  onClose: () => void;
  onUpdated: () => void;
}

const ROLES = [
  "Super Admin",
  "Administrator",
  "Dispatcher",
  "Driver",
  "Operation Manager",
  "Finance User",
  "Sales User",
];
const DEPTS = ["Executive", "Operations", "Logistics", "Finance", "IT", "HR"];

export default function EditUserModal({ isOpen, user, onClose, onUpdated }: EditUserModalProps) {
  const [fullName,       setFullName]    = useState(user.fullName);
  const [email,          setEmail]       = useState(user.email);
  const [username,       setUsername]    = useState(user.username ?? "");
  const [role,           setRole]        = useState(user.role);
  const [department,     setDept]        = useState(user.department ?? "Operations");
  const [phoneNumber,    setPhone]       = useState(user.phoneNumber ?? "");
  const [status,         setStatus]      = useState(user.status);
  const [selectedBranches, setSelected] = useState<string[]>(
    (user.branches ?? []).map((b) => b._id)
  );
  const [branches,       setBranches]    = useState<BranchLookup[]>([]);
  const [branchSearch,   setBranchSearch]= useState("");
  const [submitting,     setSubmitting]  = useState(false);
  const [error,          setError]       = useState("");
  const [activeTab,      setActiveTab]   = useState<"info" | "branches">("info");

  // Load branches when modal opens
  useEffect(() => {
    if (!isOpen) return;
    apiGet<{ success: boolean; data: BranchLookup[] }>("/api/branches/lookup")
      .then((r) => setBranches(r.data ?? []))
      .catch(() => {});
  }, [isOpen]);

  // Sync when a different user is passed in
  useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
    setUsername(user.username ?? "");
    setRole(user.role);
    setDept(user.department ?? "Operations");
    setPhone(user.phoneNumber ?? "");
    setStatus(user.status);
    setSelected((user.branches ?? []).map((b) => b._id));
    setBranchSearch("");
    setError("");
    setActiveTab("info");
  }, [user]);

  const toggleBranch = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );

  const selectAll = () => setSelected(branches.map((b) => b._id));
  const clearAll  = () => setSelected([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      await apiPut(`/api/users/${user._id}`, {
        fullName, email,
        username:    username    || undefined,
        role, department,
        phoneNumber: phoneNumber || undefined,
        branches:    selectedBranches,   // [] = any branch allowed
        status,
      });
      onUpdated(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const tabs = [
    { key: "info",     label: "User Info" },
    { key: "branches", label: `Branches${selectedBranches.length ? ` (${selectedBranches.length})` : ""}` },
  ] as const;

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="edit-user-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Saving…" : "Save Changes"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Edit User" footer={footer} size="max-w-2xl">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <form id="edit-user-form" onSubmit={handleSubmit}>

        {/* ── User Info tab ─────────────────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Full Name" required>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  required className={inputClass} />
              </Field>
            </div>
            <Field label="Email Address" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required className={inputClass} />
            </Field>
            <Field label="Username">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className={inputClass} />
            </Field>
            <Field label="Role" required>
              <Select value={role} onChange={setRole} placeholder="Select role"
                options={ROLES} required />
            </Field>
            <Field label="Department">
              <Select value={department} onChange={setDept} placeholder="Select department"
                options={DEPTS} />
            </Field>
            <Field label="Phone Number">
              <input type="text" value={phoneNumber} onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 082 000 0000" className={inputClass} />
            </Field>
            <Field label="Status" required>
              <Select value={status} onChange={setStatus} placeholder="Select status"
                options={["Active", "Inactive"]} required />
            </Field>
          </div>
        )}

        {/* ── Branches tab ─────────────────────────────────────────────── */}
        {activeTab === "branches" && (
          <div className="space-y-4">

            {/* Info banner */}
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              selectedBranches.length === 0
                ? "border-amber-100 bg-amber-50 text-amber-700"
                : "border-green-100 bg-green-50 text-green-700"
            }`}>
              {selectedBranches.length === 0 ? (
                <p>⚠️ No branches selected — user can login from <strong>any branch</strong>.</p>
              ) : (
                <p>✅ User can login from <strong>{selectedBranches.length} selected branch{selectedBranches.length > 1 ? "es" : ""}</strong> only.</p>
              )}
            </div>

            {/* Search + bulk actions */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branches…"
                className={`${inputClass} flex-1`}
              />
              <button type="button" onClick={selectAll}
                className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Select all
              </button>
              <button type="button" onClick={clearAll}
                className="whitespace-nowrap rounded-lg border border-red-100 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50">
                Clear
              </button>
            </div>

            {/* Branch checklist */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
              {branches.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                  No branches found. Add branches first.
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                  No branches match your search.
                </div>
              ) : (
                filteredBranches.map((b, i) => {
                  const checked = selectedBranches.includes(b._id);
                  return (
                    <label
                      key={b._id}
                      onClick={() => toggleBranch(b._id)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                        i !== filteredBranches.length - 1 ? "border-b border-gray-50" : ""
                      } ${checked ? "bg-blue-50/60" : "hover:bg-gray-50/60"}`}>
                      {/* Custom checkbox */}
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                        checked
                          ? "border-blue-600 bg-blue-600"
                          : "border-gray-300 bg-white"
                      }`}>
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>

                      <Building2 className={`h-4 w-4 shrink-0 ${checked ? "text-blue-600" : "text-gray-400"}`} />

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${checked ? "text-blue-700" : "text-gray-800"}`}>
                          {b.name}
                          {b.isHeadOffice && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                              HQ
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-xs text-gray-400">{b.code}</p>
                      </div>

                      {checked && (
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                          Assigned
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            {selectedBranches.length > 0 && (
              <p className="text-xs text-gray-500">
                Selected: {branches
                  .filter((b) => selectedBranches.includes(b._id))
                  .map((b) => b.name)
                  .join(" • ")}
              </p>
            )}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
