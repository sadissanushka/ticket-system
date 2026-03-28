"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL, fetchWithAuth } from "@/lib/api";

type Category = { id: string; name: string };

type TicketData = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: string;
  location?: string | null;
  device?: string | null;
};

interface EditTicketModalProps {
  ticket: TicketData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTicket: any) => void;
}

export function EditTicketModal({ ticket, isOpen, onClose, onUpdate }: EditTicketModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [location, setLocation] = useState("");
  const [device, setDevice] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description);
      setCategoryId(ticket.categoryId);
      setPriority(ticket.priority);
      setLocation(ticket.location || "");
      setDevice(ticket.device || "");
      setError("");
    }
  }, [isOpen, ticket]);

  useEffect(() => {
    if (isOpen) {
      fetchWithAuth(`${API_URL}/api/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(() => setError("Failed to load categories"));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetchWithAuth(`${API_URL}/api/tickets/${ticket.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          categoryId,
          priority,
          location: location || null,
          device: device || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update ticket");
      }

      const updated = await response.json();
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Edit Ticket Details
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">Update the information for this ticket.</p>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-semibold">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-sm font-semibold">Category</Label>
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
                <SelectTrigger id="edit-category" className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority" className="text-sm font-semibold">Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val || "")}>
                <SelectTrigger id="edit-priority" className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-sm font-semibold">Location</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room, Building"
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-device" className="text-sm font-semibold">Device</Label>
              <Input
                id="edit-device"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="Laptop, PC Name"
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-semibold">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
