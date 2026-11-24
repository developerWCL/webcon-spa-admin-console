"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertCircle, CalendarIcon, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ServiceClosure } from "@/actions/service-closure.actions";

interface CatalogueItem {
  id: string;
  name: string;
}

interface EditClosureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closure: ServiceClosure;
  services: CatalogueItem[];
  packages: CatalogueItem[];
  programmes: CatalogueItem[];
  onEditClosure: (data: any) => Promise<void>;
}

type ItemType = "service" | "package" | "programme";

const toLocalDateValue = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toLocalTimeValue = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export function EditClosureDialog({
  open,
  onOpenChange,
  closure,
  services,
  packages,
  programmes,
  onEditClosure,
}: EditClosureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [closeAll, setCloseAll] = useState(
    closure.isCloseAll ??
      ((!closure.services || closure.services.length === 0) &&
        (!closure.packages || closure.packages.length === 0) &&
        (!closure.programmes || closure.programmes.length === 0))
  );
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(closure.services?.map((s) => s.id) || [])
  );
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(
    new Set(closure.packages?.map((p) => p.id) || [])
  );
  const [selectedProgrammes, setSelectedProgrammes] = useState<Set<string>>(
    new Set(closure.programmes?.map((p) => p.id) || [])
  );
  const [startDate, setStartDate] = useState(
    toLocalDateValue(closure.startClosure) || closure.startDate || closure.closeDate || ""
  );
  const [endDate, setEndDate] = useState(
    toLocalDateValue(closure.endClosure) || closure.endDate || closure.closeDate || ""
  );
  const [startTime, setStartTime] = useState(
    toLocalTimeValue(closure.startClosure) || closure.startTime || closure.closeTime || ""
  );
  const [endTime, setEndTime] = useState(
    toLocalTimeValue(closure.endClosure) || closure.endTime || ""
  );
  const [reason, setReason] = useState(closure.reason || "");
  const [dropdownOpen, setDropdownOpen] = useState<{
    service: boolean;
    package: boolean;
    programme: boolean;
  }>({
    service: false,
    package: false,
    programme: false,
  });
  useEffect(() => {
    setCloseAll(
      closure.isCloseAll ??
        ((!closure.services || closure.services.length === 0) &&
          (!closure.packages || closure.packages.length === 0) &&
          (!closure.programmes || closure.programmes.length === 0))
    );
    setSelectedServices(new Set(closure.services?.map((s) => s.id) || []));
    setSelectedPackages(new Set(closure.packages?.map((p) => p.id) || []));
    setSelectedProgrammes(new Set(closure.programmes?.map((p) => p.id) || []));
    setStartDate(
      toLocalDateValue(closure.startClosure) || closure.startDate || closure.closeDate || ""
    );
    setEndDate(
      toLocalDateValue(closure.endClosure) || closure.endDate || closure.closeDate || ""
    );
    setStartTime(
      toLocalTimeValue(closure.startClosure) || closure.startTime || closure.closeTime || ""
    );
    setEndTime(
      toLocalTimeValue(closure.endClosure) || closure.endTime || ""
    );
    setReason(closure.reason || "");
    setDropdownOpen({
      service: false,
      package: false,
      programme: false,
    });
  }, [closure, open]);

  const toggleDropdown = (type: ItemType) => {
    setDropdownOpen((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleToggleItem = (type: ItemType, itemId: string) => {
    const getSetter =
      type === "service"
        ? setSelectedServices
        : type === "package"
          ? setSelectedPackages
          : setSelectedProgrammes;
    const currentSet =
      type === "service"
        ? selectedServices
        : type === "package"
          ? selectedPackages
          : selectedProgrammes;

    const newSelected = new Set(currentSet);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    getSetter(newSelected);
  };

  const handleToggleAllItems = (
    type: ItemType,
    items: CatalogueItem[],
    checked: boolean
  ) => {
    const getSetter =
      type === "service"
        ? setSelectedServices
        : type === "package"
          ? setSelectedPackages
          : setSelectedProgrammes;

    if (checked) {
      getSetter(new Set(items.map((item) => item.id)));
      return;
    }

    getSetter(new Set());
  };

  const handleCloseAllChange = (checked: boolean) => {
    setCloseAll(checked);
    if (checked) {
      setSelectedServices(new Set());
      setSelectedPackages(new Set());
      setSelectedProgrammes(new Set());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }
    if (!endDate) {
      toast.error("Please select an end date");
      return;
    }
    if (!startTime) {
      toast.error("Please select a start time");
      return;
    }
    if (!endTime) {
      toast.error("Please select an end time");
      return;
    }
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
      toast.error("Please enter valid start and end date/time");
      return;
    }
    if (endDateTime <= startDateTime) {
      toast.error("End date/time must be after start date/time");
      return;
    }
    if (
      !closeAll &&
      selectedServices.size === 0 &&
      selectedPackages.size === 0 &&
      selectedProgrammes.size === 0
    ) {
      toast.error(
        "Please select at least one service, package, or programme, or close all"
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        closeDate: startDate,
        closeTime: startTime,
        startDate,
        startTime,
        endDate,
        endTime,
        reason: reason || undefined,
        closeAllServices: closeAll,
        serviceIds: closeAll ? [] : Array.from(selectedServices),
        packageIds: closeAll ? [] : Array.from(selectedPackages),
        programmeIds: closeAll ? [] : Array.from(selectedProgrammes),
      };

      await onEditClosure(payload);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceCount = selectedServices.size;
  const selectedPackageCount = selectedPackages.size;
  const selectedProgrammeCount = selectedProgrammes.size;
  const totalSelected =
    selectedServiceCount + selectedPackageCount + selectedProgrammeCount;

  const getDisplayText = (type: ItemType): string => {
    const count =
      type === "service"
        ? selectedServiceCount
        : type === "package"
          ? selectedPackageCount
          : selectedProgrammeCount;
    const label =
      type === "service"
        ? "service"
        : type === "package"
          ? "package"
          : "programme";

    if (count === 0) return `Select ${label}s...`;
    return `${count} ${label}${count !== 1 ? "s" : ""} selected`;
  };

  const renderSelection = (
    type: ItemType,
    label: string,
    items: CatalogueItem[],
    selectedSet: Set<string>
  ) => {
    const allSelected = items.length > 0 && selectedSet.size === items.length;
    const partiallySelected =
      selectedSet.size > 0 && selectedSet.size < items.length;

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown(type)}
            className="w-full px-3 py-2 text-left bg-white dark:bg-slate-950 border border-input rounded-md text-sm font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <span>{getDisplayText(type)}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                dropdownOpen[type] ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen[type] && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-950 border border-input rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
              <div className="p-2">
                {items.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No {label.toLowerCase()} available
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 p-2 border-b border-slate-200 dark:border-slate-800 mb-1">
                      <Checkbox
                        id={`${type}-select-all`}
                        checked={
                          allSelected
                            ? true
                            : partiallySelected
                              ? "indeterminate"
                              : false
                        }
                        onCheckedChange={(checked) =>
                          handleToggleAllItems(type, items, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`${type}-select-all`}
                        className="flex-1 cursor-pointer text-sm font-semibold"
                      >
                        Select all {label.toLowerCase()}
                      </Label>
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                      >
                        <Checkbox
                          id={`${type}-${item.id}`}
                          checked={selectedSet.has(item.id)}
                          onCheckedChange={() => handleToggleItem(type, item.id)}
                        />
                        <Label
                          htmlFor={`${type}-${item.id}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {item.name}
                        </Label>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {selectedSet.size > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400">
            ✓ {selectedSet.size} {label.toLowerCase()}
            {selectedSet.size !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Closure</DialogTitle>
          <DialogDescription>
            Update closure date/time range and affected services, packages, or
            programmes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    {startDate
                      ? format(new Date(startDate), "PPP")
                      : "Pick start date"}
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) =>
                      setStartDate(date ? format(date, "yyyy-MM-dd") : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    {endDate
                      ? format(new Date(endDate), "PPP")
                      : "Pick end date"}
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) =>
                      setEndDate(date ? format(date, "yyyy-MM-dd") : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <Checkbox
              id="closeAll"
              checked={closeAll}
              onCheckedChange={handleCloseAllChange}
              className="h-5 w-5"
            />
            <div className="flex-1">
              <Label
                htmlFor="closeAll"
                className="font-semibold text-sm cursor-pointer"
              >
                Close All Services, Packages & Programmes
              </Label>
              <p className="text-xs text-muted-foreground">
                Check this to close all items, or choose specific ones below
              </p>
            </div>
          </div>

          {!closeAll && (
            <div className="space-y-4">
              {renderSelection("service", "Services", services, selectedServices)}
              {renderSelection("package", "Packages", packages, selectedPackages)}
              {renderSelection(
                "programme",
                "Programmes",
                programmes,
                selectedProgrammes
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Annual maintenance, Staff training, System upgrade..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-semibold text-slate-900 dark:text-slate-50">
                  Closure Summary
                </p>
                <p className="text-muted-foreground">
                  {startDate && endDate && startTime && endTime
                    ? `Closes from ${new Date(startDate).toLocaleDateString()} ${startTime} to ${new Date(endDate).toLocaleDateString()} ${endTime}`
                    : "Select start/end date and time"}
                </p>
                <p className="text-muted-foreground">
                  {closeAll
                    ? "All services, packages, and programmes will be closed"
                    : totalSelected === 0
                      ? "No items selected"
                      : `${totalSelected} item${totalSelected !== 1 ? "s" : ""} will be closed`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Closure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
