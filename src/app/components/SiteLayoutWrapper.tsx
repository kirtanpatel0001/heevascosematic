"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

export default function SiteLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  // Hide global chrome on admin and auth pages for faster first paint.
  const hideChrome = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  return (
    <>
      {!hideChrome && <Nav />}
      <main className="overflow-x-hidden">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
