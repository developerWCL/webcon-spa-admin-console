"use client";

import React from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateServiceFormData } from "../../../../../schemas/service.schema";

interface PriceChangeConfirmationDialogProps {
  open: boolean;
  priceChangeData: {
    oldPrices: Record<number, number>;
    newPrices: Record<number, number>;
  };
  pendingFormData: CreateServiceFormData | null;
  editServiceData?: any;
  onConfirm: (
    formData: CreateServiceFormData,
    action: "overwrite" | "keep-custom",
  ) => void;
  onCancel: () => void;
}

export const PriceChangeConfirmationDialog = ({
  open,
  priceChangeData,
  pendingFormData,
  editServiceData,
  onConfirm,
  onCancel,
}: PriceChangeConfirmationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Update base price?
          </DialogTitle>
          <DialogDescription className="mt-4 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-amber-900 mb-2">
                You are changing the price to:
              </p>
              <div className="space-y-1 text-amber-800">
                {Object.entries(priceChangeData.newPrices).map(
                  ([index, newPrice]) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {editServiceData?.subServices?.[parseInt(index)]
                          ?.name || `Variant ${parseInt(index) + 1}`}
                      </span>
                      <span className="font-medium">
                        ฿{newPrice.toFixed(2)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              How would you like to handle the price change?
            </p>
            <p>Overwrite all - apply to all dates</p>
            <p>Keep custom - update only the default dates</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 mt-6">
          <div className="w-full gap-3 grid grid-cols-1 sm:grid-cols-2">
            <Button
              onClick={() => {
                if (pendingFormData) {
                  onConfirm(pendingFormData, "overwrite");
                }
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              Overwrite All
            </Button>
            <Button
              onClick={() => {
                if (pendingFormData) {
                  onConfirm(pendingFormData, "keep-custom");
                }
              }}
              variant="outline"
              className="w-full"
            >
              Keep Custom Prices
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
