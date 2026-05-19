"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getActionLogs,
  exportActionLogsToExcel,
  type ActionLog,
} from "@/actions/action-logs.actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter } from "date-fns";
import { Eye, FilterX, CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Pagination } from "@/components/pagination";

interface PaginatedResponse {
  data: ActionLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ActionLogsContent = () => {
  const params = useParams();
  const branchId = params.branchId as string;
  const { data: session } = useSession();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [featureFilter, setFeatureFilter] = useState<string>("");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    fetchLogs();
  }, [page, limit, featureFilter, actionTypeFilter, statusFilter, dateRange]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const response = await getActionLogs(
        page,
        limit,
        featureFilter === "all" ? undefined : featureFilter,
        actionTypeFilter === "all" ? undefined : actionTypeFilter,
        statusFilter === "all" ? undefined : statusFilter,
        branchId,
        dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      );

      if (!response.success || !response.data) {
        console.error("Failed to fetch action logs:", response.error);
        setLogs([]);
        setTotal(0);
        return;
      }

      setLogs(response.data.data);
      setTotal(response.data.meta?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching action logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log: ActionLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await exportActionLogsToExcel(
        featureFilter === "all" ? undefined : featureFilter,
        actionTypeFilter === "all" ? undefined : actionTypeFilter,
        statusFilter === "all" ? undefined : statusFilter,
        dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      );

      if (!response.success || !response.data) {
        console.error("Failed to export logs:", response.error);
        return;
      }

      // Create a blob from the CSV content
      const blob = new Blob([response.data.content], {
        type: "text/csv;charset=utf-8;",
      });

      // Create a temporary URL for the blob
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", response.data.filename);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting logs:", error);
    } finally {
      setExporting(false);
    }
  };

  const getFeatures = () => [
    { value: "all", label: "All Features" },
    { value: "daily", label: "Daily" },
    { value: "booking", label: "Booking" },
    { value: "promotion", label: "Promotion" },
    { value: "service", label: "Service" },
    { value: "programme", label: "Programme" },
    { value: "package", label: "Package" },
    { value: "staff", label: "Staff" },
    { value: "room", label: "Room" },
    { value: "bed", label: "Bed" },
    { value: "customer", label: "Customer" },
    { value: "guest", label: "Guest" },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Action Logs</h1>
          <p className="text-muted-foreground">
            Audit trail of all operations performed in the system
          </p>
        </div>
        <Button
          variant="default"
          disabled={loading || exporting}
          onClick={handleExport}
        >
          {exporting ? "Exporting..." : "Export Excel"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="w-full flex justify-between items-center">
          <CardTitle>Filters</CardTitle>
          {/* export */}

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setFeatureFilter("");
              setActionTypeFilter("");
              setStatusFilter("");
              setDateRange(undefined);
              setLimit(20);
            }}
          >
            <FilterX className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* First row: Dropdowns */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Feature</label>
              <Select value={featureFilter} onValueChange={setFeatureFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select feature" />
                </SelectTrigger>
                <SelectContent>
                  {getFeatures().map((feature) => (
                    <SelectItem key={feature.value} value={feature.value}>
                      {feature.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Action Type
              </label>
              <Select
                value={actionTypeFilter}
                onValueChange={setActionTypeFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !dateRange?.from ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Action Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No action logs found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(
                          new Date(log.actionDate),
                          "MMM d, yyyy HH:mm:ss",
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.feature}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.actionType === "create"
                              ? "bg-green-100 text-green-800"
                              : log.actionType === "update"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.actionType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.actorName || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.entityType || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}

          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalCount={total}
              itemsPerPage={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
              limitOptions={[10, 20, 50, 100]}
              showLimitSelector={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="min-w-2xl max-w-full overflow-auto">
          <DialogHeader>
            <DialogTitle>Action Log Details</DialogTitle>
            <DialogDescription>
              Complete information about the action
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date/Time
                  </label>
                  <p className="mt-1 text-sm">
                    {format(
                      new Date(selectedLog.actionDate),
                      "MMM d, yyyy HH:mm:ss",
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Feature
                  </label>
                  <p className="mt-1 text-sm capitalize">
                    {selectedLog.feature}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Action Type
                  </label>
                  <p className="mt-1 text-sm capitalize">
                    {selectedLog.actionType}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <p className="mt-1 text-sm capitalize">
                    {selectedLog.status}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Actor Name
                  </label>
                  <p className="mt-1 text-sm">{selectedLog.actorName || "-"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Entity Type
                  </label>
                  <p className="mt-1 text-sm">
                    {selectedLog.entityType || "-"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedLog.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="mt-2 text-sm bg-muted p-3 rounded">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {/* Old Data */}
              {selectedLog.oldData &&
                Object.keys(selectedLog.oldData).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Previous Values
                    </label>
                    <pre className="mt-2 text-sm bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.oldData, null, 2)}
                    </pre>
                  </div>
                )}

              {/* New Data */}
              {selectedLog.newData &&
                Object.keys(selectedLog.newData).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      New Values
                    </label>
                    <pre className="mt-2 text-sm bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.newData, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function ActionLogsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActionLogsContent />
    </Suspense>
  );
}
