import {
  LayoutDashboard,
  Box,
  FileText,
  Truck,
  Package,
  ArrowLeftRight,
  ClipboardCheck,
  Receipt,
  FileStack,
  DollarSign,
  FileSignature,
  BarChart3,
  Database,
  Users,
  CreditCard,
  Car,
  Layers,
  MapPin,
  GitBranch,
  Briefcase,
  Building2,
  ShieldCheck,
  UserCog,
  Lock,
  ScrollText,
  Settings,
  Table2,
  type LucideIcon,
} from "lucide-react";

export interface MenuItem {
  title: string;
  href?: string;
  icon?: LucideIcon;
  children?: MenuItem[];
  /** future: hide item unless user has this permission key */
  permission?: string;
  /** show a "Coming Soon" badge */
  comingSoon?: boolean;
}

const menu: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },

  // ── Operations ────────────────────────────────────────────────────────────
  {
    title: "Operations",
    icon: Box,
    children: [
      {
        title: "Waybills",
        icon: FileText,
        children: [
          { title: "Waybill Maintenance", href: "/operations/waybills" },
        ],
      },
      {
        title: "Deliveries",
        icon: Truck,
        children: [
          { title: "Delivery Manifest",        href: "/operations/deliveries/delivery-manifest" },
          { title: "Delivery Manifest Debrief", href: "/operations/deliveries/delivery-manifest-debrief" },
        ],
      },
      {
        title: "Collections",
        icon: Package,
        children: [
          { title: "Adhoc Collection",    href: "/operations/collections/adhoc-collection" },
          { title: "Collection Manifest", href: "/operations/collections/collection-manifest" },
          { title: "Collection Debrief",  href: "/operations/collections/collection-debrief" },
        ],
      },
      {
        title: "Branch Transfers",
        icon: ArrowLeftRight,
        children: [
          { title: "Branch to Branch Transfer", href: "/operations/branch-transfers/branch-to-branch-transfer" },
          { title: "Transfer Receipt",          href: "/operations/branch-transfers/transfer-receipt" },
        ],
      },
      {
        title: "POD",
        icon: ClipboardCheck,
        children: [
          { title: "POD Maintenance", href: "/operations/pod/pod-maintenance" },
        ],
      },
    ],
  },

  // ── Billing ───────────────────────────────────────────────────────────────
  {
    title: "Billing",
    icon: Receipt,
    children: [
      {
        title: "Invoices",
        icon: FileStack,
        children: [
          { title: "Generate Invoice", href: "/billing/invoices/generate" },
          { title: "Search Invoice",   href: "/billing/invoices/search" },
        ],
      },
      {
        title: "Credit / Debit Notes",
        icon: DollarSign,
        children: [
          { title: "Generate Credit / Debit Note", href: "/billing/credit-debit-notes/generate" },
        ],
      },
    ],
  },

  // ── Quote ─────────────────────────────────────────────────────────────────
  {
    title: "Quote",
    icon: FileSignature,
    children: [
      { title: "Quotation Maintenance", href: "/quote/quotation-maintenance" },
    ],
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },

  // ── Master Data ───────────────────────────────────────────────────────────
  {
    title: "Master Data",
    icon: Database,
    children: [
      { title: "Customers",          href: "/master-data/customers",          icon: Users },
      { title: "Billing Accounts",   href: "/master-data/billing-accounts",   icon: CreditCard },
      { title: "Drivers",            href: "/master-data/drivers",            icon: UserCog },
      { title: "Vehicles",           href: "/master-data/vehicles",           icon: Car },
      { title: "Trailers",           href: "/master-data/trailers",           icon: Layers },
      { title: "Routes",             href: "/master-data/routes",             icon: MapPin },
      { title: "Branches",           href: "/master-data/branches",           icon: GitBranch },
      { title: "Sub Contractors",    href: "/master-data/sub-contractors",    icon: Briefcase },
      { title: "Suppliers",          href: "/master-data/suppliers",          icon: Building2 },
      { title: "Postal Codes Upload",href: "/master-data/postal-codes-upload",icon: MapPin },
    ],
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    title: "Admin",
    icon: ShieldCheck,
    children: [
      { title: "Users",         href: "/admin/users",         icon: Users },
      { title: "Roles",         href: "/admin/roles",         icon: UserCog },
      { title: "Permissions",   href: "/admin/permissions",   icon: Lock },
      { title: "Audit Trail",   href: "/admin/audit-trail",   icon: ScrollText },
      { title: "Company",       href: "/admin/company",       icon: Building2 },
      { title: "Master Tables", href: "/admin/master-tables", icon: Table2 },
      { title: "Settings",      href: "/admin/settings",      icon: Settings },
    ],
  },
];

export default menu;
