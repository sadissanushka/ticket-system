"use client";

import RoleGuard from "@/components/RoleGuard";

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["TECHNICIAN", "ADMIN"]}>
      {children}
    </RoleGuard>
  );
}
