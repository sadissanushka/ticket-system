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
    case "OPEN":        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Open</Badge>;
    case "ASSIGNED":    return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Assigned</Badge>;
    case "IN_PROGRESS": return <Badge className="bg-orange-100 text-orange-700 border-orange-200">In Progress</Badge>;
    case "WAITING":     return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Waiting</Badge>;
    case "RESOLVED":    return <Badge className="bg-green-100 text-green-700 border-green-200">Resolved</Badge>;
    case "CLOSED":      return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Closed</Badge>;
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
      <TableHeader className="bg-gray-50/50">
        <TableRow>
          <TableHead className="w-[110px] font-semibold">Ticket ID</TableHead>
          <TableHead className="font-semibold">Title</TableHead>
          <TableHead className="font-semibold">Category</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="text-right font-semibold">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
            </TableCell>
          </TableRow>
        ) : tickets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-gray-500">
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
              <TableCell className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                {ticket.title}
              </TableCell>
              <TableCell className="text-gray-500">
                {ticket.category?.name || "N/A"}
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell className="text-right text-sm text-gray-500">
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
        const response = await fetch("http://localhost:5000/api/tickets");
        const data = await response.json();
        const myTickets =
          user?.role === "STUDENT"
            ? data.filter((t: Ticket) => t.authorId === user.id)
            : data;
        setTickets(myTickets);
      } catch (error) {
        console.error("Failed to fetch tickets", error);
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Tickets</h1>
          <p className="text-gray-500 mt-1">Manage and track your IT support requests.</p>
        </div>
        <Link href="/dashboard/create-ticket">
          <Button className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Tabs defaultValue="all" className="w-full">
          {/* Tab Bar + Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="bg-gray-100/80">
              <TabsTrigger value="all">
                All
                <span className="ml-1.5 text-[11px] font-bold bg-gray-200 text-gray-600 rounded-full px-1.5">{tickets.length}</span>
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
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search tickets..."
                className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-primary/20"
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
