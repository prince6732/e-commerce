"use client";

import Sidebar from "@/components/(dashboards)/Sidebar";
import Header from "@/components/(dashboards)/Header";
import ProtectedRoute from "@/components/(sheared)/ProtectedRoute";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProtectedRoute role="Admin">
      <div className="lg:flex min-h-screen max-w-[200rem] mx-auto">
        <Sidebar isOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 pt-[10px] px-5">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
