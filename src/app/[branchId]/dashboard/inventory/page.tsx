"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { CreateBedDialog } from "./components/CreateBedDialog";
import { RoomsTab } from "./components/RoomsTab";
import { Bed, BedsTab } from "./components/BedsTab";
import { ScheduleTab } from "./components/ScheduleTab";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination, PaginationMeta } from "@/components/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Plus, FilterX } from "lucide-react";
import { getRooms, createRoom } from "@/actions/rooms.actions";
import { getBeds, createBed } from "@/actions/beds.actions";
import { getBookings } from "@/actions/booking.actions";
import { toast } from "sonner";
import { se } from "date-fns/locale";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  amenities: string[];
  floor: number;
  size: string;
  beds: string[];
}
interface PaginationData {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}

export default function RoomsPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "schedule";
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openCreateBedDialog, setOpenCreateBedDialog] = useState(false);
  const [openCreateRoomDialog, setOpenCreateRoomDialog] = useState(false);
  const [dateSelected, setDateSelected] = useState<Date | null>(null);

  // Pagination states
  const [roomsPage, setRoomsPage] = useState(1);
  const [bedsPage, setBedsPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const [roomsPagination, setRoomsPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [bedsPagination, setBedsPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [schedulePagination, setSchedulePagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const result = await getRooms(
          branchId,
          roomsPage,
          roomsPagination.limit,
          searchQuery || undefined,
          statusFilter !== "all" ? statusFilter : undefined,
        );
        if (result.success) {
          setRooms(result.data || []);
          if (result.pagination) {
            setRoomsPagination(result.pagination);
          }
        } else {
          toast.error(result.error || "Failed to load rooms");
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Failed to load rooms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [
    branchId,
    roomsPage,
    roomsPagination.limit,
    searchQuery,
    statusFilter,
    refreshTrigger,
  ]);

  // Fetch beds
  useEffect(() => {
    if (activeTab !== "beds") return;

    const fetchBeds = async () => {
      setIsLoading(true);
      try {
        const result = await getBeds(
          branchId,
          bedsPage,
          bedsPagination.limit,
          searchQuery || undefined,
          statusFilter !== "all" ? statusFilter : undefined,
        );
        if (result.success) {
          setBeds(result.data || []);
          if (result.pagination) {
            setBedsPagination(result.pagination);
          }
        } else {
          toast.error(result.error || "Failed to load beds");
        }
      } catch (error) {
        console.error("Error fetching beds:", error);
        toast.error("Failed to load beds");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeds();
  }, [
    branchId,
    bedsPage,
    bedsPagination.limit,
    searchQuery,
    statusFilter,
    activeTab,
    refreshTrigger,
  ]);

  // Fetch today's schedule bookings
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      if (dateSelected) {
        startDate.setTime(dateSelected.getTime());
        endDate.setTime(dateSelected.getTime());
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      const result = await getBookings(
        branchId,
        schedulePage,
        schedulePagination.limit,
        searchQuery || undefined,
        statusFilter !== "all" ? statusFilter : undefined,
        startDate.toISOString(),
        endDate.toISOString(),
        true, // hasBedOrRoom filter to only get bookings with bed or room assigned
      );
      if (result.success) {
        setTodaySchedule(result.data || []);
        if (result.meta && "itemsPerPage" in result.meta) {
          setSchedulePagination({
            currentPage: result.meta.currentPage,
            totalPages: result.meta.totalPages,
            total: result.meta.totalItems,
            limit: result.meta.itemsPerPage,
          });
        }
      } else {
        setTodaySchedule([]);
      }
      setIsLoading(false);
    };
    if (activeTab === "schedule") {
      fetchBookings();
    }
  }, [
    branchId,
    activeTab,
    schedulePage,
    schedulePagination.limit,
    searchQuery,
    statusFilter,
    dateSelected,
  ]);

  useEffect(() => {
    if (activeTab !== (searchParams.get("tab") || "schedule")) {
      router.push(`?tab=${activeTab}`);
    }
  }, [activeTab, router, searchParams]);

  const handleRoomCreate = () => {
    // Reset to first page to show the new/updated room
    setRoomsPage(1);
  };

  const handleRoomSaved = () => {
    // Trigger a refresh by toggling the refresh trigger
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBedCreate = () => {
    setBedsPage(1);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleRoomsLimitChange = (newLimit: number) => {
    setRoomsPagination((prev) => ({ ...prev, limit: newLimit }));
    setRoomsPage(1);
  };

  const handleBedsLimitChange = (newLimit: number) => {
    setBedsPagination((prev) => ({ ...prev, limit: newLimit }));
    setBedsPage(1);
  };

  const handleScheduleLimitChange = (newLimit: number) => {
    setSchedulePagination((prev) => ({ ...prev, limit: newLimit }));
    setSchedulePage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage treatment inventory allocation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpenCreateRoomDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
          <CreateRoomDialog
            onRoomCreate={handleRoomSaved}
            open={openCreateRoomDialog}
            onOpenChange={setOpenCreateRoomDialog}
          />
          <Button
            variant="default"
            onClick={() => setOpenCreateBedDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bed
          </Button>
          <CreateBedDialog
            rooms={rooms}
            onBedCreate={handleBedCreate}
            open={openCreateBedDialog}
            onOpenChange={setOpenCreateBedDialog}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="schedule">Inventory Schedule</TabsTrigger>
          <TabsTrigger value="rooms">Room/Area</TabsTrigger>
          <TabsTrigger value="beds">Bed/Chair</TabsTrigger>
        </TabsList>
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms or beds..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setRoomsPage(1);
                    setBedsPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setRoomsPage(1);
                    setBedsPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // reset all filters and pagination
                    setSearchQuery("");
                    setStatusFilter("all");
                    setRoomsPage(1);
                    setBedsPage(1);
                    setRoomsPagination((prev) => ({ ...prev, limit: 10 }));
                    setBedsPagination((prev) => ({ ...prev, limit: 10 }));
                  }}
                >
                  <FilterX className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="rooms" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== "all"
                    ? "No rooms found"
                    : "No rooms yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first treatment room"}
                </p>
                {!(searchQuery || statusFilter !== "all") && (
                  <CreateRoomDialog onRoomCreate={handleRoomCreate} />
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <RoomsTab rooms={rooms} onRoomUpdated={handleRoomSaved} />
              {/* Pagination for rooms */}

              <Pagination
                meta={{
                  totalItems: roomsPagination.total,
                  itemCount: rooms.length,
                  itemsPerPage: roomsPagination.limit,
                  totalPages: roomsPagination.totalPages,
                  currentPage: roomsPagination.currentPage,
                }}
                onPageChange={setRoomsPage}
                showLimitSelector={true}
                onLimitChange={handleRoomsLimitChange}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : beds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== "all"
                    ? "No beds found"
                    : "No beds yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first bed or chair"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <BedsTab
                beds={beds}
                rooms={rooms}
                onBedUpdated={handleBedCreate}
              />
              {/* Pagination for beds */}

              <Pagination
                meta={{
                  totalItems: bedsPagination.total,
                  itemCount: beds.length,
                  itemsPerPage: bedsPagination.limit,
                  totalPages: bedsPagination.totalPages,
                  currentPage: bedsPagination.currentPage,
                }}
                onPageChange={setBedsPage}
                showLimitSelector={true}
                onLimitChange={handleBedsLimitChange}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <div className="flex flex-col gap-4">
            <ScheduleTab
              bookings={todaySchedule}
              selectedDate={dateSelected}
              onDateChange={(date) => {
                setDateSelected(date);
                setSchedulePage(1);
              }}
              isLoading={isLoading}
              includeFilter={
                searchQuery || statusFilter !== "all" || dateSelected
                  ? true
                  : false
              }
            />
            <Pagination
              meta={{
                totalItems: schedulePagination.total,
                itemCount: todaySchedule.length,
                itemsPerPage: schedulePagination.limit,
                totalPages: schedulePagination.totalPages,
                currentPage: schedulePagination.currentPage,
              }}
              onPageChange={setSchedulePage}
              showLimitSelector={true}
              onLimitChange={handleScheduleLimitChange}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
