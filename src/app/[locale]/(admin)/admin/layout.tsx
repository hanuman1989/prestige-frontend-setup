"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import Loader from "@/components/common/Loader";
import AdminToaster from "@/components/admin/common/AdminToaster";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthorized } = useProtectedRoute("admin");
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  if (!isAuthorized) {
    return <Loader />;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>
      <AdminToaster />
    </div>
  );
}
