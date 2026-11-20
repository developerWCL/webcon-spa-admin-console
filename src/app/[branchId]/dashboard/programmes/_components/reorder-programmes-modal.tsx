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
import { updateProgrammeOrder } from "@/actions/programme.action";
import { toast } from "sonner";
import { Programme } from "@/types/api/programme";

interface ReorderProgrammesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmes: Programme[];
  onReorderComplete: () => void;
}

export function ReorderProgrammesModal({
  open,
  onOpenChange,
  programmes,
  onReorderComplete,
}: ReorderProgrammesModalProps) {
  const [orderedProgrammes, setOrderedProgrammes] = useState<Programme[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    setOrderedProgrammes(programmes);
  }, [programmes, open]);

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

    const newItems = [...orderedProgrammes];
    const draggedProgramme = newItems[sourceIndex];
    newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, draggedProgramme);

    setOrderedProgrammes(newItems);
    setDraggedItem(null);
  };

  const handleSaveOrder = async () => {
    setIsUpdating(true);
    try {
      const updates = orderedProgrammes.map((programme, index) => ({
        id: programme.id,
        displayOrder: index,
      }));

      await updateProgrammeOrder(updates);
      toast.success("Programme order updated successfully");
      onOpenChange(false);
      onReorderComplete();
    } catch (error) {
      console.error("Failed to update programme order:", error);
      toast.error("Failed to update programme order");
      setOrderedProgrammes(programmes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setOrderedProgrammes(programmes);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Reorder Programmes</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 mb-4">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Drag and drop programmes to reorder them. Changes will be saved to the
            system.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-2">
            {orderedProgrammes.map((programme, index) => (
              <div
                key={programme.id}
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
                    {programme.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {programme.description || "No description"}
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
