import { redirect } from "next/navigation";

export default function AdminHomePage() {
  // Automatically forward /admin -> /admin/dashboard
  redirect("/admin/dashboard");
}