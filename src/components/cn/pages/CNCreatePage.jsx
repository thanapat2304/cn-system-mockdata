"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { G, baseInput, calcRow, formatDateThaiLong, formatNum } from "../shared";
import { mockCreateDocument, mockGetLookups, mockGetSaleInvoiceReference } from "@/lib/cnApi";

const tealBtn = {
  background: "#0d9488",
  color: "#fff",
  border: "none",
  borderRadius: 0,
  padding: "0 20px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
};

const btnSaveGreen = {
  background: G.success,
  color: "#fff",
  border: "none",
  borderRadius: G.radiusSm,
  padding: "10px 28px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnCancelRedOutline = {
  background: "#fff",
  color: G.danger,
  border: `1px solid ${G.danger}`,
  borderRadius: G.radiusSm,
  padding: "10px 28px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const sectionCard = {
  background: G.surface,
  border: `1px solid ${G.border}`,
  borderRadius: G.radius,
  padding: "22px 24px",
  marginBottom: 18,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: G.text,
  margin: "0 0 18px 0",
  letterSpacing: -0.2,
};

const readOnlyField = {
  background: "#f1f5f9",
  border: `1px solid ${G.border}`,
  borderRadius: G.radiusSm,
  padding: "10px 12px",
  fontSize: 13,
  color: G.textDim,
  minHeight: 40,
  lineHeight: 1.45,
  boxSizing: "border-box",
};

function dash(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s || "—";
}

/** YYYY-MM-DD → แสดง dd/mm/yyyy (ค.ศ.) */
function isoToDmy(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * วัน/เดือน/ปี — รับปี พ.ศ. (≥ 2400 แปลงเป็น ค.ศ.) หรือ ค.ศ.
 * คืน YYYY-MM-DD หรือ null
 */
function dmyToIso(text) {
  const t = String(text).trim();
  if (!t) return null;
  const parts = t.split(/[/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return null;
  let d = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  let y = parseInt(parts[2], 10);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
  if (y >= 2400) y -= 543;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function Req({ children }) {
  return (
    <span style={{ color: G.danger, marginLeft: 2 }} aria-hidden>
      *
    </span>
  );
}

function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>
      {children}
      {required ? <Req /> : null}
    </div>
  );
}

export default function CNCreatePage({ setPage }) {
  const initialDocDate = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    type: "",
    reason: "",
    remark: "",
    refDoc: "",
  });
  const [dateDmy, setDateDmy] = useState(() => isoToDmy(initialDocDate));
  const [refData, setRefData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [qtyOverride, setQtyOverride] = useState({});
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedDocNo, setSavedDocNo] = useState("");
  const [docTypes, setDocTypes] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupError, setLookupError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLookupLoading(true);
      setLookupError("");
      try {
        const data = await mockGetLookups();
        if (!cancelled) {
          setDocTypes(Array.isArray(data.docTypes) ? data.docTypes : []);
          setReasons(Array.isArray(data.reasons) ? data.reasons : []);
        }
      } catch {
        if (!cancelled) setLookupError("ไม่สามารถโหลดตัวเลือกฟอร์มได้");
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function referenceInvoiceNo() {
    return form.refDoc.trim();
  }

  async function checkRef() {
    const invoiceNo = referenceInvoiceNo();
    if (!invoiceNo) {
      setErrors((e) => ({ ...e, refDoc: "กรุณากรอกเลขที่เอกสารอ้างอิง" }));
      return;
    }
    setLoading(true);
    setRefData(null);
    setSelectedItems({});
    setQtyOverride({});
    try {
      const data = await mockGetSaleInvoiceReference(invoiceNo);
      setRefData({
        invoiceNo: data.invoiceNo,
        teamLeadBill: data.teamLeadBill || "",
        salespersonCode: data.salespersonCode || "",
        date: data.date,
        salesperson: data.salesperson || "",
        customerId: data.customerId || "",
        customerName: data.customerName || "",
        customerAddress: data.customerAddress || "",
        deliveryLocation: data.deliveryLocation || "",
        remark: data.remark || "",
        items: (data.items || []).map((it) => ({
          no: it.no,
          code: it.code,
          name: it.name,
          qty: it.qty,
          unit: it.unit,
          price: it.price,
          discount: it.discount ?? 0,
          tax: it.tax ?? 7,
          lot: it.lot ?? "",
          remark: it.remark ?? "",
        })),
      });
      setErrors((e) => {
        const next = { ...e };
        delete next.refDoc;
        return next;
      });
    } catch (err) {
      setErrors((e) => ({ ...e, refDoc: err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล" }));
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(i) {
    setSelectedItems((s) => ({ ...s, [i]: !s[i] }));
    if (!qtyOverride[i] && refData) setQtyOverride((q) => ({ ...q, [i]: refData.items[i].qty }));
  }

  function updateItemRemark(index, remark) {
    setRefData((rd) => {
      if (!rd) return rd;
      const items = rd.items.map((it, j) => (j === index ? { ...it, remark } : it));
      return { ...rd, items };
    });
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setImages((imgs) => [...imgs, { file, name: file.name, url: ev.target.result, type: file.type, size: file.size }]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function validate() {
    const e = {};
    if (!dmyToIso(dateDmy.trim())) e.date = "กรุณากรอกวันที่ให้ถูกต้อง (วัน/เดือน/ปี — ปี พ.ศ. หรือ ค.ศ.)";
    if (!form.type) e.type = "กรุณาเลือกประเภทเอกสาร";
    if (!form.reason) e.reason = "กรุณาเลือกเหตุผล";
    if (!refData) e.refDoc = "กรุณาตรวจสอบเอกสารอ้างอิงก่อน";
    if (!Object.values(selectedItems).some(Boolean)) e.items = "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ";
    if (images.length === 0) e.images = "กรุณาแนบรูปภาพ";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitToBackend() {
    if (!validate()) return;

    const docDate = dmyToIso(dateDmy.trim());
    if (!docDate) return;

    const selectedPayloadItems = refData.items
      .map((item, i) => ({ item, i }))
      .filter(({ i }) => !!selectedItems[i])
      .map(({ item, i }) => {
        const qty = Number(qtyOverride[i] ?? item.qty);
        return {
          productCode: item.code,
          productName: item.name,
          quantity: qty,
          unitName: item.unit,
          unitPrice: Number(item.price),
          discountPercent: Number(item.discount ?? 0),
          taxPercent: Number(item.tax ?? 7),
          lotNo: item.lot ?? "",
          remark: item.remark ?? "",
        };
      });

    const payload = {
      docDate,
      docTypeId: form.type,
      reasonId: form.reason,
      referenceDocNo: referenceInvoiceNo(),
      remark: form.remark,
      customerId: refData?.customerId || "",
      customerName: refData?.customerName || "",
      salespersonCode: refData?.salespersonCode || "",
      salesperson: refData?.salesperson || "",
      customerAddress: refData?.customerAddress || "",
      deliveryLocation: refData?.deliveryLocation || "",
      items: selectedPayloadItems,
    };

    const imageFiles = images.map((img) => img.file).filter(Boolean);

    setSubmitting(true);
    setSaveError("");
    try {
      const data = await mockCreateDocument(payload, imageFiles);
      setSavedDocNo(data?.docNo || "");
      setSaved(true);
    } catch (err) {
      setSaveError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", color: G.text }}>
        <div style={{ textAlign: "center" }}>
          <h2>บันทึกเอกสารสำเร็จ</h2>
          {savedDocNo && <p style={{ marginBottom: 12 }}>เลขที่เอกสาร: {savedDocNo}</p>}
          <button type="button" style={{ ...btnSaveGreen, borderRadius: G.radiusSm }} onClick={() => setPage("list")}>
            กลับหน้ารายการ
          </button>
        </div>
      </div>
    );
  }

  const grid2 = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px 32px",
  };

  return (
    <div style={{ padding: "24px 20px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button
          type="button"
          style={{ background: "none", border: "none", color: G.accent, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: 13 }}
          onClick={() => setPage("list")}
        >
          ← รายการเอกสาร
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: G.text, margin: 0 }}>สร้างเอกสาร CN ใหม่</h1>
      </div>

      {/* —— ข้อมูลการจัดทำเอกสาร —— */}
      <div style={sectionCard}>
        <h2 style={sectionTitle}>ข้อมูลการจัดทำเอกสาร</h2>
        <div style={grid2}>
          <div>
            <FieldLabel required>วันที่เอกสาร</FieldLabel>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="วัน/เดือน/ปี เช่น 10/05/2569 หรือ 10/05/2026"
              value={dateDmy}
              onChange={(e) => {
                setDateDmy(e.target.value);
                setErrors((er) => {
                  const n = { ...er };
                  delete n.date;
                  return n;
                });
              }}
              onBlur={() => {
                const iso = dmyToIso(dateDmy.trim());
                if (iso) {
                  setDateDmy(isoToDmy(iso));
                } else if (dateDmy.trim()) {
                  setErrors((er) => ({ ...er, date: "รูปแบบวันที่ไม่ถูกต้อง" }));
                }
              }}
              style={{ ...baseInput, width: "100%" }}
            />
            {errors.date && <div style={{ color: G.danger, fontSize: 12, marginTop: 6 }}>{errors.date}</div>}
          </div>
          <div>
            <FieldLabel required>ประเภทเอกสาร</FieldLabel>
            <select
              value={form.type}
              disabled={lookupLoading}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              style={{ ...baseInput, width: "100%" }}
            >
              <option value="">{lookupLoading ? "-- กำลังโหลด..." : "-- เลือกประเภทเอกสาร --"}</option>
              {docTypes.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
            {lookupError && <div style={{ color: G.danger, fontSize: 12, marginTop: 6 }}>{lookupError}</div>}
            {errors.type && <div style={{ color: G.danger, fontSize: 12, marginTop: 6 }}>{errors.type}</div>}
          </div>

          <div>
            <FieldLabel required>เหตุผลการขอทำ</FieldLabel>
            <select
              value={form.reason}
              disabled={lookupLoading}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              style={{ ...baseInput, width: "100%" }}
            >
              <option value="">{lookupLoading ? "-- กำลังโหลด..." : "-- เลือกเหตุผล --"}</option>
              {reasons.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label}
                </option>
              ))}
            </select>
            {errors.reason && <div style={{ color: G.danger, fontSize: 12, marginTop: 6 }}>{errors.reason}</div>}
          </div>

          <div>
            <FieldLabel required>แนบไฟล์รูปภาพ</FieldLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ ...baseInput, width: "auto", cursor: "pointer" }}>
                Choose Files
              </button>
              <span style={{ fontSize: 12, color: G.textMuted }}>{images.length ? `${images.length} ไฟล์` : "ยังไม่ได้เลือกไฟล์"}</span>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleFiles} />
            </div>
            {errors.images && <div style={{ color: G.danger, fontSize: 12, marginTop: 6 }}>{errors.images}</div>}
            {images.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                {images.map((img, i) => (
                  <Image key={i} src={img.url} alt={img.name} width={72} height={72} unoptimized style={{ borderRadius: 8, border: `1px solid ${G.border}` }} />
                ))}
              </div>
            )}
          </div>

          <div>
            <FieldLabel required>เอกสารอ้างอิง</FieldLabel>
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderRadius: G.radiusSm,
                overflow: "hidden",
                border: `1px solid ${errors.refDoc ? G.danger : G.border}`,
                maxWidth: 520,
              }}
            >
              <input
                value={form.refDoc}
                onChange={(e) => setForm((f) => ({ ...f, refDoc: e.target.value }))}
                placeholder="ตัวอย่าง: SI2605010001"
                style={{
                  flex: 1,
                  border: "none",
                  padding: "10px 12px",
                  fontSize: 13,
                  fontFamily: "inherit",
                  outline: "none",
                  minWidth: 120,
                }}
              />
              <button type="button" onClick={checkRef} disabled={loading} style={tealBtn}>
                {loading ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
              </button>
            </div>
            {errors.refDoc && <div style={{ color: G.danger, fontSize: 12, marginTop: 6 }}>{errors.refDoc}</div>}
          </div>
        </div>
      </div>

      {/* —— ข้อมูลเอกสารอ้างอิง —— */}
      {refData && (
        <div style={sectionCard}>
          <h2 style={sectionTitle}>ข้อมูลเอกสารอ้างอิง</h2>
          <div style={grid2}>
            <div>
              <FieldLabel>วันที่เอกสาร</FieldLabel>
              <div style={readOnlyField}>{formatDateThaiLong(refData.date)}</div>
            </div>
            <div>
              <FieldLabel>พนักงานขาย</FieldLabel>
              <div style={readOnlyField}>{dash(refData.salesperson)}</div>
            </div>
            <div>
              <FieldLabel>รหัสลูกค้า</FieldLabel>
              <div style={readOnlyField}>{dash(refData.customerId)}</div>
            </div>
            <div>
              <FieldLabel>ชื่อลูกค้า</FieldLabel>
              <div style={readOnlyField}>{dash(refData.customerName)}</div>
            </div>
            <div>
              <FieldLabel>ที่อยู่ลูกค้า</FieldLabel>
              <div style={{ ...readOnlyField, minHeight: 56 }}>{dash(refData.customerAddress)}</div>
            </div>
            <div>
              <FieldLabel>หมายเหตุ (จากเอกสาร)</FieldLabel>
              <div style={readOnlyField}>{dash(refData.remark)}</div>
            </div>
            <div>
              <FieldLabel>สถานที่จัดส่ง</FieldLabel>
              <div style={readOnlyField}>{dash(refData.deliveryLocation)}</div>
            </div>
          </div>

          <div style={{ overflowX: "auto", marginTop: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  {[
                    "เลือก",
                    "รหัสสินค้า",
                    "ชื่อสินค้า",
                    "จำนวน",
                    "หน่วย",
                    "ราคา/หน่วย",
                    "ส่วนลด",
                    "รวมเงิน",
                    "ภาษี",
                    "ล็อตผลิต",
                    "หมายเหตุ",
                  ].map((h) => (
                    <th key={h} style={{ padding: "10px 8px", fontSize: 11, fontWeight: 700, color: G.textDim, textAlign: "left", whiteSpace: "nowrap", borderBottom: `1px solid ${G.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {refData.items.map((item, i) => {
                  const qty = Number(qtyOverride[i] ?? item.qty);
                  const row = calcRow({ ...item, qty });
                  const qtyStr = qty.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  const discStr = item.discount > 0 ? `${formatNum(item.discount)}%` : "—";
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${G.border}`, background: i % 2 ? "#fafafa" : "#fff" }}>
                      <td style={{ padding: "8px", verticalAlign: "middle" }}>
                        <input type="checkbox" checked={!!selectedItems[i]} onChange={() => toggleItem(i)} aria-label={`เลือก ${item.code}`} />
                      </td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.text, whiteSpace: "nowrap" }}>{item.code}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.text, maxWidth: 280 }}>{item.name}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.text, whiteSpace: "nowrap" }}>{qtyStr}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.text }}>{item.unit}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.text, whiteSpace: "nowrap" }}>{formatNum(item.price)}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.textMuted }}>{discStr}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.text, whiteSpace: "nowrap", fontWeight: 600 }}>{formatNum(row.total)}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.text, whiteSpace: "nowrap" }}>{formatNum(row.taxAmt)}</td>
                      <td style={{ padding: "8px", fontSize: 12, color: G.textMuted, whiteSpace: "nowrap" }}>{dash(item.lot)}</td>
                      <td style={{ padding: "6px", minWidth: 120 }}>
                        <input
                          value={item.remark ?? ""}
                          onChange={(e) => updateItemRemark(i, e.target.value)}
                          placeholder="หมายเหตุ"
                          style={{
                            ...baseInput,
                            padding: "6px 8px",
                            fontSize: 12,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {errors.items && <div style={{ color: G.danger, fontSize: 12, marginTop: 10 }}>{errors.items}</div>}
        </div>
      )}

      {refData && (
        <div style={sectionCard}>
          <FieldLabel>หมายเหตุ</FieldLabel>
          <textarea
            value={form.remark}
            onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
            placeholder="หมายเหตุเพิ่มเติม"
            rows={3}
            style={{
              ...baseInput,
              width: "100%",
              resize: "vertical",
              minHeight: 72,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
            <button type="button" style={btnCancelRedOutline} onClick={() => setPage("list")}>
              ยกเลิก
            </button>
            <button type="button" style={btnSaveGreen} onClick={submitToBackend} disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
          {saveError && <div style={{ color: G.danger, fontSize: 12, marginTop: 12, textAlign: "right" }}>{saveError}</div>}
        </div>
      )}

      {!refData && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" style={btnCancelRedOutline} onClick={() => setPage("list")}>
            ยกเลิก
          </button>
        </div>
      )}
    </div>
  );
}
