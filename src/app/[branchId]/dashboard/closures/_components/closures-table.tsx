"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Trash2, Edit } from "lucide-react";
import { EditClosureDialog } from "./edit-closure-dialog";
import { ServiceClosure } from "@/actions/service-closure.actions";

interface CatalogueItem {
  id: string;
  name: string;
}

interface ClosuresTableProps {
  closures: ServiceClosure[];
  services: CatalogueItem[];
  packages: CatalogueItem[];
  programmes: CatalogueItem[];
  onDelete: (closureId: string) => Promise<void>;
  onEdit: (closureId: string, data: any) => Promise<void>;
}

export function ClosuresTable({
  closures,
  services,
  packages,
  programmes,
  onDelete,
  onEdit,
}: ClosuresTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingClosure, setEditingClosure] = useState<ServiceClosure | null>(
    null
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatTimeFromDate = (dateStr: string): string => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };
  

  const getSelectionPreview = (closure: ServiceClosure) => {
    const serviceCount = closure.services?.length || 0;
    const packageCount = closure.packages?.length || 0;
    const programmeCount = closure.programmes?.length || 0;
    const total = serviceCount + packageCount + programmeCount;

    if (total === 0) {
      return <Badge variant="secondary">All Services, Packages & Programmes</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {serviceCount > 0 && (
          <Badge variant="outline">
            {serviceCount} Service{serviceCount > 1 ? "s" : ""}
          </Badge>
        )}
        {packageCount > 0 && (
          <Badge variant="outline">
            {packageCount} Package{packageCount > 1 ? "s" : ""}
          </Badge>
        )}
        {programmeCount > 0 && (
          <Badge variant="outline">
            {programmeCount} Programme{programmeCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    );
  };

  const getClosureStatus = (
    closure: ServiceClosure
  ): "Upcoming" | "Active" | "Past" => {
    const now = Date.now();
    const start = new Date(closure.startClosure).getTime();
    const end = new Date(closure.endClosure).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) return "Upcoming";
    if (now < start) return "Upcoming";
    if (now <= end) return "Active";
    return "Past";
  };

  const selectedClosure = deleteId
    ? closures.find((c) => c.id === deleteId) || null
    : null;

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900">
            <TableRow>
              <TableHead>Start Date Time</TableHead>
              <TableHead>End Date Time</TableHead>
              <TableHead>Affected Items</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {closures.map((closure) => {
              const status = getClosureStatus(closure);
              return (
                <TableRow
                  key={closure.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <TableCell className="font-medium">
                    {formatDate(closure.startClosure)} {formatTimeFromDate(closure.startClosure)}
                  </TableCell>
                  <TableCell>
                    {formatDate(closure.endClosure)} {formatTimeFromDate(closure.endClosure)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {getSelectionPreview(closure)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {closure.reason || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={status === "Past" ? "secondary" : "default"}
                      className={
                        status === "Active"
                          ? "bg-green-600 hover:bg-green-600"
                          : status === "Upcoming"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : ""
                      }
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingClosure(closure);
                            setEditingId(closure.id);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(closure.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Closure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this closure? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            {selectedClosure && (
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-semibold">Start Date Time:</span>{" "}
                  {formatDate(selectedClosure.startClosure)} {formatTimeFromDate(selectedClosure.startClosure)}
                </p>
                <p>
                  <span className="font-semibold">End Date Time:</span>{" "}
                  { formatDate(selectedClosure.endClosure)} {formatTimeFromDate(selectedClosure.endClosure)}
                </p>
                <p>
                  <span className="font-semibold">Services:</span>{" "}
                  { selectedClosure.isCloseAll ? "All" :
                  selectedClosure?.services?.map((service) => service.name).join(", ")}
                </p>
                <p>
                  <span className="font-semibold">Packages:</span>{" "}
                  { 
                  selectedClosure.isCloseAll ? "All" :
                  selectedClosure?.packages?.map((pkg) => pkg.name).join(", ")}
                </p>
                <p>
                  <span className="font-semibold">Programmes:</span>{" "}
                  {
                  selectedClosure.isCloseAll ? "All" :
                  selectedClosure?.programmes?.map((programme) => programme.name).join(", ")}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {editingClosure && (
        <EditClosureDialog
          open={editingId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingId(null);
            }
          }}
          closure={editingClosure}
          services={services}
          packages={packages}
          programmes={programmes}
          onEditClosure={async (data) => {
            await onEdit(editingClosure.id, data);
            setEditingId(null);
          }}
        />
      )}
    </>
  );
}
