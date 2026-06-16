"use client";

import { useEffect, useRef, useState } from "react";
import { mockGetLookups, mockListDocuments } from "@/lib/cnApi";
import { G, baseInput, btnPrimary, btnSecondary, formatDate, getDocTypeHighlight, statusConfig, StatusBadge, DocTypeBadge } from "../shared";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const TABLE_COLUMNS = [
  { key: "id", label: "เลขที่เอกสาร", pin: "left", width: "12%" },
  { key: "date", label: "วันที่", width: "8%" },
  { key: "type", label: "ประเภท", width: "12%" },
  { key: "reason", label: "เหตุผล", width: "11%" },
  { key: "customerId", label: "รหัสลูกค้า", width: "8%" },
  { key: "customerName", label: "ชื่อลูกค้า", width: "18%" },
  { key: "refDoc", label: "เอกสารอ้างอิง", width: "10%" },
  { key: "salesperson", label: "พนักงานขาย", width: "11%" },
  { key: "status", label: "สถานะ", pin: "right", width: "10%" },
];

function tableRowBackground(rowIndex) {
  return rowIndex % 2 === 0 ? G.surface : G.surfaceElevated;
}

function stickyCellStyle(pin, { isHeader, rowIndex }) {
  const bg = isHeader ? G.surfaceElevated : tableRowBackground(rowIndex);
  const style = { background: bg };

  if (isHeader) {
    style.position = "sticky";
    style.top = 0;
    style.zIndex = pin === "left" ? 5 : pin === "right" ? 4 : 2;
  }

  if (pin === "left") {
    style.position = "sticky";
    style.left = 0;
    style.zIndex = isHeader ? 5 : 3;
    style.boxShadow = "2px 0 8px rgba(15,31,53,0.08)";
  } else if (pin === "right") {
    style.position = "sticky";
    style.right = 0;
    style.zIndex = isHeader ? 4 : 3;
    style.boxShadow = "-2px 0 8px rgba(15,31,53,0.08)";
  }

  return style;
}

function setRowHoverBackground(rowEl, hovered, rowIndex, docTypeId, docTypeLabel) {
  const bg = hovered ? G.accentSoft : tableRowBackground(rowIndex);
  const typeBg = getDocTypeHighlight(docTypeId, docTypeLabel).bg;
  rowEl.style.background = bg;
  rowEl.querySelectorAll("td").forEach((cell) => {
    cell.style.background = cell.dataset.col === "type" ? typeBg : bg;
  });
}

export default function CNListPage({ setPage, setSelectedDoc, isVisible = true }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [docTypes, setDocTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusSummary, setStatusSummary] = useState({});
  const [summaryFromDate, setSummaryFromDate] = useState("");
  const [pendingMyApprovalCount, setPendingMyApprovalCount] = useState(0);
  const [canApprove, setCanApprove] = useState(false);
  const [filterAwaitingMyApproval, setFilterAwaitingMyApproval] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [listReloadTick, setListReloadTick] = useState(0);
  const wasVisibleRef = useRef(isVisible);

  useEffect(() => {
    if (isVisible && !wasVisibleRef.current) {
      setListReloadTick((tick) => tick + 1);
    }
    wasVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await mockGetLookups();
        if (!cancelled) setDocTypes(Array.isArray(data.docTypes) ? data.docTypes : []);
      } catch {
        // Ignore lookup error on list page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return undefined;
    let mounted = true;
    async function loadDocuments() {
      setLoading(true);
      setLoadError("");
      try {
        const json = await mockListDocuments({
          page: currentPage,
          pageSize,
          q: search.trim(),
          status: filterStatus,
          docTypeId: filterType,
          fromDate: filterDate,
          awaitingMyApproval: filterAwaitingMyApproval,
        });

        const mapped = (json?.data || []).map((doc) => ({
          id: doc.docNo,
          date: (doc.docDate || "").slice(0, 10),
          type: doc.docType,
          docTypeId: doc.docTypeId || "",
          reason: doc.reason,
          customerId: doc.customerId,
          customerName: doc.customerName,
          refDoc: doc.referenceDocNo,
          salesperson: doc.salesperson,
          status: doc.status,
          pendingHint: doc.pendingHint || "",
          dbId: doc.id,
        }));
        if (mounted) {
          setDocuments(mapped);
          setHasMore(Boolean(json?.hasMore));
          setStatusSummary(json?.statusSummary && typeof json.statusSummary === "object" ? json.statusSummary : {});
          setSummaryFromDate(String(json?.summaryFromDate || "").slice(0, 10));
          setPendingMyApprovalCount(Number(json?.pendingMyApprovalCount) || 0);
          setCanApprove(Boolean(json?.canApprove));
        }
      } catch (err) {
        if (mounted) {
          setLoadError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
          setDocuments([]);
          setHasMore(false);
          setStatusSummary({});
          setSummaryFromDate("");
          setPendingMyApprovalCount(0);
          setCanApprove(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDocuments();
    return () => {
      mounted = false;
    };
  }, [currentPage, search, filterStatus, filterType, filterDate, filterAwaitingMyApproval, pageSize, listReloadTick]);

  const thStyle = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    whiteSpace: "nowrap",
    userSelect: "none",
    color: G.textMuted,
  };

  const tdStyle = {
    padding: "12px 14px",
    fontSize: 13,
    color: G.text,
    verticalAlign: "top",
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    lineHeight: 1.45,
  };

  function renderCell(row, colKey) {
    switch (colKey) {
      case "id":
        return (
          <button
            type="button"
            style={{ background: "none", border: "none", color: G.accent, cursor: "pointer", fontWeight: 700, fontSize: 13, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}
            onClick={() => {
              setSelectedDoc(row.dbId || row.id);
              setPage("detail");
            }}
          >
            {row.id}
          </button>
        );
      case "date":
        return formatDate(row.date);
      case "type":
        return <DocTypeBadge docTypeId={row.docTypeId} label={row.type} />;
      case "status":
        return <StatusBadge status={row.status} pendingHint={row.pendingHint} />;
      default:
        return row[colKey] ?? "—";
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "24px 16px 16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: G.text, margin: 0, letterSpacing: -0.5 }}>รายการเอกสาร CN</h1>
          <p style={{ fontSize: 13, color: G.textMuted, margin: "4px 0 0" }}>Credit Note Management System</p>
        </div>
        <button style={btnPrimary} onClick={() => setPage("create")}>
          <span>＋</span> สร้างเอกสารใหม่
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {Object.entries(statusConfig).map(([k, v]) => (
          <div key={k} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: "14px 16px", borderLeft: `3px solid ${v.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: v.color }}>{statusSummary[k] ?? 0}</div>
            <div style={{ fontSize: 11, color: G.textMuted, marginTop: 2 }}>{v.label}</div>
            <div style={{ fontSize: 10, color: G.textDim, marginTop: 4 }}>6 เดือนย้อนหลัง</div>
          </div>
        ))}
      </div>
      {summaryFromDate && (
        <div style={{ fontSize: 11, color: G.textMuted, marginTop: -12, marginBottom: 16 }}>
          สรุปตั้งแต่ {formatDate(summaryFromDate)} ถึงวันนี้
        </div>
      )}

      {loading && <div style={{ color: G.textMuted, marginBottom: 12 }}>กำลังโหลดข้อมูล...</div>}
      {loadError && <div style={{ color: G.danger, marginBottom: 12 }}>{loadError}</div>}

      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: 16, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {canApprove && (
          <button
            type="button"
            style={{
              ...(filterAwaitingMyApproval
                ? {
                    background: "rgba(154,107,22,0.14)",
                    color: "#9a6b16",
                    border: "1px solid rgba(154,107,22,0.35)",
                  }
                : {
                    background: G.surfaceElevated,
                    color: G.text,
                    border: `1px solid ${G.border}`,
                  }),
              borderRadius: G.radiusSm,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              setFilterAwaitingMyApproval((v) => !v);
              setCurrentPage(1);
            }}
          >
            รอฉันอนุมัติ
            <span
              style={{
                marginLeft: 8,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 22,
                height: 22,
                padding: "0 6px",
                borderRadius: 999,
                background: pendingMyApprovalCount > 0 ? "#9a6b16" : G.border,
                color: pendingMyApprovalCount > 0 ? "#fff" : G.textMuted,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {pendingMyApprovalCount}
            </span>
          </button>
        )}
        <input
          placeholder="🔍  ค้นหาเลขที่, ลูกค้า, พนักงาน..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          style={{ ...baseInput, flex: "1 1 200px", minWidth: 200 }}
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          style={{ ...baseInput, width: "auto", flex: "0 0 160px" }}
        >
          <option value="all">สถานะทั้งหมด</option>
          {Object.keys(statusConfig).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          style={{ ...baseInput, width: "auto", flex: "0 0 180px" }}
        >
          <option value="all">ประเภทเอกสารทั้งหมด</option>
          {docTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label || t.label_th || t.id}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setCurrentPage(1);
          }}
          style={{ ...baseInput, width: "auto", flex: "0 0 150px", colorScheme: "dark" }}
        />
        {(search || filterStatus !== "all" || filterType !== "all" || filterDate || filterAwaitingMyApproval) && (
          <button
            style={{ ...btnSecondary, padding: "9px 14px" }}
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setFilterType("all");
              setFilterDate("");
              setFilterAwaitingMyApproval(false);
              setCurrentPage(1);
            }}
          >
            ✕ ล้าง
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: G.surface,
          border: `1px solid ${G.border}`,
          borderRadius: G.radius,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ overflow: "auto", flex: 1 }}>
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}>
            <colgroup>
              {TABLE_COLUMNS.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
            </colgroup>
            <thead>
              <tr style={{ background: G.surfaceElevated, borderBottom: `1px solid ${G.border}` }}>
                {TABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      ...thStyle,
                      ...stickyCellStyle(col.pin, { isHeader: true, rowIndex: 0 }),
                      width: col.width,
                      borderBottom: `1px solid ${G.border}`,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_COLUMNS.length} style={{ ...tdStyle, textAlign: "center", color: G.textMuted, whiteSpace: "normal", overflow: "visible" }}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                documents.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: `1px solid ${G.border}`, background: tableRowBackground(i) }}
                    onMouseEnter={(e) => setRowHoverBackground(e.currentTarget, true, i, row.docTypeId, row.type)}
                    onMouseLeave={(e) => setRowHoverBackground(e.currentTarget, false, i, row.docTypeId, row.type)}
                  >
                    {TABLE_COLUMNS.map((col) => {
                      const typeHighlight = col.key === "type" ? getDocTypeHighlight(row.docTypeId, row.type) : null;
                      return (
                      <td
                        key={col.key}
                        data-col={col.key}
                        style={{
                          ...tdStyle,
                          ...stickyCellStyle(col.pin, { isHeader: false, rowIndex: i }),
                          width: col.width,
                          borderBottom: `1px solid ${G.border}`,
                          ...(typeHighlight ? { background: typeHighlight.bg } : {}),
                        }}
                      >
                        {renderCell(row, col.key)}
                      </td>
                    );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: G.textMuted }}>หน้า {currentPage}</span>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: G.textMuted }}>
              แสดง
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ ...baseInput, width: "auto", padding: "6px 10px", fontSize: 12 }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              รายการต่อหน้า
            </label>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button style={{ ...btnSecondary, padding: "6px 12px", fontSize: 12 }} disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              ‹ ก่อนหน้า
            </button>
            <button style={{ ...btnSecondary, padding: "6px 12px", fontSize: 12 }} disabled={!hasMore} onClick={() => setCurrentPage((p) => p + 1)}>
              ถัดไป ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
