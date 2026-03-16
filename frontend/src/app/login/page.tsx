"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MonitorCheck, Mail, Lock, Building } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Import Context

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Context will handle state and redirecting based on Role
      login(data.token, data.user);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Is the backend running?");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4">
      {/* Back to home */}
      <div className="absolute top-6 left-6">
        <Link href="/">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary p-3 rounded-2xl shadow-lg mb-6">
            <MonitorCheck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Stitch University</h2>
          <p className="mt-2 text-sm text-muted-foreground">IT Help Desk Ticketing System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-border">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SSO Option */}
            <Button variant="outline" className="w-full h-12 text-base font-medium border-border bg-muted/40 hover:bg-muted/70 hover:text-foreground transition-colors">
              <Building className="mr-2 h-5 w-5 text-muted-foreground" />
              Continue with University SSO
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
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="text" 
                    placeholder="student@stitchu.edu" 
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
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
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
            <p className="text-xs text-center text-muted-foreground">
              Your role (Student, Technician, Admin) will be automatically detected upon login.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
