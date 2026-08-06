"use client";

interface Props {
  collapsed: boolean;
}

export default function SidebarHeader({ collapsed }: Props) {
  return (
    <div
      className={`flex h-[70px] shrink-0 items-center border-b border-white/[0.07] ${
        collapsed ? "justify-center px-3" : "px-5"
      }`}
    >
      {collapsed ? (
        /* Collapsed: show only the "S" shield icon mark */
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
            <path
              d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
      ) : (
        /* Expanded: full logo wordmark */
        <div className="flex items-center gap-3 select-none">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
                fill="currentColor"
                className="text-white"
              />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight text-white">
              FREIGHT<span className="text-blue-400">FLOW</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              TMS
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
