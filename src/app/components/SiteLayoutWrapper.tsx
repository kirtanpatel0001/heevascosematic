"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

export default function SiteLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  // Hide global chrome ONLY on admin pages.
  // Auth pages (login, signup, etc.) now show the navbar so users can
  // navigate back without needing the browser back button.
  const hideChrome = pathname.startsWith("/admin");

  return (
    <>
      {!hideChrome && <Nav />}
      <main className="overflow-x-hidden">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}