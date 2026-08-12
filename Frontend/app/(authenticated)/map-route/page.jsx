"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Sparkles,
  Map as MapIcon,
  List as ListIcon,
  Layers,
  Plus,
  Minus,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  RotateCcw,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_WAYBILLS = [
  {
    id: "WB00012345",
    receiver: "Build It Centurion",
    address: "Centurion, 0157",
    pieces: 3,
    weight: "25.00 kg",
    cubic: "0.25 m³",
    selected: true,
  },
  {
    id: "WB00012346",
    receiver: "Takealot Midrand",
    address: "Midrand, 1685",
    pieces: 2,
    weight: "10.00 kg",
    cubic: "0.10 m³",
    selected: true,
  },
  {
    id: "WB00012347",
    receiver: "Pretoria CBD Store",
    address: "Pretoria Central, 0002",
    pieces: 4,
    weight: "30.00 kg",
    cubic: "0.30 m³",
    selected: true,
  },
  {
    id: "WB00012348",
    receiver: "Soshanguve Retail",
    address: "Soshanguve, 0152",
    pieces: 2,
    weight: "12.00 kg",
    cubic: "0.12 m³",
    selected: true,
  },
  {
    id: "WB00012349",
    receiver: "Westgate Mall",
    address: "Roodepoort, 1709",
    pieces: 3,
    weight: "18.00 kg",
    cubic: "0.18 m³",
    selected: true,
  },
];

const INITIAL_STOPS = [
  {
    stop: 1,
    waybill: "WB00012346",
    receiver: "Takealot Midrand",
    suburb: "Midrand, 1685",
    pieces: 2,
    weight: "10.00 kg",
    eta: "08:30",
  },
  {
    stop: 2,
    waybill: "WB00012345",
    receiver: "Build It Centurion",
    suburb: "Centurion, 0157",
    pieces: 3,
    weight: "25.00 kg",
    eta: "09:15",
  },
  {
    stop: 3,
    waybill: "WB00012347",
    receiver: "Pretoria CBD Store",
    suburb: "Pretoria Central, 0002",
    pieces: 4,
    weight: "30.00 kg",
    eta: "10:30",
  },
  {
    stop: 4,
    waybill: "WB00012348",
    receiver: "Soshanguve Retail",
    suburb: "Soshanguve, 0152",
    pieces: 2,
    weight: "12.00 kg",
    eta: "12:00",
  },
  {
    stop: 5,
    waybill: "WB00012349",
    receiver: "Westgate Mall",
    suburb: "Roodepoort, 1709",
    pieces: 3,
    weight: "18.00 kg",
    eta: "13:15",
  },
];

/* Approximate positions (in a 860x560 viewBox) for the SVG map, chosen to
   mirror the layout of the reference screenshot. */
const MAP_POINTS = {
  1: { x: 372, y: 268, label: "Midrand", labelSide: "right" },
  2: { x: 372, y: 200, label: "Centurion", labelSide: "right" },
  3: { x: 430, y: 122, label: "Pretoria", labelSide: "right", big: true },
  4: { x: 400, y: 46, label: "Soshanguve", labelSide: "right" },
  5: { x: 150, y: 328, label: "Roodepoort", labelSide: "right", big: true },
};

const ROUTE_PATH =
  "M150,328 L260,318 L300,272 L372,268 L372,240 L372,200 L390,170 L430,122 L420,80 L400,46";

const CITY_LABELS = [
  { name: "Akasia", x: 250, y: 60 },
  { name: "Mamelodi", x: 560, y: 108 },
  { name: "Atteridgeville", x: 210, y: 138 },
  { name: "Ivory Park", x: 700, y: 176 },
  { name: "Olifantsfontein", x: 560, y: 246 },
  { name: "Krugersdorp", x: 60, y: 260 },
  { name: "Kempton Park", x: 630, y: 322 },
  { name: "Randburg", x: 230, y: 358 },
];

const ROAD_TAGS = [
  { name: "R80", x: 320, y: 66 },
  { name: "N1", x: 402, y: 152 },
  { name: "N4", x: 630, y: 150 },
  { name: "N1", x: 336, y: 232 },
  { name: "R21", x: 600, y: 234 },
  { name: "N21", x: 660, y: 288 },
];

/* ------------------------------------------------------------------ */
/*  Small reusable pieces                                              */
/* ------------------------------------------------------------------ */

function FieldSelect({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-1 min-w-[150px]">
      <span className="text-xs text-slate-500">{label}</span>
      <button className="flex items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 hover:border-slate-400 transition-colors">
        <span className="truncate">{value}</span>
        {icon ? icon : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 py-1.5 text-sm text-slate-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function RoutePlanningPage() {
  const [waybills, setWaybills] = useState(INITIAL_WAYBILLS);
  const [search, setSearch] = useState("");
  const [stops, setStops] = useState(INITIAL_STOPS);
  const [mapView, setMapView] = useState(true);
  const [dragIndex, setDragIndex] = useState(null);
  const [display, setDisplay] = useState({
    waybillNumbers: true,
    traffic: true,
    etas: true,
    avoidHighways: false,
  });

  const filteredWaybills = waybills.filter((w) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      w.id.toLowerCase().includes(q) ||
      w.receiver.toLowerCase().includes(q) ||
      w.address.toLowerCase().includes(q)
    );
  });

  const selectedCount = waybills.filter((w) => w.selected).length;

  function toggleWaybill(id) {
    setWaybills((prev) =>
      prev.map((w) => (w.id === id ? { ...w, selected: !w.selected } : w))
    );
  }

  function addAll() {
    setWaybills((prev) => prev.map((w) => ({ ...w, selected: true })));
  }

  function deleteStop(stopNum) {
    setStops((prev) =>
      prev
        .filter((s) => s.stop !== stopNum)
        .map((s, i) => ({ ...s, stop: i + 1 }))
    );
  }

  function optimizeRoute() {
    setStops((prev) => [...prev].reverse().map((s, i) => ({ ...s, stop: i + 1 })));
  }

  function clearRoute() {
    setStops([]);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next.map((s, i) => ({ ...s, stop: i + 1 }));
    });
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  const totalWeightKg = stops
    .reduce((sum, s) => sum + parseFloat(s.weight), 0)
    .toFixed(2);
  const totalPieces = stops.reduce((sum, s) => sum + s.pieces, 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* ---------------------------------------------------------- */}
      {/* Header                                                      */}
      {/* ---------------------------------------------------------- */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button className="rounded-md p-1.5 hover:bg-slate-100 shrink-0">
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 shrink-0">
            Route Planning
          </h1>
          <nav className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 truncate">
            <span>Operations</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>Deliveries</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-700">Route Planning</span>
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button className="hidden sm:flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Save className="h-4 w-4" />
            Save Plan
          </button>
          <button className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Apply to Manifest
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Configuration bar                                           */}
      {/* ---------------------------------------------------------- */}
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
        <FieldSelect label="Branch" value="Johannesburg DC" />
        <FieldSelect label="Route" value="DBN - CPT" />
        <FieldSelect
          label="Service Date"
          value="29/07/2026"
          icon={<Calendar className="h-4 w-4 text-slate-400 shrink-0" />}
        />
        <FieldSelect label="Vehicle" value="GRT55" />
        <FieldSelect label="Driver" value="John Dube (On Trip)" />
        <button className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 ml-auto">
          <Sparkles className="h-4 w-4" />
          Suggest Best Route
        </button>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Main 3-column layout                                        */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 p-4 md:p-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* ------------------------------ LEFT: Unallocated Waybills */}
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">
            Unallocated Waybills ({waybills.length})
          </h2>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-300 px-2.5 py-2">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search waybill / receiver / suburb"
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
            </div>
            <button className="rounded-md border border-slate-300 p-2 hover:bg-slate-50 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="mt-3 flex max-h-[560px] flex-col gap-2 overflow-y-auto pr-0.5">
            {filteredWaybills.map((w) => (
              <div
                key={w.id}
                className="rounded-md border border-slate-200 p-3 hover:border-slate-300"
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={w.selected}
                    onChange={() => toggleWaybill(w.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-blue-700 truncate">
                        {w.id}
                      </span>
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-800 truncate">
                      {w.receiver}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {w.address}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {w.pieces} pcs &nbsp; {w.weight} &nbsp; {w.cubic}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredWaybills.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                No waybills match your search.
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-500">
              {selectedCount} waybills selected
            </span>
            <button
              onClick={addAll}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Add All
            </button>
          </div>

          <details className="mt-3 rounded-md border border-slate-200">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-slate-700 flex items-center justify-between">
              Filters
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500">
              No additional filters applied.
            </div>
          </details>
        </aside>

        {/* ------------------------------ CENTER: Map + Route table */}
        <section className="flex flex-col gap-4 min-w-0">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-blue-50 p-1.5">
                    <MapIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Planned Route ({stops.length} Stops)
                  </h2>
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                  <span>
                    Total Distance:{" "}
                    <span className="font-medium text-slate-700">132.4 km</span>
                  </span>
                  <span>
                    Estimated Time:{" "}
                    <span className="font-medium text-slate-700">04h 15m</span>
                  </span>
                </div>
              </div>
              <div className="flex overflow-hidden rounded-md border border-slate-300">
                <button
                  onClick={() => setMapView(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
                    mapView
                      ? "bg-blue-50 text-blue-700"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  Map View
                </button>
                <button
                  onClick={() => setMapView(false)}
                  className={`flex items-center gap-1.5 border-l border-slate-300 px-3 py-1.5 text-xs font-medium ${
                    !mapView
                      ? "bg-blue-50 text-blue-700"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                  List View
                </button>
              </div>
            </div>

            {/* Map / list body */}
            <div className="relative mt-3 h-[420px] w-full overflow-hidden rounded-md border border-slate-200 bg-[#eef1e9]">
              {mapView ? (
                <>
                  <svg
                    viewBox="0 0 860 560"
                    preserveAspectRatio="xMidYMid slice"
                    className="h-full w-full"
                  >
                    <rect width="860" height="560" fill="#eef1e6" />
                    {/* Green land patches */}
                    <ellipse cx="150" cy="120" rx="120" ry="60" fill="#dcebd8" />
                    <ellipse cx="600" cy="90" rx="150" ry="70" fill="#dcebd8" />
                    <ellipse cx="720" cy="380" rx="140" ry="90" fill="#dcebd8" />
                    <ellipse cx="120" cy="420" rx="110" ry="70" fill="#dcebd8" />
                    <ellipse cx="450" cy="480" rx="180" ry="60" fill="#e4ecd9" />

                    {/* Minor roads */}
                    <g stroke="#f4d9a0" strokeWidth="3" fill="none" opacity="0.9">
                      <path d="M0,200 L860,180" />
                      <path d="M0,340 L860,300" />
                      <path d="M120,0 L200,560" />
                      <path d="M700,0 L620,560" />
                    </g>

                    {/* Highways (N/R roads) */}
                    <g stroke="#f6b73c" strokeWidth="5" fill="none">
                      <path d="M0,190 L860,150" />
                      <path d="M430,0 L340,560" />
                      <path d="M0,420 L860,340" />
                    </g>
                    <g stroke="#ffffff" strokeWidth="1.4" strokeDasharray="8 8" fill="none" opacity="0.8">
                      <path d="M0,190 L860,150" />
                      <path d="M430,0 L340,560" />
                      <path d="M0,420 L860,340" />
                    </g>

                    {/* Road shield labels */}
                    {ROAD_TAGS.map((r, i) => (
                      <g key={i} transform={`translate(${r.x},${r.y})`}>
                        <rect
                          x="-15"
                          y="-11"
                          width="30"
                          height="18"
                          rx="3"
                          fill="#2563eb"
                        />
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="white"
                        >
                          {r.name}
                        </text>
                      </g>
                    ))}

                    {/* City / suburb labels */}
                    {CITY_LABELS.map((c, i) => (
                      <text
                        key={i}
                        x={c.x}
                        y={c.y}
                        fontSize="12"
                        fill="#5b6472"
                        fontWeight="500"
                      >
                        {c.name}
                      </text>
                    ))}

                    {/* Route path */}
                    <path
                      d={ROUTE_PATH}
                      fill="none"
                      stroke="#1d4ed8"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Stop markers */}
                    {Object.entries(MAP_POINTS).map(([num, p]) => {
                      const isGreen = num === "1";
                      const label = display.waybillNumbers !== undefined ? p.label : p.label;
                      return (
                        <g key={num}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="14"
                            fill={isGreen ? "#16a34a" : "#2563eb"}
                            stroke="white"
                            strokeWidth="3"
                          />
                          <text
                            x={p.x}
                            y={p.y + 4.5}
                            textAnchor="middle"
                            fontSize="13"
                            fontWeight="700"
                            fill="white"
                          >
                            {num}
                          </text>
                          <text
                            x={p.x + 20}
                            y={p.y + 5}
                            fontSize={p.big ? "16" : "13"}
                            fontWeight={p.big ? "700" : "600"}
                            fill="#1e293b"
                          >
                            {p.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Layers control */}
                  <button className="absolute right-3 top-3 rounded-md border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-50">
                    <Layers className="h-4 w-4 text-slate-600" />
                  </button>

                  {/* Zoom controls */}
                  <div className="absolute right-3 top-16 flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <button className="p-2 hover:bg-slate-50 border-b border-slate-200">
                      <Plus className="h-4 w-4 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-50">
                      <Minus className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full overflow-y-auto p-3">
                  <ul className="flex flex-col gap-2">
                    {stops.map((s) => (
                      <li
                        key={s.stop}
                        className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-800">
                          {s.stop}. {s.receiver}
                        </span>
                        <span className="text-slate-500">{s.suburb}</span>
                      </li>
                    ))}
                    {stops.length === 0 && (
                      <p className="py-8 text-center text-sm text-slate-400">
                        No stops in this route.
                      </p>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Route Sequence table */}
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-slate-900">
                Route Sequence
              </h3>
              <div className="overflow-x-auto rounded-md border border-slate-200">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500">
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-2 py-2">Stop</th>
                      <th className="px-2 py-2">Waybill</th>
                      <th className="px-2 py-2">Receiver</th>
                      <th className="px-2 py-2">Suburb</th>
                      <th className="px-2 py-2">Pieces</th>
                      <th className="px-2 py-2">Weight</th>
                      <th className="px-2 py-2">ETA</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.map((s, i) => (
                      <tr
                        key={s.waybill}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragEnd={handleDragEnd}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          dragIndex === i ? "bg-blue-50" : "bg-white"
                        }`}
                      >
                        <td className="cursor-grab px-3 py-2.5 text-slate-400">
                          <GripVertical className="h-4 w-4" />
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                            {s.stop}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 font-medium text-blue-700">
                          {s.waybill}
                        </td>
                        <td className="px-2 py-2.5 text-slate-800">
                          {s.receiver}
                        </td>
                        <td className="px-2 py-2.5 text-slate-500">
                          {s.suburb}
                        </td>
                        <td className="px-2 py-2.5 text-slate-700">
                          {s.pieces}
                        </td>
                        <td className="px-2 py-2.5 text-slate-700">
                          {s.weight}
                        </td>
                        <td className="px-2 py-2.5 text-slate-700">
                          {display.etas ? s.eta : "—"}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteStop(s.stop)}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {stops.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-6 text-center text-sm text-slate-400"
                        >
                          No stops yet — add waybills to build a route.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 rounded-md border border-dashed border-slate-300 py-2.5 text-center text-xs text-slate-400">
                + Drag and drop waybills to reorder stops
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ RIGHT sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">Route Summary</h2>
            <div className="mt-1 divide-y divide-slate-100">
              <SummaryRow label="Total Stops" value={stops.length} />
              <SummaryRow label="Total Waybills" value={14} />
              <SummaryRow label="Total Pieces" value={totalPieces || 14} />
              <SummaryRow
                label="Total Weight"
                value={`${totalWeightKg !== "0.00" ? totalWeightKg : "95.00"} kg`}
              />
              <SummaryRow label="Total Cubic" value="0.95 m³" />
              <SummaryRow label="Total Distance" value="132.4 km" />
              <SummaryRow label="Estimated Time" value="04h 15m" />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Estimated time includes travel time only.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-slate-900">
              Route Actions
            </h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={optimizeRoute}
                className="flex items-start gap-2.5 rounded-md border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50"
              >
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  <span className="block text-sm font-semibold text-blue-700">
                    Optimize Route
                  </span>
                  <span className="block text-xs text-slate-500">
                    Recalculate best order
                  </span>
                </span>
              </button>
              <button
                onClick={clearRoute}
                className="flex items-start gap-2.5 rounded-md border border-slate-200 p-3 text-left hover:border-red-300 hover:bg-red-50"
              >
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>
                  <span className="block text-sm font-semibold text-red-600">
                    Clear Route
                  </span>
                  <span className="block text-xs text-slate-500">
                    Remove all stops
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-bold text-slate-900">
              Display Options
            </h2>
            <div className="flex flex-col">
              <CheckboxRow
                label="Show Waybill Numbers"
                checked={display.waybillNumbers}
                onChange={() =>
                  setDisplay((d) => ({ ...d, waybillNumbers: !d.waybillNumbers }))
                }
              />
              <CheckboxRow
                label="Show Traffic"
                checked={display.traffic}
                onChange={() =>
                  setDisplay((d) => ({ ...d, traffic: !d.traffic }))
                }
              />
              <CheckboxRow
                label="Show ETAs"
                checked={display.etas}
                onChange={() => setDisplay((d) => ({ ...d, etas: !d.etas }))}
              />
              <CheckboxRow
                label="Avoid Highways"
                checked={display.avoidHighways}
                onChange={() =>
                  setDisplay((d) => ({ ...d, avoidHighways: !d.avoidHighways }))
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-bold text-slate-900">Next Step</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              When you are satisfied with the route, click{" "}
              <span className="font-semibold">Apply to Manifest</span> to load
              waybills and parcels onto the manifest.
            </p>
            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Apply to Manifest
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}