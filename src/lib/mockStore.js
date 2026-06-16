import { getUser, setUser } from "@/lib/cnAuth";
import {
  DOC_TYPE_CN_PRICE,
  DOC_TYPE_DELIVERY,
  DOC_TYPE_DN_PRICE,
  DOC_TYPE_FOLLOW_RETURN,
  DOC_TYPE_RETURN,
  MOCK_INVOICE_REFERENCES,
  MOCK_LOOKUPS,
  createSeedDocuments,
} from "@/lib/mockData";

const STORE_KEY = "cn_mock_store_v1";
const CREATOR_CLOSE_PREFIX = "ปิดเอกสารโดยผู้สร้าง:";

const APPROVE_ROLE_BY_ENDPOINT = {
  "approve-teamlead": "หัวหน้า",
  "approve-admin": "Admin",
  "approve-transportation": "transportation",
  "approve-warehouse": "warehouse",
  "approve-finance": "Finance",
};

const ROLE_TO_APPROVAL = {
  teamlead: "หัวหน้า",
  admin: "Admin",
  "admin system": "Admin",
  transportation: "transportation",
  warehouse: "warehouse",
  finance: "Finance",
};

const APPROVER_ROLES = new Set(["teamlead", "admin", "admin system", "transportation", "warehouse", "finance"]);

function normalizeRole(role) {
  const r = String(role || "").toLowerCase().trim();
  if (r === "team lead" || r === "หัวหน้า") return "teamlead";
  if (r === "admin_system" || r === "system admin") return "admin system";
  return r;
}

function delay(ms = 80) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadStore() {
  if (typeof window === "undefined") {
    return { documents: createSeedDocuments(), nextDocId: 9 };
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  const initial = { documents: createSeedDocuments(), nextDocId: 9 };
  localStorage.setItem(STORE_KEY, JSON.stringify(initial));
  return initial;
}

function saveStore(store) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }
}

function getCurrentEmployeeCode() {
  return String(getUser()?.employeeCode || "").trim();
}

function getCurrentRole() {
  return normalizeRole(getUser()?.roleLabel);
}

function findDoc(store, idOrNo) {
  const key = String(idOrNo || "").trim();
  return store.documents.find((d) => String(d.id) === key || d.docNo === key);
}

function approvalStepsForDocType(docTypeId) {
  const id = String(docTypeId || "").toLowerCase();
  if (id === DOC_TYPE_DELIVERY) return ["warehouse", "transportation", "หัวหน้า", "Admin"];
  if (id === DOC_TYPE_FOLLOW_RETURN) return ["พนักงานที่ขอ", "หัวหน้า", "Admin", "transportation", "warehouse"];
  if (id === DOC_TYPE_RETURN) return ["พนักงานที่ขอ", "หัวหน้า", "Admin", "transportation", "warehouse", "Finance"];
  if (id === DOC_TYPE_CN_PRICE || id === DOC_TYPE_DN_PRICE) return ["พนักงานที่ขอ", "หัวหน้า", "Admin", "Finance"];
  return ["พนักงานที่ขอ", "หัวหน้า", "Admin", "Finance"];
}

function prevStepApproved(steps, roleName, approvals) {
  const idx = steps.indexOf(roleName);
  if (idx <= 0) return true;
  const prev = approvals.find((a) => a.roleName === steps[idx - 1]);
  return prev?.decisionStatus === "Approved";
}

function userCanApproveDoc(doc, role) {
  const approvalRole = ROLE_TO_APPROVAL[role];
  if (!approvalRole) return false;
  const step = (doc.approvals || []).find((a) => a.roleName === approvalRole);
  if (!step || step.decisionStatus !== "Pending") return false;
  const steps = approvalStepsForDocType(doc.docTypeId);
  return prevStepApproved(steps, approvalRole, doc.approvals || []);
}

function refreshDocStatus(doc) {
  const approvals = doc.approvals || [];
  if (approvals.some((a) => a.decisionStatus === "Rejected")) {
    doc.status = "Rejected";
    doc.pendingHint = "";
    return;
  }
  const required = approvals.filter((a) => a.roleName !== "พนักงานที่ขอ");
  const allApproved = required.every((a) => a.decisionStatus === "Approved");
  if (allApproved && required.length > 0) {
    doc.status = "Approved";
    doc.pendingHint = "";
    return;
  }
  if (doc.status !== "Cancelled") {
    doc.status = "Pending Approval";
    const pending = required.find((a) => a.decisionStatus === "Pending");
    doc.pendingHint = pending ? `รอ ${pending.roleName} อนุมัติ` : "";
  }
}

function buildApprovalsForDocType(docTypeId, user) {
  const now = new Date().toISOString();
  const saleName = user?.fullName || "พนักงานขาย";
  const saleCode = user?.employeeCode || "EMP001";
  const id = String(docTypeId || "").toLowerCase();

  const saleStep = {
    roleName: "พนักงานที่ขอ",
    approverCode: saleCode,
    approverName: saleName,
    decisionStatus: "Approved",
    decisionAt: now,
    remark: "",
    signaturePath: user?.signaturePath || "",
  };

  if (id === DOC_TYPE_DELIVERY) {
    return [
      { roleName: "warehouse", approverCode: "EMP006", approverName: "สมศักดิ์ คลังสินค้า", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "transportation", approverCode: "EMP005", approverName: "ประเสริฐ ขนส่งดี", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "หัวหน้า", approverCode: "EMP002", approverName: "พิฐชญาณ์ จิรายุเกริกพัชร์ (แพร์)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "Admin", approverCode: "EMP003", approverName: "วรรณวิไล วิริยะกุลพานิช (หนิง)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
    ];
  }

  if (id === DOC_TYPE_RETURN) {
    return [
      saleStep,
      { roleName: "หัวหน้า", approverCode: "EMP002", approverName: "พิฐชญาณ์ จิรายุเกริกพัชร์ (แพร์)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "Admin", approverCode: "EMP003", approverName: "วรรณวิไล วิริยะกุลพานิช (หนิง)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "transportation", approverCode: "EMP005", approverName: "ประเสริฐ ขนส่งดี", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "warehouse", approverCode: "EMP006", approverName: "สมศักดิ์ คลังสินค้า", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "Finance", approverCode: "EMP004", approverName: "อัจฉรา สุขวัฒนา (ดิว)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
    ];
  }

  if (id === DOC_TYPE_FOLLOW_RETURN) {
    return [
      saleStep,
      { roleName: "หัวหน้า", approverCode: "EMP002", approverName: "พิฐชญาณ์ จิรายุเกริกพัชร์ (แพร์)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "Admin", approverCode: "EMP003", approverName: "วรรณวิไล วิริยะกุลพานิช (หนิง)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "transportation", approverCode: "EMP005", approverName: "ประเสริฐ ขนส่งดี", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
      { roleName: "warehouse", approverCode: "EMP006", approverName: "สมศักดิ์ คลังสินค้า", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
    ];
  }

  return [
    saleStep,
    { roleName: "หัวหน้า", approverCode: "EMP002", approverName: "พิฐชญาณ์ จิรายุเกริกพัชร์ (แพร์)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
    { roleName: "Admin", approverCode: "EMP003", approverName: "วรรณวิไล วิริยะกุลพานิช (หนิง)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
    { roleName: "Finance", approverCode: "EMP004", approverName: "อัจฉรา สุขวัฒนา (ดิว)", decisionStatus: "Pending", decisionAt: "", remark: "", signaturePath: "" },
  ];
}

export class MockApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "MockApiError";
    this.status = status;
  }
}

function sixMonthsAgoIso() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

export async function mockGetLookups() {
  await delay();
  return clone(MOCK_LOOKUPS);
}

export async function mockListDocuments(params = {}) {
  await delay();
  const store = loadStore();
  const role = getCurrentRole();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Number(params.pageSize) || 10);
  const q = String(params.q || "").trim().toLowerCase();
  const status = params.status && params.status !== "all" ? params.status : "";
  const docTypeId = params.docTypeId && params.docTypeId !== "all" ? params.docTypeId : "";
  const fromDate = String(params.fromDate || "").slice(0, 10);
  const awaitingMyApproval = params.awaitingMyApproval === "1" || params.awaitingMyApproval === true;

  let rows = [...store.documents];

  if (q) {
    rows = rows.filter((d) =>
      [d.docNo, d.customerName, d.customerId, d.salespersonName, d.referenceDocNo, d.reason]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  if (status) rows = rows.filter((d) => d.status === status);
  if (docTypeId) rows = rows.filter((d) => d.docTypeId === docTypeId);
  if (fromDate) rows = rows.filter((d) => String(d.docDate).slice(0, 10) >= fromDate);
  if (awaitingMyApproval) rows = rows.filter((d) => userCanApproveDoc(d, role));

  rows.sort((a, b) => String(b.docDate).localeCompare(String(a.docDate)));

  const summaryFrom = sixMonthsAgoIso();
  const statusSummary = { "Pending Approval": 0, Approved: 0, Rejected: 0, Cancelled: 0 };
  for (const d of store.documents) {
    if (String(d.docDate).slice(0, 10) >= summaryFrom && statusSummary[d.status] !== undefined) {
      statusSummary[d.status] += 1;
    }
  }

  const pendingMyApprovalCount = store.documents.filter((d) => userCanApproveDoc(d, role)).length;
  const start = (page - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);

  return {
    data: slice.map((doc) => ({
      id: doc.id,
      docNo: doc.docNo,
      docDate: doc.docDate,
      docType: doc.docType,
      docTypeId: doc.docTypeId,
      reason: doc.reason,
      customerId: doc.customerId,
      customerName: doc.customerName,
      referenceDocNo: doc.referenceDocNo,
      salesperson: doc.salespersonName,
      status: doc.status,
      pendingHint: doc.pendingHint || "",
    })),
    hasMore: start + pageSize < rows.length,
    statusSummary,
    summaryFromDate: summaryFrom,
    pendingMyApprovalCount,
    canApprove: APPROVER_ROLES.has(role),
  };
}

export async function mockGetDocument(idOrNo) {
  await delay();
  const store = loadStore();
  const doc = findDoc(store, idOrNo);
  if (!doc) {
    throw new MockApiError("ไม่พบเอกสาร", 404);
  }
  return clone(doc);
}

export async function mockGetSaleInvoiceReference(invoiceNo) {
  await delay();
  const key = String(invoiceNo || "").trim();
  if (!key) {
    throw new MockApiError("กรุณาระบุเลขที่เอกสารอ้างอิง", 400);
  }
  const hit = MOCK_INVOICE_REFERENCES[key];
  if (hit) return clone(hit);
  if (/^(SI|INV)/i.test(key)) {
    return {
      invoiceNo: key,
      teamLeadBill: "TL-MOCK",
      salespersonCode: "EMP001",
      date: new Date().toISOString().slice(0, 10),
      salesperson: "สมชาย ใจดี",
      customerId: "C-MOCK",
      customerName: "ลูกค้าตัวอย่าง (Mock)",
      customerAddress: "ที่อยู่ตัวอย่าง กรุงเทพฯ",
      deliveryLocation: "คลังสินค้าหลัก",
      remark: "ข้อมูล mock สำหรับทดสอบ",
      items: [
        { no: 1, code: "MOCK001", name: "สินค้าตัวอย่าง A", qty: 10, unit: "ชิ้น", price: 100, discount: 0, tax: 7, lot: "LOT-MOCK", remark: "" },
        { no: 2, code: "MOCK002", name: "สินค้าตัวอย่าง B", qty: 5, unit: "กล่อง", price: 250, discount: 5, tax: 7, lot: "LOT-MOCK-2", remark: "" },
      ],
    };
  }
  throw new MockApiError("ไม่พบเอกสารอ้างอิง", 404);
}

export async function mockCreateDocument(payload, imageFiles = []) {
  await delay(120);
  const store = loadStore();
  const user = getUser();
  const docType = MOCK_LOOKUPS.docTypes.find((t) => t.id === payload.docTypeId);
  const reason = MOCK_LOOKUPS.reasons.find((r) => r.id === payload.reasonId);
  const items = (payload.items || []).map((it, idx) => ({
    lineNo: idx + 1,
    productCode: it.productCode,
    productName: it.productName,
    quantity: it.quantity,
    unitName: it.unitName,
    unitPrice: it.unitPrice,
    discountPercent: it.discountPercent,
    taxPercent: it.taxPercent,
    lotNo: it.lotNo || "",
    remark: it.remark || "",
  }));

  let subtotal = 0;
  let tax = 0;
  for (const it of items) {
    const line = Number(it.quantity) * Number(it.unitPrice);
    const afterDisc = line * (1 - Number(it.discountPercent || 0) / 100);
    const taxAmt = afterDisc * (Number(it.taxPercent || 0) / 100);
    subtotal += afterDisc;
    tax += taxAmt;
  }

  const id = store.nextDocId++;
  const year = new Date().getFullYear();
  const docNo = `CN-${year}-${String(id).padStart(4, "0")}`;
  const attachments = [];

  for (const file of imageFiles) {
    if (file instanceof File || (file && file.name)) {
      const dataUrl = await readFileAsDataUrl(file);
      attachments.push({
        id: `att-${id}-${attachments.length + 1}`,
        fileName: file.name || "image.jpg",
        mimeType: file.type || "image/jpeg",
        storagePath: dataUrl,
      });
    }
  }

  const doc = {
    id,
    docNo,
    docDate: payload.docDate,
    docTypeId: payload.docTypeId,
    docType: docType?.label || "",
    reason: reason?.label || payload.reasonId || "",
    reasonId: payload.reasonId,
    status: "Pending Approval",
    pendingHint: "รอหัวหน้าอนุมัติ",
    referenceDocNo: payload.referenceDocNo,
    salespersonCode: payload.salespersonCode || user?.employeeCode || "EMP001",
    salespersonName: payload.salesperson || user?.fullName || "",
    customerId: payload.customerId || "",
    customerName: payload.customerName || "",
    purchaseOrderNo: "",
    customerAddress: payload.customerAddress || "",
    deliveryLocation: payload.deliveryLocation || "",
    remark: payload.remark || "",
    ownerEmployeeCode: user?.employeeCode || "EMP001",
    items,
    approvals: buildApprovalsForDocType(payload.docTypeId, user),
    attachments,
    subtotalAmount: subtotal,
    taxAmount: tax,
    totalAmount: subtotal + tax,
  };

  refreshDocStatus(doc);
  store.documents.unshift(doc);
  saveStore(store);
  return { id: doc.id, docNo: doc.docNo };
}

export async function mockGetEmployeeProfile() {
  await delay();
  return clone(getUser());
}

export async function mockUpdateEmployeeProfile({ fullName }) {
  await delay();
  setUser({ fullName: String(fullName || "").trim() });
  return clone(getUser());
}

export async function mockUploadSignature(file) {
  await delay(150);
  const dataUrl = await readFileAsDataUrl(file);
  setUser({ signaturePath: dataUrl });
  return { signaturePath: dataUrl };
}

export async function mockApproveDocument(idOrNo, endpointSegment, remark = "") {
  await delay();
  const roleName = APPROVE_ROLE_BY_ENDPOINT[endpointSegment];
  if (!roleName) throw new MockApiError("คำขอไม่ถูกต้อง", 400);

  const store = loadStore();
  const doc = findDoc(store, idOrNo);
  if (!doc) throw new MockApiError("ไม่พบเอกสาร", 404);

  const userRole = getCurrentRole();
  const expectedRole = Object.entries(ROLE_TO_APPROVAL).find(([, v]) => v === roleName)?.[0];
  if (expectedRole && userRole !== expectedRole && !(expectedRole === "admin" && userRole === "admin system")) {
    throw new MockApiError("ไม่มีสิทธิ์อนุมัติเอกสารนี้", 403);
  }

  const step = (doc.approvals || []).find((a) => a.roleName === roleName);
  if (!step || step.decisionStatus !== "Pending") {
    throw new MockApiError("ไม่มีสิทธิ์อนุมัติเอกสารนี้", 403);
  }

  const steps = approvalStepsForDocType(doc.docTypeId);
  if (!prevStepApproved(steps, roleName, doc.approvals)) {
    throw new MockApiError("ยังไม่ถึงขั้นตอนการอนุมัติของคุณ", 403);
  }

  const profile = getUser();
  step.decisionStatus = "Approved";
  step.decisionAt = new Date().toISOString();
  step.remark = String(remark || "").trim();
  step.approverCode = profile.employeeCode;
  step.approverName = profile.fullName;
  step.signaturePath = profile.signaturePath || "";

  refreshDocStatus(doc);
  saveStore(store);
  return { ok: true };
}

export async function mockRejectDocument(idOrNo, remark) {
  await delay();
  const store = loadStore();
  const doc = findDoc(store, idOrNo);
  if (!doc) throw new MockApiError("ไม่พบเอกสาร", 404);

  const role = getCurrentRole();
  const roleName = ROLE_TO_APPROVAL[role];
  if (!roleName) throw new MockApiError("ไม่มีสิทธิ์ไม่อนุมัติเอกสารนี้", 403);

  const step = (doc.approvals || []).find((a) => a.roleName === roleName && a.decisionStatus === "Pending");
  if (!step) throw new MockApiError("ไม่มีสิทธิ์ไม่อนุมัติเอกสารนี้", 403);

  const profile = getUser();
  step.decisionStatus = "Rejected";
  step.decisionAt = new Date().toISOString();
  step.remark = String(remark || "").trim();
  step.approverCode = profile.employeeCode;
  step.approverName = profile.fullName;

  refreshDocStatus(doc);
  saveStore(store);
  return { ok: true };
}

export async function mockCloseDocument(idOrNo, remark) {
  await delay();
  const store = loadStore();
  const doc = findDoc(store, idOrNo);
  if (!doc) throw new MockApiError("ไม่พบเอกสาร", 404);

  const code = getCurrentEmployeeCode();
  if (String(doc.ownerEmployeeCode) !== code) {
    throw new MockApiError("มีสิทธิ์เฉพาะผู้สร้างเอกสาร", 403);
  }
  if (doc.status !== "Pending Approval") {
    throw new MockApiError("ไม่สามารถปิดเอกสารได้", 400);
  }

  doc.status = "Cancelled";
  doc.pendingHint = "";
  doc.remark = `${CREATOR_CLOSE_PREFIX}${String(remark || "").trim()}`;
  saveStore(store);
  return { ok: true };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

/** รีเซ็ตข้อมูล mock กลับเป็นค่าเริ่มต้น */
export function resetMockStore() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORE_KEY);
  }
}
