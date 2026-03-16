"use client";

import Link from "next/link";
import { CheckCircle2, Search, PlayCircle, MessageSquare } from "lucide-react";

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

const techTickets = [
  { id: "#234", title: "WiFi not working in Lab 2", category: "Network", status: "In Progress", priority: "High", user: "s.smith@stitchu.edu", time: "2 hrs ago" },
  { id: "#232", title: "Need Photoshop installed on Lab PC 12", category: "Software", status: "Waiting", priority: "Low", user: "m.mouse@stitchu.edu", time: "18 hrs ago" },
  { id: "#228", title: "Replace keyboard in IT Office", category: "Hardware", status: "Assigned", priority: "Medium", user: "h.potter@stitchu.edu", time: "1 day ago" },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Assigned":
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">Assigned</Badge>;
    case "In Progress":
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">In Progress</Badge>;
    case "Waiting":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Waiting on User</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "High":
      return <span className="text-red-600 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-600"></div> High</span>;
    case "Medium":
      return <span className="text-orange-500 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div> Med</span>;
    case "Low":
      return <span className="text-gray-500 font-semibold text-xs flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div> Low</span>;
    default:
      return <span>{priority}</span>;
  }
}

export default function TechnicianDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Assigned Tasks</h1>
          <p className="text-gray-500 mt-1">Manage and resolve tickets assigned to you.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-2 flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
               <span className="text-orange-600 font-bold">1</span>
             </div>
             <div>
               <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">In Progress</p>
               <p className="text-sm font-medium text-gray-900 leading-none mt-0.5">Currently working on</p>
             </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
               <span className="text-blue-600 font-bold">2</span>
             </div>
             <div>
               <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Pending</p>
               <p className="text-sm font-medium text-gray-900 leading-none mt-0.5">Assigned to you</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-lg text-gray-800">Your Action Queue</h2>
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-9 h-9 bg-white border-gray-200 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/30 hover:bg-gray-50/30">
              <TableHead className="w-[80px] font-semibold text-xs uppercase tracking-wider text-gray-500">ID</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Issue Title</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Requester</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Priority</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-gray-500">Status</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-gray-500">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {techTickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-blue-50/30 transition-colors group">
                <TableCell className="font-medium text-primary text-sm">{ticket.id}</TableCell>
                <TableCell className="font-medium text-gray-900 text-sm max-w-[250px] truncate">{ticket.title}</TableCell>
                <TableCell className="text-sm text-gray-500">{ticket.user}</TableCell>
                <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                <TableCell><StatusBadge status={ticket.status} /></TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2">
                  <Link href={`/dashboard/ticket/${ticket.id.replace('#', '')}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-gray-600 hover:text-primary">
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      View Details
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none">
                      <Button size="sm" className="h-8 text-xs font-medium shadow-sm">
                        Update
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer font-medium text-orange-600">
                        <PlayCircle className="mr-2 h-4 w-4" /> Start Work
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Wait for User</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer font-medium text-green-600">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {techTickets.length === 0 && (
           <div className="p-12 text-center">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
               <CheckCircle2 className="h-6 w-6 text-green-600" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">You're all caught up!</h3>
             <p className="text-gray-500 mt-1">There are no tickets assigned to you right now.</p>
           </div>
        )}
      </div>
    </div>
  );
}
