"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DoorOpen,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  FilterX,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import {
  getRoomBedClosures,
  deleteRoomBedClosure,
} from "@/actions/room-bed-closure.actions";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";

interface RoomAllotment {
  id: string;
  closureDate: string;
  room?: { name: string };
  bed?: { name: string };
  reason: string;
}

interface AllotmentTabProps {
  branchId?: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  allotmentMonth: string;
  setAllotmentMonth: (month: string) => void;
  allotmentPage: number;
  setAllotmentPage: (page: number) => void;
  itemsPerPage: number;
  onAddAllotment: () => void;
  setItemsPerPage: (limit: number) => void;
  refetchTrigger?: number;
}

export function AllotmentTab({
  branchId,
  searchTerm,
  setSearchTerm,
  allotmentMonth,
  setAllotmentMonth,
  allotmentPage,
  setAllotmentPage,
  itemsPerPage,
  onAddAllotment,
  setItemsPerPage,
  refetchTrigger,
}: AllotmentTabProps) {
  const [allotments, setAllotments] = useState<RoomAllotment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch closures from API
  useEffect(() => {
    const fetchClosures = async () => {
      if (!branchId) return;

      setLoading(true);
      setError(null);

      const [year, month] = allotmentMonth.split("-").map(Number);
      // Calculate first and last day of the month for API query
      // Create the dates
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      // Helper function to format as YYYY-MM-DD without timezone shifting
      const formatDate = (date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
      };

      const fromDate = formatDate(firstDay);
      const toDate = formatDate(lastDay);

      const result = await getRoomBedClosures({
        branchId,
        fromDate,
        toDate,
        search: searchTerm,
      });

      if (result.success) {
        setAllotments(result.data);
        setTotalItems(result.data.length); // Assuming API returns total count in data length
      } else {
        setError(result.error || "Failed to fetch closures");
        setAllotments([]);
      }

      setLoading(false);
    };

    fetchClosures();
  }, [branchId, allotmentMonth, searchTerm, refetchTrigger]);

  const handleDelete = (closureId: string) => {
    setDeleteConfirmId(closureId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setDeletingId(deleteConfirmId);
    const result = await deleteRoomBedClosure(deleteConfirmId);

    if (result.success) {
      toast.success("Closure deleted successfully");
      // Refresh the list
      const [year, month] = allotmentMonth.split("-").map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      const formatDate = (date: Date) => {
        const d = date.getDate().toString().padStart(2, "0");
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
      };

      const fromDate = formatDate(firstDay);
      const toDate = formatDate(lastDay);

      const refreshResult = await getRoomBedClosures({
        branchId,
        fromDate,
        toDate,
        search: searchTerm,
      });

      if (refreshResult.success) {
        setAllotments(refreshResult.data);
        setTotalItems(refreshResult.data.length);
      }
    } else {
      toast.error(result.error || "Failed to delete closure");
    }

    setDeletingId(null);
    setDeleteConfirmId(null);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Calendar generation
  const generateCalendar = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const calendarDays = generateCalendar(allotmentMonth);

  // Check if date has allotment closure
  const hasAllotment = (day: number) => {
    const dateStr = `${allotmentMonth}-${String(day).padStart(2, "0")}`;
    return allotments.some((a) => a.closureDate.startsWith(dateStr));
  };

  const getAllotmentsForDate = (day: number) => {
    const dateStr = `${allotmentMonth}-${String(day).padStart(2, "0")}`;
    return allotments.filter((a) => a.closureDate.startsWith(dateStr));
  };

  const allotmentsForCurrentPage = useMemo(
    () =>
      allotments.slice(
        (allotmentPage - 1) * itemsPerPage,
        allotmentPage * itemsPerPage,
      ),
    [allotments, allotmentPage, itemsPerPage],
  );
  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by room or bed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // reset all filter and pagination
              setSearchTerm("");
              setAllotmentMonth(new Date().toISOString().slice(0, 7));
              setAllotmentPage(1);
              setItemsPerPage(10);
            }}
          >
            <FilterX className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={onAddAllotment}>
          <Plus className="h-4 w-4 mr-2" />
          Manage Availability
        </Button>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Availability Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const [year, month] = allotmentMonth.split("-").map(Number);
                  const newDate = new Date(year, month - 2, 1);
                  setAllotmentMonth(
                    `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`,
                  );
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-40 text-center">
                {new Date(allotmentMonth + "-01").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const [year, month] = allotmentMonth.split("-").map(Number);
                  const newDate = new Date(year, month, 1);
                  setAllotmentMonth(
                    `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`,
                  );
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Click on dates to view room closures. Highlighted dates have rooms
            closed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              const allotmentsForDay = day ? getAllotmentsForDate(day) : [];
              return (
                <div
                  key={index}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative group
                    ${day ? "hover:bg-accent cursor-pointer" : ""}
                    ${day && hasAllotment(day) ? "bg-destructive/10 border-2 border-destructive" : "border border-border"}
                  `}
                >
                  {day && (
                    <>
                      <span
                        className={
                          hasAllotment(day)
                            ? "font-semibold text-destructive"
                            : ""
                        }
                      >
                        {day}
                      </span>
                      {hasAllotment(day) && (
                        <>
                          <span className="absolute bottom-1 right-1">
                            <DoorOpen className="h-3 w-3 text-destructive" />
                          </span>
                          {allotmentsForDay.length > 0 && (
                            <div className="absolute hidden group-hover:block z-10 bg-popover text-popover-foreground p-2 rounded-md shadow-lg border -top-2 left-full ml-2 w-48">
                              <p className="text-xs font-semibold mb-1">
                                Closed Rooms:
                              </p>
                              {allotmentsForDay.map((a) => (
                                <p key={a.id} className="text-xs">
                                  {a.room?.name || "N/A"} -{" "}
                                  {a.bed?.name || "N/A"}
                                </p>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Room Allotments List with Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Room Availability</CardTitle>
          <CardDescription>
            Manage room and bed availability for specific dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-destructive"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : allotments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No closures found
                  </TableCell>
                </TableRow>
              ) : (
                allotmentsForCurrentPage.map((allotment) => (
                  <TableRow key={allotment.id}>
                    <TableCell className="font-medium">
                      {new Date(allotment.closureDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell>{allotment.room?.name || "N/A"}</TableCell>
                    <TableCell>{allotment.bed?.name || "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {allotment.reason}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(allotment.id)}
                          disabled={deletingId === allotment.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Allotment Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={allotmentPage}
              totalCount={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setAllotmentPage}
              onLimitChange={setItemsPerPage}
              showLimitSelector={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Closure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this room/bed closure? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
