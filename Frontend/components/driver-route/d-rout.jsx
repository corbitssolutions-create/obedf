import React, { useState } from "react";
import { Plus, Search } from "lucide-react";

const INK = "#12181F";
const SLATE = "#5C6672";
const PAPER = "#F3F5F4";
const BLUE = "#2F6FED";
const MOSS = "#2F6B4F";
const MOSS_BG = "#E9F3EC";
const LINE = "#E1E4E3";
const LINE_STRONG = "#CBD0CE";

const initialAssignments = [
  { driver: "John Dube", route: "JHB - PTA", from: "Johannesburg", to: "Pretoria", frequency: "Daily", status: "Active" },
  { driver: "John Dube", route: "JHB - DBN", from: "Johannesburg", to: "Durban", frequency: "Daily", status: "Active" },
  { driver: "John Dube", route: "JHB - CTN", from: "Johannesburg", to: "Cape Town", frequency: "3x Weekly", status: "Active" },
  { driver: "John Dube", route: "JHB - PE", from: "Johannesburg", to: "Port Elizabeth", frequency: "2x Weekly", status: "Active" },
  { driver: "John Dube", route: "JHB - EL", from: "Johannesburg", to: "East London", frequency: "2x Weekly", status: "Active" },
];

const selectStyle = {
  height: 38,
  borderRadius: 6,
  border: `1px solid ${LINE_STRONG}`,
  background: "#fff",
  fontSize: 14,
  color: INK,
  padding: "0 10px",
  outline: "none",
  fontFamily: "'Inter', sans-serif",
};

function StatusPill({ status }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12.5,
        fontWeight: 500,
        padding: "4px 10px",
        borderRadius: 5,
        color: MOSS,
        background: MOSS_BG,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.02em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: MOSS }} />
      {status}
    </span>
  );
}

export default function DriverRouteAssignments() {
  const [assignments] = useState(initialAssignments);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: PAPER, minHeight: 560, padding: 28, color: INK }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
        Drivers (Routes / Assignments)
        </h1>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 16px",
            borderRadius: 6,
            border: "none",
            background: BLUE,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} /> Assign route
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: 12, color: SLATE }} />
        <input placeholder="Search route..." style={{ ...selectStyle, width: "100%", paddingLeft: 30 }} />
      </div>

      <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 0.9fr 1.2fr 1.2fr 1fr 0.8fr",
            padding: "12px 20px",
            background: PAPER,
            borderBottom: `1px solid ${LINE}`,
            fontSize: 11.5,
            fontWeight: 600,
            color: SLATE,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>Driver</span>
          <span>Route</span>
          <span>From</span>
          <span>To</span>
          <span>Frequency</span>
          <span>Status</span>
        </div>

        {assignments.map((a, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 0.9fr 1.2fr 1.2fr 1fr 0.8fr",
              alignItems: "center",
              padding: "13px 20px",
              borderBottom: `1px solid ${LINE}`,
            }}
          >
            <span style={{ fontSize: 13.5 }}>{a.driver}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: BLUE, fontWeight: 600 }}>{a.route}</span>
            <span style={{ fontSize: 13.5, color: SLATE }}>{a.from}</span>
            <span style={{ fontSize: 13.5, color: SLATE }}>{a.to}</span>
            <span style={{ fontSize: 13.5 }}>{a.frequency}</span>
            <StatusPill status={a.status} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <span style={{ fontSize: 13, color: SLATE }}>Showing 1 to {assignments.length} of 20 entries</span>
      </div>
    </div>
  );
}