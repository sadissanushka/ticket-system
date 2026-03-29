"use client";
 
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MonitorCheck, Mail, Lock, User, GraduationCap } from "lucide-react";
 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
 
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { login } = useAuth();
  const router = useRouter();
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  useEffect(() => {
    let s = 0;
    const pwd = formData.password;
    if (pwd.length > 7) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    setPasswordStrength(s);
  }, [formData.password]);
 
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
 
    // Basic validations
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
 
    const emailRegex = /^[a-zA-Z]+\.\d{2}@uom\.lk$/;
    if (!emailRegex.test(formData.email)) {
      setError("Email should be jdoe.12@uom.lk format");
      setIsLoading(false);
      return;
    }
 
    const studentIdRegex = /^\d{6}[A-Z]$/;
    if (!studentIdRegex.test(formData.studentId)) {
      setError("Student ID should be like 123456A");
      setIsLoading(false);
      return;
    }
 
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          studentId: formData.studentId,
          email: formData.email,
          password: formData.password
        }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }
 
      // Redirect to login with success message
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 py-12">
      <div className="absolute top-6 left-6">
        <Link href="/login">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>
 
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary p-3 rounded-2xl shadow-lg mb-6">
            <MonitorCheck className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Join the UniTech Assist IT Help Desk</p>
        </div>
 
        <Card className="shadow-xl border-border">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Register</CardTitle>
            <CardDescription className="text-center">
              Student registration for the IT Ticketing System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    className="pl-10 h-11"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="studentId" 
                    placeholder="123456A" 
                    className="pl-10 h-11"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    placeholder="jdoe.12@uom.lk" 
                    className="pl-10 h-11"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-10 h-11"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/* Strength Bar */}
                <div className="flex gap-1 h-1.5 mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 rounded-full transition-colors",
                        passwordStrength >= i 
                          ? (passwordStrength <= 2 ? "bg-red-500" : passwordStrength === 3 ? "bg-orange-500" : "bg-green-500")
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
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-10 h-11"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
 
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
 
              <Button type="submit" className="w-full h-12 text-base shadow-md mt-6" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t p-6 bg-muted/30 rounded-b-lg">
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
