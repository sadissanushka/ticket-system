"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { API_URL, fetchWithAuth } from "@/lib/api";

type Ticket = {
  id: string;
  title: string;
  category?: { name: string };
  status: string;
  priority: string;
  createdAt: string;
  authorId: string;
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">Open</Badge>;
    case "ASSIGNED":    return <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">Assigned</Badge>;
    case "IN_PROGRESS": return <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800">In Progress</Badge>;
    case "WAITING":     return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800">Waiting</Badge>;
    case "RESOLVED":    return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">Resolved</Badge>;
    case "CLOSED":      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">Closed</Badge>;
    default:            return <Badge variant="outline">{status}</Badge>;
  }
}

// Reusable ticket table
function TicketTable({
  tickets, isLoading,
}: {
  tickets: Ticket[];
  isLoading: boolean;
}) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader className="bg-muted/40">
        <TableRow>
          <TableHead className="w-[110px] font-semibold">Ticket ID</TableHead>
          <TableHead className="font-semibold">Title</TableHead>
          <TableHead className="font-semibold">Category</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            </TableCell>
          </TableRow>
        ) : tickets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              No tickets in this category.
            </TableCell>
          </TableRow>
        ) : (
          tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className="hover:bg-primary/5 cursor-pointer transition-colors group"
              onClick={() => router.push(`/dashboard/ticket/${ticket.id}`)}
            >
              <TableCell className="font-mono font-medium text-primary text-xs">
                {ticket.id.slice(0, 8)}
              </TableCell>
              <TableCell className="font-medium text-foreground group-hover:text-primary transition-colors">
                {ticket.title}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.category?.name || "N/A"}
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchMyTickets() {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/tickets`);
        const data = await response.json();
        
        // Defensive check: if backend returns an object with error: "...", 
        // don't try to filter it.
        if (Array.isArray(data)) {
          setTickets(data);
        } else {
          console.error("Expected array from API but got:", data);
          setTickets([]);
        }
      } catch (error) {
        console.error("Failed to fetch tickets", error);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) fetchMyTickets();
  }, [user]);

  // Apply search filter on top of everything
  const searched = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Tab-specific filtered lists
  const allTickets = searched;
  const openTickets = searched.filter((t) => t.status === "OPEN" || t.status === "ASSIGNED");
  const inProgressTickets = searched.filter((t) => t.status === "IN_PROGRESS" || t.status === "WAITING");
  const resolvedTickets = searched.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage and track your IT support requests.</p>
        </div>
        <Link href="/dashboard/create-ticket">
          <Button className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <Tabs defaultValue="all" className="w-full">
          {/* Tab Bar + Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="all">
                All
                <span className="ml-1.5 text-[11px] font-bold bg-muted text-muted-foreground rounded-full px-1.5">{tickets.length}</span>
              </TabsTrigger>
              <TabsTrigger value="open">
                Open
                <span className="ml-1.5 text-[11px] font-bold bg-blue-100 text-blue-600 rounded-full px-1.5">{openTickets.length}</span>
              </TabsTrigger>
              <TabsTrigger value="in-progress">
                In Progress
                <span className="ml-1.5 text-[11px] font-bold bg-orange-100 text-orange-600 rounded-full px-1.5">{inProgressTickets.length}</span>
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved
                <span className="ml-1.5 text-[11px] font-bold bg-green-100 text-green-600 rounded-full px-1.5">{resolvedTickets.length}</span>
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tickets..."
                className="pl-9 bg-muted/40 border-border focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* All Tabs share the same TicketTable component, just with different filtered data */}
          <TabsContent value="all" className="mt-0 border rounded-lg overflow-hidden">
            <TicketTable tickets={allTickets} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="open" className="mt-0 border rounded-lg overflow-hidden">
            <TicketTable tickets={openTickets} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="in-progress" className="mt-0 border rounded-lg overflow-hidden">
            <TicketTable tickets={inProgressTickets} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="resolved" className="mt-0 border rounded-lg overflow-hidden">
            <TicketTable tickets={resolvedTickets} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
