"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  title: string;
  href: string;
  /** depth 0 = top-level leaf (Dashboard/Reports), depth > 0 = nested leaf */
  depth?: number;
  icon?: React.ElementType;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function SidebarItem({
  title,
  href,
  depth = 0,
  icon: Icon,
  collapsed = false,
  onNavigate,
}: Props) {
  const pathname = usePathname();

  // Match exact or sub-routes (e.g. /dashboard matches /dashboard/*)
  const active =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"));

  /* ── Top-level leaf (Dashboard, Reports) ── */
  if (depth === 0) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        title={collapsed ? title : undefined}
        className={`
          group relative flex h-10 items-center rounded-lg transition-all duration-200
          ${collapsed ? "justify-center px-0" : "gap-3 px-3.5"}
          ${
            active
              ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
              : "text-slate-300/80 hover:bg-white/[0.07] hover:text-white"
          }
        `}
      >
        {/* Active left accent bar */}
        {active && !collapsed && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white/70" />
        )}

        {Icon && (
          <Icon
            size={17}
            strokeWidth={active ? 2.3 : 2}
            className="shrink-0"
          />
        )}

        {!collapsed && (
          <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>
            {title}
          </span>
        )}

        {/* Collapsed tooltip */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-[#0A1230] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 lg:block">
            {title}
          </span>
        )}
      </Link>
    );
  }

  /* ── Nested leaf (bullet dot style) ── */
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`
        relative flex h-8 items-center gap-2.5 rounded-md pr-3 text-sm
        transition-all duration-150
        ${depth === 1 ? "pl-3" : "pl-3"}
        ${
          active
            ? "font-semibold text-white"
            : "text-slate-400 hover:text-white"
        }
      `}
    >
      {/* Blue dot — matches image exactly */}
      <span
        className={`h-[7px] w-[7px] shrink-0 rounded-full transition-colors duration-150 ${
          active ? "bg-blue-400" : "bg-slate-500 group-hover:bg-slate-400"
        }`}
      />
      <span className="truncate leading-snug">{title}</span>
    </Link>
  );
}
