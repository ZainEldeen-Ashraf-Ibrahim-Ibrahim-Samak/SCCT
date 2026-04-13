import { AdminDashboard } from "@/presentation/components/admin/dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — SCCT Admin",
  description: "Review and manage client submissions",
};

export default function DashboardPage() {
  return <AdminDashboard />;
}
