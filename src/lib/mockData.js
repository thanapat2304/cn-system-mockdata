/** Doc type IDs — align with CNDetailPage / backend */
export const DOC_TYPE_CN_PRICE = "d1e7c38d-85b1-4ac3-b4b3-d8a8bc43d82a";
export const DOC_TYPE_DN_PRICE = "82ed8db6-3fca-40f6-aff7-b20772d2f7d1";
export const DOC_TYPE_RETURN = "b7e9d4f2-6c8a-4e3b-a1f5-9d2e8c7b4a60";
export const DOC_TYPE_FOLLOW_RETURN = "a3f2c9e1-5d8b-42e7-a4c6-91b0e8f7d6c5";
export const DOC_TYPE_DELIVERY = "f7e2b8c4-1a9d-4e63-b5d0-8c2f4e6a9b1d";

export const DEMO_USER = {
  loginId: "sale01",
  employeeCode: "EMP001",
  fullName: "สมชาย ใจดี",
  roleLabel: "sale",
  signaturePath: "",
};

export const MOCK_LOOKUPS = {
  docTypes: [
    { id: DOC_TYPE_CN_PRICE, label: "เอกสาร CN ราคาสินค้า" },
    { id: DOC_TYPE_DN_PRICE, label: "เอกสาร DN ราคาสินค้า" },
    { id: DOC_TYPE_RETURN, label: "เอกสารรับคืนสินค้า" },
    { id: DOC_TYPE_FOLLOW_RETURN, label: "เอกสารตามเปลี่ยน - รับคืนสินค้า" },
    { id: DOC_TYPE_DELIVERY, label: "เอกสารตามส่งสินค้า" },
  ],
  reasons: [
    { id: "reason-damage", label: "สินค้าชำรุด" },
    { id: "reason-expired", label: "สินค้าหมดอายุ" },
    { id: "reason-short", label: "ขาดส่งสินค้า" },
    { id: "reason-wrong", label: "ส่งสินค้าผิด" },
  ],
};

const SAMPLE_ITEMS = [
  {
    lineNo: 1,
    productCode: "GMC0005",
    productName: "(61871)French Wheat Flour(T55) 25kgs.",
    quantity: 24,
    unitName: "bag",
    unitPrice: 120,
    discountPercent: 5,
    taxPercent: 7,
    lotNo: "LOT-240110-A",
    remark: "ขวดแตก 12 ใบ",
  },
  {
    lineNo: 2,
    productCode: "SGA0002",
    productName: "Barry 44% Chocolate Bar 300(Stick)15x1.6kg",
    quantity: 48,
    unitName: "box",
    unitPrice: 85,
    discountPercent: 10,
    taxPercent: 7,
    lotNo: "LOT-240112-C",
    remark: "กล่องบุบ",
  },
];

function priceFlowApprovals(partial = {}) {
  return [
    { roleName: "พนักงานที่ขอ", approverCode: "EMP001", approverName: "สมชาย ใจดี", decisionStatus: "Approved", decisionAt: "2024-01-15T10:00:00", remark: "ยืนยันสินค้าชำรุดจริง", signaturePath: "" },
    { roleName: "หัวหน้า", approverCode: "EMP002", approverName: "พิฐชญาณ์ จิรายุเกริกพัชร์ (แพร์)", decisionStatus: partial.teamlead || "Pending", decisionAt: partial.teamlead === "Approved" ? "2024-01-16T10:00:00" : "", remark: partial.teamlead === "Approved" ? "อนุมัติ ตรวจสอบแล้ว" : "", signaturePath: "" },
    { roleName: "Admin", approverCode: "EMP003", approverName: "วรรณวิไล วิริยะกุลพานิช (หนิง)", decisionStatus: partial.admin || "Pending", decisionAt: partial.admin === "Approved" ? "2024-01-17T10:00:00" : "", remark: "", signaturePath: "" },
    { roleName: "Finance", approverCode: "EMP004", approverName: "อัจฉรา สุขวัฒนา (ดิว)", decisionStatus: partial.finance || "Pending", decisionAt: partial.finance === "Approved" ? "2024-01-18T10:00:00" : "", remark: partial.finance === "Approved" ? "ออก CN เรียบร้อย" : "", signaturePath: "" },
  ];
}

function returnFlowApprovals(partial = {}) {
  return [
    { roleName: "พนักงานที่ขอ", approverCode: "EMP001", approverName: "สมชาย ใจดี", decisionStatus: "Approved", decisionAt: "2024-01-18T09:00:00", remark: "", signaturePath: "" },
    { roleName: "หัวหน้า", approverCode: "EMP002", approverName: "พิฐชญาณ์ จิรายุเกริกพัชร์ (แพร์)", decisionStatus: partial.teamlead || "Pending", decisionAt: "", remark: "", signaturePath: "" },
    { roleName: "Admin", approverCode: "EMP003", approverName: "วรรณวิไล วิริยะกุลพานิช (หนิง)", decisionStatus: partial.admin || "Pending", decisionAt: "", remark: "", signaturePath: "" },
    { roleName: "transportation", approverCode: "EMP005", approverName: "ประเสริฐ ขนส่งดี", decisionStatus: partial.transportation || "Pending", decisionAt: "", remark: "", signaturePath: "" },
    { roleName: "warehouse", approverCode: "EMP006", approverName: "สมศักดิ์ คลังสินค้า", decisionStatus: partial.warehouse || "Pending", decisionAt: "", remark: "", signaturePath: "" },
    { roleName: "Finance", approverCode: "EMP004", approverName: "อัจฉรา สุขวัฒนา (ดิว)", decisionStatus: partial.finance || "Pending", decisionAt: "", remark: "", signaturePath: "" },
  ];
}

function deliveryFlowApprovals(partial = {}) {
  return [
    { roleName: "warehouse", approverCode: "EMP006", approverName: "สมศักดิ์ คลังสินค้า", decisionStatus: partial.warehouse || "Pending", decisionAt: partial.warehouse === "Approved" ? "2024-02-05T10:00:00" : "", remark: "", signaturePath: "" },
    { roleName: "transportation", approverCode: "EMP005", approverName: "ประเสริฐ ขนส่งดี", decisionStatus: partial.transportation || "Pending", decisionAt: partial.transportation === "Approved" ? "2024-02-06T10:00:00" : "", remark: "", signaturePath: "" },
    { roleName: "หัวหน้า", approverCode: "EMP002", approverName: "พิฐชญาณ์ จิรายุเกริกพัชร์ (แพร์)", decisionStatus: partial.teamlead || "Pending", decisionAt: partial.teamlead === "Approved" ? "2024-02-07T10:00:00" : "", remark: "", signaturePath: "" },
    { roleName: "Admin", approverCode: "EMP003", approverName: "วรรณวิไล วิริยะกุลพานิช (หนิง)", decisionStatus: partial.admin || "Pending", decisionAt: partial.admin === "Approved" ? "2024-02-08T10:00:00" : "", remark: "", signaturePath: "" },
  ];
}

function calcAmounts(items) {
  let subtotal = 0;
  let tax = 0;
  for (const it of items) {
    const qty = Number(it.quantity || 0);
    const price = Number(it.unitPrice || 0);
    const disc = Number(it.discountPercent || 0);
    const taxPct = Number(it.taxPercent || 0);
    const line = qty * price;
    const afterDisc = line * (1 - disc / 100);
    const taxAmt = afterDisc * (taxPct / 100);
    subtotal += afterDisc;
    tax += taxAmt;
  }
  return { subtotalAmount: subtotal, taxAmount: tax, totalAmount: subtotal + tax };
}

function buildDoc({
  id,
  docNo,
  docDate,
  docTypeId,
  docType,
  reason,
  reasonId,
  status,
  customerId,
  customerName,
  referenceDocNo,
  salesperson,
  salespersonCode,
  ownerEmployeeCode,
  approvals,
  items = SAMPLE_ITEMS,
  remark = "",
  pendingHint = "",
}) {
  const amounts = calcAmounts(items);
  return {
    id,
    docNo,
    docDate,
    docTypeId,
    docType,
    reason,
    reasonId: reasonId || "reason-damage",
    status,
    pendingHint,
    referenceDocNo,
    salespersonCode: salespersonCode || "EMP001",
    salespersonName: salesperson,
    customerId,
    customerName,
    purchaseOrderNo: "PO-2024-0033",
    customerAddress: "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    deliveryLocation: "คลังสินค้า A อาคาร 2 ชั้น 1",
    remark,
    ownerEmployeeCode: ownerEmployeeCode || "EMP001",
    items,
    approvals,
    attachments: [],
    ...amounts,
  };
}

export function createSeedDocuments() {
  return [
    buildDoc({
      id: 1,
      docNo: "CN-2024-0001",
      docDate: "2024-01-15",
      docTypeId: DOC_TYPE_CN_PRICE,
      docType: "เอกสาร CN ราคาสินค้า",
      reason: "สินค้าชำรุด",
      status: "Approved",
      customerId: "C001",
      customerName: "บริษัท เอบีซี จำกัด",
      referenceDocNo: "INV-2024-0045",
      salesperson: "สมชาย ใจดี",
      approvals: priceFlowApprovals({ teamlead: "Approved", admin: "Approved", finance: "Approved" }),
      remark: "กรุณาออกเอกสาร CN ภายใน 7 วันทำการ",
    }),
    buildDoc({
      id: 2,
      docNo: "CN-2024-0002",
      docDate: "2024-01-18",
      docTypeId: DOC_TYPE_RETURN,
      docType: "เอกสารรับคืนสินค้า",
      reason: "สินค้าหมดอายุ",
      status: "Pending Approval",
      pendingHint: "รอหัวหน้าอนุมัติ",
      customerId: "C002",
      customerName: "ห้างหุ้นส่วน เดลต้า",
      referenceDocNo: "INV-2024-0038",
      salesperson: "วิภา รักงาน",
      approvals: returnFlowApprovals(),
    }),
    buildDoc({
      id: 3,
      docNo: "CN-2024-0003",
      docDate: "2024-01-20",
      docTypeId: DOC_TYPE_DELIVERY,
      docType: "เอกสารตามส่งสินค้า",
      reason: "ขาดส่งสินค้า",
      status: "Pending Approval",
      pendingHint: "รอ warehouse อนุมัติ",
      customerId: "C003",
      customerName: "บริษัท แกมม่า เทรดดิ้ง",
      referenceDocNo: "INV-2024-0052",
      salesperson: "สมชาย ใจดี",
      approvals: deliveryFlowApprovals(),
    }),
    buildDoc({
      id: 4,
      docNo: "CN-2024-0004",
      docDate: "2024-01-22",
      docTypeId: DOC_TYPE_CN_PRICE,
      docType: "เอกสาร CN ราคาสินค้า",
      reason: "สินค้าชำรุด",
      status: "Rejected",
      customerId: "C004",
      customerName: "ร้านสุขสวัสดิ์",
      referenceDocNo: "INV-2024-0061",
      salesperson: "ธนา มั่นคง",
      approvals: priceFlowApprovals({ teamlead: "Rejected" }).map((a) =>
        a.roleName === "หัวหน้า" ? { ...a, remark: "เอกสารอ้างอิงไม่ตรงกับสินค้าที่รับคืน", decisionAt: "2024-01-23T10:00:00" } : a,
      ),
    }),
    buildDoc({
      id: 5,
      docNo: "CN-2024-0005",
      docDate: "2024-01-25",
      docTypeId: DOC_TYPE_RETURN,
      docType: "เอกสารรับคืนสินค้า",
      reason: "สินค้าชำรุด",
      status: "Cancelled",
      customerId: "C001",
      customerName: "บริษัท เอบีซี จำกัด",
      referenceDocNo: "INV-2024-0070",
      salesperson: "วิภา รักงาน",
      remark: "ปิดเอกสารโดยผู้สร้าง: ลูกค้ายกเลิกการรับคืน",
      approvals: returnFlowApprovals({ teamlead: "Pending" }),
    }),
    buildDoc({
      id: 6,
      docNo: "CN-2024-0006",
      docDate: "2024-02-01",
      docTypeId: DOC_TYPE_CN_PRICE,
      docType: "เอกสาร CN ราคาสินค้า",
      reason: "ขาดส่งสินค้า",
      status: "Pending Approval",
      pendingHint: "รอหัวหน้าอนุมัติ",
      customerId: "C005",
      customerName: "บริษัท โอเมก้า ซัพพลาย",
      referenceDocNo: "INV-2024-0078",
      salesperson: "ธนา มั่นคง",
      approvals: priceFlowApprovals({ teamlead: "Pending" }),
    }),
    buildDoc({
      id: 7,
      docNo: "CN-2024-0007",
      docDate: "2024-02-05",
      docTypeId: DOC_TYPE_DELIVERY,
      docType: "เอกสารตามส่งสินค้า",
      reason: "สินค้าหมดอายุ",
      status: "Approved",
      customerId: "C006",
      customerName: "ห้างมหาชัย",
      referenceDocNo: "INV-2024-0082",
      salesperson: "สมชาย ใจดี",
      approvals: deliveryFlowApprovals({ warehouse: "Approved", transportation: "Approved", teamlead: "Approved", admin: "Approved" }),
    }),
    buildDoc({
      id: 8,
      docNo: "CN-2024-0008",
      docDate: "2024-02-08",
      docTypeId: DOC_TYPE_CN_PRICE,
      docType: "เอกสาร CN ราคาสินค้า",
      reason: "สินค้าชำรุด",
      status: "Pending Approval",
      pendingHint: "รอ Admin อนุมัติ",
      customerId: "C007",
      customerName: "บริษัท เซต้า โลจิสติก",
      referenceDocNo: "INV-2024-0090",
      salesperson: "วิภา รักงาน",
      approvals: priceFlowApprovals({ teamlead: "Approved", admin: "Pending" }),
    }),
  ];
}

export const MOCK_INVOICE_REFERENCES = {
  SI2605010001: {
    invoiceNo: "SI2605010001",
    teamLeadBill: "TL-001",
    salespersonCode: "EMP001",
    date: "2024-01-10",
    salesperson: "สมชาย ใจดี",
    customerId: "C001",
    customerName: "บริษัท เอบีซี จำกัด",
    customerAddress: "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    deliveryLocation: "คลังสินค้า A อาคาร 2 ชั้น 1",
    remark: "กรุณาออกเอกสาร CN ภายใน 7 วันทำการ",
    items: [
      { no: 1, code: "CCB0074", name: "BAKING PAPER EXOPAP 60x40cm(P/500)", qty: 24, unit: "โหล", price: 120, discount: 5, tax: 7, lot: "LOT-240110-A", remark: "" },
      { no: 2, code: "GMC0005", name: "Barry 44% Chocolate Bar 300(Stick)15x1.6kg", qty: 6, unit: "แพ็ค", price: 350, discount: 0, tax: 7, lot: "LOT-240108-B", remark: "" },
      { no: 3, code: "SGA0002", name: "(61871)French Wheat Flour(T55) 25kgs.", qty: 48, unit: "กล่อง", price: 85, discount: 10, tax: 7, lot: "LOT-240112-C", remark: "" },
    ],
  },
  "INV-2024-0045": {
    invoiceNo: "INV-2024-0045",
    teamLeadBill: "TL-002",
    salespersonCode: "EMP001",
    date: "2024-01-10",
    salesperson: "สมชาย ใจดี",
    customerId: "1RT260053",
    customerName: "บริษัท บิ๊กซี ซูเปอร์เซ็นเตอร์ จำกัด(มหาชน) (สำนักงานใหญ่)",
    customerAddress: "123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    deliveryLocation: "คลังสินค้า A อาคาร 2 ชั้น 1",
    remark: "กรุณาออกเอกสาร CN ภายใน 7 วันทำการ",
    items: [
      { no: 1, code: "GMC0005", name: "(61871)French Wheat Flour(T55) 25kgs.", qty: 24, unit: "bag", price: 120, discount: 5, tax: 7, lot: "LOT-240110-A", remark: "" },
      { no: 2, code: "SGA0002", name: "Barry 44% Chocolate Bar 300(Stick)15x1.6kg", qty: 48, unit: "box", price: 85, discount: 10, tax: 7, lot: "LOT-240112-C", remark: "" },
    ],
  },
};
