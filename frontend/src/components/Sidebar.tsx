"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Ticket, 
  Users, 
  Settings, 
  MonitorCheck,
  ChevronRight,
  ShieldCheck,
  Wrench,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["STUDENT", "ADMIN", "TECHNICIAN"],
    },
    {
      name: "Create Ticket",
      href: "/dashboard/create-ticket",
      icon: PlusCircle,
      roles: ["STUDENT", "ADMIN", "TECHNICIAN"],
    },
    {
      name: "Admin Panel",
      href: "/dashboard/admin",
      icon: ShieldCheck,
      roles: ["ADMIN"],
    },
    {
      name: "Technician Panel",
      href: "/dashboard/technician",
      icon: Wrench,
      roles: ["TECHNICIAN", "ADMIN"],
    },
    // Future expansion
    // {
    //   name: "Knowledge Base",
    //   href: "/dashboard/kb",
    //   icon: BookOpen,
    //   roles: ["STUDENT", "ADMIN", "TECHNICIAN"],
    // },
    // {
    //   name: "Knowledge Base",
    //   href: "/dashboard/kb",
    //   icon: BookOpen,
    //   roles: ["STUDENT", "ADMIN", "TECHNICIAN"],
    // },
  ];

  const filteredNavigation = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-md shadow-sm">
            <MonitorCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            UniTech Assist
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary dark:group-hover:text-blue-400"
              )} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="bg-muted/40 rounded-xl p-2 flex items-center gap-2">
            <Link href="/dashboard/settings" className="flex-1 flex items-center gap-3 p-1 rounded-lg hover:bg-muted transition-colors text-left outline-none cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary dark:text-blue-400 text-xs font-bold shrink-0 border border-primary/10 overflow-hidden">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user?.name?.[0].toUpperCase() ?? "?"
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{user?.role}</p>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary dark:hover:text-blue-400 outline-none focus-visible:ring-1">
                  <Settings className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name ?? "Guest"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email ?? ""}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-0">
                  <Link href="/dashboard/settings" className="flex items-center gap-2 w-full cursor-pointer px-2 py-1.5 outline-none hover:bg-accent hover:text-accent-foreground rounded-sm">
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 dark:hover:bg-red-900/10"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
