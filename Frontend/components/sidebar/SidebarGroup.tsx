"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import SidebarItem from "./SidebarItem";
import type { MenuItem } from "@/config/menu";

interface Props {
  item: MenuItem;
  /** nesting level: 0 = top section (Operations), 1 = sub-group (Waybills), 2+ = deeper */
  depth?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
  /** unique key used to persist open state */
  storageKey: string;
}

/** Recursively checks if any descendant href matches the current pathname */
function containsActive(item: MenuItem, pathname: string): boolean {
  if (item.href && (pathname === item.href || pathname.startsWith(item.href + "/")))
    return true;
  return item.children?.some((c) => containsActive(c, pathname)) ?? false;
}

export default function SidebarGroup({
  item,
  depth = 0,
  collapsed = false,
  onNavigate,
  storageKey,
}: Props) {
  const pathname = usePathname();
  const hasActive = containsActive(item, pathname);

  const getInitialOpen = useCallback(() => {
    if (typeof window === "undefined") return hasActive;
    const saved = localStorage.getItem(`sidebar:${storageKey}`);
    if (saved !== null) return saved === "1";
    return hasActive;
  }, [storageKey, hasActive]);

  const [open, setOpen] = useState(getInitialOpen);

  // Re-open automatically when a child becomes active (e.g. navigation)
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (typeof window !== "undefined")
      localStorage.setItem(`sidebar:${storageKey}`, next ? "1" : "0");
  };

  const Icon = item.icon;
  const isTopLevel = depth === 0;

  /* ─────────────────────────────────────────────
     Collapsed sidebar: only top-level groups show
     as icon-only buttons with tooltip
  ───────────────────────────────────────────── */
  if (collapsed && isTopLevel) {
    return (
      <div className="group relative">
        <button
          onClick={toggle}
          title={item.title}
          className="flex h-10 w-full items-center justify-center rounded-lg text-slate-300/80 transition-all duration-200 hover:bg-white/[0.07] hover:text-white"
        >
          {Icon && <Icon size={17} strokeWidth={2} className="shrink-0" />}
        </button>
        <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0A1230] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 lg:block">
          {item.title}
        </span>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Expanded sidebar
  ───────────────────────────────────────────── */

  // Padding per depth level
  const headerPad = isTopLevel ? "px-3.5" : "px-2.5";

  // Header row height
  const headerH = isTopLevel ? "h-10" : "h-8.5";

  // Header text style
  const headerText = isTopLevel
    ? "text-sm font-semibold text-slate-200"
    : "text-sm font-medium text-slate-300";

  return (
    <div>
      {/* ── Toggle header ── */}
      <button
        onClick={toggle}
        aria-expanded={open}
        className={`
          flex w-full items-center justify-between gap-2 rounded-lg transition-all duration-150
          ${headerPad} ${headerH}
          ${
            isTopLevel
              ? "text-slate-300/80 hover:bg-white/[0.07] hover:text-white"
              : hasActive
              ? "text-blue-400 hover:bg-white/[0.04]"
              : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
          }
        `}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <Icon
              size={isTopLevel ? 17 : 15}
              strokeWidth={2}
              className="shrink-0"
            />
          )}
          <span className={`truncate text-left ${headerText}`}>
            {item.title}
          </span>
        </div>

        {/* Chevron — rotates smoothly */}
        <ChevronDown
          size={13}
          strokeWidth={2.5}
          className={`shrink-0 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* ── Children ── */}
      {open && item.children && (
        <div
          className={`
            mt-0.5 space-y-0.5 overflow-hidden
            ${
              isTopLevel
                ? /* top-level children: vertical tree line */
                  "ml-[22px] border-l border-white/[0.09] pl-1.5"
                : /* sub-group children: keep aligned along parent tree line without extra shift */
                  "ml-0 border-l-0 pl-0"
            }
          `}
        >
          {item.children.map((child) =>
            child.children ? (
              <SidebarGroup
                key={child.title}
                item={child}
                depth={depth + 1}
                collapsed={false}
                onNavigate={onNavigate}
                storageKey={`${storageKey}/${child.title}`}
              />
            ) : (
              <SidebarItem
                key={child.href}
                title={child.title}
                href={child.href!}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
