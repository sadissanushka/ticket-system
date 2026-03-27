"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Search, PlayCircle, MessageSquare, Loader2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

type TechnicianTicket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  author: { name: string; email: string };
  category: { name: string };
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ASSIGNED":
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50">Assigned</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50">In Progress</Badge>;
    case "WAITING":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50">Waiting</Badge>;
    case "RESOLVED":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50">Resolved</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "HIGH":
      return <span className="text-red-600 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-600"></div> High</span>;
    case "MEDIUM":
      return <span className="text-orange-500 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div> Med</span>;
    default:
      return <span className="text-gray-500 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div> Low</span>;
  }
}

export default function TechnicianDashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TechnicianTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_URL}/api/tickets/assigned/${user.id}`);
        const data = await res.json();
        setTickets(data);
      } catch (err) {
        console.error("Failed to fetch technician tickets", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTickets();
  }, [user?.id]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.author.name.toLowerCase().includes(search.toLowerCase()) ||
    t.author.email.toLowerCase().includes(search.toLowerCase())
  );

  const inProgressCount = tickets.filter(t => t.status === "IN_PROGRESS").length;
  const assignedCount = tickets.filter(t => t.status === "ASSIGNED").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Assigned Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and resolve tickets assigned to you.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-orange-50/10 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30 rounded-lg px-4 py-2 flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
               <span className="text-orange-600 dark:text-orange-400 font-bold">{inProgressCount}</span>
             </div>
             <div>
               <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">In Progress</p>
               <p className="text-sm font-medium text-foreground leading-none mt-0.5">Active tasks</p>
             </div>
          </div>
          <div className="bg-blue-50/10 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-4 py-2 flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
               <span className="text-blue-600 dark:text-blue-400 font-bold">{assignedCount}</span>
             </div>
             <div>
               <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Pending</p>
               <p className="text-sm font-medium text-foreground leading-none mt-0.5">New assignments</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <h2 className="font-semibold text-lg text-foreground">Your Action Queue</h2>
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-9 h-9 bg-background border-border focus-visible:ring-primary/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[80px] font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">ID</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Issue Title</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Requester</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Priority</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredTickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-primary/5 transition-colors group">
                <TableCell className="font-mono font-medium text-primary text-sm">{ticket.id.slice(0, 8)}</TableCell>
                <TableCell className="font-medium text-foreground text-sm max-w-[250px] truncate">{ticket.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium">{ticket.author.name}</span>
                    <span className="text-[11px]">{ticket.author.email}</span>
                  </div>
                </TableCell>
                <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                <TableCell><StatusBadge status={ticket.status} /></TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2 p-2">
                  <Link href={`/dashboard/ticket/${ticket.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-muted-foreground hover:text-primary">
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      View Details
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="outline-none">
                      <Button size="sm" className="h-8 text-[11px] font-bold shadow-sm" disabled={updatingId === ticket.id}>
                        {updatingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(ticket.id, "IN_PROGRESS")}
                        className="cursor-pointer font-bold text-orange-600 dark:text-orange-400 focus:text-orange-700 focus:bg-orange-50 dark:focus:bg-orange-950/30"
                      >
                        <PlayCircle className="mr-2 h-4 w-4" /> Start Work
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(ticket.id, "WAITING")}
                        className="cursor-pointer font-medium"
                      >
                        <Clock className="mr-2 h-4 w-4" /> Wait for User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleUpdateStatus(ticket.id, "RESOLVED")}
                        className="cursor-pointer font-bold text-green-600 dark:text-green-400 focus:text-green-700 focus:bg-green-50 dark:focus:bg-green-950/30"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {!isLoading && filteredTickets.length === 0 && (
           <div className="p-12 text-center">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100/50 dark:bg-green-900/30 mb-4 border border-green-200 dark:border-green-800">
               <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
             </div>
             <h3 className="text-lg font-bold text-foreground">You're all caught up!</h3>
             <p className="text-muted-foreground mt-1">There are no tickets assigned to you right now.</p>
           </div>
        )}
      </div>
    </div>
  );
}
