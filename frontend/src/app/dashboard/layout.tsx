"use client";

import Link from "next/link";
import { Bell, LogOut, User, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Show a loading spinner to prevent flash of content before redirecting
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get initials from name
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground">
      {/* Sidebar for Desktop */}
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* Top bar */}
        <header className="px-4 md:px-8 h-16 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <MobileNav />
            <div className="md:hidden flex items-center gap-2">
               <span className="font-bold text-lg text-foreground tracking-tight">
                UniTech Assist
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsDropdown />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
