"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";

export default function SiteLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  // hide header/footer for admin routes
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Nav />}
      <main className="overflow-x-hidden">{children}</main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
