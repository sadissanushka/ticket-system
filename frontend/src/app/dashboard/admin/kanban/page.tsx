"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, AlertCircle, Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types — priority matches Prisma enum casing from the API
type Ticket = {
  id: string;
  title: string;
  category: string;
  priority: string;
  assignedTo: string | null;
  timeAgo: string;
};

type ColumnData = {
  id: string;
  title: string;
  ticketIds: string[];
};

type KanbanData = {
  tickets: Record<string, Ticket>;
  columns: Record<string, ColumnData>;
  columnOrder: string[];
};

function PriorityIndicator({ priority }: { priority: string }) {
  if (priority === "HIGH") return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> High</span>;
  if (priority === "MEDIUM") return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">Medium</span>;
  return <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">Low</span>;
}

const emptyKanban = (): KanbanData => ({
  tickets: {},
  columns: {
    "OPEN":        { id: "OPEN",        title: "Open",           ticketIds: [] },
    "ASSIGNED":    { id: "ASSIGNED",    title: "Assigned",       ticketIds: [] },
    "IN_PROGRESS": { id: "IN_PROGRESS", title: "In Progress",    ticketIds: [] },
    "WAITING":     { id: "WAITING",     title: "Waiting on User",ticketIds: [] },
    "RESOLVED":    { id: "RESOLVED",    title: "Resolved",       ticketIds: [] },
    "CLOSED":      { id: "CLOSED",      title: "Closed",         ticketIds: [] },
  },
  columnOrder: ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],
});

export default function KanbanBoardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [data, setData] = useState<KanbanData>(emptyKanban());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    async function fetchTickets() {
      try {
        const res = await fetch("http://localhost:5000/api/tickets");
        const ticketsData = await res.json();

        const kanban = emptyKanban();

        ticketsData.forEach((t: any) => {
          kanban.tickets[t.id] = {
            id: t.id,
            title: t.title,
            category: t.category?.name || "Uncategorized",
            priority: t.priority,
            assignedTo: t.assignedTo?.name || null,
            timeAgo: new Date(t.createdAt).toLocaleDateString(),
          };

          if (kanban.columns[t.status]) {
            kanban.columns[t.status].ticketIds.push(t.id);
          }
        });

        setData(kanban);
      } catch (error) {
        console.error("Failed to fetch tickets for kanban", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTickets();
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startCol = data.columns[source.droppableId];
    const finishCol = data.columns[destination.droppableId];

    if (startCol === finishCol) {
      const newTicketIds = Array.from(startCol.ticketIds);
      newTicketIds.splice(source.index, 1);
      newTicketIds.splice(destination.index, 0, draggableId);

      setData({ ...data, columns: { ...data.columns, [startCol.id]: { ...startCol, ticketIds: newTicketIds } } });
      return;
    }

    const startTicketIds = Array.from(startCol.ticketIds);
    startTicketIds.splice(source.index, 1);

    const finishTicketIds = Array.from(finishCol.ticketIds);
    finishTicketIds.splice(destination.index, 0, draggableId);

    setData({
      ...data,
      columns: {
        ...data.columns,
        [startCol.id]: { ...startCol, ticketIds: startTicketIds },
        [finishCol.id]: { ...finishCol, ticketIds: finishTicketIds },
      },
    });

    // Also PATCH the backend to persist the new status
    fetch(`http://localhost:5000/api/tickets/${draggableId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destination.droppableId }),
    }).catch(console.error);
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link href="/dashboard/admin">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-gray-200">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">IT Help Desk Ticket Board</h1>
          <p className="text-sm text-gray-500">Drag and drop tickets across columns to update their status automatically.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        /* Kanban Board Area */
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 items-start min-w-max pb-4 px-1">
              {data.columnOrder.map((columnId) => {
                const column = data.columns[columnId];
                const tickets = column.ticketIds.map((tId) => data.tickets[tId]).filter(Boolean);

                let headerColor = "bg-gray-200 text-gray-700";
                if (columnId === "OPEN")        headerColor = "bg-blue-100 text-blue-700 border-b-2 border-blue-200";
                if (columnId === "ASSIGNED")     headerColor = "bg-purple-100 text-purple-700 border-b-2 border-purple-200";
                if (columnId === "IN_PROGRESS")  headerColor = "bg-orange-100 text-orange-700 border-b-2 border-orange-200";
                if (columnId === "WAITING")      headerColor = "bg-yellow-100 text-yellow-700 border-b-2 border-yellow-200";
                if (columnId === "RESOLVED")     headerColor = "bg-green-100 text-green-700 border-b-2 border-green-200";
                if (columnId === "CLOSED")       headerColor = "bg-gray-100 text-gray-700 border-b-2 border-gray-200";

                return (
                  <div key={column.id} className="flex flex-col w-80 h-full max-h-full bg-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
                    {/* Column Header */}
                    <div className={`p-3 flex justify-between items-center ${headerColor}`}>
                      <h3 className="font-semibold text-sm tracking-wide uppercase">{column.title}</h3>
                      <Badge variant="secondary" className="bg-white/60 text-current text-xs">{tickets.length}</Badge>
                    </div>

                    {/* Column Droppable Area */}
                    <div className="flex-1 overflow-y-auto p-3">
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[150px] transition-colors rounded-lg ${snapshot.isDraggingOver ? "bg-blue-50/50 outline-dashed outline-2 outline-blue-200 outline-offset-2" : ""}`}
                          >
                            {tickets.map((ticket, index) => (
                              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`mb-3 select-none bg-white p-4 rounded-lg border shadow-sm group hover:border-primary/50 transition-all
                                      ${snapshot.isDragging ? "shadow-lg border-primary ring-2 ring-primary/20 opacity-90 scale-[1.02]" : "border-gray-200"}`}
                                    style={provided.draggableProps.style}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-mono font-bold text-gray-500">{ticket.id.slice(0, 8)}</span>
                                      <div className="flex items-center gap-1">
                                        {ticket.assignedTo && (
                                          <Avatar className="h-6 w-6 border border-gray-100 shadow-sm" title={`Assigned to ${ticket.assignedTo}`}>
                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                              {ticket.assignedTo.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors" />
                                      </div>
                                    </div>

                                    <p className="font-semibold text-gray-900 text-sm leading-tight mb-3 line-clamp-2">
                                      {ticket.title}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                                      <span className="text-xs font-medium text-gray-500 px-2 py-0.5 bg-gray-100 rounded-md">
                                        {ticket.category}
                                      </span>
                                      <PriorityIndicator priority={ticket.priority} />
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}
