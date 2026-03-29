"use client";

import { useState, useEffect, useRef } from "react";
import { API_URL, fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Bell,
  Shield,
  Smartphone,
  CheckCircle2,
  Loader2,
  Trash2,
  Camera,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notifications, setNotifications] = useState({
    tickets: user?.notifyTickets ?? true,
    system: user?.notifySystem ?? false
  });
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Password state
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync with user data when it loads
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    if (user) {
      setNotifications({
        tickets: user.notifyTickets ?? true,
        system: user.notifySystem ?? false
      });
    }
  }, [user]);

  useEffect(() => {
    let s = 0;
    if (newPassword.length > 7) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    setPasswordStrength(s);
  }, [newPassword]);

  const handleNotificationChange = async (type: 'tickets' | 'system') => {
    if (!user) return;

    const nextState = { ...notifications, [type]: !notifications[type] };
    setNotifications(nextState); // Optimistic UI update

    try {
      const res = await fetchWithAuth(`${API_URL}/api/users/${user.id}/notifications`, {
        method: "PUT",
        body: JSON.stringify({
          notifyTickets: nextState.tickets,
          notifySystem: nextState.system
        })
      });

      if (res.ok) {
        const data = await res.json();
        updateUser({ notifyTickets: data.notifyTickets, notifySystem: data.notifySystem });
      } else {
        setNotifications(notifications); // Revert on error
      }
    } catch (e) {
      console.error(e);
      setNotifications(notifications); // Revert on error
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        updateUser({ name: data.name });
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (e) {
      console.error(e);
      alert("Server error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !currentPassword || !newPassword) return;
    setIsSavingPassword(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/users/${user.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        alert("Password updated successfully!");
        setIsUpdatingPassword(false);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error(e);
      alert("Server error occurred.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    
    // Initialize AbortController for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload file with abort signal
      const uploadRes = await fetch(`${API_URL}/api/uploads`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("helpdesk_token")}`
        },
        body: formData,
        signal: controller.signal
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.url;

      // 2. Update user profile with photo URL
      const userRes = await fetchWithAuth(`${API_URL}/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ profilePicture: photoUrl })
      });

      if (userRes.ok) {
        updateUser({ profilePicture: photoUrl });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Upload cancelled by user");
        return;
      }
      console.error(error);
      alert("Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setIsUploading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ profilePicture: null })
      });

      if (res.ok) {
        updateUser({ profilePicture: null });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your tickets.")) {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/users/${user.id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          alert("Account deleted successfully.");
          logout();
        } else {
          alert("Failed to delete account.");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile, security, and notification preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-foreground">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary dark:text-blue-400" />
              Profile Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6 pb-2">
              <div className="relative group">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary dark:text-blue-400 text-2xl font-bold border-2 border-primary/20 overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.[0].toUpperCase() ?? "?"
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-blue-400" />
                    </div>
                  )}
                </div>
                {isUploading ? (
                   <button 
                    onClick={handleCancelUpload}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground border border-destructive/20 flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-all scale-110"
                    title="Cancel Upload"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <label className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center cursor-pointer shadow-sm hover:text-primary dark:hover:text-blue-400 transition-colors group-hover:scale-110">
                    <Camera className="h-4 w-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                  </label>
                )}
                {user?.profilePicture && !isUploading && (
                  <button 
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-all hover:scale-110"
                    title="Remove Photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-primary dark:text-blue-400">{user?.role} ACCOUNT</p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-muted/30 border-border focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={email}
                    className="pl-9 h-10 rounded-xl bg-muted/10 border-border opacity-70"
                    disabled
                  />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-6">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-foreground">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary dark:text-blue-400" />
              Security & Privacy
            </h2>
          </div>
          <div className="p-6 divide-y divide-border/50">
            <div className="flex flex-col py-4 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-bold text-foreground">Login Password</p>
                  <p className="text-sm text-muted-foreground">Change your account password regularly to keep it secure.</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl px-6"
                  onClick={() => setIsUpdatingPassword(!isUpdatingPassword)}
                >
                  {isUpdatingPassword ? "Cancel" : "Update Password"}
                </Button>
              </div>

              {isUpdatingPassword && (
                <div className="pt-4 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-10 rounded-xl bg-muted/30 border-border"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10 rounded-xl bg-muted/30 border-border"
                        placeholder="••••••••"
                      />
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
                  </div>
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={isSavingPassword || !currentPassword || !newPassword}
                    className="rounded-xl"
                  >
                    {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Password
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
              <div>
                <p className="font-bold text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Button disabled variant="outline" className="gap-2 rounded-xl px-6 opacity-60">
                <Smartphone className="h-4 w-4" />
                2FA (Coming Soon)
              </Button>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-foreground">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary dark:text-blue-400" />
              Notification Preferences
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Ticket Updates</p>
                <p className="text-sm text-muted-foreground">Receive emails when your tickets are updated or commented on.</p>
              </div>
              <button
                onClick={() => handleNotificationChange('tickets')}
                className={cn(
                  "h-6 w-11 rounded-full relative transition-colors duration-200 outline-none",
                  notifications.tickets ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn(
                  "absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-200",
                  notifications.tickets ? "right-1" : "left-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">System Announcements</p>
                <p className="text-sm text-muted-foreground">Receive notifications about system maintenance and new features.</p>
              </div>
              <button
                onClick={() => handleNotificationChange('system')}
                className={cn(
                  "h-6 w-11 rounded-full relative transition-colors duration-200 outline-none",
                  notifications.system ? "bg-primary" : "bg-muted"
                )}
              >
                <div className={cn(
                  "absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all duration-200",
                  notifications.system ? "right-1" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50/30 dark:bg-red-950/10 rounded-2xl border border-red-200/50 dark:border-red-900/50 overflow-hidden text-foreground">
          <div className="p-6 border-b border-red-200/50 dark:border-red-900/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="font-bold text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently remove your account and all associated data.</p>
              </div>
              <Button
                variant="destructive"
                className="rounded-xl px-6 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteAccount}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

