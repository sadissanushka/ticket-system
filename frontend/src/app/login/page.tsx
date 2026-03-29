"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MonitorCheck, Mail, Lock, Building, CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/lib/api";

function LoginFields() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const studentIdRegex = /^\d{6}[A-Z]$/;

    if (!emailRegex.test(email) && !studentIdRegex.test(email)) {
      setError("Please enter a valid university email or Student ID (e.g., 123456A).");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.token, data.user);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Is the backend running?");
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-border">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
            <AlertDescription className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {isRegistered && !error && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400">
            <AlertDescription className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Registration successful! Please sign in.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          disabled 
          variant="outline" 
          className="w-full h-12 text-base font-medium border-border bg-muted/20 opacity-50 cursor-not-allowed group"
        >
          <Building className="mr-2 h-5 w-5 text-muted-foreground transition-colors group-hover:text-muted-foreground" />
          University SSO (Coming Soon)
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email or Student ID</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                id="email" 
                type="text" 
                placeholder="student@uni.edu" 
                className="pl-10 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" title="Forgot password?" className="text-sm font-medium text-primary dark:text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="pl-10 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-base shadow-md mt-6" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col border-t p-6 bg-muted/30 rounded-b-lg">
        <p className="text-sm text-center mt-4">
          Don't have an account? <Link href="/register" className="text-primary dark:text-blue-400 font-bold hover:underline">Register now</Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4">
      <div className="absolute top-6 left-6">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary p-3 rounded-2xl shadow-lg mb-6">
            <MonitorCheck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">UniTech Assist</h2>
          <p className="mt-2 text-sm text-muted-foreground">University IT Help Desk: Ticket Manager</p>
        </div>

        <Suspense fallback={
          <Card className="shadow-xl border-border p-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-blue-400" />
          </Card>
        }>
          <LoginFields />
        </Suspense>
      </div>
    </div>
  );
}
