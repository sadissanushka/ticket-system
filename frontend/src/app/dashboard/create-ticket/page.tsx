"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UploadCloud, Info, CheckCircle2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { API_URL, fetchWithAuth } from "@/lib/api";

type Category = { id: string; name: string };
type PendingFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploading: boolean;
  url?: string;
  error?: string;
};

export default function CreateTicketPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("LOW");
  const [location, setLocation] = useState("");
  const [device, setDevice] = useState("");

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    fetchWithAuth(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Expected array for categories, got:", data);
          setCategories([]);
        }
      })
      .catch(() => setError("Could not load categories. Is the backend running?"));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const f of files) {
      const tempId = crypto.randomUUID();
      const controller = new AbortController();
      uploadControllersRef.current.set(tempId, controller);

      const newFile = {
        id: tempId,
        name: f.name,
        size: f.size,
        type: f.type,
        uploading: true,
      };

      setPendingFiles((prev) => [...prev, newFile]);

      try {
        const formData = new FormData();
        formData.append("file", f);

        const res = await fetchWithAuth(`${API_URL}/api/uploads`, {
          method: "POST",
          body: formData,
          signal: controller.signal
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await res.json();
        setPendingFiles((prev) =>
          prev.map((p) => p.id === tempId ? { ...data, uploading: false } : p)
        );
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`Upload ${tempId} cancelled`);
          continue;
        }
        setPendingFiles((prev) =>
          prev.map((p) => p.id === tempId ? { ...p, uploading: false, error: "Failed" } : p)
        );
      } finally {
        uploadControllersRef.current.delete(tempId);
      }
    }
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    const controller = uploadControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      uploadControllersRef.current.delete(id);
    }
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("You must be logged in to create a ticket.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth(`${API_URL}/api/tickets`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          categoryId,
          priority,
          location: location || undefined,
          device: device || undefined,
          authorId: user.id,
          attachments: pendingFiles.filter(f => !f.uploading && !f.error).map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            url: f.url
          }))
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create ticket");
      }

      // Show success state briefly, then redirect
      setIsSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center py-24 space-y-4">
        <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-full">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Ticket Submitted!</h2>
        <p className="text-muted-foreground max-w-sm">Your ticket has been saved to the database and assigned a tracking ID. Redirecting to your dashboard...</p>
        <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-blue-400 mt-2" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-500 shrink-0 cursor-pointer">
            <ArrowLeft className="h-4 w-4 text-slate-200" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Ticket</h1>
          <p className="text-sm text-muted-foreground">Submit a technical issue to the IT Help Desk.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="shadow-md border-border">
          <CardHeader className="bg-muted/40 border-b pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-foreground">Issue Details</CardTitle>
                <CardDescription className="mt-1">
                  Please provide as much information as possible to help us resolve your issue quickly.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-primary dark:text-blue-400 hover:bg-blue-100 flex gap-1 items-center px-3 py-1">
                <Info className="h-3.5 w-3.5" />
                Est. response: 2 hrs
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Row 1: Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-foreground/90">Issue Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="e.g.: WiFi disconnected in library"
                  required
                  className="h-11 bg-muted/40 border-border focus-visible:ring-primary/20"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold text-foreground/90">Category <span className="text-red-500">*</span></Label>
                <Select onValueChange={(val) => setCategoryId(val || "")} value={categoryId}>
                  <SelectTrigger className="h-11 bg-muted/40 border-border">
                    <div className="flex flex-1 text-left line-clamp-1">
                      {categoryId 
                        ? categories.find(c => c.id === categoryId)?.name 
                        : (categories.length === 0 ? "Loading categories..." : "Select a category")}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Location & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="font-semibold text-foreground/90">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g.: Lab 2, Building A"
                  className="h-11 bg-muted/40 border-border focus-visible:ring-primary/20"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="font-semibold text-foreground/90">Priority Level <span className="text-red-500">*</span></Label>
                <Select value={priority} onValueChange={(val) => setPriority(val || "LOW")}>
                  <SelectTrigger className="h-11 bg-muted/40 border-border">
                    <div className="flex flex-1 text-left line-clamp-1">
                      {priority === "LOW" ? "Low (Not urgent)" :
                       priority === "MEDIUM" ? "Medium (Impacting work)" :
                       priority === "HIGH" ? "High (Critical failure)" : 
                       "Select priority"}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low (Not urgent)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (Impacting work)</SelectItem>
                    <SelectItem value="HIGH">High (Critical failure)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="device" className="font-semibold text-foreground/90">Device Type (Optional)</Label>
              <Input
                id="device"
                placeholder="e.g.: MacBook Pro, Lab PC #12"
                className="h-11 bg-muted/40 border-border focus-visible:ring-primary/20"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold text-foreground/90">Detailed Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Please describe exactly what happened, including any error messages you saw..."
                className="min-h-[120px] bg-muted/40 border-border focus-visible:ring-primary/20 resize-y"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2 pt-2">
              <Label className="font-semibold text-foreground/90">Attachments (Optional)</Label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
              <div 
                className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/70 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-primary/5 p-3 rounded-full mb-3 group-hover:bg-primary/10 transition-colors">
                  <UploadCloud className="h-6 w-6 text-primary dark:text-blue-400" />
                </div>
                <p className="text-sm font-medium text-foreground/90">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 10MB</p>
              </div>

              {pendingFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {pendingFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 bg-muted/40 border border-border rounded-lg p-3 relative group">
                      <div className="bg-primary/10 p-2 rounded flex-shrink-0">
                        <UploadCloud className="h-4 w-4 text-primary dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB • {file.uploading ? "Uploading..." : file.error ? "Failed" : "Ready"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </CardContent>

          <CardFooter className="bg-muted/40 border-t p-6 flex justify-end gap-3 rounded-b-xl">
            <Link href="/dashboard">
              <Button type="button" variant="outline" className="h-11 px-6 font-medium" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="h-11 px-8 shadow-md" disabled={isSubmitting || categories.length === 0}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : "Submit Ticket"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
