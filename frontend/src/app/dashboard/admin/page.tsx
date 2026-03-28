"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Search, LayoutDashboard, Ticket, CheckCircle2, Clock, Loader2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { API_URL, fetchWithAuth } from "@/lib/api";

// --- Types ---
type AdminTicket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category?: { name: string };
  author?: { name: string; email: string };
  assignedTo?: { id: string; name: string } | null;
  createdAt: string;
};

type Technician = {
  id: string;
  name: string;
  email: string;
};

// --- Sub-components ---
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":        return <Badge className="bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">Open</Badge>;
    case "ASSIGNED":    return <Badge className="bg-purple-100/80 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/50">Assigned</Badge>;
    case "IN_PROGRESS": return <Badge className="bg-orange-100/80 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50">In Progress</Badge>;
    case "WAITING":     return <Badge className="bg-yellow-100/80 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50">Waiting</Badge>;
    case "RESOLVED":    return <Badge className="bg-green-100/80 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50">Resolved</Badge>;
    case "CLOSED":      return <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">Closed</Badge>;
    default:            return <Badge variant="outline">{status}</Badge>;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "HIGH":   return <span className="text-red-600 dark:text-red-400 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" /> High</span>;
    case "MEDIUM": return <span className="text-orange-500 dark:text-orange-400 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400" /> Med</span>;
    default:       return <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" /> Low</span>;
  }
}

// --- Main Page ---
export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Assignment dialog state
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; ticketId: string; ticketTitle: string }>({
    open: false, ticketId: "", ticketTitle: "",
  });
  const [selectedTechId, setSelectedTechId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch tickets and technicians in parallel
  useEffect(() => {
    async function loadData() {
      try {
        const [ticketsRes, techsRes] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/tickets`),
          fetchWithAuth(`${API_URL}/api/users/role/technician`),
        ]);
        const [ticketsData, techsData] = await Promise.all([
          ticketsRes.json(), techsRes.json(),
        ]);
        
        // Defensive checks for arrays
        if (Array.isArray(ticketsData)) {
          setTickets(ticketsData);
        } else {
          console.error("Expected array for tickets, got:", ticketsData);
          setTickets([]);
        }

        if (Array.isArray(techsData)) {
          setTechnicians(techsData);
        } else {
          console.error("Expected array for technicians, got:", techsData);
          setTechnicians([]);
        }
      } catch (err) {
        console.error("Failed to load admin data", err);
        setTickets([]);
        setTechnicians([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const openAssignDialog = (ticket: AdminTicket) => {
    setSelectedTechId(ticket.assignedTo?.id || "");
    setAssignDialog({ open: true, ticketId: ticket.id, ticketTitle: ticket.title });
  };

  const handleAssign = async () => {
    if (!selectedTechId) return;
    setIsAssigning(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/api/tickets/${assignDialog.ticketId}`, {
        method: "PUT",
        body: JSON.stringify({
          assignedToId: selectedTechId,
          status: "ASSIGNED",
        }),
      });

      if (!res.ok) throw new Error("Failed to assign");

      // Optimistically update local state
      const assignedTech = technicians.find((t) => t.id === selectedTechId);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === assignDialog.ticketId
            ? { ...t, assignedTo: assignedTech ? { id: assignedTech.id, name: assignedTech.name } : null, status: "ASSIGNED" }
            : t
        )
      );

      setAssignDialog({ open: false, ticketId: "", ticketTitle: "" });
    } catch (err) {
      console.error("Assignment failed", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const filtered = tickets.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.author?.email.toLowerCase().includes(search.toLowerCase())
  );

  // Derived stats from real data
  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Support Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and assign incoming IT support requests.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/admin/kanban">
            <Button variant="outline" className="shadow-sm border-border bg-card hover:bg-muted text-foreground transition-all">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Kanban View
            </Button>
          </Link>
          <Link href="/dashboard/create-ticket">
            <Button className="shadow-sm transition-all">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards — live counts from DB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{tickets.length}</div>
            <p className="text-xs text-blue-500 font-medium mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{openCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs assignment</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Being handled</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{resolvedCount}</div>
            <p className="text-xs text-green-500 font-medium mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-300">
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-semibold text-lg text-foreground">All Tickets</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title or user..."
              className="pl-9 h-9 bg-background border-border focus-visible:ring-primary/20 text-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-border">
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground w-24">ID</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">User</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Issue</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Category</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Priority</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Assigned To</TableHead>
              <TableHead className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-primary/5 transition-colors border-border group">
                  <TableCell className="font-mono font-medium text-primary text-xs">{ticket.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                       <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 border border-border">
                          {ticket.author?.name?.charAt(0) ?? "?"}
                       </div>
                      <span className="text-muted-foreground truncate max-w-[120px]" title={ticket.author?.email}>
                        {ticket.author?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground text-sm max-w-[250px] truncate">{ticket.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ticket.category?.name || "—"}</TableCell>
                  <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                  <TableCell><StatusBadge status={ticket.status} /></TableCell>
                  <TableCell className="text-sm">
                    {ticket.assignedTo ? (
                      <span className="flex items-center gap-1.5 text-foreground font-medium">
                        <UserCheck className="h-3.5 w-3.5 text-green-500" />
                        {ticket.assignedTo.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-primary font-medium">
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Ticket Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 font-medium"
                          onClick={() => openAssignDialog(ticket)}
                        >
                          <UserCheck className="h-4 w-4 text-primary" />
                          Assign Technician
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="p-0">
                          <Link href={`/dashboard/ticket/${ticket.id}`} className="cursor-pointer text-primary font-bold w-full px-2 py-1.5 flex items-center">
                            View Full Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Technician Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(o) => setAssignDialog((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Assign Technician
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1 line-clamp-2">
              <span className="font-medium text-foreground">Ticket:</span> {assignDialog.ticketTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select value={selectedTechId} onValueChange={(val) => setSelectedTechId(val || "")}>
              <SelectTrigger className="h-11">
                <div className="flex flex-1 text-left line-clamp-1">
                  {selectedTechId 
                    ? technicians.find(t => t.id === selectedTechId)?.name 
                    : "Select a technician..."}
                </div>
              </SelectTrigger>
              <SelectContent>
                {technicians.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">No technicians found in database.</div>
                ) : (
                  technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{tech.name}</span>
                        <span className="text-xs text-muted-foreground">{tech.email}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialog((s) => ({ ...s, open: false }))}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedTechId || isAssigning}>
              {isAssigning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
