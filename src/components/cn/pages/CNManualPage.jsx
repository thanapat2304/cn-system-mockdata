"use client";

import { G } from "../shared";

const card = {
  background: G.surface,
  border: `1px solid ${G.border}`,
  borderRadius: G.radius,
  padding: "16px 18px",
};

const sectionTitle = {
  margin: "0 0 10px",
  fontSize: 16,
  fontWeight: 800,
  color: G.text,
};

const list = {
  margin: 0,
  paddingLeft: 18,
  color: G.textDim,
  fontSize: 13,
  lineHeight: 1.75,
};

export default function CNManualPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: G.text }}>วิธีใช้งานระบบ CN</h1>
        <p style={{ margin: "6px 0 0", color: G.textMuted, fontSize: 13 }}>คู่มือสั้นสำหรับการใช้งานจริงในแต่ละวัน</p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <section style={card}>
          <h2 style={sectionTitle}>1) เริ่มต้นใช้งาน</h2>
          <ul style={list}>
            <li>เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน</li>
            <li>ไปที่เมนูรายการเอกสารเพื่อดูงานล่าสุด (ระบบเรียงใหม่สุดขึ้นก่อน)</li>
            <li>ถ้าต้องการสร้างใหม่ ให้กดเมนู &quot;สร้างเอกสาร&quot;</li>
          </ul>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>2) การสร้างเอกสาร</h2>
          <ul style={list}>
            <li>กรอกเอกสารอ้างอิง แล้วกดตรวจสอบ (ตัวอย่าง: SI2605010001)</li>
            <li>เลือกประเภทเอกสารและเหตุผล</li>
            <li>กรอกรายการสินค้าและแนบรูป (ถ้ามี)</li>
            <li>บันทึกเอกสารเพื่อส่งเข้ากระบวนการอนุมัติ</li>
          </ul>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>3) อนุมัติ / ไม่อนุมัติ</h2>
          <ul style={list}>
            <li>ระบบจะแสดงปุ่มอนุมัติเฉพาะ role และเฉพาะขั้นที่ถึงคิวของคุณ</li>
            <li>กด &quot;อนุมัติ&quot; ได้ทันที (ไม่บังคับเหตุผล)</li>
            <li>กด &quot;ไม่อนุมัติ&quot; ต้องระบุเหตุผลทุกครั้ง</li>
            <li>เมื่อไม่อนุมัติ เอกสารจะเป็นสถานะ Rejected</li>
          </ul>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>4) ปิดเอกสารโดยผู้สร้าง</h2>
          <ul style={list}>
            <li>ผู้สร้างเอกสารสามารถกดปิดเอกสารได้ เมื่อ flow ยังไม่จบ</li>
            <li>ต้องระบุเหตุผลก่อนปิดเอกสาร</li>
            <li>สถานะจะเปลี่ยนเป็น Cancelled</li>
            <li>เมื่อเอกสารถูกปิดแล้ว ปุ่มพิมพ์และ Export PDF จะไม่แสดง</li>
          </ul>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>5) สถานะเอกสารที่ใช้จริง</h2>
          <ul style={list}>
            <li>Pending Approval: รอการอนุมัติ</li>
            <li>Approved: อนุมัติครบทุกขั้น</li>
            <li>Rejected: ถูกไม่อนุมัติใน flow</li>
            <li>Cancelled: ผู้สร้างปิดเอกสาร</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
