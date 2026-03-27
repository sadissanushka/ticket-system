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

import { ThemeToggle } from "@/components/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

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
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>
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
