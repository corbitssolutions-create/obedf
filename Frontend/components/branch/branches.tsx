"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api";
import { useTableFilters } from "../hooks/useTableFilters";
import AddBranchModal from "./AddBranchModal";
import EditBranchModal from "./EditBranchModal";
import { SearchBar, FilterSelect, ResetButton, SortIcon, Pagination, EmptyState, StatusBadge } from "../ui/TableToolbar";

export interface Branch {
  _id: string; code: string; name: string;
  city?: string; province?: string; phoneNumber?: string; email?: string;
  managerName?: string; isHeadOffice?: boolean; status: string; createdAt: string;
}

const STATUS_OPTS = [{ label:"Active",value:"Active" },{ label:"Inactive",value:"Inactive" }];

export default function BranchesTable() {
  const [branches,  setBranches]  = useState<Branch[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [isAddOpen, setAddOpen]   = useState(false);
  const [editTarget,setEditTarget]= useState<Branch|null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet<{success:boolean;data:Branch[]}>("/api/branches?limit=200&sort=name:asc");
      setBranches(res.data ?? []);
    } catch(e:any) { setError(e.message??"Failed to load branches"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleDelete = async (id:string, name:string) => {
    if (!confirm(`Delete branch "${name}"?`)) return;
    try { await apiDelete(`/api/branches/${id}`); setBranches(p=>p.filter(b=>b._id!==id)); }
    catch(e:any) { alert(e.message??"Delete failed"); }
  };

  const { paginated, filtered, total, rawSearch, handleSearch, filters, handleFilter, sort, handleSort, page, setPage, pageSize, handlePageSize, totalPages, resetFilters, hasActiveFilters } =
    useTableFilters<Branch>({ data: branches, searchFields: ["name","code","city","province","managerName"], pageSize: 10 });

  if (loading) return (
    <div className="flex min-h-[300px] items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">BRANCHES</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} records</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto">
          <Plus className="h-4 w-4" /> New Branch
        </button>
      </div>
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs"><SearchBar value={rawSearch} onChange={handleSearch} placeholder="Search branches…" /></div>
        <FilterSelect value={filters.status} onChange={v=>handleFilter("status",v)} options={STATUS_OPTS} placeholder="All Statuses" />
        <ResetButton onClick={resetFilters} active={hasActiveFilters} />
      </div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              {([["code","Code"],["name","Branch Name"],["city","City"],["province","Province"],["managerName","Manager"],["status","Status"]] as [keyof Branch,string][]).map(([k,l])=>(
                <th key={k} onClick={()=>handleSort(k)} className="cursor-pointer select-none whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100">
                  {l}<SortIcon sortState={sort} column={k} />
                </th>
              ))}
              <th className="px-5 py-3.5 text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length===0 ? <EmptyState message="No branches found." colSpan={7} /> : paginated.map((b,i)=>(
              <tr key={b._id} className={`text-sm text-gray-700 hover:bg-gray-50/60 ${i!==paginated.length-1?"border-b border-gray-50":""}`}>
                <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{b.code}</td>
                <td className="px-5 py-3.5 font-semibold text-gray-900">
                  {b.name}{b.isHeadOffice&&<span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">HQ</span>}
                </td>
                <td className="px-5 py-3.5">{b.city||"—"}</td>
                <td className="px-5 py-3.5">{b.province||"—"}</td>
                <td className="px-5 py-3.5">{b.managerName||"—"}</td>
                <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setEditTarget(b)} className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"><Pencil className="h-3 w-3"/>Edit</button>
                    <button onClick={()=>handleDelete(b._id,b.name)} className="flex items-center gap-1 rounded-md border border-red-100 px-2 py-1 text-xs text-red-500 hover:bg-red-50"><Trash2 className="h-3 w-3"/>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {paginated.map(b=>(
          <div key={b._id} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-blue-600">{b.code}</p>
                <p className="text-sm font-semibold text-gray-900">{b.name}{b.isHeadOffice&&<span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">HQ</span>}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5 text-gray-400"/>{[b.city,b.province].filter(Boolean).join(", ")||"—"}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={()=>setEditTarget(b)} className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Edit</button>
              <button onClick={()=>handleDelete(b._id,b.name)} className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto">
        <Pagination page={page} totalPages={totalPages} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={handlePageSize} />
      </div>
      <AddBranchModal isOpen={isAddOpen} onClose={()=>setAddOpen(false)} onCreated={fetchBranches} />
      {editTarget && <EditBranchModal isOpen={!!editTarget} branch={editTarget} onClose={()=>setEditTarget(null)} onUpdated={fetchBranches} />}
    </div>
  );
}
