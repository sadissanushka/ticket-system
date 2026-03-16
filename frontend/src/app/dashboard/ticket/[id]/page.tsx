"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Paperclip, Send, MoreVertical, MessageSquareText, Loader2, Wifi } from "lucide-react";
import { io, Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

type Message = {
  id: string;
  text: string;
  createdAt: string;
  isSystem: boolean;
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

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Open</Badge>;
    case "ASSIGNED":    return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Assigned</Badge>;
    case "IN_PROGRESS": return <Badge className="bg-orange-100 text-orange-700 border-orange-200">In Progress</Badge>;
    case "RESOLVED":    return <Badge className="bg-green-100 text-green-700 border-green-200">Resolved</Badge>;
    case "CLOSED":      return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
    default:            return <Badge variant="outline">{status}</Badge>;
  }
}

const STATUS_STEPS = ["Created", "Assigned", "In Progress", "Resolved"];
const STATUS_MAP: Record<string, number> = {
  OPEN: 0, ASSIGNED: 1, IN_PROGRESS: 2, RESOLVED: 3, CLOSED: 3,
};

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch ticket info + initial messages, then set up socket
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

    // Connect to Socket.io server
    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_ticket", ticketId);
    });

    socket.on("disconnect", () => setIsConnected(false));

    // New message from server → append to list
    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !socketRef.current) return;

    socketRef.current.emit("send_message", {
      ticketId,
      text: newMessage.trim(),
      senderId: user.id,
      senderName: user.name,
    });

    setNewMessage("");
  };

  const currentStep = ticket ? STATUS_MAP[ticket.status] ?? 0 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-5xl mx-auto text-center py-24">
        <h2 className="text-xl font-bold text-gray-700">Ticket not found</h2>
        <Link href="/dashboard"><Button className="mt-4" variant="outline">Back to Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-gray-200">
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 line-clamp-1">{ticket.title}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="text-sm text-gray-500 font-mono mt-1">
              Ticket {ticket.id.slice(0, 8)} • {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isConnected ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            <Wifi className="h-3 w-3" />
            {isConnected ? "Live" : "Connecting..."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Chat */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-210px)] space-y-4">
          {/* Progress Timeline */}
          <Card className="shadow-sm border-gray-100 shrink-0">
            <CardContent className="pt-6">
              <div className="relative flex justify-between items-center w-full px-4">
                <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0">
                  <div className="h-full bg-primary/40 transition-all" style={{ width: `${(currentStep / 3) * 100}%` }} />
                </div>
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className={`relative z-10 flex flex-col items-center gap-2 ${i > currentStep ? "opacity-40" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white ${
                      i < currentStep ? "bg-primary text-primary-foreground" :
                      i === currentStep ? "bg-orange-100 text-orange-600 border-2 border-orange-500 animate-pulse" :
                      "bg-gray-100 text-gray-400 border-2 border-gray-200"
                    }`}>{i + 1}</div>
                    <span className={`text-xs font-semibold ${i === currentStep ? "text-orange-600" : "text-gray-700"}`}>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card className="shadow-sm border-gray-100 flex-1 flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2 text-gray-800">
                <MessageSquareText className="w-4 h-4 text-gray-500" />
                <CardTitle className="text-base">Conversation</CardTitle>
              </div>
            </CardHeader>

            {/* Messages area */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
                  <MessageSquareText className="h-8 w-8" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              )}
              {messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-gray-100 text-gray-500 text-xs py-1 px-4 rounded-full flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                const isMe = msg.sender?.id === user?.id;
                const isTech = msg.sender?.role === "TECHNICIAN" || msg.sender?.role === "ADMIN";

                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                    <Avatar className={`h-8 w-8 mt-1 shrink-0 border shadow-sm ${isMe ? "border-primary" : "border-gray-200"}`}>
                      <AvatarFallback className={`text-[10px] font-bold ${isMe ? "bg-primary text-primary-foreground" : isTech ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                        {msg.sender?.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700">{isMe ? "You" : msg.sender?.name}</span>
                        <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 rounded-full h-9 w-9">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  placeholder={isConnected ? "Type a message..." : "Connecting to chat..."}
                  className="flex-1 bg-gray-50 border-gray-200 rounded-full h-10 focus-visible:ring-primary/20"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={!isConnected}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 h-10 w-10 rounded-full shadow-sm"
                  disabled={!newMessage.trim() || !isConnected}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column — Ticket Info */}
        <div className="space-y-4">
          <Card className="shadow-sm border-gray-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Ticket Information
                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete Ticket</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Requester", value: ticket.author?.name },
                { label: "Email", value: ticket.author?.email },
                { label: "Category", value: ticket.category?.name },
                { label: "Priority", value: ticket.priority },
                { label: "Assigned To", value: ticket.assignedTo?.name || "Unassigned" },
                { label: "Location", value: ticket.location || "—" },
                { label: "Device", value: ticket.device || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
