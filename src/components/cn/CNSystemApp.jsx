"use client";

import { useCallback, useEffect, useState } from "react";
import { getUser, setUser } from "@/lib/cnAuth";
import TopBar from "./TopBar";
import CNListPage from "./pages/CNListPage";
import CNDetailPage from "./pages/CNDetailPage";
import CNCreatePage from "./pages/CNCreatePage";
import CNProfilePage from "./pages/CNProfilePage";
import CNManualPage from "./pages/CNManualPage";
import { G } from "./shared";

function readDemoUser() {
  const u = getUser();
  return {
    name: u.fullName || u.employeeCode || "",
    code: u.employeeCode || "",
    role: u.roleLabel || "sale",
    signaturePath: u.signaturePath || "",
  };
}

export default function CNSystemApp() {
  const [page, setPage] = useState("list");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [currentUser, setCurrentUser] = useState(readDemoUser);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  const handleProfileUpdated = useCallback((next) => {
    setCurrentUser((prev) => {
      const merged = {
        code: next?.employeeCode || prev.code || "",
        name: next?.fullName || prev.name || "",
        role: "sale",
        signaturePath: next?.signaturePath ?? prev.signaturePath ?? "",
      };
      setUser({
        fullName: merged.name,
        signaturePath: merged.signaturePath,
      });
      return merged;
    });
  }, []);

  return (
    <div style={{ height: "100vh", background: G.bg, color: G.text, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100vh", minHeight: 0 }}>
        <TopBar page={page} setPage={setPage} currentUser={currentUser} isMobile={isMobile} />

        <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: page === "list" ? "flex" : "none",
                flex: 1,
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <CNListPage setPage={setPage} setSelectedDoc={setSelectedDoc} isVisible={page === "list"} />
            </div>
            {page === "detail" && (
              <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <CNDetailPage setPage={setPage} selectedDoc={selectedDoc} currentUser={currentUser} />
              </div>
            )}
            {page === "create" && (
              <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <CNCreatePage setPage={setPage} />
              </div>
            )}
            {page === "profile" && (
              <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <CNProfilePage onProfileUpdated={handleProfileUpdated} />
              </div>
            )}
            {page === "manual" && (
              <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <CNManualPage />
              </div>
            )}
          </div>
          <footer
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${G.border}`,
              background: G.surface,
              color: G.textMuted,
              fontSize: 12,
              textAlign: "center",
              padding: "10px 16px",
            }}
          >
            © AMERICAN-EUROPEAN PRODUCTS CO., LTD. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}
