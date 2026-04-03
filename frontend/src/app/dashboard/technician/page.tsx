"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Search, PlayCircle, MessageSquare, Loader2, Clock, UserPlus, ClipboardList, InboxIcon } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { API_URL, fetchWithAuth, ENDPOINTS } from "@/lib/api";

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
    case "OPEN":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">Open</Badge>;
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
  const router = useRouter();
  const { user } = useAuth();
  const [assignedTickets, setAssignedTickets] = useState<TechnicianTicket[]>([]);
  const [unassignedTickets, setUnassignedTickets] = useState<TechnicianTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnassignedLoading, setIsUnassignedLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssignedTickets() {
      if (!user?.id) return;
      try {
        const res = await fetchWithAuth(ENDPOINTS.TICKETS.ASSIGNED(user.id));
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setAssignedTickets(data);
        } else {
          setAssignedTickets([]);
        }
      } catch (err) {
        console.error("Failed to fetch technician tickets", err);
        setAssignedTickets([]);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchUnassignedTickets() {
      try {
        const res = await fetchWithAuth(ENDPOINTS.TICKETS.UNASSIGNED);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setUnassignedTickets(data);
        } else {
          setUnassignedTickets([]);
        }
      } catch (err) {
        console.error("Failed to fetch unassigned tickets", err);
        setUnassignedTickets([]);
      } finally {
        setIsUnassignedLoading(false);
      }
    }

    fetchAssignedTickets();
    fetchUnassignedTickets();
  }, [user?.id]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      const res = await fetchWithAuth(`${ENDPOINTS.TICKETS.BASE}/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      setAssignedTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    if (!user?.id) return;
    setUpdatingId(ticketId);
    try {
      const res = await fetchWithAuth(`${ENDPOINTS.TICKETS.BASE}/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify({ assignedToId: user.id, status: "ASSIGNED" }),
      });
      if (!res.ok) throw new Error("Failed to claim ticket");
      
      // Move from unassigned to assigned
      const claimedTicket = unassignedTickets.find(t => t.id === ticketId);
      if (claimedTicket) {
        const updatedTicket = { ...claimedTicket, status: "ASSIGNED" };
        setAssignedTickets(prev => [updatedTicket, ...prev]);
        setUnassignedTickets(prev => prev.filter(t => t.id !== ticketId));
      }
    } catch (err) {
      console.error("Claim failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAssigned = assignedTickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.author.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUnassigned = unassignedTickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.author.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const inProgressCount = assignedTickets.filter(t => t.status === "IN_PROGRESS").length;
  const pendingCount = assignedTickets.filter(t => t.status === "ASSIGNED").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Technician Workspace</h1>
          <p className="text-muted-foreground mt-1">Manage assigned tasks and claim new requests.</p>
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
               <span className="text-blue-600 dark:text-blue-400 font-bold">{unassignedTickets.length}</span>
             </div>
             <div>
               <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Available</p>
               <p className="text-sm font-medium text-foreground leading-none mt-0.5">Unassigned</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tickets..."
            className="pl-9 h-10 bg-card border-border focus-visible:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="bg-muted/50 p-1 border border-border rounded-xl">
          <TabsTrigger value="assigned" className="rounded-lg px-5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ClipboardList className="mr-2 h-4 w-4" />
            My Assigned Queue
            {assignedTickets.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px] h-5 min-w-5 px-1 justify-center">
                {assignedTickets.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="rounded-lg px-5 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm text-muted-foreground data-[state=active]:text-foreground">
            <InboxIcon className="mr-2 h-4 w-4" />
            Available Board
            {unassignedTickets.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-none text-[10px] h-5 min-w-5 px-1 justify-center">
                {unassignedTickets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="mt-6">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-border">
                  <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-wider text-muted-foreground">ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Title</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Requester</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Priority</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredAssigned.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="hover:bg-primary/5 cursor-pointer transition-colors group border-border"
                    onClick={() => router.push(`/dashboard/ticket/${ticket.id}`)}
                  >
                    <TableCell className="font-mono font-medium text-primary dark:text-blue-400 text-sm">
                      #{ticket.id.slice(0, 4)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm max-w-[120px] sm:max-w-[400px] truncate">
                      {ticket.title}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{ticket.author.name}</span>
                        <span className="text-[11px] underline decoration-muted/50">{ticket.author.email}</span>
                      </div>
                    </TableCell>
                    <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                    <TableCell><StatusBadge status={ticket.status} /></TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2 p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[11px] font-bold shadow-sm rounded-lg"
                            disabled={updatingId === ticket.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {updatingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Manage"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Update Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, "IN_PROGRESS"); }}
                            className="cursor-pointer font-bold text-orange-600 dark:text-orange-400 focus:text-orange-700"
                          >
                            <PlayCircle className="mr-2 h-4 w-4" /> Start Working
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, "WAITING"); }}
                            className="cursor-pointer font-medium"
                          >
                            <Clock className="mr-2 h-4 w-4" /> Need More Info
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, "RESOLVED"); }}
                            className="cursor-pointer font-bold text-green-600 dark:text-green-400 focus:text-green-700"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {!isLoading && filteredAssigned.length === 0 && (
              <div className="p-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-display">No tasks assigned</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">Either you're all caught up or you should check the available board for new tickets.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unassigned" className="mt-6">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-border">
                  <TableHead className="w-[80px] font-bold text-[10px] uppercase tracking-wider text-muted-foreground">ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Title</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Requester</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Priority</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center">Wait Time</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-muted-foreground px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isUnassignedLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredUnassigned.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="hover:bg-orange-50/30 dark:hover:bg-orange-900/5 cursor-pointer transition-colors group border-border"
                    onClick={() => router.push(`/dashboard/ticket/${ticket.id}`)}
                  >
                    <TableCell className="font-mono font-medium text-orange-600 dark:text-orange-400 text-sm">
                      #{ticket.id.slice(0, 4)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm max-w-[120px] sm:max-w-[400px] truncate">
                      {ticket.title}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{ticket.author.name}</span>
                        <span className="text-[11px]">{ticket.author.email}</span>
                      </div>
                    </TableCell>
                    <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                    <TableCell className="text-center">
                       <div className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                         <Clock className="h-3 w-3" />
                         {new Date(ticket.createdAt).toLocaleDateString()}
                       </div>
                    </TableCell>
                    <TableCell className="text-right p-2">
                      <Button
                        size="sm"
                        className="h-8 bg-black hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 text-[11px] font-bold shadow-sm rounded-lg"
                        disabled={updatingId === ticket.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimTicket(ticket.id);
                        }}
                      >
                        {updatingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                          <>
                            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                            Claim Ticket
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {!isUnassignedLoading && filteredUnassigned.length === 0 && (
              <div className="p-16 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-4 border border-green-200 dark:border-green-800">
                  <InboxIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground font-display">No Available Tickets</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">Great job! All customer requests are currently assigned to technicians.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
