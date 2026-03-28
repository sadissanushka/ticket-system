"use client";
 
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
 
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
 
  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);
 
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg opacity-0">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }
 
  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };
 
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg hover:bg-muted transition-all relative flex items-center justify-center"
      title={`Current: ${resolvedTheme} (Click to toggle)`}
    >
      <div className="relative h-[1.2rem] w-[1.2rem]">
        <Sun className={cn(
          "absolute h-full w-full transition-all duration-300",
          resolvedTheme === "light" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
        )} />
        <Moon className={cn(
          "absolute h-full w-full transition-all duration-300 text-primary",
          resolvedTheme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
        )} />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
