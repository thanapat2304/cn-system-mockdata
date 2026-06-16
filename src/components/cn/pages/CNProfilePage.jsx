"use client";

import { useEffect, useRef, useState } from "react";
import { mockGetEmployeeProfile, mockUpdateEmployeeProfile, mockUploadSignature } from "@/lib/cnApi";
import { getUploadUrl } from "@/lib/cnAuth";
import { G, baseInput, btnPrimary, btnSecondary } from "../shared";

export default function CNProfilePage({ onProfileUpdated }) {
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const data = await mockGetEmployeeProfile();
        if (!mounted) return;
        setProfile(data);
        setFullName(data.fullName || "");
        onProfileUpdated?.(data);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [onProfileUpdated]);

  async function saveName() {
    setSuccessMsg("");
    setError("");
    if (!fullName.trim()) {
      setError("กรุณากรอกชื่อ-นามสกุล");
      return;
    }
    setSavingName(true);
    try {
      const data = await mockUpdateEmployeeProfile({ fullName: fullName.trim() });
      setProfile(data);
      setFullName(data.fullName || "");
      setSuccessMsg("บันทึกชื่อเรียบร้อยแล้ว");
      onProfileUpdated?.(data);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingName(false);
    }
  }

  async function uploadSignature(file) {
    if (!file) return;
    setSuccessMsg("");
    setError("");
    setUploadingSig(true);
    try {
      const data = await mockUploadSignature(file);
      const next = { ...(profile || {}), signaturePath: data.signaturePath || "" };
      setProfile(next);
      setSuccessMsg("อัปโหลดลายเซ็นเรียบร้อยแล้ว");
      onProfileUpdated?.(next);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setUploadingSig(false);
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: G.text, margin: 0 }}>โปรไฟล์ผู้ใช้งาน</h1>
      <p style={{ fontSize: 13, color: G.textMuted, margin: "6px 0 18px" }}>แก้ไขชื่อ-นามสกุล และลายเซ็นของคุณสำหรับการอนุมัติเอกสาร</p>

      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: G.radius, padding: 18 }}>
        {loading ? (
          <div style={{ color: G.textMuted }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: G.textMuted }}>รหัสพนักงาน</div>
              <div style={{ fontSize: 13, color: G.text, fontWeight: 600 }}>{profile?.employeeCode || "-"}</div>
              <div style={{ fontSize: 12, color: G.textMuted }}>สิทธิ์การใช้งาน</div>
              <div style={{ fontSize: 13, color: G.text, fontWeight: 600 }}>{profile?.roleLabel || "-"}</div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>ชื่อ-นามสกุล</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ ...baseInput, flex: "1 1 320px" }} />
                <button type="button" style={btnPrimary} disabled={savingName} onClick={saveName}>
                  {savingName ? "กำลังบันทึก..." : "บันทึกชื่อ"}
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: G.textDim, marginBottom: 6 }}>ลายเซ็น</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" style={btnSecondary} onClick={() => fileRef.current?.click()} disabled={uploadingSig}>
                  {uploadingSig ? "กำลังอัปโหลด..." : "เลือกรูปลายเซ็น"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    uploadSignature(file);
                    e.target.value = "";
                  }}
                />
                <span style={{ color: G.textMuted, fontSize: 12 }}>แนะนำไฟล์พื้นหลังโปร่งใส PNG</span>
              </div>

              <div style={{ marginTop: 12 }}>
                {profile?.signaturePath ? (
                  <div style={{ border: `1px dashed ${G.border}`, borderRadius: G.radiusSm, padding: 10, maxWidth: 360, background: "#fff" }}>
                    <img
                      src={getUploadUrl(profile.signaturePath)}
                      alt="signature-preview"
                      style={{ width: "100%", maxHeight: 120, objectFit: "contain" }}
                    />
                  </div>
                ) : (
                  <div style={{ color: G.textMuted, fontSize: 12 }}>ยังไม่มีลายเซ็น</div>
                )}
              </div>
            </div>

            {error && <div style={{ marginTop: 14, color: G.danger, fontSize: 13 }}>{error}</div>}
            {successMsg && <div style={{ marginTop: 14, color: G.success, fontSize: 13 }}>{successMsg}</div>}
          </>
        )}
      </div>
    </div>
  );
}
