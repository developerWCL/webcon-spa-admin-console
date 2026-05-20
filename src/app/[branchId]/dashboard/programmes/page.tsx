"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  FilterX,
  Copy,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreateProgrammeDialog } from "./_components/create-programme-dialog";
import { DeleteProgrammeDialog } from "./_components/delete-programme-dialog";
import { getProgrammesAction } from "@/actions/programme.action";
import { Pagination } from "@/components/pagination";
import { Programme } from "@/types/api/programme";
import { formatNumberWithComma } from "@/utils/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function ProgrammesPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const { data: session } = useSession();

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programmesToDelete, setProgrammesToDelete] =
    useState<Programme | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  // Fetch programmes from API with server-side pagination
  const fetchProgrammes = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    const result = await getProgrammesAction(branchId, {
      page,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
    });

    if (result.success && result.data) {
      // Handle both paginated and non-paginated responses
      const programmesData = Array.isArray(result.data)
        ? result.data
        : result.data.data || [];

      setProgrammes(programmesData);

      setTotalCount(result?.data?.meta?.totalItems);
      setCurrentPage(result?.data?.meta?.currentPage);
    } else {
      setError(result.error || "Failed to load programmes");
      console.error("Error fetching programmes:", result.error);
    }

    setLoading(false);
  };

  // Fetch when page, search, or status changes
  useEffect(() => {
    if (branchId) {
      // Reset to page 1 when search or status changes
      setCurrentPage(1);
      fetchProgrammes(1);
    }
  }, [branchId, searchTerm, selectedStatus]);

  // Fetch when current page changes
  useEffect(() => {
    if (branchId) {
      fetchProgrammes(currentPage);
    }
  }, [branchId, currentPage, itemsPerPage]);

  const handleCopyLink = async (programmeId: string) => {
    try {
      const bookingEngineUrl =
        process.env.NEXT_PUBLIC_BOOKING_ENGINE_URL ||
        "https://spa.webconnection.app";
      const spaId = session?.spaIds?.[0] || "default-spa";

      const bookingLink = `${bookingEngineUrl}/${spaId}?branchId=${branchId}&serviceId=${programmeId}&serviceType=programs`;
      await navigator.clipboard.writeText(bookingLink);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programmes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage multi-step treatment programmes
          </p>
        </div>
        <Button onClick={() => setOpenDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Programme
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search programmes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // reset all filters and pagination
              setSearchTerm("");
              setSelectedStatus("all");
              setCurrentPage(1);
              setItemsPerPage(10);
            }}
          >
            <FilterX className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Programmes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Loading programmes...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-muted-foreground text-sm">
            Please try refreshing the page or check your network connection.
          </p>
        </div>
      ) : programmes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No programmes found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {programmes.map((programme) => (
            <Card
              key={`programme-${programme.id}`}
              className="overflow-hidden flex flex-col"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="line-clamp-1">
                    {programme.name}
                  </CardTitle>
                  <Badge
                    variant={
                      programme.status === "active" ? "default" : "secondary"
                    }
                  >
                    {programme.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  {programme.steps.length} step
                  {programme.steps.length > 1 ? "s" : ""} programme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Price
                    </span>
                    <span className="text-lg font-bold text-primary">
                      ฿{formatNumberWithComma(programme.price)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {programme.steps.reduce((total, step) => {
                      step ? (total += parseInt(step.duration)) : (total += 0);
                      return total;
                    }, 0)}{" "}
                    mins duration
                  </div>
                </div>

                <div className="space-y-1 flex-grow">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Treatment Steps:
                  </div>
                  {programme.steps.length > 0 ? (
                    <>
                      {programme.steps
                        .slice(0, 3)
                        .map((step, index: number) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-2 text-sm py-1"
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                            <div className="w-full flex justify-between">
                              <span className="text-muted-foreground line-clamp-1">
                                {step.title}
                              </span>
                              <p className="text-xs text-muted-foreground/70">
                                {step.duration} mins
                              </p>
                            </div>
                          </div>
                        ))}
                      {programme.steps.length > 3 && (
                        <div className="text-xs text-muted-foreground pt-1">
                          +{programme.steps.length - 3} more step
                          {programme.steps.length - 3 > 1 ? "s" : ""}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground py-2">
                      No steps available
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {programme.description}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingProgramme(programme);
                      setOpenDialog(true);
                    }}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(programme.id as string)}
                    title="Copy booking link"
                    disabled={programme.status !== "active"}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProgrammesToDelete(programme);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onLimitChange={setItemsPerPage}
        showLimitSelector={true}
      />

      {/* Create/Edit Programme Dialog */}
      <CreateProgrammeDialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingProgramme(null);
          }
        }}
        defaultData={editingProgramme}
        onSubmit={() => {
          // Refetch after submission completes
          setCurrentPage(1);
          fetchProgrammes(1);
        }}
      />

      {/* Delete Programme Dialog */}
      <DeleteProgrammeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        programme={programmesToDelete}
        branchId={branchId}
        onDeleteSuccess={() => {
          // Reset to page 1 and refetch programmes
          setCurrentPage(1);
          fetchProgrammes(1);
          setProgrammesToDelete(null);
        }}
      />
    </div>
  );
}
