import { DEMO_USER } from "@/lib/mockData";

const PROFILE_KEY = "cn_demo_profile";

export function getUser() {
  if (typeof window === "undefined") return { ...DEMO_USER };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEMO_USER };
    return { ...DEMO_USER, ...JSON.parse(raw), roleLabel: "sale", employeeCode: DEMO_USER.employeeCode };
  } catch {
    return { ...DEMO_USER };
  }
}

export function setUser(partial = {}) {
  if (typeof window === "undefined") return;
  const current = getUser();
  const next = {
    loginId: DEMO_USER.loginId,
    employeeCode: DEMO_USER.employeeCode,
    roleLabel: "sale",
    fullName: partial.fullName ?? current.fullName,
    signaturePath: partial.signaturePath ?? current.signaturePath,
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
}

export function getUploadUrl(storagePath) {
  const raw = String(storagePath || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw;
}
