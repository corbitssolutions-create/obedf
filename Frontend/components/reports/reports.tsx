"use client";

import { useState } from "react";
import { Download, FileBarChart2, FileText, TrendingUp, Truck } from "lucide-react";
import { useTableFilters } from "../hooks/useTableFilters";
import { SearchBar, FilterSelect, ResetButton, EmptyState } from "../ui/TableToolbar";

type ReportCategory = "Delivery" | "Operations" | "Finance" | "Performance";

interface Report {
  name: string;
  description: string;
  category: ReportCategory;
  format: string;
  status: string;  // used generically so hook filtering works if needed
}

const reports: Report[] = [
  { name: "Waybill Report",               description: "Detailed waybill summary with status breakdown",      category: "Delivery",    format: "CSV / PDF", status: "Active" },
  { name: "Manifest Report",              description: "Manifest and daily dispatch summary",                  category: "Operations",  format: "CSV / PDF", status: "Active" },
  { name: "Delivery Performance Report",  description: "On-time delivery rates and performance analytics",     category: "Performance", format: "PDF",       status: "Active" },
  { name: "POD Report",                   description: "Proof of delivery statistics and return summary",      category: "Delivery",    format: "CSV / PDF", status: "Active" },
  { name: "Customer Report",              description: "Customer transaction history and volume summary",      category: "Operations",  format: "CSV / PDF", status: "Active" },
  { name: "Driver Performance Report",    description: "Driver delivery rates, distances and scores",          category: "Performance", format: "PDF",       status: "Active" },
  { name: "Vehicle Utilization Report",   description: "Fleet usage, mileage and availability report",        category: "Operations",  format: "PDF",       status: "Active" },
  { name: "Revenue Report",               description: "Revenue breakdown by route, customer and period",      category: "Finance",     format: "CSV / PDF", status: "Active" },
  { name: "COD Collection Report",        description: "Cash on delivery collection and outstanding balances", category: "Finance",     format: "CSV",       status: "Active" },
  { name: "Route Efficiency Report",      description: "Route-level KPIs, fuel costs and time metrics",       category: "Performance", format: "PDF",       status: "Active" },
  { name: "Failed Deliveries Report",     description: "Summary of failed, returned and cancelled deliveries",category: "Delivery",    format: "CSV / PDF", status: "Active" },
  { name: "Invoice Summary Report",       description: "Invoiced amounts, paid and outstanding per customer",  category: "Finance",     format: "CSV / PDF", status: "Active" },
];

const CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: "Delivery",    value: "Delivery"    },
  { label: "Operations",  value: "Operations"  },
  { label: "Finance",     value: "Finance"     },
  { label: "Performance", value: "Performance" },
];

const categoryIcon: Record<ReportCategory, React.ElementType> = {
  Delivery:    FileText,
  Operations:  Truck,
  Finance:     FileBarChart2,
  Performance: TrendingUp,
};

const categoryColor: Record<ReportCategory, string> = {
  Delivery:    "bg-blue-50 text-blue-600",
  Operations:  "bg-emerald-50 text-emerald-600",
  Finance:     "bg-purple-50 text-purple-600",
  Performance: "bg-orange-50 text-orange-600",
};

export default function ReportsTable() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);

  const {
    paginated,
    filtered,
    total,
    rawSearch,
    handleSearch,
    resetFilters,
    hasActiveFilters,
  } = useTableFilters<Report>({
    data: reports,
    searchFields: ["name", "description", "category", "format"],
    pageSize: 50,
    filterFn: (item, _f) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      return true;
    },
  });

  const handleReset = () => {
    resetFilters();
    setCategoryFilter("");
  };

  const handleGenerate = (reportName: string) => {
    setGenerating(reportName);
    setTimeout(() => setGenerating(null), 1500);
  };

  const anyActive = hasActiveFilters || !!categoryFilter;

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <FileBarChart2 className="h-6 w-6 flex-shrink-0 text-gray-700" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">REPORTS</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} available reports</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="w-full sm:max-w-md">
          <SearchBar
            value={rawSearch}
            onChange={handleSearch}
            placeholder="Search report name, category, format..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v)}
            options={CATEGORY_OPTIONS}
            placeholder="All Categories"
          />
          <ResetButton onClick={handleReset} active={anyActive} />
        </div>
      </div>

      {anyActive && (
        <p className="mb-3 text-xs font-medium text-blue-600">
          {filtered.length} of {total} reports match current filters
        </p>
      )}

      {/* ---------- Desktop / tablet: full table ---------- */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 md:block">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">Report Name</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">Description</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">Category</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600">Format</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <EmptyState message="No reports match your search." colSpan={5} />
            ) : (
              paginated.map((report, idx) => {
                const Icon = categoryIcon[report.category];
                const isGenerating = generating === report.name;
                return (
                  <tr
                    key={report.name}
                    className={`text-sm text-gray-700 transition-colors hover:bg-gray-50/60 ${
                      idx !== paginated.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${categoryColor[report.category]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-gray-800">{report.name}</span>
                      </div>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-gray-500">{report.description}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${categoryColor[report.category]}`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{report.format}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleGenerate(report.name)}
                        disabled={isGenerating}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                          isGenerating
                            ? "cursor-not-allowed bg-gray-100 text-gray-400"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isGenerating ? "Generating…" : "Generate"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile: card list instead of a squeezed 5-column table ---------- */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-gray-100 py-10 text-center text-sm text-gray-500">
            No reports match your search.
          </div>
        ) : (
          paginated.map((report) => {
            const Icon = categoryIcon[report.category];
            const isGenerating = generating === report.name;
            return (
              <div key={report.name} className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${categoryColor[report.category]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800">{report.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{report.description}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${categoryColor[report.category]}`}>
                      {report.category}
                    </span>
                    <span className="font-mono text-xs text-gray-500">{report.format}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerate(report.name)}
                    disabled={isGenerating}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isGenerating
                        ? "cursor-not-allowed bg-gray-100 text-gray-400"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isGenerating ? "Generating…" : "Generate"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}