"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
 
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const router = useRouter();
 
  useEffect(() => {
    const verified = localStorage.getItem("otpVerified");
    if (verified !== "true") {
      router.push("/forgot-password");
    }
  }, [router]);
 
  useEffect(() => {
    let s = 0;
    if (password.length > 7) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setStrength(s);
  }, [password]);
 
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
 
    setIsLoading(true);
    setError("");
 
    try {
      const email = localStorage.getItem("resetEmail");
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });
 
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to reset password");
      }
 
      setSuccess(true);
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("otpVerified");
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };
 
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center py-8 shadow-2xl border-primary/20 bg-primary/5">
          <CardContent className="space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Success!</h2>
              <p className="text-muted-foreground">Your password has been successfully reset. You will be redirected to the login page shortly.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <Lock className="h-10 w-10 text-primary dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Set New Password</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a strong password to secure your account.</p>
        </div>
 
        <Card className="shadow-xl border-border">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pr-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {/* Strength Bar */}
                <div className="flex gap-1 h-1.5 mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 rounded-full transition-colors",
                        strength >= i 
                          ? (strength <= 2 ? "bg-red-500" : strength === 3 ? "bg-orange-500" : "bg-green-500")
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Use at least 8 characters, one uppercase, one number, and one symbol.
                </p>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
 
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
 
              <Button type="submit" className="w-full h-11 mt-2 shadow-md" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
