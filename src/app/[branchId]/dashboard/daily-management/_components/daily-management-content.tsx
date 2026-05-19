"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, DoorOpen, UserX } from "lucide-react";
import { toast } from "sonner";
import type { Staff, StaffDayOff } from "@/types";
import { PricingTab } from "./pricing-tab";
import { AllotmentTab } from "./allotment-tab";
import { StaffDayOffTab } from "./staff-dayoff-tab";
import { AddPriceOverrideDialog } from "./add-price-override-dialog";
import { ManageAvailabilityDialog } from "./manage-availability-dialog";
import { AddStaffDayOffDialog } from "./add-staff-dayoff-dialog";
import {
  deleteStaffDayOff,
  getPriceOverrides,
} from "@/actions/daily-management.actions";

interface DailyManagementContentProps {
  branchId: string;
  staffDayOffs: StaffDayOff[];
  staffMembers: Staff[];
  paginationMeta?: any;
}

export function DailyManagementContent({
  branchId,
  staffDayOffs,
  staffMembers,
  paginationMeta,
}: DailyManagementContentProps) {
  const [activeTab, setActiveTab] = useState("pricing");
  const [priceOverrides, setPriceOverrides] = useState<any[]>([]);
  const [priceOverridesLoading, setPriceOverridesLoading] = useState(false);
  const [openPricingDialog, setOpenPricingDialog] = useState(false);
  const [openAllotmentDialog, setOpenAllotmentDialog] = useState(false);
  const [openStaffDayOffDialog, setOpenStaffDayOffDialog] = useState(false);
  const [editingDayOff, setEditingDayOff] = useState<StaffDayOff | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  ); // Format: YYYY-MM
  const [allotmentMonth, setAllotmentMonth] = useState(
    new Date().toISOString().slice(0, 7),
  ); // Format: YYYY-MM
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Pagination states
  const [pricingPage, setPricingPage] = useState(1);
  const [allotmentPage, setAllotmentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch price overrides on mount and when refetchTrigger changes
  useEffect(() => {
    const fetchPriceOverrides = async () => {
      setPriceOverridesLoading(true);
      try {
        const startOfDay = selectedMonth
          ? new Date(`${selectedMonth}-01`)
          : undefined;
        startOfDay?.setHours(0, 0, 0, 0);

        const endOfDay = selectedMonth
          ? new Date(
              `${selectedMonth}-${new Date(
                new Date(selectedMonth).getFullYear(),
                new Date(selectedMonth).getMonth() + 1,
                0,
              ).getDate()}`,
            )
          : undefined;
        endOfDay?.setHours(23, 59, 59, 999);
        const result = await getPriceOverrides(branchId, {
          startDate: startOfDay ? startOfDay.toISOString() : undefined,
          endDate: endOfDay ? endOfDay.toISOString() : undefined,
        });

        if (result.success && result.data) {
          setPriceOverrides(result.data);
        } else {
          toast.error(result.error || "Failed to fetch price overrides");
        }
      } catch (error) {
        console.error("Error fetching price overrides:", error);
        toast.error("An error occurred while fetching price overrides");
      } finally {
        setPriceOverridesLoading(false);
      }
    };

    fetchPriceOverrides();
  }, [branchId, refetchTrigger, selectedMonth]);

  const handleEditDayOff = (dayOff: StaffDayOff) => {
    setEditingDayOff(dayOff);
    setOpenStaffDayOffDialog(true);
  };

  const handleAddDayOff = () => {
    setEditingDayOff(null);
    setOpenStaffDayOffDialog(true);
  };

  const handleDeleteDayOff = async (dayOffId: string) => {
    try {
      const result = await deleteStaffDayOff(branchId, dayOffId);
      if (result.success) {
        toast.success("Staff day-off deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete staff day-off");
      }
    } catch (error) {
      console.error("Error deleting staff day-off:", error);
      toast.error("An error occurred while deleting staff day-off");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Daily Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage daily pricing and room/bed availability
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-3xl grid-cols-3">
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Dynamic Pricing
          </TabsTrigger>
          <TabsTrigger value="allotment" className="gap-2">
            <DoorOpen className="h-4 w-4" />
            Allotment & Availability
          </TabsTrigger>
          <TabsTrigger value="staff-dayoff" className="gap-2">
            <UserX className="h-4 w-4" />
            Staff Day-Off
          </TabsTrigger>
        </TabsList>

        {/* Dynamic Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4 mt-6">
          <PricingTab
            priceOverrides={priceOverrides}
            onPriceOverridesChange={setPriceOverrides}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            pricingPage={pricingPage}
            setPricingPage={setPricingPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            onAddPrice={() => setOpenPricingDialog(true)}
            branchId={branchId}
          />
        </TabsContent>

        {/* Allotment & Availability Tab */}
        <TabsContent value="allotment" className="space-y-4 mt-6">
          <AllotmentTab
            branchId={branchId}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            allotmentMonth={allotmentMonth}
            setAllotmentMonth={setAllotmentMonth}
            allotmentPage={allotmentPage}
            setAllotmentPage={setAllotmentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            onAddAllotment={() => setOpenAllotmentDialog(true)}
            refetchTrigger={refetchTrigger}
          />
        </TabsContent>

        {/* Staff Day-Off Tab */}
        <TabsContent value="staff-dayoff" className="space-y-4 mt-6">
          <StaffDayOffTab
            branchId={branchId}
            initialDayOffs={staffDayOffs}
            initialPaginationMeta={paginationMeta}
            onAddDayOff={handleAddDayOff}
            onEditDayOff={handleEditDayOff}
            onDeleteDayOff={handleDeleteDayOff}
            refetchTrigger={refetchTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddPriceOverrideDialog
        open={openPricingDialog}
        onOpenChange={setOpenPricingDialog}
        onSave={() => {
          setOpenPricingDialog(false);
          setRefetchTrigger((prev) => prev + 1);
        }}
      />

      <ManageAvailabilityDialog
        open={openAllotmentDialog}
        onOpenChange={setOpenAllotmentDialog}
        onSave={() => {
          setOpenAllotmentDialog(false);
          setRefetchTrigger((prev) => prev + 1);
        }}
      />

      <AddStaffDayOffDialog
        open={openStaffDayOffDialog}
        onOpenChange={setOpenStaffDayOffDialog}
        staffMembers={staffMembers}
        editingDayOff={editingDayOff}
        onSave={() => {
          setOpenStaffDayOffDialog(false);
          setRefetchTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
}
