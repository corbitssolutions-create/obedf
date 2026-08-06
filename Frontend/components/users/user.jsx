import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import AddUserModal from "./AddUserModal";

const INK = "#12181F";
const SLATE = "#5C6672";
const PAPER = "#F3F5F4";
const BLUE = "#2F6FED";
const MOSS = "#2F6B4F";
const MOSS_BG = "#E9F3EC";
const LINE = "#E1E4E3";
const LINE_STRONG = "#CBD0CE";

const initialUsers = [
  { username: "admin", fullName: "Admin User", role: "Administrator", status: "Active" },
  { username: "dispatch", fullName: "Dispatch Manager", role: "Dispatcher", status: "Active" },
  { username: "driver1", fullName: "John Dube", role: "Driver", status: "Active" },
  { username: "driver", fullName: "Sipho Nkosi", role: "Driver", status: "Active" },
  { username: "viewer", fullName: "Report Viewer", role: "Operation Manager", status: "Active" },
];

function StatusPill({ status }) {
  return (
    <span className="u-status-wrap">
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
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: MOSS, flexShrink: 0 }} />
        {status}
      </span>
    </span>
  );
}

export default function UsersList() {
  const [users, setUsers] = useState(initialUsers);
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: PAPER, minHeight: 480, color: INK }} className="users-page">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .users-page {
          padding: 28px;
        }

        .users-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .users-header h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
        }

        .new-user-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border-radius: 6px;
          border: none;
          background: ${BLUE};
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }

        .search-wrap {
          position: relative;
          margin-bottom: 16px;
          max-width: 320px;
        }

        .search-input {
          height: 38px;
          width: 100%;
          box-sizing: border-box;
          border-radius: 6px;
          border: 1px solid ${LINE_STRONG};
          background: #fff;
          font-size: 14px;
          color: ${INK};
          padding: 0 10px 0 30px;
          outline: none;
          font-family: 'Inter', sans-serif;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 12px;
          color: ${SLATE};
          pointer-events: none;
        }

        .users-table {
          border: 1px solid ${LINE};
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }

        .users-table-head {
          display: grid;
          grid-template-columns: 1fr 1.3fr 1fr 0.8fr;
          padding: 12px 20px;
          background: ${PAPER};
          border-bottom: 1px solid ${LINE};
          font-size: 11.5px;
          font-weight: 600;
          color: ${SLATE};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Desktop/tablet: 4-column grid row, exactly like before */
        .users-row {
          display: grid;
          grid-template-columns: 1fr 1.3fr 1fr 0.8fr;
          align-items: center;
          padding: 13px 20px;
          border-bottom: 1px solid ${LINE};
        }

        .users-row:last-child {
          border-bottom: none;
        }

        .u-username {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: ${BLUE};
          font-weight: 600;
        }

        .u-fullname {
          font-size: 13.5px;
        }

        .u-role {
          font-size: 13.5px;
          color: ${SLATE};
        }

        .u-status-wrap {
          display: flex;
          justify-content: flex-start;
        }

        /* ---------- Mobile: same 4 elements, reflowed via flex + order ---------- */
        @media (max-width: 767px) {
          .users-page {
            padding: 16px;
          }

          .users-header h1 {
            font-size: 18px;
          }

          .users-header {
            gap: 10px;
          }

          .new-user-btn {
            flex: 1 1 auto;
          }

          .search-wrap {
            max-width: 100%;
          }

          .users-table-head {
            display: none;
          }

          .users-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            row-gap: 6px;
            column-gap: 10px;
            padding: 14px 16px;
          }

          .u-username {
            order: 1;
            flex: 1 1 auto;
            min-width: 0;
          }

          .u-status-wrap {
            order: 2;
            flex: 0 0 auto;
            justify-content: flex-end;
          }

          .u-fullname {
            order: 3;
            flex-basis: 100%;
            font-weight: 500;
          }

          .u-role {
            order: 4;
            flex: 1 1 auto;
          }

          .u-role::before {
            content: "Role: ";
            color: ${SLATE};
            font-weight: 400;
          }
        }
      `}</style>

      <div className="users-header">
        <h1>Users</h1>
        <button className="new-user-btn" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> New user
        </button>
      </div>

      <div className="search-wrap">
        <Search size={14} className="search-icon" />
        <input placeholder="Search..." className="search-input" />
      </div>

      <div className="users-table">
        <div className="users-table-head">
          <span>Username</span>
          <span>Full name</span>
          <span>Role</span>
          <span>Status</span>
        </div>

        {users.map((u) => (
          <div key={u.username} className="users-row">
            <span className="u-username">{u.username}</span>
            <span className="u-fullname">{u.fullName}</span>
            <span className="u-role">{u.role}</span>
            <StatusPill status={u.status} />
          </div>
        ))}
      </div>

      <AddUserModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(newEntry) => setUsers((prev) => [newEntry, ...prev])}
      />
    </div>
  );
}