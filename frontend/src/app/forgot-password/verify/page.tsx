"use client";
 
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, RefreshCcw } from "lucide-react";
 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/lib/api";
 
export default function VerifyOTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
 
  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (!storedEmail) {
      router.push("/forgot-password");
      return;
    }
    setEmail(storedEmail);
  }, [router]);
 
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);
 
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
 
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
 
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
 
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
 
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;
 
    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
  };
 
  const handleVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) return;
 
    setIsLoading(true);
    setError("");
 
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: fullOtp }),
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }
 
      localStorage.setItem("otpVerified", "true");
      router.push("/forgot-password/reset");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setTimeLeft(30);
    setError("");
 
    try {
      await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError("Failed to resend OTP");
      setCanResend(true);
    }
  };
 
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4">
      <div className="absolute top-6 left-6">
        <Link href="/forgot-password">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
 
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-6">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Verify Account</h2>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>
 
        <Card className="shadow-xl border-border">
          <CardHeader>
            <CardTitle className="text-center">Verification Code</CardTitle>
            <CardDescription className="text-center">
              The code will expire in a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>
 
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs text-center">{error}</AlertDescription>
              </Alert>
            )}
 
            <Button 
              className="w-full h-11 shadow-md" 
              disabled={otp.some(d => !d) || isLoading}
              onClick={handleVerify}
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3 border-t p-4 bg-muted/20">
            <div className="flex items-center text-sm text-muted-foreground">
              Didn't receive code?
              <Button 
                variant="link" 
                className="h-auto p-0 ml-1 text-primary font-bold decoration-2"
                disabled={!canResend}
                onClick={handleResend}
              >
                Resend Code
              </Button>
              {!canResend && <span className="ml-2 tabular-nums">({timeLeft}s)</span>}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
