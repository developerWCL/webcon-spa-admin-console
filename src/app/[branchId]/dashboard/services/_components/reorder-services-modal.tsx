"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical, Loader2 } from "lucide-react";
import { updateServiceOrder } from "@/actions/service.actions";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
}

interface ReorderServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onOrderUpdated?: () => void;
}

export const ReorderServicesModal = ({
  open,
  onOpenChange,
  services,
  onOrderUpdated,
}: ReorderServicesModalProps) => {
  const [orderedServices, setOrderedServices] = useState<Service[]>(services);
  const [draggedItem, setDraggedItem] = useState<Service | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setOrderedServices(services);
  }, [services, open]);

  const handleDragStart = useCallback((service: Service) => {
    setDraggedItem(service);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-primary/5", "border-l-4", "border-primary");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("bg-primary/5", "border-l-4", "border-primary");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetService: Service) => {
      e.preventDefault();
      e.currentTarget.classList.remove("bg-primary/5", "border-l-4", "border-primary");

      if (!draggedItem || draggedItem.id === targetService.id) {
        return;
      }

      const draggedIndex = orderedServices.findIndex(
        (s) => s.id === draggedItem.id,
      );
      const targetIndex = orderedServices.findIndex(
        (s) => s.id === targetService.id,
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        return;
      }

      const newServices = [...orderedServices];
      const [removed] = newServices.splice(draggedIndex, 1);
      newServices.splice(targetIndex, 0, removed);

      setOrderedServices(newServices);
      setDraggedItem(null);
    },
    [draggedItem, orderedServices],
  );

  const handleSaveOrder = async () => {
    try {
      setIsUpdating(true);
      const orderUpdates = orderedServices.map((service, index) => ({
        id: service.id,
        displayOrder: index,
      }));

      await updateServiceOrder(orderUpdates);
      toast.success("Service order updated successfully");
      onOpenChange(false);
      onOrderUpdated?.();
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update service order");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reorder Services</DialogTitle>
          <DialogDescription>
            Drag services to reorder them. Changes will be saved to all pages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto rounded-md border">
            <div className="space-y-2 p-4">
              {orderedServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No services to reorder
                </div>
              ) : (
                orderedServices.map((service, index) => (
                  <div
                    key={service.id}
                    draggable
                    onDragStart={() => handleDragStart(service)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, service)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move ${
                      draggedItem?.id === service.id
                        ? "opacity-50 bg-muted"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="font-medium truncate">{service.name}</p>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveOrder} disabled={isUpdating}>
              {isUpdating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
