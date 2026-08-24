"use client";

import { useState } from "react";
import { X, Plus, ChevronDown, Eye, Trash2 } from "lucide-react";

interface Waybill {
  id: string;
  waybillNo: string;
  date: string;
  seller: string;
  origin: string;
  destination: string;
  amount: number;
  status: string;
}

interface ChargeItem {
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

  // Sample data
  const waybills: Waybill[] = [
    {
      id: "1",
      waybillNo: "WB-2026-007891",
      date: "05/07/2026",
      seller: "ABC Supplies",
      origin: "Build It (Pty) Ltd",
      destination: "Durban",
      amount: 5000.00,
      status: "Ready for Billing"
    },
    {
      id: "2",
      waybillNo: "WB-2026-007892",
      date: "06/07/2026",
      seller: "ABC Supplies",
      origin: "Pick n Pay DC",
      destination: "Durban",
      amount: 4500.00,
      status: "Ready for Billing"
    },
    {
      id: "3",
      waybillNo: "WB-2026-007893",
      date: "07/07/2026",
      seller: "XYZ Traders",
      origin: "Shoprite DC",
      destination: "Durban",
      amount: 3800.00,
      status: "Ready for Billing"
    },
    {
      id: "4",
      waybillNo: "WB-2026-007894",
      date: "08/07/2026",
      seller: "ABC Supplies",
      origin: "Checkers DC",
      destination: "Durban",
      amount: 4200.00,
      status: "Ready for Billing"
    }
  ];

  const [charges, setCharges] = useState<ChargeItem[]>([
    {
      code: "RF01",
      description: "Road Freight",
      amountExclVAT: 5000.00,
      vatRate: 15,
      vatAmount: 750.00,
      amountInclVAT: 5750.00
    },
    {
      code: "FUEL",
      description: "Fuel Levy",
      amountExclVAT: 500.00,
      vatRate: 15,
      vatAmount: 75.00,
      amountInclVAT: 575.00
    },
    {
      code: "HAND",
      description: "Handling Fee",
      amountExclVAT: 300.00,
      vatRate: 15,
      vatAmount: 45.00,
      amountInclVAT: 345.00
    },
    {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
            <p className="text-sm text-gray-500">Create a new invoice</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDraft(!isDraft)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDraft 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Draft
            </button>
            <span className="text-sm text-gray-500">
              Invoice will be saved as {isDraft ? "draft" : "submitted"} until submitted for approval
            </span>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Account
              </label>
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-900 font-medium">
                BA-10023 - Value World (Pty) Ltd
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-900">
                ZAR - South African Rand
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
                <option>On Delivery</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input 
                type="date" 
                value="2026-08-29"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Type
              </label>
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-900">
                Standard Invoice
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <select className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Head Office</option>
                <option>Durban Branch</option>
                <option>Cape Town Branch</option>
                <option>Johannesburg Branch</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exchange Rate
              </label>
              <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-900">
                1.0000
              </div>
              <p className="text-xs text-gray-500 mt-1">1 ZAR = 1.0000 ZAR</p>
            </div>
          </div>
        </div>

        {/* Waybills to Include */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Waybills to Include
              <span className="ml-2 text-sm font-normal text-gray-500">
                {selectedWaybills.length} Selected
              </span>
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add Waybills
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waybill No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (Excl. VAT)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {waybills.map((waybill) => (
                  <tr key={waybill.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {waybill.waybillNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {waybill.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {waybill.seller}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {waybill.origin}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {waybill.destination}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      R {waybill.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {waybill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary of Charges - First Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary of Charges</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charge Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charge Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (Excl. VAT)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VAT Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VAT Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (Incl. VAT)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {charges.map((charge, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {charge.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {charge.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      R {charge.amountExclVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {charge.vatRate}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      R {charge.vatAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      R {charge.amountInclVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    R {totalExclVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    R {totalVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    R {totalInclVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea 
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Enter notes (optional)"
            />
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal (Excl. VAT)</span>
                <span className="font-medium text-gray-900">R {totalExclVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total VAT</span>
                <span className="font-medium text-gray-900">R {totalVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">Invoice Total (Incl. VAT)</span>
                <span className="font-bold text-gray-900">R {totalInclVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Less: Credit Notes</span>
                <span className="font-medium text-gray-900">R0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Add: Debit Notes</span>
                <span className="font-medium text-gray-900">R0.00</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">Outstanding Balance</span>
                <span className="font-bold text-blue-600">R {totalInclVAT.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            Print
          </button>
          <button className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewInvoiceScreen;
