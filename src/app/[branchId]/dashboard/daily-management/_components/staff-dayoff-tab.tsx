"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserX,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
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
import { Pagination, type PaginationMeta } from "@/components/pagination";
import { getStaffDayOffs } from "@/actions/daily-management.actions";
import type { StaffDayOff } from "@/types";

interface StaffDayOffTabProps {
  branchId: string;
  initialDayOffs: StaffDayOff[];
  initialPaginationMeta?: PaginationMeta | null;
  onAddDayOff: () => void;
  onEditDayOff?: (dayOff: StaffDayOff) => void;
  onDeleteDayOff?: (dayOffId: string) => void;
  refetchTrigger?: number;
}

export function StaffDayOffTab({
  branchId,
  initialDayOffs,
  initialPaginationMeta,
  onAddDayOff,
  onEditDayOff,
  onDeleteDayOff,
  refetchTrigger = 0,
}: StaffDayOffTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dayOffPage, setDayOffPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [staffDayOffs, setStaffDayOffs] = useState(initialDayOffs);
  const [paginationMeta, setPaginationMeta] = useState(
    initialPaginationMeta || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingDayOffId, setDeletingDayOffId] = useState<string | null>(null);

  // Refetch staff day-offs
  const refetchDayOffs = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const result = await getStaffDayOffs(
        branchId,
        page,
        itemsPerPage,
        searchTerm,
      );

      if (result.success && result.data) {
        setStaffDayOffs(result.data);
        setPaginationMeta(result.meta || null);
        setError(null);
      } else {
        setError(result.error || "Failed to load staff day-offs");
        setStaffDayOffs([]);
        setPaginationMeta(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load staff day-offs";
      setError(errorMessage);
      setStaffDayOffs([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch staff day-offs with search filter
  useEffect(() => {
    refetchDayOffs(dayOffPage);
  }, [branchId, dayOffPage, itemsPerPage, searchTerm, refetchTrigger]);

  const deletingDayOff = staffDayOffs.find((d) => d.id === deletingDayOffId);

  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setDayOffPage(1); // Reset to page 1 when changing limit
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by staff name..."
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
              setDayOffPage(1);
              setItemsPerPage(10);
            }}
          >
            <FilterX className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={onAddDayOff}>
          <Plus className="h-4 w-4 mr-2" />
          Add Day Off
        </Button>
      </div>

      {/* Staff Day-Offs List with Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Day-Offs</CardTitle>
          <CardDescription>
            Manage staff day-off requests and approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : staffDayOffs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserX className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {searchTerm
                  ? "No matching staff day-offs"
                  : "No Staff Day-Offs"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? `No staff day-offs found matching "${searchTerm}"`
                  : 'There are no staff day-off requests at the moment. Click "Add Day Off" to create a new one.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffDayOffs.map((dayOff) => (
                    <TableRow key={dayOff.id}>
                      <TableCell className="font-medium">
                        {new Date(dayOff.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{dayOff.staffName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {dayOff.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            dayOff.status === "approved"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {dayOff.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditDayOff?.(dayOff)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingDayOffId(dayOff.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Day-Off Pagination */}
              {paginationMeta && (
                <Pagination
                  meta={paginationMeta}
                  onPageChange={setDayOffPage}
                  onLimitChange={handleLimitChange}
                  showLimitSelector={true}
                  className="mt-8"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingDayOffId}
        onOpenChange={(open) => {
          if (!open) setDeletingDayOffId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff Day-Off</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the day-off for{" "}
              <span className="font-semibold text-foreground">
                {deletingDayOff?.staffName}
              </span>{" "}
              on{" "}
              <span className="font-semibold text-foreground">
                {deletingDayOff
                  ? new Date(deletingDayOff.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDayOffId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingDayOffId) {
                  onDeleteDayOff?.(deletingDayOffId);
                  setDeletingDayOffId(null);
                  refetchDayOffs(1);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
