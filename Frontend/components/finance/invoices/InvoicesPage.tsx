"use client";

import { useState } from "react";
import { 
  Plus, ChevronDown, Eye, Trash2, Search, Filter,
  Printer, Send, FileText, Calendar, Building2,
  DollarSign, X, Check, AlertCircle, Download,
  Copy, RotateCcw, User, MapPin, Package, Truck
} from "lucide-react";

interface Waybill {
  id: string;
  waybillNo: string;
  date: string;
  seller: string;
  receiver: string;
  origin: string;
  destination: string;
  amount: number;
  status: string;
}

interface ChargeItem {
  id: number;
  code: string;
  description: string;
  amountExclVAT: number;
  vatRate: number;
  vatAmount: number;
  amountInclVAT: number;
}

const NewInvoiceScreen = () => {
  const [isDraft, setIsDraft] = useState(true);
  const [selectedWaybills, setSelectedWaybills] = useState<string[]>([
    "WB-2026-007891",
    "WB-2026-007892",
    "WB-2026-007893",
    "WB-2026-007894"
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  // Sample waybills data
  const waybills: Waybill[] = [
    {
      id: "1",
      waybillNo: "WB-2026-007891",
      date: "05/07/2026",
      seller: "ABC Supplies",
      receiver: "Build It (Pty) Ltd",
      origin: "Durban",
      destination: "Johannesburg",
      amount: 2500.00,
      status: "Ready for Billing"
    },
    {
      id: "2",
      waybillNo: "WB-2026-007892",
      date: "06/07/2026",
      seller: "ABC Supplies",
      receiver: "Pick n Pay DC",
      origin: "Durban",
      destination: "Pretoria",
      amount: 1500.00,
      status: "Ready for Billing"
    },
    {
      id: "3",
      waybillNo: "WB-2026-007893",
      date: "07/07/2026",
      seller: "XYZ Traders",
      receiver: "Shoprite DC",
      origin: "Durban",
      destination: "Bloemfontein",
      amount: 900.00,
      status: "Ready for Billing"
    },
    {
      id: "4",
      waybillNo: "WB-2026-007894",
      date: "08/07/2026",
      seller: "ABC Supplies",
      receiver: "Checkers DC",
      origin: "Durban",
      destination: "Cape Town",
      amount: 2100.00,
      status: "Ready for Billing"
    }
  ];

  const [charges] = useState<ChargeItem[]>([
    {
      id: 1,
      code: "RF01",
      description: "Road Freight",
      amountExclVAT: 5000.00,
      vatRate: 15,
      vatAmount: 750.00,
      amountInclVAT: 5750.00
    },
    {
      id: 2,
      code: "FUEL",
      description: "Fuel Levy",
      amountExclVAT: 500.00,
      vatRate: 15,
      vatAmount: 75.00,
      amountInclVAT: 575.00
    },
    {
      id: 3,
      code: "HAND",
      description: "Handling Fee",
      amountExclVAT: 300.00,
      vatRate: 15,
      vatAmount: 45.00,
      amountInclVAT: 345.00
    },
    {
      id: 4,
      code: "WAIT",
      description: "Waiting Time",
      amountExclVAT: 200.00,
      vatRate: 15,
      vatAmount: 30.00,
      amountInclVAT: 230.00
    }
  ]);

  const totalExclVAT = charges.reduce((sum, item) => sum + item.amountExclVAT, 0);
  const totalVAT = charges.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalInclVAT = charges.reduce((sum, item) => sum + item.amountInclVAT, 0);

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const toggleWaybillSelection = (waybillNo: string) => {
    if (selectedWaybills.includes(waybillNo)) {
      setSelectedWaybills(selectedWaybills.filter(w => w !== waybillNo));
    } else {
      setSelectedWaybills([...selectedWaybills, waybillNo]);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedWaybills([]);
    } else {
      setSelectedWaybills(waybills.map(w => w.waybillNo));
    }
    setSelectAll(!selectAll);
  };

  const clearSelection = () => {
    setSelectedWaybills([]);
    setSelectAll(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-['Inter',system-ui,sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Invoice</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create a new invoice</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              <button 
                onClick={() => setIsDraft(true)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  isDraft 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Draft
              </button>
              <button 
                onClick={() => setIsDraft(false)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  !isDraft 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Published
              </button>
            </div>
            <span className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Invoice will be saved as draft until submitted for approval
            </span>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 bg-blue-50 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Invoice Information</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Billing Account <span className="text-red-500">*</span>
              </label>
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 font-medium">
                BA-10023 - Value World (Pty) Ltd
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Currency <span className="text-red-500">*</span>
              </label>
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900">
                ZAR - South African Rand
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                  <option>30 Days</option>
                  <option>60 Days</option>
                  <option>90 Days</option>
                  <option>On Delivery</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Due Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  defaultValue="2026-08-29"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Invoice Type <span className="text-red-500">*</span>
              </label>
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900">
                Standard Invoice
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Branch <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                  <option>Head Office</option>
                  <option>Durban Branch</option>
                  <option>Cape Town Branch</option>
                  <option>Johannesburg Branch</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Exchange Rate
              </label>
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900">
                1.0000
              </div>
              <p className="text-xs text-gray-400 mt-1.5">1 ZAR = 1.0000 ZAR</p>
            </div>
          </div>
        </div>

        {/* Waybills to Include */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Waybills to Include
                </h2>
                <span className="ml-1 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                  {selectedWaybills.length} Selected
                </span>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <Plus className="w-4 h-4" />
                Add Waybills
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search waybill"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72 z-10">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>All</option>
                        <option>Ready for Billing</option>
                        <option>Pending</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                      <div className="flex gap-2">
                        <input type="date" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="date" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-2 rounded-xl border border-gray-200">
              <span className="font-medium">Total (Excl. VAT):</span>
              <span className="font-semibold text-gray-900">R {formatCurrency(7000)}</span>
            </div>
          </div>

          {/* Waybills Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Waybill No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Receiver
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Origin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount (Excl. VAT)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {waybills.map((waybill) => (
                  <tr key={waybill.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedWaybills.includes(waybill.waybillNo)}
                        onChange={() => toggleWaybillSelection(waybill.waybillNo)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {waybill.waybillNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {waybill.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {waybill.seller}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {waybill.receiver}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {waybill.origin}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {waybill.destination}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      R {formatCurrency(waybill.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                        {waybill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Selection Footer */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-600">
              {selectedWaybills.length} waybill(s) selected
            </span>
            {selectedWaybills.length > 0 && (
              <button 
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Summary of Charges */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Summary of Charges</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Charge Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Charge Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount (Excl. VAT)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    VAT Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    VAT Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount (Incl. VAT)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {charge.id}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {charge.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {charge.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(charge.amountExclVAT)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {charge.vatRate}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(charge.vatAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(charge.amountInclVAT)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3.5 text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(totalExclVAT)}
                  </td>
                  <td className="px-4 py-3.5"></td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(totalVAT)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(totalInclVAT)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-6 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {notes.length} / 500
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-blue-50 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
            </div>
            <div className="space-y-3.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal (Excl. VAT)</span>
                <span className="font-semibold text-gray-900">R {formatCurrency(totalExclVAT)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total VAT</span>
                <span className="font-semibold text-gray-900">R {formatCurrency(totalVAT)}</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">Invoice Total (Incl. VAT)</span>
                <span className="font-bold text-blue-600 text-lg">R {formatCurrency(totalInclVAT)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-blue-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
            </div>
            <div className="space-y-3.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Less: Credit Notes</span>
                <span className="font-medium text-gray-900">R0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Add: Debit Notes</span>
                <span className="font-medium text-gray-900">R0.00</span>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">Outstanding Balance</span>
                <span className="font-bold text-green-600 text-lg">R {formatCurrency(totalInclVAT)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button className="px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button className="px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200">
              <Send className="w-4 h-4" />
              Submit for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewInvoiceScreen;
