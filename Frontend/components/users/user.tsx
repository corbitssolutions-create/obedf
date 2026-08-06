"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import { SearchBar, FilterSelect, ResetButton, SortIcon, Pagination, EmptyState, StatusBadge } from "../ui/TableToolbar";

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
  createdAt: string;
}

const ROLE_OPTIONS = [
  "Super Admin",
  "Administrator",
  "Dispatcher",
  "Driver",
  "Operation Manager",
  "Finance User",
  "Sales User",
].map(r => ({ label: r, value: r }));
const STATUS_OPTIONS  = [{label:"Active",value:"Active"},{label:"Inactive",value:"Inactive"}];

export default function UsersList() {
  const [users, setUsers]         = useState<UserRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [isAddOpen, setAddOpen]   = useState(false);
  const [editTarget, setEditTarget]= useState<UserRecord|null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{success:boolean;data:UserRecord[]}>("/api/users?limit=500&sort=fullName:asc");
      setUsers(res.data ?? []);
    } catch(e:any) { setError(e.message ?? "Failed to load users"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id:string, name:string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try { await apiDelete(`/api/users/${id}`); setUsers(p=>p.filter(u=>u._id!==id)); }
    catch(e:any) { alert(e.message ?? "Delete failed"); }
  };

  const { paginated, filtered, total, rawSearch, handleSearch, filters, handleFilter, sort, handleSort, page, setPage, pageSize, handlePageSize, totalPages, resetFilters, hasActiveFilters } =
    useTableFilters<UserRecord>({ data:users, searchFields:["fullName","email","username","role","department"], pageSize:10 });

  if (loading) return (
    <div className="flex min-h-[300px] items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">USERS</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} records</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> New User
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs"><SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search users…" /></div>
        <FilterSelect value={String(filters.status ?? "")} onChange={v=>handleFilter("status",v)} options={STATUS_OPTIONS} placeholder="All Statuses" />
        <FilterSelect value={String(filters.role ?? "")} onChange={v=>handleFilter("role",v)} options={ROLE_OPTIONS} placeholder="All Roles" />
        <ResetButton onClick={resetFilters} active={hasActiveFilters} />
      </div>

      {hasActiveFilters && <p className="mb-3 text-xs font-medium text-blue-600">{filtered.length} of {total} match</p>}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([["fullName","Full Name"],["email","Email"],["username","Username"],["role","Role"],["department","Department"],["status","Status"]] as [keyof UserRecord,string][]).map(([k,l])=>(
                <th key={k} onClick={()=>handleSort(k)} className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {l}<SortIcon sortState={sort} column={k} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600 whitespace-nowrap">Branch</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length===0 ? <EmptyState message="No users found." colSpan={8} /> : paginated.map((u,i)=>(
              <tr key={u._id} className={`text-sm text-gray-700 hover:bg-gray-50/60 ${i!==paginated.length-1?"border-b border-gray-50":""}`}>
                <td className="px-5 py-3.5 font-semibold text-gray-900">{u.fullName}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-blue-600">{u.username||"—"}</td>
                <td className="px-5 py-3.5">{u.role}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.department||"—"}</td>
                <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                <td className="px-5 py-3.5">
                  {u.branches && u.branches.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.branches.map((b) => (
                        <span key={b._id}
                          className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {b.code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs italic text-gray-400">Any</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setEditTarget(u)} className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"><Pencil className="h-3 w-3"/>Edit</button>
                    <button onClick={()=>handleDelete(u._id,u.fullName)} className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3"/>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {paginated.map(u=>(
          <div key={u._id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div><p className="text-sm font-semibold text-gray-900">{u.fullName}</p><p className="text-xs text-gray-500">{u.email}</p></div>
              <StatusBadge status={u.status} />
            </div>
            <p className="text-xs text-gray-500">{u.role} • {u.department}</p>
            {u.branches && u.branches.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {u.branches.map((b) => (
                  <span key={b._id}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {b.code} — {b.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="mt-1 block text-xs italic text-gray-400">Any branch</span>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={()=>setEditTarget(u)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
              <button onClick={()=>handleDelete(u._id,u.fullName)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>

      <AddUserModal isOpen={isAddOpen} onClose={()=>setAddOpen(false)} onCreated={fetchUsers} />
      {editTarget && <EditUserModal isOpen={!!editTarget} user={editTarget} onClose={()=>setEditTarget(null)} onUpdated={fetchUsers} />}
    </div>
  );
}
