"use client";

import { useEffect, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DollarSign,
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
import { Pagination } from "@/components/pagination";
import {
  deletePriceOverride,
  getPriceOverrides,
  updatePriceOverride,
} from "@/actions/daily-management.actions";
import { AddPriceOverrideDialog } from "./add-price-override-dialog";
import { formatNumberWithComma } from "@/utils/utils";

interface PriceOverride {
  id: number;
  date: string;
  endDate: string;
  type: string;
  itemName: string;
  originalPrice: number;
  newPrice: number;
  status: string;
  serviceId?: string;
  programmeId?: string;
  packageId?: string;
}

interface PricingTabProps {
  branchId?: string;
  priceOverrides: PriceOverride[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  pricingPage: number;
  setPricingPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (limit: number) => void;
  onAddPrice: () => void;
  onPriceOverridesChange?: (overrides: PriceOverride[]) => void;
}

export function PricingTab({
  branchId,
  priceOverrides,
  searchTerm,
  setSearchTerm,
  selectedMonth,
  setSelectedMonth,
  pricingPage,
  setPricingPage,
  itemsPerPage,
  setItemsPerPage,
  onAddPrice,
  onPriceOverridesChange,
}: PricingTabProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<
    PriceOverride | undefined
  >(undefined);
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

  const calendarDays = generateCalendar(selectedMonth);

  // Filter price overrides based on search term
  const filteredPriceOverrides =
    priceOverrides?.filter((override) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        override.itemName.toLowerCase().includes(searchLower) ||
        override.type.toLowerCase().includes(searchLower)
      );
    }) || [];

  // Convert ISO date to local date (what local date does UTC time represent?)
  const toLocalDate = (isoStr: string): Date => {
    const utcDate = new Date(isoStr);
    // Get what date this represents in LOCAL timezone
    return new Date(
      utcDate.getFullYear(),
      utcDate.getMonth(),
      utcDate.getDate(),
    );
  };

  // Parse calendar date as-is (already in local context)
  const parseCalendarDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Check if date has price override
  const hasPrice = (day: number) => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    return filteredPriceOverrides?.some((p) => {
      const date = parseCalendarDate(dateStr);
      const start = toLocalDate(p.date);
      const end = toLocalDate(p.endDate);
      // Add 1 day to end to include the entire last day
      const endInclusive = new Date(end);
      endInclusive.setDate(endInclusive.getDate() + 1);
      return date >= start && date < endInclusive;
    });
  };

  const getPriceOverridesForDate = (day: number) => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    return (
      filteredPriceOverrides?.filter((p) => {
        const date = parseCalendarDate(dateStr);
        const start = toLocalDate(p.date);
        const end = toLocalDate(p.endDate);
        // Add 1 day to end to include the entire last day
        const endInclusive = new Date(end);
        endInclusive.setDate(endInclusive.getDate() + 1);
        return date >= start && date < endInclusive;
      }) || []
    );
  };

  const paginatedPriceOverrides = filteredPriceOverrides?.slice(
    (pricingPage - 1) * itemsPerPage,
    pricingPage * itemsPerPage,
  );

  const handleDelete = (overrideId: number) => {
    setDeleteConfirmId(overrideId);
  };

  const handleEdit = (override: PriceOverride) => {
    setEditingOverride(override);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingOverride(undefined);
  };

  const refreshOverrides = async () => {
    if (!branchId) return;

    const [year, month] = selectedMonth.split("-").map(Number);
    const fromDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const toDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Create dates at start and end of day in local timezone
    const startOfDay = new Date(year, month - 1, 1);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(year, month - 1, lastDay);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await getPriceOverrides(branchId, {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      search: searchTerm,
    });

    if (result.success && onPriceOverridesChange) {
      onPriceOverridesChange(result.data);

      setPricingPage(1);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId || !branchId) return;

    setDeletingId(deleteConfirmId);
    const result = await deletePriceOverride(
      branchId,
      deleteConfirmId.toString(),
    );

    if (result.success) {
      toast.success("Price override deleted successfully");
      await refreshOverrides();
    } else {
      toast.error(result.error || "Failed to delete price override");
    }

    setDeletingId(null);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by service, package, or programme..."
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
              setSelectedMonth(new Date().toISOString().slice(0, 7));
              setPricingPage(1);
              setItemsPerPage(10);
            }}
          >
            <FilterX className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={onAddPrice}>
          <Plus className="h-4 w-4 mr-2" />
          Add Price Override
        </Button>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pricing Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const [year, month] = selectedMonth.split("-").map(Number);
                  const newDate = new Date(year, month - 2, 1);
                  setSelectedMonth(
                    `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`,
                  );
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const [year, month] = selectedMonth.split("-").map(Number);
                  const newDate = new Date(year, month, 1);
                  setSelectedMonth(
                    `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`,
                  );
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Click on dates to view price overrides. Highlighted dates have
            custom pricing.
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
              const overrides = day ? getPriceOverridesForDate(day) : [];
              return (
                <div
                  key={index}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative group
                    ${day ? "hover:bg-accent cursor-pointer" : ""}
                    ${day && hasPrice(day) ? "bg-primary/10 border-2 border-primary" : "border border-border"}
                  `}
                >
                  {day && (
                    <>
                      <span
                        className={
                          hasPrice(day) ? "font-semibold text-primary" : ""
                        }
                      >
                        {day}
                      </span>
                      {hasPrice(day) && (
                        <>
                          <span className="absolute bottom-1 right-1">
                            <DollarSign className="h-3 w-3 text-primary" />
                          </span>
                          {overrides.length > 0 && (
                            <div className="absolute hidden group-hover:block z-10 bg-popover text-popover-foreground p-2 rounded-md shadow-lg border -top-2 left-full ml-2 w-48">
                              <p className="text-xs font-semibold mb-1">
                                Price Overrides:
                              </p>
                              {overrides.map((o) => (
                                <p key={o.id} className="text-xs">
                                  {o.itemName}: ฿{o.newPrice}
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

      {/* Price Overrides List with Pagination */}
      <Card>
        <CardHeader>
          <CardTitle>Price Overrides</CardTitle>
          <CardDescription>
            Manage custom pricing for specific dates or periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Range</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Original Price</TableHead>
                <TableHead>New Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPriceOverrides?.map((override) => (
                <TableRow key={override.id}>
                  <TableCell className="font-medium">
                    {new Date(override.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {override.date !== override.endDate && (
                      <>
                        {" "}
                        -{" "}
                        {new Date(override.endDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{override.type}</Badge>
                  </TableCell>
                  <TableCell>{override.itemName}</TableCell>
                  <TableCell className="text-muted-foreground line-through">
                    ฿{formatNumberWithComma(override.originalPrice)}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    ฿{formatNumberWithComma(override.newPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        override.status === "active" ? "default" : "secondary"
                      }
                    >
                      {override.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(override)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(override.id)}
                        disabled={deletingId === override.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pricing Pagination */}
          <div className="mt-6">
            <Pagination
              currentPage={pricingPage}
              totalCount={filteredPriceOverrides.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setPricingPage}
              onLimitChange={setItemsPerPage}
              showLimitSelector={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Price Override Dialog */}
      <AddPriceOverrideDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        priceOverride={editingOverride}
        onSave={refreshOverrides}
        onUpdate={refreshOverrides}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Price Override</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this price override? This action
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
