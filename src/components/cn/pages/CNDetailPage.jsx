"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getUploadUrl } from "@/lib/cnAuth";
import { mockApproveDocument, mockCloseDocument, mockGetDocument, mockRejectDocument } from "@/lib/cnApi";
import { APP_FONT_FAMILY, GOOGLE_FONTS_HREF } from "@/config/fonts";
import { G, baseInput, btnPrimary, btnSecondary, calcRow, formatDateThaiLong, formatNum, StatusBadge } from "../shared";

/** Align with backend normalizeEmployeeRole */
function normalizeStoredRole(role) {
  const r = String(role || "").toLowerCase().trim();
  if (r === "team lead" || r === "หัวหน้า") return "teamlead";
  if (r === "admin_system" || r === "system admin") return "admin system";
  if (r === "warehouse" || r === "warehouse-dry" || r === "warehouse_dry" || r === "warehousedry") return "warehouse";
  return r;
}

function isTeamLeadRole(role) {
  return normalizeStoredRole(role) === "teamlead";
}

function isAdminRole(role) {
  const r = normalizeStoredRole(role);
  return r === "admin" || r === "admin system";
}

function isFinanceRole(role) {
  return normalizeStoredRole(role) === "finance";
}

function isTransportationRole(role) {
  return normalizeStoredRole(role) === "transportation";
}

function isWarehouseRole(role) {
  return normalizeStoredRole(role) === "warehouse";
}


/** Steps match backend cn_document_approvals.role_name */
const PRICE_APPROVAL_STEPS = [
  { role: "พนักงานที่ขอ", subtitle: "Sale" },
  { role: "หัวหน้า", subtitle: "Sale Manager" },
  { role: "Admin", subtitle: "Admin" },
  { role: "Finance", subtitle: "Finance" },
];

const RETURN_GOODS_APPROVAL_STEPS = [
  { role: "พนักงานที่ขอ", subtitle: "Sale" },
  { role: "หัวหน้า", subtitle: "Sale Manager" },
  { role: "Admin", subtitle: "Admin" },
  { role: "transportation", subtitle: "Transportation" },
  { role: "warehouse", subtitle: "Warehouse" },
  { role: "Finance", subtitle: "Finance" },
];

/** เอกสารตามเปลี่ยน - รับคืนสินค้า: ไม่มี Finance */
const FOLLOW_CHANGE_RETURN_APPROVAL_STEPS = [
  { role: "พนักงานที่ขอ", subtitle: "Sale" },
  { role: "หัวหน้า", subtitle: "Sale Manager" },
  { role: "Admin", subtitle: "Admin" },
  { role: "transportation", subtitle: "Transportation" },
  { role: "warehouse", subtitle: "Warehouse" },
];

/** เอกสารตามส่งสินค้า: เริ่มที่ warehouse → transportation → teamlead → admin */
const DELIVERY_FOLLOW_APPROVAL_STEPS = [
  { role: "warehouse", subtitle: "Warehouse" },
  { role: "transportation", subtitle: "Transportation" },
  { role: "หัวหน้า", subtitle: "Sale Manager" },
  { role: "Admin", subtitle: "Admin" },
];

function prevStepApprovedFor(steps, roleName, approvalsByRole) {
  const chain = steps.map((s) => s.role);
  const idx = chain.indexOf(roleName);
  if (idx <= 0) return true;
  const prev = approvalsByRole.get(chain[idx - 1]);
  return prev?.status === "Approved";
}

function dash(value) {
  if (value == null) return "—";
  const t = String(value).trim();
  return t || "—";
}

function dateOnly(value) {
  return String(value || "").slice(0, 10);
}

function formatApprovalDecisionAt(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatDateThaiLong(s);
  return formatDateThaiDateTime(s);
}

function formatDateThaiDateTime(value) {
  const dt = value ? new Date(value) : new Date();
  if (Number.isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(dt);
}

function isImageAttachment(mimeType, path) {
  const mime = String(mimeType || "").toLowerCase();
  const p = String(path || "").toLowerCase();
  return mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(p);
}

function resolveDirectImageUrl(src) {
  const raw = String(src || "").trim();
  if (!raw || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${raw}`;
  }
  return raw;
}

async function embedImagesAsDataUrls(root) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const directUrl = resolveDirectImageUrl(img.getAttribute("src") || img.src || "");
      if (!directUrl || directUrl.startsWith("data:")) return;

      if (!/^https?:\/\//i.test(directUrl)) {
        img.setAttribute("src", directUrl);
        return;
      }

      try {
        const res = await fetch(directUrl, { cache: "no-store", mode: "cors", credentials: "omit" });
        if (!res.ok) {
          img.setAttribute("src", directUrl);
          return;
        }
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        if (dataUrl) img.setAttribute("src", dataUrl);
      } catch {
        img.setAttribute("src", directUrl);
      }
    }),
  );
}

function chunkSteps(steps, size = 3) {
  const out = [];
  for (let i = 0; i < steps.length; i += size) {
    out.push(steps.slice(i, i + size));
  }
  return out;
}

/** Same IDs as backend */
const DOC_TYPE_CN_PRICE_GOODS_ID = "d1e7c38d-85b1-4ac3-b4b3-d8a8bc43d82a";
const DOC_TYPE_DN_PRICE_GOODS_ID = "82ed8db6-3fca-40f6-aff7-b20772d2f7d1";

const DOC_TYPE_PRICE_GOODS_FLOW_IDS = new Set([
  DOC_TYPE_CN_PRICE_GOODS_ID,
  DOC_TYPE_DN_PRICE_GOODS_ID,
]);

const DOC_TYPE_RETURN_GOODS_FLOW_IDS = new Set(["b7e9d4f2-6c8a-4e3b-a1f5-9d2e8c7b4a60"]);

const DOC_TYPE_FOLLOW_CHANGE_RETURN_FLOW_IDS = new Set(["a3f2c9e1-5d8b-42e7-a4c6-91b0e8f7d6c5"]);

const DOC_TYPE_DELIVERY_FOLLOW_FLOW_IDS = new Set(["f7e2b8c4-1a9d-4e63-b5d0-8c2f4e6a9b1d"]);
const CREATOR_CLOSE_PREFIX = "ปิดเอกสารโดยผู้สร้าง:";

function docUsesPriceGoodsApprovalFlow(docTypeId) {
  const id = String(docTypeId || "")
    .trim()
    .toLowerCase();
  return DOC_TYPE_PRICE_GOODS_FLOW_IDS.has(id);
}

function docUsesReturnGoodsApprovalFlow(docTypeId) {
  const id = String(docTypeId || "")
    .trim()
    .toLowerCase();
  return DOC_TYPE_RETURN_GOODS_FLOW_IDS.has(id);
}

function docUsesFollowChangeReturnApprovalFlow(docTypeId) {
  const id = String(docTypeId || "")
    .trim()
    .toLowerCase();
  return DOC_TYPE_FOLLOW_CHANGE_RETURN_FLOW_IDS.has(id);
}

function docUsesDeliveryFollowApprovalFlow(docTypeId) {
  const id = String(docTypeId || "")
    .trim()
    .toLowerCase();
  return DOC_TYPE_DELIVERY_FOLLOW_FLOW_IDS.has(id);
}

function docUsesTransportWarehouseApprovalFlow(docTypeId) {
  return docUsesReturnGoodsApprovalFlow(docTypeId) || docUsesFollowChangeReturnApprovalFlow(docTypeId);
}

function docUsesWarehouseOrTransportApproveUI(docTypeId) {
  return docUsesTransportWarehouseApprovalFlow(docTypeId) || docUsesDeliveryFollowApprovalFlow(docTypeId);
}

function docUsesConfiguredApprovalFlow(docTypeId) {
  return (
    docUsesPriceGoodsApprovalFlow(docTypeId) ||
    docUsesReturnGoodsApprovalFlow(docTypeId) ||
    docUsesFollowChangeReturnApprovalFlow(docTypeId) ||
    docUsesDeliveryFollowApprovalFlow(docTypeId)
  );
}

function docUsesReceiveDocumentPrintLayout(docTypeId) {
  return docUsesReturnGoodsApprovalFlow(docTypeId) || docUsesFollowChangeReturnApprovalFlow(docTypeId);
}

function docUsesCNPriceSimplePrintLayout(docTypeId) {
  const id = String(docTypeId || "").trim().toLowerCase();
  return id === DOC_TYPE_CN_PRICE_GOODS_ID || id === DOC_TYPE_DN_PRICE_GOODS_ID;
}

function docUsesDeliveryFollowPrintLayout(docTypeId) {
  return docUsesDeliveryFollowApprovalFlow(docTypeId);
}

export default function CNDetailPage({ setPage, selectedDoc, currentUser = {} }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);
  const [approveRemark, setApproveRemark] = useState("");
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const cardStyle = { background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: "16px 20px", marginBottom: 14 };
  const printDocRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function loadDetail() {
      if (!selectedDoc) {
        if (mounted) {
          setLoadError("ไม่พบเลขที่เอกสารที่ต้องการเปิด");
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setLoadError("");
      try {
        const data = await mockGetDocument(selectedDoc);

        const mapped = {
          id: data.docNo || selectedDoc,
          date: dateOnly(data.docDate),
          reason: data.reason || "",
          status: data.status || "",
          pendingHint: data.pendingHint || "",
          docTypeId: data.docTypeId || "",
          docTypeLabel: data.docType || "",
          refDoc: data.referenceDocNo || "",
          salespersonCode: data.salespersonCode || "",
          salesperson: data.salespersonName || "",
          customerId: data.customerId || "",
          customerName: data.customerName || "",
          purchaseOrder: data.purchaseOrderNo || "",
          customerAddress: data.customerAddress || "",
          deliveryLocation: data.deliveryLocation || "",
          remark: data.remark || "",
          subtotalAmount: Number(data.subtotalAmount || 0),
          taxAmount: Number(data.taxAmount || 0),
          totalAmount: Number(data.totalAmount || 0),
          ownerEmployeeCode: data.ownerEmployeeCode || "",
          items: Array.isArray(data.items)
            ? data.items.map((it) => ({
                no: it.lineNo,
                code: it.productCode,
                name: it.productName,
                qty: Number(it.quantity || 0),
                unit: it.unitName,
                price: Number(it.unitPrice || 0),
                discount: Number(it.discountPercent || 0),
                tax: Number(it.taxPercent || 0),
                lot: it.lotNo || "",
                remark: it.remark || "",
              }))
            : [],
          approvals: Array.isArray(data.approvals)
            ? data.approvals.map((ap) => ({
                role: ap.roleName,
                code: ap.approverCode,
                name: ap.approverName,
                signaturePath: ap.signaturePath || "",
                decisionAt: ap.decisionAt || "",
                status: ap.decisionStatus,
                remark: ap.remark || "",
              }))
            : [],
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
        };
        if (mounted) setDoc(mapped);
      } catch (err) {
        if (mounted) {
          setLoadError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
          setDoc(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDetail();
    return () => {
      mounted = false;
    };
  }, [selectedDoc, reloadNonce]);

  const totals = useMemo(() => {
    if (!doc) return { subtotal: 0, tax: 0, total: 0 };
    if (doc.subtotalAmount || doc.taxAmount || doc.totalAmount) {
      return { subtotal: doc.subtotalAmount, tax: doc.taxAmount, total: doc.totalAmount };
    }
    return doc.items.reduce(
      (acc, item) => {
        const r = calcRow(item);
        return { subtotal: acc.subtotal + r.afterDisc, tax: acc.tax + r.taxAmt, total: acc.total + r.total };
      },
      { subtotal: 0, tax: 0, total: 0 },
    );
  }, [doc]);

  const approvalsByRole = useMemo(() => {
    const m = new Map();
    for (const ap of doc?.approvals || []) {
      m.set(ap.role, ap);
    }
    return m;
  }, [doc]);
  const attachments = doc?.attachments || [];
  const rejectedReason = useMemo(() => {
    if (!doc) return "";
    for (const ap of doc.approvals || []) {
      if (String(ap?.status || "").trim() === "Rejected" && String(ap?.remark || "").trim()) {
        return String(ap.remark).trim();
      }
    }
    return "";
  }, [doc]);
  const closedReason = useMemo(() => {
    if (!doc) return "";
    const docRemark = String(doc.remark || "").trim();
    if (docRemark.startsWith(CREATOR_CLOSE_PREFIX)) {
      return docRemark.slice(CREATOR_CLOSE_PREFIX.length).trim();
    }
    for (const ap of doc.approvals || []) {
      const remark = String(ap?.remark || "").trim();
      if (remark.startsWith(CREATOR_CLOSE_PREFIX)) {
        return remark.slice(CREATOR_CLOSE_PREFIX.length).trim();
      }
    }
    return "";
  }, [doc]);

  const approvalSteps = useMemo(() => {
    if (!doc?.docTypeId) return PRICE_APPROVAL_STEPS;
    if (docUsesDeliveryFollowApprovalFlow(doc.docTypeId)) return DELIVERY_FOLLOW_APPROVAL_STEPS;
    if (docUsesFollowChangeReturnApprovalFlow(doc.docTypeId)) return FOLLOW_CHANGE_RETURN_APPROVAL_STEPS;
    if (docUsesReturnGoodsApprovalFlow(doc.docTypeId)) return RETURN_GOODS_APPROVAL_STEPS;
    if (docUsesPriceGoodsApprovalFlow(doc.docTypeId)) return PRICE_APPROVAL_STEPS;
    return PRICE_APPROVAL_STEPS;
  }, [doc?.docTypeId]);

  const usesConfiguredFlow = docUsesConfiguredApprovalFlow(doc?.docTypeId);

  const teamLeadStep = approvalsByRole.get("หัวหน้า");
  const adminStep = approvalsByRole.get("Admin");
  const transportationStep = approvalsByRole.get("transportation");
  const warehouseStep = approvalsByRole.get("warehouse");
  const financeStep = approvalsByRole.get("Finance");

  const showTeamLeadApprove =
    doc &&
    usesConfiguredFlow &&
    isTeamLeadRole(currentUser?.role) &&
    teamLeadStep?.status === "Pending" &&
    prevStepApprovedFor(approvalSteps, "หัวหน้า", approvalsByRole);

  const showAdminApprove =
    doc &&
    usesConfiguredFlow &&
    isAdminRole(currentUser?.role) &&
    adminStep?.status === "Pending" &&
    prevStepApprovedFor(approvalSteps, "Admin", approvalsByRole);

  const showWarehouseApprove =
    doc &&
    warehouseStep?.status === "Pending" &&
    prevStepApprovedFor(approvalSteps, "warehouse", approvalsByRole) &&
    docUsesWarehouseOrTransportApproveUI(doc.docTypeId) &&
    isWarehouseRole(currentUser?.role);

  const showTransportationApprove =
    doc &&
    docUsesWarehouseOrTransportApproveUI(doc.docTypeId) &&
    isTransportationRole(currentUser?.role) &&
    transportationStep?.status === "Pending" &&
    prevStepApprovedFor(approvalSteps, "transportation", approvalsByRole);

  const showFinanceApprove =
    doc &&
    (docUsesPriceGoodsApprovalFlow(doc.docTypeId) || docUsesReturnGoodsApprovalFlow(doc.docTypeId)) &&
    isFinanceRole(currentUser?.role) &&
    financeStep?.status === "Pending" &&
    prevStepApprovedFor(approvalSteps, "Finance", approvalsByRole);
  const hasPendingApprovals = (doc?.approvals || []).some((ap) => String(ap?.status || "").trim() === "Pending");
  const canCloseDocument =
    !!doc &&
    String(doc.status || "").trim() === "Pending Approval" &&
    !!currentUser?.code &&
    String(doc.ownerEmployeeCode || "").trim() === String(currentUser.code || "").trim() &&
    hasPendingApprovals;

  async function submitApprove(endpointSegment) {
    if (!selectedDoc || approveSubmitting) return;
    setApproveSubmitting(true);
    setApproveError("");
    try {
      await mockApproveDocument(selectedDoc, endpointSegment, approveRemark.trim());
      setApproveRemark("");
      setReloadNonce((n) => n + 1);
    } catch (err) {
      setApproveError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setApproveSubmitting(false);
    }
  }

  async function submitReject() {
    if (!selectedDoc || approveSubmitting) return;
    const remark = approveRemark.trim();
    if (!remark) {
      setApproveError("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }
    setApproveSubmitting(true);
    setApproveError("");
    try {
      await mockRejectDocument(selectedDoc, remark);
      setApproveRemark("");
      setReloadNonce((n) => n + 1);
    } catch (err) {
      setApproveError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setApproveSubmitting(false);
    }
  }

  async function submitCloseDocument() {
    if (!selectedDoc || approveSubmitting) return;
    const remark = approveRemark.trim();
    if (!remark) {
      setApproveError("กรุณาระบุเหตุผลในการปิดเอกสาร");
      return;
    }
    setApproveSubmitting(true);
    setApproveError("");
    try {
      await mockCloseDocument(selectedDoc, remark);
      setApproveRemark("");
      setReloadNonce((n) => n + 1);
    } catch (err) {
      setApproveError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setApproveSubmitting(false);
    }
  }

  async function handlePrintDocument() {
    const node = printDocRef.current;
    if (!node) return;
    const clone = node.cloneNode(true);
    await embedImagesAsDataUrls(clone);
    const w = window.open("", "_blank", "width=1100,height=850");
    if (!w) return;
    w.document.write(`<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="${GOOGLE_FONTS_HREF}" rel="stylesheet" />
        <title>CN Print</title>
        <style>
          body { font-family: ${APP_FONT_FAMILY}; margin: 0; background: #fff; color: #111; -webkit-font-smoothing: antialiased; }
          .sheet { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm 10mm; box-sizing: border-box; }
          .small { font-size: 11px; color: #475569; }
          .title { text-align: center; font-size: 22px; font-weight: 700; margin: 8px 0 12px; }
          .row { margin: 3px 0; font-size: 12px; }
          .hr { border-top: 1px solid #cbd5e1; margin: 8px 0; }
          .tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
          .tbl th, .tbl td { border: 1px solid #cbd5e1; padding: 6px 7px; vertical-align: top; }
          .tbl th { background: #f8fafc; text-align: left; }
          .sign-grid { display: grid; gap: 12px; margin-top: 10px; }
          .sign-card { text-align: center; min-height: 94px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          .page-break { page-break-before: always; }
          .att-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
          .att-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
          .att-card img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 6px; }
          @page { size: A4; margin: 0; }
          @media print {
            .sheet { margin: 0; }
          }
        </style>
      </head>
      <body>${clone.innerHTML}</body>
      </html>`);
    w.document.close();
    setTimeout(async () => {
      if (w.document.fonts?.ready) {
        await w.document.fonts.ready;
      }
      w.focus();
      w.print();
    }, 400);
  }

  async function handleExportPdf() {
    if (!printDocRef.current || exportingPdf) return;
    setExportingPdf(true);
    let tempContainer = null;
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import("jspdf"), import("html2canvas")]);
      const sourceNode = printDocRef.current;
      tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.style.width = "794px";
      tempContainer.style.background = "#fff";
      tempContainer.style.fontFamily = APP_FONT_FAMILY;
      tempContainer.style.zIndex = "-1";
      tempContainer.style.pointerEvents = "none";
      tempContainer.style.opacity = "1";
      tempContainer.innerHTML = sourceNode.innerHTML;
      document.body.appendChild(tempContainer);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await embedImagesAsDataUrls(tempContainer);

      const pageNodes = Array.from(tempContainer.children).filter((n) => n.nodeType === 1);
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const usableW = pageW - margin * 2;
      const usableH = pageH - margin * 2;

      let started = false;
      for (const node of pageNodes) {
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        const maxSliceHeightPx = Math.floor((usableH * canvas.width) / usableW);
        let offsetY = 0;
        while (offsetY < canvas.height) {
          const sliceHeight = Math.min(maxSliceHeightPx, canvas.height - offsetY);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext("2d");
          if (!ctx) break;
          ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

          const renderH = (sliceHeight * usableW) / canvas.width;
          if (started) pdf.addPage();
          pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, margin, usableW, renderH);
          started = true;
          offsetY += sliceHeight;
        }
      }

      pdf.save(`${(doc?.id || selectedDoc || "CN").toString().replace(/[^\w-]/g, "_")}.pdf`);
    } catch (e) {
      setApproveError(e?.message || "ไม่สามารถ export PDF ได้");
    } finally {
      if (tempContainer?.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setExportingPdf(false);
    }
  }

  const btnApproveGreen = { ...btnPrimary, background: G.success };
  const btnRejectRed = { ...btnSecondary, color: "#fff", background: G.danger, border: `1px solid ${G.danger}` };
  const isRejectedDoc = String(doc?.status || "").trim() === "Rejected";
  const creatorClosedStatus = String(doc?.status || "").trim();
  const isCreatorClosedDoc = (creatorClosedStatus === "Cancelled" || creatorClosedStatus === "Completed") && !!closedReason;
  const hidePrintExportActions = isRejectedDoc || isCreatorClosedDoc;
  return (
    <div style={{ padding: "20px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 13 }}>
        <button style={{ background: "none", border: "none", color: G.accent, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: 13 }} onClick={() => setPage("list")}>
          ← รายการเอกสาร
        </button>
      </div>

      {loading && (
        <div style={cardStyle}>
          <div style={{ color: G.textMuted }}>กำลังโหลดรายละเอียดเอกสาร...</div>
        </div>
      )}
      {!loading && loadError && (
        <div style={cardStyle}>
          <div style={{ color: G.danger, marginBottom: 10 }}>{loadError}</div>
          <button type="button" style={btnSecondary} onClick={() => setPage("list")}>
            กลับหน้ารายการ
          </button>
        </div>
      )}
      {!loading && !loadError && !doc && (
        <div style={cardStyle}>
          <div style={{ color: G.textMuted }}>ไม่พบข้อมูลเอกสาร</div>
        </div>
      )}
      {!loading && !loadError && doc && (
        <>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", fontWeight: 800, color: G.text, marginBottom: 12, fontSize: 18 }}>
          {(doc.docTypeLabel && String(doc.docTypeLabel).trim()) || "เอกสาร CN"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, fontSize: 13 }}>
          <div>
            <strong>เลขที่เอกสาร:</strong> {dash(doc.id)}
          </div>
          <div>
            <strong>วันที่เอกสาร:</strong> {formatDateThaiLong(doc.date)}
          </div>
          <div>
            <strong>สถานะ:</strong> <StatusBadge status={doc.status || "Approved"} pendingHint={doc.pendingHint} />
          </div>
          <div>
            <strong>เหตุผล:</strong> {dash(doc.reason)}
          </div>
        </div>
        {String(doc.status || "").trim() === "Rejected" && (
          <div style={{ marginTop: 10, fontSize: 13, color: G.danger }}>
            <strong>เหตุผลไม่อนุมัติ:</strong> {dash(rejectedReason)}
          </div>
        )}
        {isCreatorClosedDoc && (
          <div style={{ marginTop: 10, fontSize: 13, color: G.warning }}>
            <strong>เหตุผลปิดเอกสาร:</strong> {dash(closedReason)}
          </div>
        )}

        <div style={{ height: 1, background: G.border, margin: "12px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, fontSize: 13 }}>
          <div>
            <strong>เลขที่เอกสารอ้างอิง:</strong> {dash(doc.refDoc)}
          </div>
          <div>
            <strong>พนักงานขาย:</strong> {dash(doc.salesperson)} {doc.salespersonCode ? `(${doc.salespersonCode})` : ""}
          </div>
          <div>
            <strong>รหัสลูกค้า:</strong> {dash(doc.customerId)}
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <strong>ชื่อลูกค้า:</strong> {dash(doc.customerName)}
          </div>
          <div>
            <strong>ใบสั่งซื้อ:</strong> {dash(doc.purchaseOrder)}
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <strong>ที่อยู่ลูกค้า:</strong> {dash(doc.customerAddress)}
          </div>
          <div>
            <strong>สถานที่จัดส่ง:</strong> {dash(doc.deliveryLocation)}
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <strong>หมายเหตุ:</strong> {dash(doc.remark)}
          </div>
        </div>
      </div>

      {!hidePrintExportActions && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnSecondary} onClick={handlePrintDocument}>
              🖨 พิมพ์เอกสาร
            </button>
            <button style={btnSecondary} onClick={handleExportPdf} disabled={exportingPdf}>
              {exportingPdf ? "กำลัง Export..." : "⬇ Export PDF"}
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 10 }}>รายการสินค้า</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 950 }}>
            <thead>
              <tr style={{ background: G.surfaceElevated }}>
                {["ลำดับ", "รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "หน่วย", "ราคา/หน่วย", "ส่วนลด", "รวมเงิน", "ภาษี", "ล็อตผลิต", "หมายเหตุ"].map((h) => (
                  <th key={h} style={{ padding: "9px 12px", fontSize: 11, color: G.textMuted, textAlign: "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => {
                const r = calcRow(item);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${G.border}` }}>
                    <td style={{ padding: "10px 12px", color: G.textDim }}>{i + 1}</td>
                    <td style={{ padding: "10px 12px", color: G.textDim }}>{item.code}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{item.name}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{formatNum(item.qty)}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{dash(item.unit)}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{formatNum(item.price)}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{item.discount ? `${formatNum(item.discount)}%` : "—"}</td>
                    <td style={{ padding: "10px 12px", color: G.accent, fontWeight: 700 }}>{formatNum(r.afterDisc)}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{formatNum(r.taxAmt)}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{dash(item.lot)}</td>
                    <td style={{ padding: "10px 12px", color: G.text }}>{dash(item.remark)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, color: G.text, gap: 16, flexWrap: "wrap" }}>
          <span>รวมก่อนภาษี: {formatNum(totals.subtotal)}</span>
          <span>ภาษี: {formatNum(totals.tax)}</span>
          <span style={{ fontWeight: 700, color: G.accent }}>รวมทั้งสิ้น: {formatNum(totals.total)}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 10 }}>เอกสารแนบ</div>
        {attachments.length === 0 ? (
          <div style={{ color: G.textMuted, fontSize: 13 }}>ไม่มีไฟล์แนบ</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {attachments.map((file) => {
              const url = getUploadUrl(file.storagePath);
              const isImage = isImageAttachment(file.mimeType, file.storagePath);
              return (
                <a key={file.id || `${file.fileName}-${file.storagePath}`} href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ border: `1px solid ${G.border}`, borderRadius: G.radiusSm, padding: 10 }}>
                    {isImage ? (
                      <img src={url} alt={file.fileName || "attachment"} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
                    ) : (
                      <div style={{ height: 140, display: "grid", placeItems: "center", background: G.surfaceElevated, borderRadius: 6, marginBottom: 8, color: G.textMuted, fontSize: 12 }}>
                        ไฟล์แนบ
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: G.text, fontWeight: 600, wordBreak: "break-word" }}>{dash(file.fileName)}</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 10 }}>ลายเซ็นผู้อนุมัติ</div>

        {canCloseDocument && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: G.radiusSm,
              border: `1px solid ${G.border}`,
              background: G.surfaceElevated,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>ปิดเอกสาร (ผู้สร้างเอกสาร)</div>
            <p style={{ fontSize: 12, color: G.textMuted, margin: "0 0 10px" }}>
              ใช้เมื่อไม่ต้องการให้เอกสารเดิน flow ต่อ โดยระบบจะบันทึกเหตุผลและปิดเอกสารทันที
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>เหตุผลที่ปิดเอกสาร *</label>
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              rows={3}
              placeholder="ระบุเหตุผลที่ต้องการปิดเอกสาร"
              style={{
                ...baseInput,
                marginBottom: 10,
                resize: "vertical",
                minHeight: 72,
                fontFamily: "inherit",
              }}
            />
            {approveError && canCloseDocument && <div style={{ color: G.danger, fontSize: 12, marginBottom: 8 }}>{approveError}</div>}
            <button type="button" disabled={approveSubmitting} style={{ ...btnRejectRed, opacity: approveSubmitting ? 0.65 : 1 }} onClick={submitCloseDocument}>
              {approveSubmitting ? "กำลังบันทึก…" : "ปิดเอกสาร"}
            </button>
          </div>
        )}

        {showTeamLeadApprove && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: G.radiusSm,
              border: `1px solid ${G.border}`,
              background: G.surfaceElevated,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>อนุมัติในฐานะหัวหน้า</div>
            <p style={{ fontSize: 12, color: G.textMuted, margin: "0 0 10px" }}>
              {docUsesDeliveryFollowApprovalFlow(doc.docTypeId)
                ? "แสดงเมื่อฝ่ายขนส่งอนุมัติแล้วเท่านั้น — เมื่อกดอนุมัติ ระบบจะบันทึกลายเซ็นตามโปรไฟล์ของคุณในขั้นตอน &quot;หัวหน้า&quot;"
                : "เมื่อกดอนุมัติ ระบบจะบันทึกลายเซ็นตามโปรไฟล์ของคุณ และวันที่อนุมัติในขั้นตอน &quot;หัวหน้า&quot;"}
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>หมายเหตุ (ถ้ามี)</label>
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              rows={2}
              placeholder="เช่น ตรวจสอบแล้วถูกต้อง"
              style={{
                ...baseInput,
                marginBottom: 10,
                resize: "vertical",
                minHeight: 56,
                fontFamily: "inherit",
              }}
            />
            {approveError && showTeamLeadApprove && <div style={{ color: G.danger, fontSize: 12, marginBottom: 8 }}>{approveError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnApproveGreen, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={() => submitApprove("approve-teamlead")}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "อนุมัติ"}
              </button>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnRejectRed, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={submitReject}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "ไม่อนุมัติ"}
              </button>
            </div>
          </div>
        )}

        {showAdminApprove && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: G.radiusSm,
              border: `1px solid ${G.border}`,
              background: G.surfaceElevated,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>อนุมัติในฐานะ Admin</div>
            <p style={{ fontSize: 12, color: G.textMuted, margin: "0 0 10px" }}>
              {docUsesDeliveryFollowApprovalFlow(doc.docTypeId)
                ? "แสดงเมื่อหัวหน้าทีมอนุมัติแล้วเท่านั้น — เมื่ออนุมัติครบ ระบบจะเปลี่ยนสถานะเอกสารเป็น Approved"
                : "แสดงเมื่อหัวหน้าทีมอนุมัติแล้วเท่านั้น — บันทึกลายเซ็นตามโปรไฟล์ของคุณ"}
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>หมายเหตุ (ถ้ามี)</label>
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              rows={2}
              placeholder="เช่น ตรวจสอบแล้วถูกต้อง"
              style={{
                ...baseInput,
                marginBottom: 10,
                resize: "vertical",
                minHeight: 56,
                fontFamily: "inherit",
              }}
            />
            {approveError && showAdminApprove && <div style={{ color: G.danger, fontSize: 12, marginBottom: 8 }}>{approveError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnApproveGreen, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={() => submitApprove("approve-admin")}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "อนุมัติ"}
              </button>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnRejectRed, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={submitReject}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "ไม่อนุมัติ"}
              </button>
            </div>
          </div>
        )}

        {showTransportationApprove && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: G.radiusSm,
              border: `1px solid ${G.border}`,
              background: G.surfaceElevated,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>อนุมัติในฐานะ Transportation</div>
            <p style={{ fontSize: 12, color: G.textMuted, margin: "0 0 10px" }}>
              {docUsesDeliveryFollowApprovalFlow(doc.docTypeId)
                ? "แสดงเมื่อคลังอนุมัติแล้วเท่านั้น — บันทึกลายเซ็นตามโปรไฟล์ของคุณ"
                : "แสดงเมื่อ Admin อนุมัติแล้วเท่านั้น — บันทึกลายเซ็นตามโปรไฟล์ของคุณ"}
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>หมายเหตุ (ถ้ามี)</label>
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              rows={2}
              placeholder="เช่น ตรวจสอบแล้วถูกต้อง"
              style={{
                ...baseInput,
                marginBottom: 10,
                resize: "vertical",
                minHeight: 56,
                fontFamily: "inherit",
              }}
            />
            {approveError && showTransportationApprove && <div style={{ color: G.danger, fontSize: 12, marginBottom: 8 }}>{approveError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnApproveGreen, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={() => submitApprove("approve-transportation")}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "อนุมัติ"}
              </button>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnRejectRed, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={submitReject}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "ไม่อนุมัติ"}
              </button>
            </div>
          </div>
        )}

        {showWarehouseApprove && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: G.radiusSm,
              border: `1px solid ${G.border}`,
              background: G.surfaceElevated,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>อนุมัติในฐานะ Warehouse</div>
            <p style={{ fontSize: 12, color: G.textMuted, margin: "0 0 10px" }}>
              {docUsesDeliveryFollowApprovalFlow(doc.docTypeId)
                ? "ขั้นแรกของ flow นี้: เฉพาะ Warehouse กดอนุมัติได้ — ระบบบันทึกลายเซ็นตามโปรไฟล์ของผู้อนุมัติ"
                : docUsesFollowChangeReturnApprovalFlow(doc.docTypeId)
                  ? "แสดงเมื่อฝ่ายขนส่งอนุมัติแล้วเท่านั้น — เมื่อคุณอนุมัติ ระบบจะปิดงานและเปลี่ยนสถานะเอกสารเป็น Approved"
                  : "แสดงเมื่อฝ่ายขนส่งอนุมัติแล้วเท่านั้น — บันทึกลายเซ็นตามโปรไฟล์ของคุณ"}
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>หมายเหตุ (ถ้ามี)</label>
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              rows={2}
              placeholder="เช่น ตรวจสอบแล้วถูกต้อง"
              style={{
                ...baseInput,
                marginBottom: 10,
                resize: "vertical",
                minHeight: 56,
                fontFamily: "inherit",
              }}
            />
            {approveError && showWarehouseApprove && <div style={{ color: G.danger, fontSize: 12, marginBottom: 8 }}>{approveError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnApproveGreen, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={() => submitApprove("approve-warehouse")}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "อนุมัติ"}
              </button>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnRejectRed, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={submitReject}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "ไม่อนุมัติ"}
              </button>
            </div>
          </div>
        )}

        {showFinanceApprove && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              borderRadius: G.radiusSm,
              border: `1px solid ${G.border}`,
              background: G.surfaceElevated,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, marginBottom: 8 }}>อนุมัติในฐานะ Finance</div>
            <p style={{ fontSize: 12, color: G.textMuted, margin: "0 0 10px" }}>
              {docUsesReturnGoodsApprovalFlow(doc.docTypeId)
                ? "แสดงเมื่อคลังอนุมัติแล้วเท่านั้น — เมื่ออนุมัติครบ ระบบจะเปลี่ยนสถานะเอกสารเป็น Approved"
                : "แสดงเมื่อ Admin อนุมัติแล้วเท่านั้น — เมื่ออนุมัติครบ ระบบจะเปลี่ยนสถานะเอกสารเป็น Approved"}
            </p>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>หมายเหตุ (ถ้ามี)</label>
            <textarea
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              rows={2}
              placeholder="เช่น รับทราบ / พร้อมตั้งหนี้"
              style={{
                ...baseInput,
                marginBottom: 10,
                resize: "vertical",
                minHeight: 56,
                fontFamily: "inherit",
              }}
            />
            {approveError && showFinanceApprove && <div style={{ color: G.danger, fontSize: 12, marginBottom: 8 }}>{approveError}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnApproveGreen, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={() => submitApprove("approve-finance")}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "อนุมัติ"}
              </button>
              <button
                type="button"
                disabled={approveSubmitting}
                style={{ ...btnRejectRed, opacity: approveSubmitting ? 0.65 : 1 }}
                onClick={submitReject}
              >
                {approveSubmitting ? "กำลังบันทึก…" : "ไม่อนุมัติ"}
              </button>
            </div>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${approvalSteps.length}, minmax(0, 1fr))`,
              gap: 14,
            }}
          >
            {approvalSteps.map((step, i) => {
              const ap = approvalsByRole.get(step.role);
              const hasSig = !!ap?.signaturePath;
              return (
                <div key={`${step.role}-${i}`} style={{ textAlign: "center", minHeight: 130 }}>
                  <div style={{ height: 52, display: "grid", placeItems: "center", marginBottom: 4 }}>
                    {hasSig ? (
                      <img
                        src={getUploadUrl(ap.signaturePath)}
                        alt={`signature-${ap.code || step.role}`}
                        style={{ height: 44, width: "auto", maxWidth: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <div style={{ width: "75%", borderBottom: `1px solid ${G.border}`, color: G.textMuted, fontSize: 12, lineHeight: "14px" }}>-</div>
                    )}
                  </div>
                  <div style={{ color: G.text, fontWeight: 700, fontSize: 12, minHeight: 18 }}>{dash(ap?.name)}</div>
                  <div style={{ color: G.textDim, fontSize: 12 }}>{step.subtitle}</div>
                  <div style={{ color: G.textMuted, fontSize: 12, marginTop: 6 }}>
                    {ap?.decisionAt ? formatApprovalDecisionAt(ap.decisionAt) : "วันที่ (....................)"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        ref={printDocRef}
        style={{
          position: "fixed",
          left: "-20000px",
          top: 0,
          width: "794px",
          background: "#fff",
          color: "#111827",
          fontFamily: APP_FONT_FAMILY,
          fontSize: 12,
          lineHeight: 1.4,
          padding: "24px 20px",
        }}
      >
        <div className="sheet">
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ width: 120 }}>
              <img src="/logo-aep.png" alt="AEP logo" style={{ width: 96, height: "auto", objectFit: "contain" }} />
            </div>
            <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 22, marginTop: 6 }}>
              {(doc.docTypeLabel && String(doc.docTypeLabel).trim()) || "เอกสารรับคืนสินค้า"}
            </div>
            <div style={{ width: 120 }} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>เลขที่เอกสารระบบ CN :</strong> {dash(doc.id)} <strong style={{ marginLeft: 16 }}>วันที่จัดทำเอกสาร :</strong> {formatDateThaiDateTime(doc.date)}
          </div>
          <div style={{ marginBottom: 8 }}><strong>เหตุผลการขอทำรายการ Credit Note :</strong> {dash(doc.reason)}</div>
          <div style={{ borderTop: "1px solid #cbd5e1", margin: "8px 0 12px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 28, rowGap: 8 }}>
            <div style={{ minWidth: 0, lineHeight: 1.55 }}>
              <strong>เลขที่เอกสาร :</strong> {dash(doc.refDoc)}
            </div>
            <div style={{ minWidth: 0, lineHeight: 1.55 }}>
              <strong>วันที่เอกสาร :</strong> {formatDateThaiLong(doc.date)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 28, rowGap: 8, marginTop: 4 }}>
            <div style={{ minWidth: 0, lineHeight: 1.55 }}>
              <strong>ใบสั่งซื้อ :</strong> {dash(doc.purchaseOrder)}
            </div>
            <div style={{ minWidth: 0, lineHeight: 1.55 }}>
              <strong>พนักงานขาย :</strong> {dash(doc.salespersonCode)} - {dash(doc.salesperson)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 28, rowGap: 8, marginTop: 4 }}>
            <div style={{ minWidth: 0, lineHeight: 1.55 }}>
              <strong>รหัสลูกค้า :</strong> {dash(doc.customerId)}
            </div>
            <div style={{ minWidth: 0, lineHeight: 1.55 }}>
              <strong>ชื่อลูกค้า :</strong> {dash(doc.customerName)}
            </div>
          </div>
          <div style={{ marginTop: 4, lineHeight: 1.55 }}><strong>ที่อยู่ลูกค้า :</strong> {dash(doc.customerAddress)}</div>
          <div style={{ marginTop: 4, lineHeight: 1.55 }}><strong>สถานที่จัดส่ง :</strong> {dash(doc.deliveryLocation)}</div>

          <div style={{ borderTop: "1px solid #cbd5e1", margin: "10px 0 8px" }} />

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ลำดับ", "รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "หน่วย", "ราคา/หน่วย", "ส่วนลด", "รวมเงิน", "ภาษี", "ล็อตผลิต", "หมายเหตุ"].map((h) => (
                  <th key={`p-${h}`} style={{ border: "1px solid #cbd5e1", padding: "6px 7px", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, i) => {
                const r = calcRow(item);
                return (
                  <tr key={`pi-${i}`}>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{i + 1}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{dash(item.code)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{dash(item.name)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{formatNum(item.qty)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{dash(item.unit)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{formatNum(item.price)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{item.discount ? `${formatNum(item.discount)}%` : "-"}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{formatNum(r.afterDisc)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{formatNum(r.taxAmt)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{dash(item.lot)}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 7px" }}>{dash(item.remark)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 8 }}>
            <strong>หมายเหตุ :</strong> {dash(doc.remark)}
          </div>
          <div style={{ marginTop: 3 }}>
            <strong>สถานะสินค้า :</strong> {dash(doc.status)}
          </div>
          <div style={{ marginTop: 3 }}>
            <strong>ระบุเหตุผล :</strong>{" "}
            {String(doc.status || "").trim() === "Rejected"
              ? dash(rejectedReason)
              : isCreatorClosedDoc
                ? dash(closedReason)
                : dash(doc.pendingHint) || "-"}
          </div>

          {docUsesReceiveDocumentPrintLayout(doc.docTypeId) ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 20 }}>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>ผู้รับ/คืนสินค้า</strong>......................................(แผนขนส่ง)
                </div>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>ผู้รับ/คืนสินค้า</strong>.............................................(ลูกค้า)
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 20 }}>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>คลังสินค้า</strong>........................................(ผู้รับคืนสินค้า)
                </div>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>ผู้อนุมัติ</strong>..................................................................
                </div>
              </div>
              <div style={{ textAlign: "center", marginBottom: 24, lineHeight: 2.05, whiteSpace: "nowrap" }}>
                <strong>ผู้อนุมัติ</strong>....................................................(manager)
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 60, marginBottom: 20 }}>
                <div>□ รับเข้าสต๊อก</div>
                <div>□ ไม่รับเข้าสต๊อก (แผนกสโตร์)</div>
                <div>□ ตามส่งสินค้า</div>
              </div>
              <div style={{ textAlign: "center", fontWeight: 700 }}>
                ** เอกสารสำคัญกรุณาส่งซองตัวบรรจุให้ครบทุกช่อง **
              </div>
            </div>
          ) : docUsesDeliveryFollowPrintLayout(doc.docTypeId) ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 20 }}>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>ผู้ส่งสินค้า</strong>........................................(แผนขนส่ง)
                </div>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>ผู้รับ/ส่งคืนสินค้า</strong>.......................................(ลูกค้า)
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 20 }}>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>คลังสินค้า</strong>........................................(ผู้จัดสินค้า)
                </div>
                <div style={{ lineHeight: 1.95, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "clip" }}>
                  <strong>ผู้อนุมัติ</strong>................................................................
                </div>
              </div>
              <div style={{ textAlign: "center", fontWeight: 700 }}>
                ** เอกสารสำคัญกรุณาส่งซองตัวบรรจุให้ครบทุกช่อง **
              </div>
            </div>
          ) : docUsesCNPriceSimplePrintLayout(doc.docTypeId) ? (
            <div style={{ marginTop: 80 }}>
              <div style={{ textAlign: "center", marginBottom: 20, lineHeight: 2.05, whiteSpace: "nowrap" }}>
                <strong>ผู้อนุมัติ</strong>.............................................(manager)
              </div>
              <div style={{ textAlign: "center", fontWeight: 700 }}>
                ** เอกสารสำคัญกรุณาส่งซองตัวบรรจุให้ครบทุกช่อง **
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              {chunkSteps(approvalSteps, 3).map((row, rowIdx) => (
                <div
                  key={`ps-row-${rowIdx}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 10,
                    marginTop: rowIdx === 0 ? 0 : 8,
                  }}
                >
                  {row.map((step) => {
                    const ap = approvalsByRole.get(step.role);
                    return (
                      <div key={`ps-${step.role}`} style={{ textAlign: "center", minHeight: 100, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                        {ap?.signaturePath ? (
                          <img
                            src={getUploadUrl(ap.signaturePath)}
                            alt={`print-sign-${step.role}`}
                            style={{ height: 34, width: "auto", maxWidth: "100%", objectFit: "contain", marginBottom: 4 }}
                          />
                        ) : (
                          <div style={{ height: 34 }} />
                        )}
                        <div style={{ fontWeight: 700 }}>{dash(ap?.name)}</div>
                        <div style={{ color: "#64748b" }}>{step.subtitle}</div>
                        <div style={{ color: "#64748b" }}>
                          {ap?.decisionAt ? formatApprovalDecisionAt(ap.decisionAt) : "วันที่ (....................)"}
                        </div>
                      </div>
                    );
                  })}
                  {row.length < 3 &&
                    Array.from({ length: 3 - row.length }).map((_, i) => (
                      <div key={`ps-empty-${rowIdx}-${i}`} />
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ pageBreakBefore: "always", marginTop: 18 }}>
          <div style={{ textAlign: "center", fontWeight: 800, fontSize: 18, marginBottom: 16 }}>
            เอกสารแนบ CN : {dash(doc.id)}
          </div>
          {attachments.length === 0 ? (
            <div style={{ marginTop: 16, color: "#64748b", textAlign: "center" }}>ไม่มีไฟล์แนบ</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: attachments.length === 1 ? "minmax(0, 520px)" : "repeat(2, minmax(0, 1fr))",
                gap: 16,
                marginTop: 12,
                marginLeft: "auto",
                marginRight: "auto",
                width: attachments.length === 1 ? "fit-content" : "100%",
                maxWidth: attachments.length === 1 ? 520 : 720,
                justifyContent: "center",
              }}
            >
              {attachments.map((file, i) => {
                const url = getUploadUrl(file.storagePath);
                const isImage = isImageAttachment(file.mimeType, file.storagePath);
                return (
                  <div key={`pa-${i}`} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 8, width: "100%" }}>
                    {isImage ? (
                      <img
                        src={url}
                        alt={file.fileName || "attachment"}
                        style={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 6, display: "block", margin: "0 auto" }}
                      />
                    ) : (
                      <div style={{ height: 140, display: "grid", placeItems: "center", background: "#f8fafc", borderRadius: 6, color: "#64748b" }}>ไฟล์แนบ</div>
                    )}
                    <div style={{ marginTop: 6, textAlign: "center" }}>{dash(file.fileName)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
