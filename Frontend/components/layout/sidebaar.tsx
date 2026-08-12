"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Box, FileText, Truck, ArrowLeftRight, ClipboardList,
  Receipt, Banknote, FileSignature, BarChart3, Settings, ShieldCheck,
  ChevronDown, ChevronRight, LogOut, type LucideIcon,
  MapPin,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/* ─ Recursive menu node: level 0 = section, level 1 = group, level 2 = leaf ─ */
interface MenuNode {
  title: string;
  href?: string;
  icon?: LucideIcon;
  children?: MenuNode[];
}

const menuConfig: MenuNode[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "Operations",
    icon: Box,
    children: [
      {
        title: "Waybills",
        icon: FileText,
        children: [{ title: "Waybill Maintenance", href: "/operations/waybills" }],
      },
      {
        title: "Deliveries",
        icon: Truck,
        children: [
          { title: "Delivery Manifest", href: "/operations/deliveries/delivery-manifest" },
          { title: "Delivery Manifest Debrief", href: "/operations/deliveries/delivery-manifest-debrief" },
        ],
      },
      {
        title: "Branch Transfers",
        icon: ArrowLeftRight,
        children: [
          { title: "Branch to Branch Transfer", href: "/operations/branch-transfers/branch-to-branch-transfer" },
          { title: "Transfer Receipt", href: "/operations/branch-transfers/transfer-receipt" },
        ],
      },
      {
        title: "POD",
        icon: ClipboardList,
        children: [{ title: "POD Maintenance", href: "/operations/pod/pod-maintenance" }],
      },
    ],
  },
  {
    title: "Billing",
    icon: Receipt,
    children: [
      {
        title: "Invoices",
        icon: FileText,
        children: [
          { title: "Generate Invoice", href: "/billing/invoices/generate" },
        ],
      },
      {
        title: "Credit / Debit Notes",
        icon: Banknote,
        children: [{ title: "Generate Credit / Debit Note", href: "/billing/credit-debit-notes/generate" }],
      },
    ],
  },
  {
    title: "Quote",
    icon: FileSignature,
    children: [{ title: "Quotation Maintenance", href: "/quote/quotation-maintenance" }],
  },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Map", href: "/map-route", icon: MapPin },
  {
    title: "Master Data",
    icon: Settings,
    children: [
      { title: "Customers", href: "/master-data/customers" },
      { title: "Billing Accounts", href: "/master-data/billing-accounts" },
      { title: "Drivers", href: "/master-data/drivers" },
      { title: "Vehicles", href: "/master-data/vehicles" },
      { title: "Trailers", href: "/master-data/trailers" },
      { title: "Routes", href: "/master-data/routes" },
      { title: "Branches", href: "/master-data/branches" },
      { title: "Sub Contractors", href: "/master-data/sub-contractors" },
      { title: "Suppliers", href: "/master-data/suppliers" },
      { title: "Postal Codes Upload", href: "/master-data/postal-codes-upload" },
    ],
  },
  {
    title: "Admin",
    icon: ShieldCheck,
    children: [
      { title: "Users", href: "/admin/users" },
      { title: "Permissions", href: "/admin/permissions" },
      { title: "Company", href: "/admin/company" },
      { title: "Master Tables", href: "/admin/master-tables" },
      { title: "Settings", href: "/admin/settings" },
    ],
  },
];

function containsActive(node: MenuNode, pathname: string): boolean {
  if (node.href === pathname) return true;
  return node.children?.some((c) => containsActive(c, pathname)) ?? false;
}

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeOnMobile = () => setMobileOpen(false);

  /* ─ Top-level leaf (Dashboard, Reports) ─ */
  const TopLink = ({ node }: { node: MenuNode }) => {
    const href = node.href!;
    const active = pathname === href || pathname.startsWith(href + "/");
    const Icon = node.icon!;
    return (
      <Link href={href} onClick={closeOnMobile} title={collapsed ? node.title : undefined}
        className={`group relative flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-3.5"} h-10 rounded-lg transition-all duration-200 ${active ? "bg-blue-600 text-white shadow-md shadow-blue-900/40" : "text-slate-300/80 hover:bg-white/[0.06] hover:text-white"}`}>
        {active && !collapsed && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white/70" />}
        <Icon size={17} strokeWidth={active ? 2.3 : 2} className="shrink-0" />
        {!collapsed && <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{node.title}</span>}
        {collapsed && <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-[#0A1230] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 hidden lg:block">{node.title}</span>}
      </Link>
    );
  };

  /* ─ Leaf link nested inside a group (bullet + tree line) ─ */
  const Leaf = ({ node }: { node: MenuNode }) => {
    const active = pathname === node.href;
    return (
      <Link href={node.href!} onClick={closeOnMobile}
        className={`relative flex items-center gap-2 h-8 rounded-lg pl-4 pr-3 text-sm transition-all duration-150 ${active ? "text-white font-semibold bg-blue-600/80" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}>
        <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
        <span className="truncate">{node.title}</span>
      </Link>
    );
  };

  /* ─ Expandable group, works recursively for any depth (Operations>Waybills>leaf, or Master Data>leaf) ─ */
  const Group = ({ node, path, level }: { node: MenuNode; path: string; level: number }) => {
    const storageKey = `sidebar-open:${path}`;
    const shouldAutoOpen = containsActive(node, pathname);
    const [open, setOpen] = useState(shouldAutoOpen);

    useEffect(() => {
      const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (saved !== null) setOpen(saved === "1");
      if (shouldAutoOpen) setOpen(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const toggle = () => {
      const next = !open;
      setOpen(next);
      if (typeof window !== "undefined") localStorage.setItem(storageKey, next ? "1" : "0");
    };

    const Icon = node.icon;
    const isTopLevel = level === 0;
    const headerPad = level === 0 ? "px-3.5" : level === 1 ? "pl-9 pr-3" : "pl-4 pr-3";

    return (
      <div>
        <button onClick={toggle} title={collapsed && isTopLevel ? node.title : undefined} aria-expanded={open}
          className={`group relative w-full flex items-center justify-between gap-2 h-9 rounded-lg transition-all duration-150 ${headerPad} ${isTopLevel ? `h-10 ${collapsed ? "justify-center px-0" : ""} text-slate-300/80 hover:bg-white/[0.06] hover:text-white` : shouldAutoOpen ? "text-blue-400" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}>
          <div className={`flex items-center ${collapsed && isTopLevel ? "" : "gap-3"} min-w-0`}>
            {Icon && <Icon size={isTopLevel ? 17 : 14} strokeWidth={2} className="shrink-0" />}
            {!(collapsed && isTopLevel) && (
              <span className={`truncate text-left ${isTopLevel ? "text-sm font-semibold" : "text-xs font-semibold uppercase tracking-wide"}`}>
                {node.title}
              </span>
            )}
          </div>
          {!(collapsed && isTopLevel) && (open ? <ChevronDown size={isTopLevel ? 14 : 12} className="shrink-0" /> : <ChevronRight size={isTopLevel ? 14 : 12} className="shrink-0" />)}
          {collapsed && isTopLevel && <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-[#0A1230] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 hidden lg:block">{node.title}</span>}
        </button>

        {open && !collapsed && node.children && (
          <div className={`mt-0.5 space-y-0.5 ${level === 0 ? "ml-3 border-l border-white/10 pl-2" : "ml-[26px] border-l border-white/10 pl-2"}`}>
            {node.children.map((child) =>
              child.children
                ? <Group key={child.title} node={child} path={`${path}/${child.title}`} level={level + 1} />
                : <Leaf key={child.title} node={child} />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {mobileOpen && <div onClick={closeOnMobile} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}

      <aside className={`sidebar-scroll fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-[#050B1F] to-[#0A1230] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${collapsed ? "lg:w-20" : "lg:w-64"} w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-white/[0.06] px-4 shrink-0">
          {collapsed
            ? <Image src="/logo/icon.png" alt="Logo" width={40} height={40} />
            : <Image src="/logo/logo-s.png" alt="FreightFlow" width={160} height={44} priority style={{ width: 160, height: "auto" }} />}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {menuConfig.map((node) =>
            node.href
              ? <TopLink key={node.href} node={node} />
              : <Group key={node.title} node={node} path={node.title} level={0} />
          )}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/[0.06] p-3 shrink-0">
          <button onClick={handleLogout}
            className={`group relative w-full flex items-center ${collapsed ? "justify-center px-0" : "gap-3 px-3.5"} h-11 rounded-lg text-red-400/90 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200`}>
            <LogOut size={19} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-[#0A1230] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 hidden lg:block">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}