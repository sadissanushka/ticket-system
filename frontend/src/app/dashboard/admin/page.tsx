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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
    case "OPEN":        return <Badge className="bg-blue-100/80 text-blue-700 border-blue-200">Open</Badge>;
    case "ASSIGNED":    return <Badge className="bg-purple-100/80 text-purple-700 border-purple-200">Assigned</Badge>;
    case "IN_PROGRESS": return <Badge className="bg-orange-100/80 text-orange-700 border-orange-200">In Progress</Badge>;
    case "WAITING":     return <Badge className="bg-yellow-100/80 text-yellow-700 border-yellow-200">Waiting</Badge>;
    case "RESOLVED":    return <Badge className="bg-green-100/80 text-green-700 border-green-200">Resolved</Badge>;
    case "CLOSED":      return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Closed</Badge>;
    default:            return <Badge variant="outline">{status}</Badge>;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "HIGH":   return <span className="text-red-600 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-600" /> High</span>;
    case "MEDIUM": return <span className="text-orange-500 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Med</span>;
    default:       return <span className="text-gray-500 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Low</span>;
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
          fetch("http://localhost:5000/api/tickets"),
          fetch("http://localhost:5000/api/users/role/technician"),
        ]);
        const [ticketsData, techsData] = await Promise.all([
          ticketsRes.json(), techsRes.json(),
        ]);
        setTickets(ticketsData);
        setTechnicians(techsData);
      } catch (err) {
        console.error("Failed to load admin data", err);
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
      const res = await fetch(`http://localhost:5000/api/tickets/${assignDialog.ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Support Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor and assign incoming faculty IT requests.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/admin/kanban">
            <Button variant="outline" className="shadow-sm bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Kanban View
            </Button>
          </Link>
          <Link href="/dashboard/create-ticket">
            <Button className="shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards — live counts from DB */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
            <p className="text-xs text-blue-600 font-medium mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Open Tickets</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{openCount}</div>
            <p className="text-xs text-gray-500 mt-1">Needs assignment</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{inProgressCount}</div>
            <p className="text-xs text-gray-500 mt-1">Being handled</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{resolvedCount}</div>
            <p className="text-xs text-green-600 font-medium mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-semibold text-lg text-gray-800">All Tickets</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by title or user..."
              className="pl-9 h-9 bg-white border-gray-200 focus-visible:ring-primary/20 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/30 hover:bg-gray-50/30">
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500 w-24">ID</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">User</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Issue</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Category</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Priority</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Status</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Assigned To</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-gray-500">Actions</TableHead>
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
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-gray-500">No tickets found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-blue-50/30 transition-colors">
                  <TableCell className="font-mono font-medium text-primary text-xs">{ticket.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600">
                          {ticket.author?.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-600 truncate max-w-[120px]" title={ticket.author?.email}>
                        {ticket.author?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 text-sm max-w-[250px] truncate">{ticket.title}</TableCell>
                  <TableCell className="text-sm text-gray-500">{ticket.category?.name || "—"}</TableCell>
                  <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                  <TableCell><StatusBadge status={ticket.status} /></TableCell>
                  <TableCell className="text-sm">
                    {ticket.assignedTo ? (
                      <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <UserCheck className="h-3.5 w-3.5 text-green-600" />
                        {ticket.assignedTo.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-primary font-medium">
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Ticket Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer gap-2"
                          onClick={() => openAssignDialog(ticket)}
                        >
                          <UserCheck className="h-4 w-4 text-primary" />
                          Assign Technician
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/ticket/${ticket.id}`} className="cursor-pointer text-blue-600 font-medium">
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
            <DialogDescription className="text-sm text-gray-500 pt-1 line-clamp-2">
              <span className="font-medium text-gray-700">Ticket:</span> {assignDialog.ticketTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a technician..." />
              </SelectTrigger>
              <SelectContent>
                {technicians.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400 text-center">No technicians found in database.</div>
                ) : (
                  technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{tech.name}</span>
                        <span className="text-xs text-gray-400">{tech.email}</span>
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
