"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MoreVertical, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatTime } from "@/lib/date-utils";

interface ServiceClosure {
  id: string;
  serviceId: string;
  closeDate: string;
  closeTime: string;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ManageServiceClosuresDialogProps {
  serviceId: string;
  serviceName: string;
  branchId: string;
  onClosuresUpdated?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageServiceClosuresDialog = ({
  serviceId,
  serviceName,
  branchId,
  onClosuresUpdated,
  open,
  onOpenChange,
}: ManageServiceClosuresDialogProps) => {
  const [closures, setClosures] = useState<ServiceClosure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClosures, setIsLoadingClosures] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    closeDate: "",
    closeTime: "00:00",
    reason: "",
  });

  // Fetch closures when dialog opens
  useEffect(() => {
    if (open) {
      fetchClosures();
    }
  }, [open, serviceId]);

  const fetchClosures = async () => {
    setIsLoadingClosures(true);
    try {
      const response = await fetch(
        `/api/services/${serviceId}/closures`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch closures");
      }

      const data = await response.json();
      // Sort by date/time descending
      const sorted = (data || []).sort((a: ServiceClosure, b: ServiceClosure) => {
        const dateA = new Date(`${a.closeDate}T${a.closeTime}`);
        const dateB = new Date(`${b.closeDate}T${b.closeTime}`);
        return dateB.getTime() - dateA.getTime();
      });
      setClosures(sorted);
    } catch (error) {
      console.error("Error fetching closures:", error);
      toast.error("Failed to load closures");
    } finally {
      setIsLoadingClosures(false);
    }
  };

  const handleAddClosure = async () => {
    if (!formData.closeDate || !formData.closeTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/services/${serviceId}/closures`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            closeDate: formData.closeDate,
            closeTime: formData.closeTime,
            reason: formData.reason || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create closure");
      }

      const newClosure = await response.json();
      setClosures([newClosure, ...closures]);
      setFormData({ closeDate: "", closeTime: "00:00", reason: "" });
      setShowAddForm(false);
      toast.success("Closure added successfully");
      onClosuresUpdated?.();
    } catch (error) {
      console.error("Error adding closure:", error);
      toast.error("Failed to add closure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClosure = async (closureId: string) => {
    if (!formData.closeDate || !formData.closeTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/services/closures/${closureId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            closeDate: formData.closeDate,
            closeTime: formData.closeTime,
            reason: formData.reason || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update closure");
      }

      const updatedClosure = await response.json();
      setClosures(
        closures.map((c) => (c.id === closureId ? updatedClosure : c))
      );
      setFormData({ closeDate: "", closeTime: "00:00", reason: "" });
      setEditingId(null);
      toast.success("Closure updated successfully");
      onClosuresUpdated?.();
    } catch (error) {
      console.error("Error updating closure:", error);
      toast.error("Failed to update closure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClosure = async (closureId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/services/closures/${closureId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete closure");
      }

      setClosures(closures.filter((c) => c.id !== closureId));
      setDeletingId(null);
      toast.success("Closure deleted successfully");
      onClosuresUpdated?.();
    } catch (error) {
      console.error("Error deleting closure:", error);
      toast.error("Failed to delete closure");
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (closure: ServiceClosure) => {
    setFormData({
      closeDate: closure.closeDate,
      closeTime: closure.closeTime,
      reason: closure.reason || "",
    });
    setEditingId(closure.id);
    setShowAddForm(false);
  };

  const startAdd = () => {
    setFormData({ closeDate: "", closeTime: "00:00", reason: "" });
    setEditingId(null);
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setFormData({ closeDate: "", closeTime: "00:00", reason: "" });
    setEditingId(null);
    setShowAddForm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Manage Closures - {serviceName}
            </DialogTitle>
            <DialogDescription>
              View, add, and manage temporary closures for this service
            </DialogDescription>
          </DialogHeader>

          {/* Add/Edit Form */}
          {showAddForm || editingId ? (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="space-y-4">
                <h3 className="font-semibold">
                  {editingId ? "Edit Closure" : "Add New Closure"}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="closeDate" className="font-medium">
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="closeDate"
                      type="date"
                      value={formData.closeDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          closeDate: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closeTime" className="font-medium">
                      Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          closeTime: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="font-medium">
                    Reason (Optional)
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Staff training, Equipment maintenance, Public holiday..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reason: e.target.value,
                      })
                    }
                    disabled={isLoading}
                    rows={2}
                    className="bg-white"
                  />
                  <p className="text-xs text-gray-500">
                    This reason will be visible in the system and can help staff understand why the service is closed
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      editingId
                        ? handleUpdateClosure(editingId)
                        : handleAddClosure()
                    }
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Saving..."
                      : editingId
                        ? "Update Closure"
                        : "Add Closure"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Closures List */}
          <div className="space-y-4 my-6">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                {closures.length} {closures.length === 1 ? "Closure" : "Closures"}
              </h3>
              {!showAddForm && !editingId && (
                <Button
                  onClick={startAdd}
                  size="sm"
                  disabled={isLoadingClosures}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Closure
                </Button>
              )}
            </div>

            {isLoadingClosures ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin">
                  <div className="h-8 w-8 border-4 border-gray-200 border-t-primary rounded-full" />
                </div>
                <p className="mt-2 text-sm text-gray-500">Loading closures...</p>
              </div>
            ) : closures.length === 0 ? (
              <Card className="p-8 border-dashed bg-gray-50">
                <div className="text-center">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No closures scheduled</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add a closure to temporarily close this service
                  </p>
                </div>
              </Card>
            ) : (
              closures.map((closure) => (
                <Card key={closure.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-primary" />
                          {formatDate(new Date(closure.closeDate))}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          at {formatTime(closure.closeTime)}
                        </div>
                      </div>

                      {closure.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Reason:</span>{" "}
                          {closure.reason}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Created: {formatDate(new Date(closure.createdAt))}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(closure)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingId(closure.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Closure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The service closure record will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDeleteClosure(deletingId)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
