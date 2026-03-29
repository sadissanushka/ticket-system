"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, AlertCircle, Loader2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { API_URL, fetchWithAuth } from "@/lib/api";

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
  if (priority === "HIGH") return <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-800/50 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> High</span>;
  if (priority === "MEDIUM") return <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800/50">Medium</span>;
  return <span className="text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">Low</span>;
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
        const res = await fetchWithAuth(`${API_URL}/api/tickets`);
        const ticketsData = await res.json();
        const kanban = emptyKanban();

        if (Array.isArray(ticketsData)) {
          (ticketsData as any[]).forEach((t) => {
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
        } else {
          console.error("Expected array for kanban tickets, got:", ticketsData);
        }

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
    fetchWithAuth(`${API_URL}/api/tickets/all${draggableId}`, {
      method: "PUT",
      body: JSON.stringify({ status: destination.droppableId }),
    }).catch(console.error);
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 shrink-0">
        <Link href="/dashboard/admin">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl border-border shrink-0 cursor-pointer">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">IT Help Desk Ticket Board</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">Drag and drop tickets to the relevant category to update their status.</p>
        </div>
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-blue-400" />
        </div>
      ) : (
        /* Kanban Board Area */
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-1 -mx-2 px-2 custom-scrollbar">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-3 items-start min-w-max pb-4">
              {data.columnOrder.map((columnId) => {
                const column = data.columns[columnId];
                const tickets = column.ticketIds.map((tId) => data.tickets[tId]).filter(Boolean);

                let headerColor = "bg-muted text-muted-foreground border-b border-border";
                if (columnId === "OPEN")        headerColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500/20";
                if (columnId === "ASSIGNED")     headerColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500/20";
                if (columnId === "IN_PROGRESS")  headerColor = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-b-2 border-orange-500/20";
                if (columnId === "WAITING")      headerColor = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500/20";
                if (columnId === "RESOLVED")     headerColor = "bg-green-500/10 text-green-600 dark:text-green-400 border-b-2 border-green-500/20";
                if (columnId === "CLOSED")       headerColor = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-b-2 border-slate-500/20";

                return (
                  <div key={column.id} className="flex flex-col w-[260px] sm:w-[280px] h-full max-h-full bg-muted/40 dark:bg-card/20 rounded-xl border border-border shadow-sm overflow-hidden shrink-0 transition-all hover:bg-muted/50 dark:hover:bg-card/30">
                    {/* Column Header */}
                    <div className={`p-2.5 flex justify-between items-center ${headerColor} transition-colors`}>
                      <h3 className="font-bold text-[10px] sm:text-xs tracking-wider uppercase">{column.title}</h3>
                      <Badge variant="secondary" className="bg-background/40 text-current backdrop-blur-sm text-[9px] h-4 min-w-[18px] justify-center px-1">{tickets.length}</Badge>
                    </div>

                    {/* Column Droppable Area */}
                    <div className="flex-1 overflow-y-auto p-3">
                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[200px] flex-1 transition-colors rounded-lg flex flex-col gap-2.5 pb-20 ${snapshot.isDraggingOver ? "bg-primary/5 outline-dashed outline-2 outline-primary/20 outline-offset-1" : ""}`}
                          >
                            {tickets.map((ticket, index) => (
                              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`select-none bg-card p-3 sm:p-4 rounded-lg border shadow-sm group hover:border-primary/50 transition-all transform-gpu
                                      ${snapshot.isDragging ? "shadow-2xl border-primary ring-4 ring-primary/10 opacity-95 scale-[1.04] z-50 cursor-grabbing" : "border-border hover:shadow-md active:scale-[0.98]"}`}
                                    style={provided.draggableProps.style}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{ticket.id.slice(0, 8)}</span>
                                      <div className="flex items-center gap-1">
                                        {ticket.assignedTo && (
                                          <Avatar className="h-6 w-6 border border-border bg-muted" title={`Assigned to ${ticket.assignedTo}`}>
                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary dark:text-blue-400 font-bold">
                                              {ticket.assignedTo.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors" />
                                      </div>
                                    </div>

                                    <p className="font-bold text-foreground text-sm leading-tight mb-4 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                                      {ticket.title}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                                      <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-md uppercase tracking-wider">
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
