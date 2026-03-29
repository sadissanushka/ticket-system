"use client";
 
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";
 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
 
export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
 
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
 
    const emailRegex = /^[a-zA-Z]+\.\d{2}@uom\.lk$/;
    const studentIdRegex = /^\d{6}[A-Z]$/;
 
    if (!emailRegex.test(identifier) && !studentIdRegex.test(identifier)) {
      setError("Enter a valid Student ID (123456A) or University Email (jdoe.12@uom.lk)");
      setIsLoading(false);
      return;
    }
 
    try {
      const response = await fetch(`${API_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }
 
      localStorage.setItem("resetEmail", identifier);
      router.push("/forgot-password/verify");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4">
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
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <KeyRound className="h-10 w-10 text-primary dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Forgot Password</h2>
          <p className="mt-2 text-sm text-muted-foreground">Enter your details to receive an authentication code.</p>
        </div>
 
        <Card className="shadow-xl border-border">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              We'll send a 6-digit OTP to your university email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">University Email or Student ID</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="identifier" 
                    placeholder="e.g. 210001X or jdoe.21@uom.lk" 
                    className="pl-10 h-11"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>
 
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
 
              <Button type="submit" className="w-full h-11 mt-2 shadow-md" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Remembered your password? <Link href="/login" className="text-primary dark:text-blue-400 font-semibold hover:underline">Sign In</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
