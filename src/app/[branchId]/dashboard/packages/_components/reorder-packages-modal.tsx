"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, AlertCircle } from "lucide-react";
import { updatePackageOrder } from "@/actions/package.actions";
import { toast } from "sonner";
import type { Package } from "@/types/models/package";

interface ReorderPackagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packages: Package[];
  onReorderComplete: () => void;
}

export function ReorderPackagesModal({
  open,
  onOpenChange,
  packages,
  onReorderComplete,
}: ReorderPackagesModalProps) {
  const [orderedPackages, setOrderedPackages] = useState<Package[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    setOrderedPackages(packages);
  }, [packages, open]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItem(String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const sourceIndex = parseInt(draggedItem);
    if (sourceIndex === targetIndex) return;

    const newItems = [...orderedPackages];
    const draggedPackage = newItems[sourceIndex];
    newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, draggedPackage);

    setOrderedPackages(newItems);
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    setIsUpdating(true);
    try {
      const updates = orderedPackages.map((pkg, index) => ({
        id: pkg.id,
        displayOrder: index,
      }));

      await updatePackageOrder(updates);
      toast.success("Package order updated successfully");
      onOpenChange(false);
      onReorderComplete();
    } catch (error) {
      console.error("Failed to update package order:", error);
      toast.error("Failed to update package order");
      setOrderedPackages(packages);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setOrderedPackages(packages);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Reorder Packages</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 mb-4">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Drag and drop packages to reorder them. Changes will be saved to the
            system.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-2">
            {orderedPackages.map((pkg, index) => (
              <div
                key={pkg.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
                  draggedItem === String(index)
                    ? "opacity-50 border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 font-semibold text-gray-700">
                  {index + 1}
                </div>
                <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {pkg.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {pkg.description || "No description"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveOrder} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
