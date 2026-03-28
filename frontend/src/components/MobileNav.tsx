import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  MonitorCheck,
  ShieldCheck,
  Wrench,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      roles: ["STUDENT", "ADMIN", "TECHNICIAN"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const drawerContent = isOpen && (
    <div className="fixed inset-0 z-[9999] flex md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Menu */}
      <div className="relative flex w-full max-w-[280px] h-full flex-col bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-300 ease-in-out">
        <div className="flex h-16 items-center justify-between px-6 border-b border-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <div className="bg-primary p-1.5 rounded-md">
              <MonitorCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">
              UniTech Assist
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                {item.name}
              </Link>
            );
          })}
          
          {/* Logout item in list for mobile */}
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <div className="bg-muted/40 rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold border border-primary/10">
              {user?.name?.[0].toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(true)}
          className="text-muted-foreground mr-1"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
};

export default MobileNav;
