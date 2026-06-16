"use client";

import React from "react";

export const MOCK_DOCUMENTS = [
  { id: "CN-2024-0001", date: "2024-01-15", type: "เอกสาร CN", reason: "สินค้าชำรุด", customerId: "C001", customerName: "บริษัท เอบีซี จำกัด", refDoc: "INV-2024-0045", salesperson: "สมชาย ใจดี", status: "Approved" },
  { id: "CN-2024-0002", date: "2024-01-18", type: "เอกสารรับคืน", reason: "สินค้าหมดอายุ", customerId: "C002", customerName: "ห้างหุ้นส่วน เดลต้า", refDoc: "INV-2024-0038", salesperson: "วิภา รักงาน", status: "Pending Approval" },
  { id: "CN-2024-0003", date: "2024-01-20", type: "เอกสารตามส่งสินค้า", reason: "ขาดส่งสินค้า", customerId: "C003", customerName: "บริษัท แกมม่า เทรดดิ้ง", refDoc: "INV-2024-0052", salesperson: "สมชาย ใจดี", status: "Pending Approval" },
  { id: "CN-2024-0004", date: "2024-01-22", type: "เอกสาร CN", reason: "สินค้าชำรุด", customerId: "C004", customerName: "ร้านสุขสวัสดิ์", refDoc: "INV-2024-0061", salesperson: "ธนา มั่นคง", status: "Rejected" },
  { id: "CN-2024-0005", date: "2024-01-25", type: "เอกสารรับคืน", reason: "สินค้าชำรุด", customerId: "C001", customerName: "บริษัท เอบีซี จำกัด", refDoc: "INV-2024-0070", salesperson: "วิภา รักงาน", status: "Cancelled" },
  { id: "CN-2024-0006", date: "2024-02-01", type: "เอกสาร CN", reason: "ขาดส่งสินค้า", customerId: "C005", customerName: "บริษัท โอเมก้า ซัพพลาย", refDoc: "INV-2024-0078", salesperson: "ธนา มั่นคง", status: "Pending Approval" },
  { id: "CN-2024-0007", date: "2024-02-05", type: "เอกสารตามส่งสินค้า", reason: "สินค้าหมดอายุ", customerId: "C006", customerName: "ห้างมหาชัย", refDoc: "INV-2024-0082", salesperson: "สมชาย ใจดี", status: "Approved" },
  { id: "CN-2024-0008", date: "2024-02-08", type: "เอกสาร CN", reason: "สินค้าชำรุด", customerId: "C007", customerName: "บริษัท เซต้า โลจิสติก", refDoc: "INV-2024-0090", salesperson: "วิภา รักงาน", status: "Pending Approval" },
];

export const MOCK_DETAIL = {
  id: "CN-2024-0001",
  date: "2024-01-15",
  reason: "สินค้าชำรุดระหว่างการขนส่ง ลูกค้าร้องเรียนว่าสินค้าบรรจุภัณฑ์แตกหัก",
  refDoc: "INV-2024-0045",
  refDocDate: "2024-01-10",
  salesperson: "นางสาวณัฐชา กนะกาศัย (นุ้ย)",
  customerId: "1RT260053",
  customerName: "บริษัท บิ๊กซี ซูเปอร์เซ็นเตอร์ จำกัด(มหาชน) (สำนักงานใหญ่)",
  purchaseOrder: "PO-2024-0033",
  customerAddress: "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  deliveryLocation: "คลังสินค้า A อาคาร 2 ชั้น 1",
  remark: "กรุณาออกเอกสาร CN ภายใน 7 วันทำการ",
  items: [
    { no: 1, code: "GMC0005", name: "(61871)French Wheat Flour(T55) 25kgs.", qty: 24, unit: "bag", price: 120, discount: 5, tax: 7, lot: "LOT-240110-A", remark: "ขวดแตก 12 ใบ" },
    { no: 2, code: "SGA0002", name: "Barry 44% Chocolate Bar 300(Stick)15x1.6kg", qty: 48, unit: "box", price: 85, discount: 10, tax: 7, lot: "LOT-240112-C", remark: "กล่องบุบ" },
  ],
  approvals: [
    { role: "พนักงานที่ขอ", name: "นางสาวณัฐชา กนะกาศัย (นุ้ย)", date: "2024-01-15", status: "Approved", remark: "ยืนยันสินค้าชำรุดจริง" },
    { role: "หัวหน้า", name: "พิฐชญาณ์  จิรายุเกริกพัชร์ (แพร์)", date: "2024-01-16", status: "Approved", remark: "อนุมัติ ตรวจสอบแล้ว" },
    { role: "Admin", name: "วรรณวิไล วิริยะกุลพานิช (หนิง)", date: "2024-01-17", status: "Approved", remark: "" },
    { role: "Finance", name: "อัจฉรา สุขวัฒนา (ดิว)", date: "2024-01-18", status: "Approved", remark: "ออก CN เรียบร้อย" },
  ],
};

export const MOCK_REF_DATA = {
  date: "2024-01-10",
  salesperson: "สมชาย ใจดี",
  customerId: "C001",
  customerName: "บริษัท เอบีซี จำกัด",
  purchaseOrder: "PO-2024-0033",
  customerAddress: "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  deliveryLocation: "คลังสินค้า A อาคาร 2 ชั้น 1",
  remark: "กรุณาออกเอกสาร CN ภายใน 7 วันทำการ",
  items: [
    { no: 1, code: "CCB0074", name: "BAKING PAPER EXOPAP 60x40cm(P/500)", qty: 24, unit: "โหล", price: 120, discount: 5, tax: 7, lot: "LOT-240110-A", remark: "" },
    { no: 2, code: "GMC0005", name: "Barry 44% Chocolate Bar 300(Stick)15x1.6kg", qty: 6, unit: "แพ็ค", price: 350, discount: 0, tax: 7, lot: "LOT-240108-B", remark: "" },
    { no: 3, code: "SGA0002", name: "(61871)French Wheat Flour(T55) 25kgs.", qty: 48, unit: "กล่อง", price: 85, discount: 10, tax: 7, lot: "LOT-240112-C", remark: "" },
  ],
};

export const statusConfig = {
  "Pending Approval": { label: "Pending Approval", detail: null, color: "#9a6b16", bg: "rgba(154,107,22,0.12)" },
  Approved: { label: "Approved", detail: "อนุมัติครบทุกขั้นแล้ว", color: "#1f7a4f", bg: "rgba(31,122,79,0.12)" },
  Rejected: { label: "Rejected", detail: "ถูกปฏิเสธจากผู้อนุมัติ", color: "#b63a3a", bg: "rgba(182,58,58,0.12)" },
  Cancelled: { label: "Cancelled", detail: "ยกเลิกโดยผู้สร้างเอกสาร", color: "#4b5668", bg: "rgba(75,86,104,0.14)" },
};

/** Fixed cn_doc_types.id — colors for list/detail badges */
export const DOC_TYPE_HIGHLIGHT_BY_ID = {
  "d1e7c38d-85b1-4ac3-b4b3-d8a8bc43d82a": { color: "#1d4ed8", bg: "rgba(29,78,216,0.12)" },
  "82ed8db6-3fca-40f6-aff7-b20772d2f7d1": { color: "#5b21b6", bg: "rgba(91,33,182,0.12)" },
  "b7e9d4f2-6c8a-4e3b-a1f5-9d2e8c7b4a60": { color: "#047857", bg: "rgba(4,120,87,0.12)" },
  "a3f2c9e1-5d8b-42e7-a4c6-91b0e8f7d6c5": { color: "#0f766e", bg: "rgba(15,118,110,0.12)" },
  "f7e2b8c4-1a9d-4e63-b5d0-8c2f4e6a9b1d": { color: "#c2410c", bg: "rgba(194,65,12,0.12)" },
};

export const DOC_TYPE_HIGHLIGHT_BY_LABEL = {
  "เอกสาร CN ราคาสินค้า": DOC_TYPE_HIGHLIGHT_BY_ID["d1e7c38d-85b1-4ac3-b4b3-d8a8bc43d82a"],
  "เอกสาร DN ราคาสินค้า": DOC_TYPE_HIGHLIGHT_BY_ID["82ed8db6-3fca-40f6-aff7-b20772d2f7d1"],
  "เอกสารรับคืนสินค้า": DOC_TYPE_HIGHLIGHT_BY_ID["b7e9d4f2-6c8a-4e3b-a1f5-9d2e8c7b4a60"],
  "เอกสารตามเปลี่ยน - รับคืนสินค้า": DOC_TYPE_HIGHLIGHT_BY_ID["a3f2c9e1-5d8b-42e7-a4c6-91b0e8f7d6c5"],
  "เอกสารตามส่งสินค้า": DOC_TYPE_HIGHLIGHT_BY_ID["f7e2b8c4-1a9d-4e63-b5d0-8c2f4e6a9b1d"],
  "เอกสารโอนสินค้า": { color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
};

const DOC_TYPE_HIGHLIGHT_DEFAULT = { color: "#42516a", bg: "rgba(75,86,104,0.1)" };

export function getDocTypeHighlight(docTypeId, docTypeLabel) {
  const id = String(docTypeId || "")
    .trim()
    .toLowerCase();
  if (id && DOC_TYPE_HIGHLIGHT_BY_ID[id]) return DOC_TYPE_HIGHLIGHT_BY_ID[id];
  const label = String(docTypeLabel || "").trim();
  if (label && DOC_TYPE_HIGHLIGHT_BY_LABEL[label]) return DOC_TYPE_HIGHLIGHT_BY_LABEL[label];
  return DOC_TYPE_HIGHLIGHT_DEFAULT;
}

export function DocTypeBadge({ docTypeId, label }) {
  const cfg = getDocTypeHighlight(docTypeId, label);
  const text = String(label || "").trim() || "—";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1.45,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      {text}
    </span>
  );
}

export const approvalStatusConfig = {
  Approved: { label: "อนุมัติ", color: "#1f7a4f", icon: "✓" },
  Rejected: { label: "ไม่อนุมัติ", color: "#b63a3a", icon: "✕" },
  Pending: { label: "รออนุมัติ", color: "#9a6b16", icon: "⏳" },
};

export const G = {
  bg: "#f3f5f8",
  surface: "#ffffff",
  surfaceElevated: "#eef2f6",
  border: "rgba(30,41,59,0.14)",
  accent: "#1f3a68",
  accentSoft: "rgba(31,58,104,0.1)",
  text: "#0f1f35",
  textMuted: "#6b778c",
  textDim: "#42516a",
  danger: "#b63a3a",
  success: "#1f7a4f",
  warning: "#9a6b16",
  radius: 12,
  radiusSm: 8,
};

export const baseInput = {
  background: G.surfaceElevated,
  border: `1px solid ${G.border}`,
  borderRadius: G.radiusSm,
  color: G.text,
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  transition: "border 0.2s",
  fontFamily: "inherit",
};

export const btnPrimary = {
  background: G.accent,
  color: "#fff",
  border: "none",
  borderRadius: G.radiusSm,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
  transition: "all 0.2s",
};

export const btnSecondary = {
  background: "transparent",
  color: G.textDim,
  border: `1px solid ${G.border}`,
  borderRadius: G.radiusSm,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
  transition: "all 0.2s",
};

export function calcRow(item) {
  const subtotal = item.qty * item.price;
  const discAmt = subtotal * (item.discount / 100);
  const afterDisc = subtotal - discAmt;
  const taxAmt = afterDisc * (item.tax / 100);
  return { subtotal, discAmt, afterDisc, taxAmt, total: afterDisc + taxAmt };
}

export function formatNum(n) {
  return n?.toLocaleString("th-TH", { minimumFractionDigits: 2 }) ?? "-";
}

export function formatDate(d) {
  if (!d) return "-";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const TH_MONTHS_LONG = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/** `isoDate` = YYYY-MM-DD → e.g. 10 พ.ค. 2569 */
export function formatDateThaiShort(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return isoDate;
  const be = y + 543;
  return `${d} ${TH_MONTHS_SHORT[m - 1]} ${be}`;
}

/** `isoDate` = YYYY-MM-DD → e.g. 8 มกราคม 2568 */
export function formatDateThaiLong(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return isoDate;
  const be = y + 543;
  return `${d} ${TH_MONTHS_LONG[m - 1]} ${be}`;
}

export function StatusBadge({ status, pendingHint }) {
  const cfg = statusConfig[status] || statusConfig["Pending Approval"];
  const hint =
    status === "Pending Approval" && String(pendingHint || "").trim()
      ? String(pendingHint).trim()
      : cfg.detail || "";

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.3,
          color: cfg.color,
          background: cfg.bg,
          border: `1px solid ${cfg.color}33`,
          whiteSpace: "nowrap",
        }}
      >
        {cfg.label}
      </span>
      {hint ? (
        <span style={{ fontSize: 10, fontWeight: 500, color: G.textMuted, lineHeight: 1.35, whiteSpace: "normal", maxWidth: 260 }}>
          {hint}
        </span>
      ) : null}
    </span>
  );
}
