"use client";

import React, { useState, useEffect } from "react";
import { ModalShell, Field, Select, inputClass } from "../ui/FormControls";
import { apiPost, apiGet } from "@/lib/api";
import { Building2, Check } from "lucide-react";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface BranchLookup {
  _id: string;
  code: string;
  name: string;
  isHeadOffice?: boolean;
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

export default function AddUserModal({ isOpen, onClose, onCreated }: AddUserModalProps) {
  const [fullName,       setFullName]    = useState("");
  const [email,          setEmail]       = useState("");
  const [username,       setUsername]    = useState("");
  const [password,       setPassword]    = useState("");
  const [role,           setRole]        = useState("");
  const [department,     setDept]        = useState("Operations");
  const [phoneNumber,    setPhone]       = useState("");
  const [status,         setStatus]      = useState("Active");
  const [selectedBranches, setSelected] = useState<string[]>([]); // array of _id
  const [branches,       setBranches]    = useState<BranchLookup[]>([]);
  const [branchSearch,   setBranchSearch]= useState("");
  const [submitting,     setSubmitting]  = useState(false);
  const [error,          setError]       = useState("");
  const [activeTab,      setActiveTab]   = useState<"info" | "branches">("info");

  useEffect(() => {
    if (!isOpen) return;
    apiGet<{ success: boolean; data: BranchLookup[] }>("/api/branches/lookup")
      .then((r) => setBranches(r.data ?? []))
      .catch(() => {});
  }, [isOpen]);

  const reset = () => {
    setFullName(""); setEmail(""); setUsername(""); setPassword("");
    setRole(""); setDept("Operations"); setPhone(""); setStatus("Active");
    setSelected([]); setBranchSearch(""); setError(""); setActiveTab("info");
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleBranch = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );

  const selectAll  = () => setSelected(branches.map((b) => b._id));
  const clearAll   = () => setSelected([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !role) { setActiveTab("info"); setError("Full name, email and role are required."); return; }
    if (!username.trim())  { setActiveTab("info"); setError("Username is required."); return; }
    if (!password.trim())  { setActiveTab("info"); setError("Password is required."); return; }
    if (password.length < 6) { setActiveTab("info"); setError("Password must be at least 6 characters."); return; }
    setSubmitting(true); setError("");
    try {
      await apiPost("/api/users", {
        fullName, email,
        username:    username.trim().toLowerCase(),
        password:    password.trim(),
        role, department,
        phoneNumber: phoneNumber || undefined,
        branches:    selectedBranches,
        status,
      });
      reset(); onCreated(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to create user");
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
    { key: "info",     label: "User Info"   },
    { key: "branches", label: `Branches${selectedBranches.length ? ` (${selectedBranches.length})` : ""}` },
  ] as const;

  const footer = (
    <>
      <button type="button" onClick={handleClose}
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
        Cancel
      </button>
      <button type="submit" form="add-user-form" disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {submitting ? "Creating…" : "Create User"}
      </button>
    </>
  );

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Add New User" footer={footer} size="max-w-2xl">
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

      <form id="add-user-form" onSubmit={handleSubmit}>

        {/* ── User Info tab ──────────────────────────────────────────────── */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Full Name" required>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Smith" required className={inputClass} />
              </Field>
            </div>
            <Field label="Email Address" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.co.za" required className={inputClass} />
            </Field>
            <Field label="Username" required>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jsmith" required className={inputClass} />
            </Field>
            <Field label="Password" required>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters" required className={inputClass} />
            </Field>
            <Field label="Phone Number">
              <input type="text" value={phoneNumber} onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 082 000 0000" className={inputClass} />
            </Field>
            <Field label="Role" required>
              <Select value={role} onChange={setRole} placeholder="Select role"
                options={ROLES} required />
            </Field>
            <Field label="Department">
              <Select value={department} onChange={setDept} placeholder="Select department"
                options={DEPTS} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Status" required>
                <Select value={status} onChange={setStatus} placeholder="Select status"
                  options={["Active", "Inactive"]} required />
              </Field>
            </div>
          </div>
        )}

        {/* ── Branches tab ───────────────────────────────────────────────── */}
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

            {/* Search + select all */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  placeholder="Search branches…"
                  className={`${inputClass} pl-3`}
                />
              </div>
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
                Selected: {branches.filter((b) => selectedBranches.includes(b._id)).map((b) => b.name).join(" • ")}
              </p>
            )}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
