"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Paperclip, Send, MoreVertical, MessageSquareText,
  Loader2, Wifi, WifiOff, Sun, Moon, Bell, BellDot, X,
  FileText, Image as ImageIcon, File, CheckCircle2, Clock3,
  ChevronRight, Upload, AlertCircle, Trash2
} from "lucide-react";
import { io, Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  text: string;
  createdAt: string;
  isSystem: boolean;
  attachments?: UploadedFile[];
  sender?: { id: string; name: string; role: string } | null;
};

type TicketInfo = {
  id: string;
  title: string;
  status: string;
  priority: string;
  location?: string | null;
  device?: string | null;
  category?: { name: string };
  author?: { name: string; email: string };
  assignedTo?: { name: string } | null;
  createdAt: string;
};

type Notification = {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: "message" | "status" | "assignment";
};

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploading?: boolean;
  error?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { label: "Created", key: "OPEN", icon: CheckCircle2 },
  { label: "Assigned", key: "ASSIGNED", icon: CheckCircle2 },
  { label: "In Progress", key: "IN_PROGRESS", icon: Clock3 },
  { label: "Resolved", key: "RESOLVED", icon: CheckCircle2 },
];

const STATUS_MAP: Record<string, number> = {
  OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, RESOLVED: 3, CLOSED: 3,
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  LOW: { label: "Low", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  MEDIUM: { label: "Medium", cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  HIGH: { label: "High", cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  CRITICAL: { label: "Critical", cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf") return FileText;
  return File;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    ASSIGNED: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    CLOSED: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  };
  const labels: Record<string, string> = {
    OPEN: "Open", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved", CLOSED: "Closed",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotificationPanel({
  notifications,
  onClose,
  onMarkRead,
  onClearAll,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}) {
  const typeIcon: Record<Notification["type"], string> = {
    message: "💬", status: "🔄", assignment: "👤",
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={onClearAll} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            Clear all
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
            <Bell className="w-6 h-6" />
            <p className="text-xs">All caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
            >
              <span className="text-base mt-0.5">{typeIcon[n.type]}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${!n.read ? "font-medium text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>
                  {n.text}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── File Upload Preview ───────────────────────────────────────────────────────

function FileUploadPreview({
  files,
  onRemove,
}: {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="px-3 pt-2 flex flex-wrap gap-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.type);
        const isImage = file.type.startsWith("image/");

        return (
          <div
            key={file.id}
            className="relative group flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 max-w-[200px] transition-all"
          >
            {isImage && file.url ? (
              <img src={file.url} alt={file.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-blue-500" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
              <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
            </div>
            {file.uploading ? (
              <Loader2 className="w-3 h-3 text-blue-500 animate-spin shrink-0" />
            ) : file.error ? (
              <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
            ) : (
              <button
                onClick={() => onRemove(file.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Message Attachments ───────────────────────────────────────────────────────

function MessageAttachments({ files }: { files: UploadedFile[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.type);
        const isImage = file.type.startsWith("image/");
        return (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/20 dark:bg-black/20 rounded-xl px-3 py-2 hover:bg-white/30 transition-colors max-w-[180px]"
          >
            {isImage ? (
              <img src={file.url} alt={file.name} className="w-6 h-6 rounded object-cover shrink-0" />
            ) : (
              <Icon className="w-4 h-4 shrink-0" />
            )}
            <span className="text-xs truncate">{file.name}</span>
          </a>
        );
      })}
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function useDropZone(onFiles: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) onFiles(files);
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [onFiles]);

  return { ref, isDragging };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();

  // Core state
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New features state
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Dark mode
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
    document.body.style.backgroundColor = dark ? "#0a0f1e" : "";
    document.body.style.colorScheme = dark ? "dark" : "light";
  }, []);

  const applyTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
    // Force background on body so parent layouts respond immediately
    document.body.style.backgroundColor = dark ? "#0a0f1e" : "";
    document.body.style.colorScheme = dark ? "dark" : "light";
  };

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Close notifications on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add notification helper
  const addNotification = useCallback((text: string, type: Notification["type"]) => {
    const notif: Notification = {
      id: crypto.randomUUID(),
      text,
      time: "Just now",
      read: false,
      type,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 20));
  }, []);

  // Fetch + socket
  useEffect(() => {
    if (!ticketId) return;

    async function init() {
      try {
        const [ticketRes, messagesRes] = await Promise.all([
          fetch(`http://localhost:5000/api/tickets`),
          fetch(`http://localhost:5000/api/messages/${ticketId}`),
        ]);
        const [allTickets, msgs] = await Promise.all([ticketRes.json(), messagesRes.json()]);
        const found = allTickets.find((t: TicketInfo) => t.id === ticketId);
        setTicket(found || null);
        setMessages(msgs);
      } catch (err) {
        console.error("Failed to load ticket data", err);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_ticket", ticketId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      addNotification("Connection lost. Reconnecting…", "status");
    });

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.sender?.id !== user?.id && !msg.isSystem) {
        addNotification(`New message from ${msg.sender?.name ?? "Someone"}`, "message");
      }
    });

    socket.on("ticket_status_update", (data: { status: string }) => {
      setTicket((prev) => prev ? { ...prev, status: data.status } : prev);
      addNotification(`Ticket status changed to ${data.status.replace("_", " ")}`, "status");
    });

    socket.on("ticket_assigned", (data: { assigneeName: string }) => {
      addNotification(`Ticket assigned to ${data.assigneeName}`, "assignment");
    });

    return () => { socket.disconnect(); };
  }, [ticketId, user?.id, addNotification]);

  // File handling
  const handleFiles = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
      uploading: true,
    }));

    setPendingFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload (replace with real upload logic)
    newFiles.forEach((f) => {
      setTimeout(() => {
        setPendingFiles((prev) =>
          prev.map((p) => p.id === f.id ? { ...p, uploading: false } : p)
        );
      }, 1200 + Math.random() * 800);
    });
  }, []);

  const removeFile = (id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.url.startsWith("blob:")) URL.revokeObjectURL(file.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  const { ref: dropRef, isDragging } = useDropZone(handleFiles);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingFiles.length === 0) || !user || !socketRef.current) return;
    if (pendingFiles.some((f) => f.uploading)) return;

    socketRef.current.emit("send_message", {
      ticketId,
      text: newMessage.trim(),
      senderId: user.id,
      senderName: user.name,
      attachments: pendingFiles.map(({ id, name, size, type, url }) => ({ id, name, size, type, url })),
    });

    setNewMessage("");
    setPendingFiles([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentStep = ticket ? STATUS_MAP[ticket.status] ?? 0 : 0;

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading ticket…</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-5xl mx-auto text-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Ticket not found</h2>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-2">← Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const priorityConf = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.MEDIUM;

  return (
    <div className="max-w-6xl mx-auto space-y-5 px-1">

      {/* ── Top Bar ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Link href="/dashboard" className="mt-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 line-clamp-1">
                {ticket.title}
              </h1>
              <StatusBadge status={ticket.status} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityConf.cls}`}>
                {priorityConf.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono flex items-center gap-1.5">
              <span>#{ticket.id.slice(0, 8).toUpperCase()}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live indicator */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${isConnected
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Live" : "Offline"}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700 relative"
              onClick={() => setShowNotifications((p) => !p)}
            >
              {unreadCount > 0 ? <BellDot className="w-4 h-4 text-blue-500" /> : <Bell className="w-4 h-4" />}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            {showNotifications && (
              <NotificationPanel
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkRead={(id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))}
                onClearAll={() => setNotifications([])}
              />
            )}
          </div>

          {/* Dark mode toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl border-slate-200 dark:border-slate-700"
            onClick={toggleDark}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </Button>
        </div>
      </div>

      {/* ── Progress Timeline ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
        <div className="relative flex justify-between items-center">
          {/* Background track */}
          <div className="absolute left-[6%] right-[6%] top-4 h-0.5 bg-slate-100 dark:bg-slate-800" />
          {/* Progress fill */}
          <div
            className="absolute left-[6%] top-4 h-0.5 bg-blue-500 transition-all duration-700"
            style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 88}%` }}
          />
          {STATUS_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ring-4 ring-white dark:ring-slate-900 ${done ? "bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900" :
                  active ? "bg-white dark:bg-slate-900 border-2 border-blue-500 text-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/30" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700"
                  }`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[11px] font-semibold whitespace-nowrap ${active ? "text-blue-600 dark:text-blue-400" :
                  done ? "text-slate-700 dark:text-slate-300" :
                    "text-slate-400 dark:text-slate-500"
                  }`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Chat */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-260px)] min-h-[500px]">
          <div
            ref={dropRef}
            className={`flex flex-col flex-1 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${isDragging
              ? "border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800"
              : "border-slate-100 dark:border-slate-800"
              }`}
          >
            {/* Chat Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <MessageSquareText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold">Conversation</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {messages.filter((m) => !m.isSystem).length}
                </span>
              </div>
              {isDragging && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                  <Upload className="w-3.5 h-3.5" />
                  Drop files to attach
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
              {messages.length === 0 && !isDragging && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <MessageSquareText className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500">No messages yet. Start the conversation!</p>
                </div>
              )}

              {isDragging && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Drop your files here</p>
                  <p className="text-xs text-slate-400">Images, PDFs, and documents supported</p>
                </div>
              )}

              {!isDragging && messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[11px] py-1 px-3 rounded-full flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.sender?.id === user?.id;
                const isTech = msg.sender?.role === "TECHNICIAN" || msg.sender?.role === "ADMIN";
                const initials = msg.sender?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

                return (
                  <div key={msg.id} className={`flex gap-2.5 max-w-[82%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                    <Avatar className="h-7 w-7 mt-1 shrink-0 border shadow-sm border-slate-200 dark:border-slate-700">
                      <AvatarFallback className={`text-[9px] font-bold ${isMe ? "bg-blue-500 text-white" :
                        isTech ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" :
                          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {isMe ? "You" : msg.sender?.name}
                        </span>
                        {isTech && !isMe && (
                          <span className="text-[9px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                            Staff
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {msg.text && (
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${isMe
                          ? "bg-blue-500 text-white rounded-tr-sm"
                          : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-sm"
                          }`}>
                          {msg.text}
                        </div>
                      )}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <MessageAttachments files={msg.attachments} />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* File previews */}
            {pendingFiles.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <FileUploadPreview files={pendingFiles} onRemove={removeFile} />
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) handleFiles(files);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-slate-400 hover:text-blue-500 rounded-xl h-9 w-9 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <input
                  placeholder={isConnected ? "Type a message…" : "Connecting…"}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-10 px-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={!isConnected}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as unknown as React.FormEvent);
                    }
                  }}
                />

                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 h-10 w-10 rounded-xl bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-200 dark:shadow-blue-900/30 transition-all disabled:opacity-40"
                  disabled={(!newMessage.trim() && pendingFiles.length === 0) || !isConnected || pendingFiles.some((f) => f.uploading)}
                >
                  {pendingFiles.some((f) => f.uploading)
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4 ml-0.5" />
                  }
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-4">
          <Card className="shadow-sm border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 px-5 pt-5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-700 dark:text-slate-200">
                Ticket Details
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete Ticket
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-4 text-sm">
              {[
                { label: "Requester", value: ticket.author?.name },
                { label: "Email", value: ticket.author?.email },
                { label: "Category", value: ticket.category?.name },
                { label: "Priority", value: priorityConf.label },
                { label: "Assigned To", value: ticket.assignedTo?.name ?? "Unassigned" },
                { label: "Location", value: ticket.location ?? "—" },
                { label: "Device", value: ticket.device ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500">{label}</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate">{value ?? "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick upload card */}
          <div
            className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 text-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              Upload files
            </p>
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5">or drag & drop into chat</p>
          </div>
        </div>
      </div>
    </div>
  );
}