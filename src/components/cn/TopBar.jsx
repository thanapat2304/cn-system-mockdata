"use client";

import { G } from "./shared";

export default function TopBar({ page, setPage, currentUser, isMobile = false }) {
  const user = currentUser ?? { name: "", code: "", role: "" };

  return (
    <aside
      style={{
        background: G.surface,
        borderRight: isMobile ? "none" : `1px solid ${G.border}`,
        borderBottom: isMobile ? `1px solid ${G.border}` : "none",
        padding: isMobile ? "10px 12px" : "20px 14px",
        display: "flex",
        flexDirection: "column",
        width: isMobile ? "100%" : 240,
        height: isMobile ? "auto" : "100vh",
        boxSizing: "border-box",
        justifyContent: "space-between",
        position: "relative",
        overflowY: isMobile ? "visible" : "auto",
        overflowX: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 8 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px" }}>
          <img
            src="/logo-aep.png"
            alt="AEP Logo"
            style={{
              width: 56,
              height: 32,
              objectFit: "contain",
              display: "block",
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: G.text, letterSpacing: -0.3 }}>CN System</span>
        </div>
        <div style={{ height: 1, background: G.border, margin: "2px 0" }} />
        <nav style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 6, overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 2 : 0 }}>
          {[
            { key: "list", label: "รายการเอกสาร" },
            { key: "create", label: "+ สร้างเอกสาร" },
            { key: "manual", label: "วิธีใช้งาน" },
            { key: "profile", label: "โปรไฟล์" },
          ].map((n) => (
            <button
              type="button"
              key={n.key}
              onClick={() => setPage(n.key)}
              style={{
                background: page === n.key ? G.accentSoft : "transparent",
                color: page === n.key ? G.accent : G.textDim,
                border: page === n.key ? `1px solid ${G.accent}33` : "1px solid transparent",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: isMobile ? "center" : "left",
                width: isMobile ? "auto" : "100%",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "stretch", gap: 8, marginTop: isMobile ? 8 : 0 }}>
        <div
          style={{
            background: G.accentSoft,
            color: G.accent,
            border: `1px solid ${G.accent}33`,
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {user.code || "—"}
        </div>
        <div
          style={{
            background: G.surfaceElevated,
            color: G.textDim,
            border: `1px solid ${G.border}`,
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {user.role || "—"}
        </div>
        {!isMobile && <div style={{ fontSize: 13, color: G.textDim, textAlign: "center" }}>{user.name || ""}</div>}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${G.accent}, #31538c)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            alignSelf: "center",
          }}
        >
          {(user.name && user.name[0]) || "?"}
        </div>
      </div>
    </aside>
  );
}
