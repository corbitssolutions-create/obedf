"use client";

import { useState } from "react";
import {
  Database,
  ArrowLeft,
  Search,
  DollarSign,
  Truck,
  MapPin,
  FileText,
  ShieldAlert,
  Layers,
  CreditCard,
  Building2,
  Percent,
  Receipt,
  Car,
  Package,
  Globe,
  Settings,
  Bell,
  Sliders,
} from "lucide-react";

import BillingAccountsPage from "@/components/master/pages/BillingAccountsPage";
import CountriesPage from "@/components/master/pages/CountriesPage";
import CurrenciesPage from "@/components/master/pages/CurrenciesPage";
import CustomerTypesPage from "@/components/master/pages/CustomerTypesPage";
import DocumentTemplatesPage from "@/components/master/pages/DocumentTemplatesPage";
import ExchangeRatesPage from "@/components/master/pages/ExchangeRatesPage";
import ExtraChargesPage from "@/components/master/pages/ExtraChargesPage";
import FailureReasonsPage from "@/components/master/pages/FailureReasonsPage";
import FuelTypesPage from "@/components/master/pages/FuelTypesPage";
import GlAccountsPage from "@/components/master/pages/GlAccountsPage";
import IncotermsPage from "@/components/master/pages/IncotermsPage";
import NotificationTemplatesPage from "@/components/master/pages/NotificationTemplatesPage";
import PackagingTypesPage from "@/components/master/pages/PackagingTypesPage";
import PaymentMethodsPage from "@/components/master/pages/PaymentMethodsPage";
import PaymentTermsPage from "@/components/master/pages/PaymentTermsPage";
import PostalCodesPage from "@/components/master/pages/PostalCodesPage";
import ProductTypesPage from "@/components/master/pages/ProductTypesPage";
import ProvincesPage from "@/components/master/pages/ProvincesPage";
import RateCardsPage from "@/components/master/pages/RateCardsPage";
import RateTypesPage from "@/components/master/pages/RateTypesPage";
import ServiceTypesPage from "@/components/master/pages/ServiceTypesPage";
import StatusCodesPage from "@/components/master/pages/StatusCodesPage";
import SuppliersPage from "@/components/master/pages/SuppliersPage";
import TrailersPage from "@/components/master/pages/TrailersPage";
import VatConfigsPage from "@/components/master/pages/VatConfigsPage";
import VehicleTypesPage from "@/components/master/pages/VehicleTypesPage";
import ZonesPage from "@/components/master/pages/ZonesPage";

interface MasterTableMeta {
  id: string;
  title: string;
  category: "Financial & Rates" | "Operations & Logistics" | "Fleet & Equipment" | "Master References";
  description: string;
  icon: any;
  component: React.ComponentType;
}

const MASTER_TABLES: MasterTableMeta[] = [
  {
    id: "billing-accounts",
    title: "Billing Accounts",
    category: "Financial & Rates",
    description: "Manage customer billing configurations and account defaults",
    icon: CreditCard,
    component: BillingAccountsPage,
  },
  {
    id: "currencies",
    title: "Currencies",
    category: "Financial & Rates",
    description: "System currencies and multi-currency configurations",
    icon: DollarSign,
    component: CurrenciesPage,
  },
  {
    id: "exchange-rates",
    title: "Exchange Rates",
    category: "Financial & Rates",
    description: "Currency exchange rates and daily conversions",
    icon: DollarSign,
    component: ExchangeRatesPage,
  },
  {
    id: "gl-accounts",
    title: "GL Accounts",
    category: "Financial & Rates",
    description: "General ledger account codes and mapping",
    icon: Receipt,
    component: GlAccountsPage,
  },
  {
    id: "rate-cards",
    title: "Rate Cards",
    category: "Financial & Rates",
    description: "Customer and service rate matrices",
    icon: FileText,
    component: RateCardsPage,
  },
  {
    id: "rate-types",
    title: "Rate Types",
    category: "Financial & Rates",
    description: "Freight rate classifications (e.g. Weight, Volumetric)",
    icon: Sliders,
    component: RateTypesPage,
  },
  {
    id: "extra-charges",
    title: "Extra Charges",
    category: "Financial & Rates",
    description: "Surcharges, fuel levies, and handling fees",
    icon: DollarSign,
    component: ExtraChargesPage,
  },
  {
    id: "vat-configs",
    title: "VAT Configurations",
    category: "Financial & Rates",
    description: "Tax percentages and statutory rules",
    icon: Percent,
    component: VatConfigsPage,
  },
  {
    id: "payment-terms",
    title: "Payment Terms",
    category: "Financial & Rates",
    description: "Credit terms (Net 30, COD, Prepaid)",
    icon: Receipt,
    component: PaymentTermsPage,
  },
  {
    id: "payment-methods",
    title: "Payment Methods",
    category: "Financial & Rates",
    description: "Accepted payment mechanisms",
    icon: CreditCard,
    component: PaymentMethodsPage,
  },

  {
    id: "service-types",
    title: "Service Types",
    category: "Operations & Logistics",
    description: "Delivery speed categories (Express, Standard, Overnight)",
    icon: Layers,
    component: ServiceTypesPage,
  },
  {
    id: "product-types",
    title: "Product Types",
    category: "Operations & Logistics",
    description: "Cargo and item classification types",
    icon: Package,
    component: ProductTypesPage,
  },
  {
    id: "packaging-types",
    title: "Packaging Types",
    category: "Operations & Logistics",
    description: "Pallets, cartons, crates, and containers",
    icon: Package,
    component: PackagingTypesPage,
  },
  {
    id: "status-codes",
    title: "Status Codes",
    category: "Operations & Logistics",
    description: "Shipment, manifest, and waybill status lifecycle",
    icon: ShieldAlert,
    component: StatusCodesPage,
  },
  {
    id: "failure-reasons",
    title: "Failure / Exception Reasons",
    category: "Operations & Logistics",
    description: "Delivery and collection debrief exception codes",
    icon: ShieldAlert,
    component: FailureReasonsPage,
  },
  {
    id: "incoterms",
    title: "Incoterms",
    category: "Operations & Logistics",
    description: "International shipping terms (FOB, CIF, EXW)",
    icon: Globe,
    component: IncotermsPage,
  },

  {
    id: "vehicle-types",
    title: "Vehicle Types",
    category: "Fleet & Equipment",
    description: "Truck categories, capacities, and specs",
    icon: Truck,
    component: VehicleTypesPage,
  },
  {
    id: "trailers",
    title: "Trailers",
    category: "Fleet & Equipment",
    description: "Fleet trailer master records",
    icon: Car,
    component: TrailersPage,
  },
  {
    id: "fuel-types",
    title: "Fuel Types",
    category: "Fleet & Equipment",
    description: "Diesel, Petrol, Electric, and Hybrid fuel profiles",
    icon: Settings,
    component: FuelTypesPage,
  },

  {
    id: "postal-codes",
    title: "Postal Codes",
    category: "Master References",
    description: "Postal code mapping for automated branch routing",
    icon: MapPin,
    component: PostalCodesPage,
  },
  {
    id: "provinces",
    title: "Provinces / States",
    category: "Master References",
    description: "Geographic regions and administrative provinces",
    icon: MapPin,
    component: ProvincesPage,
  },
  {
    id: "zones",
    title: "Geographic Zones",
    category: "Master References",
    description: "Delivery and dispatch rating zones",
    icon: MapPin,
    component: ZonesPage,
  },
  {
    id: "countries",
    title: "Countries",
    category: "Master References",
    description: "Country list and ISO codes",
    icon: Globe,
    component: CountriesPage,
  },
  {
    id: "suppliers",
    title: "Suppliers",
    category: "Master References",
    description: "Vendor and service supplier directory",
    icon: Building2,
    component: SuppliersPage,
  },
  {
    id: "customer-types",
    title: "Customer Types",
    category: "Master References",
    description: "Corporate, Retail, Wholesale customer groupings",
    icon: Building2,
    component: CustomerTypesPage,
  },
  {
    id: "document-templates",
    title: "Document Templates",
    category: "Master References",
    description: "Invoice, waybill, and manifest print templates",
    icon: FileText,
    component: DocumentTemplatesPage,
  },
  {
    id: "notification-templates",
    title: "Notification Templates",
    category: "Master References",
    description: "SMS and Email alert templates",
    icon: Bell,
    component: NotificationTemplatesPage,
  },
];

const CATEGORIES = [
  "All",
  "Financial & Rates",
  "Operations & Logistics",
  "Fleet & Equipment",
  "Master References",
] as const;

export default function MasterTablesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const selectedTable = MASTER_TABLES.find((t) => t.id === selectedId);

  if (selectedTable) {
    const ActiveComp = selectedTable.component;
    return (
      <div>
        <div className="border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
          <button
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Master Tables Directory
          </button>
        </div>
        <ActiveComp />
      </div>
    );
  }

  const filteredTables = MASTER_TABLES.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      activeCategory === "All" || item.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Master Tables Directory
              </h1>
              <p className="text-xs text-gray-500 sm:text-sm">
                System master data, rating tables, and operational lookup references ({MASTER_TABLES.length} tables)
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search master tables..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTables.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="group relative cursor-pointer rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                  {item.category.split(" ")[0]}
                </span>
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Database className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No master tables match your search</h3>
          <p className="mt-1 text-xs text-gray-500">Try adjusting your category filter or search keywords.</p>
        </div>
      )}
    </div>
  );
}
