"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
  getReportSummary,
  getBookingReport,
  getTopServicesReport,
  getCustomerSegmentsReport,
  getCustomerRetentionReport,
  getGuestReport,
  BookingReportItem,
  TopServiceItem,
  CustomerSegmentItem,
  CustomerRetentionItem,
  GuestReportItem,
} from "@/actions/report.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Star,
  BarChart3,
  PieChart,
  TrendingDown,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { Country, getCountries } from "@/actions/countries";

interface ReportSummary {
  totalRevenue: number;
  totalBookings: number;
  uniqueCustomers: number;
  avgBookingValue: number;
  revenueGrowth?: number;
  bookingsGrowth?: number;
  customersGrowth?: number;
  avgValueGrowth?: number;
}
export default function ReportsPage() {
  const params = useParams();
  const branchId = params.branchId as string;

  const [dateRange, setDateRange] = useState("month");
  const [dateType, setDateType] = useState("bookingDate");
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [salesSearch, setSalesSearch] = useState("");
  const [selectedNationality, setSelectedNationality] = useState<string | null>(
    null,
  );
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [salesData, setSalesData] = useState<BookingReportItem[]>([]);
  const [topServices, setTopServices] = useState<TopServiceItem[]>([]);
  const [customerSegments, setCustomerSegments] = useState<
    CustomerSegmentItem[]
  >([]);
  const [customerRetention, setCustomerRetention] =
    useState<CustomerRetentionItem | null>(null);
  const [guestData, setGuestData] = useState<GuestReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [COUNTRIES, setCOUNTRIES] = useState<Country[]>([]);

  // Empty State Component
  const EmptyState = ({
    title,
    description,
    icon: Icon,
  }: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mt-2">
        {description}
      </p>
    </div>
  );

  // Helper function to format date range display with actual dates
  const getDateRangeDisplay = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    const today = new Date();
    let rangeStart: Date;
    let rangeEnd: Date;

    if (dateRange === "custom" && startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
      return `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;
    }

    if (dateRange === "today") {
      rangeStart = new Date(today);
      rangeEnd = new Date(today);
    } else if (dateRange === "week") {
      // Get start of week (Sunday)
      rangeStart = new Date(today);
      rangeStart.setDate(today.getDate() - today.getDay());
      // Get end of week (Saturday)
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 6);
    } else if (dateRange === "month") {
      // Get first day of month
      rangeStart = new Date(today.getFullYear(), today.getMonth(), 1);
      // Get last day of month
      rangeEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (dateRange === "quarter") {
      const quarter = Math.floor(today.getMonth() / 3);
      // Get first day of quarter
      rangeStart = new Date(today.getFullYear(), quarter * 3, 1);
      // Get last day of quarter
      rangeEnd = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
    } else if (dateRange === "year") {
      // Get first day of year
      rangeStart = new Date(today.getFullYear(), 0, 1);
      // Get last day of year
      rangeEnd = new Date(today.getFullYear(), 11, 31);
    } else {
      return dateRange;
    }

    const dateRangeLabels: Record<string, string> = {
      today: "Today",
      week: "This Week",
      month: "This Month",
      quarter: "This Quarter",
      year: "This Year",
    };

    const label = dateRangeLabels[dateRange] || dateRange;
    return `${label} (${formatDate(rangeStart)} - ${formatDate(rangeEnd)})`;
  };

  const getFilteredSalesData = () => {
    const query = salesSearch.trim().toLowerCase();

    return salesData.filter((booking) => {
      const matchesServiceType =
        selectedServiceType !== "all"
          ? booking.serviceType.toLowerCase() === selectedServiceType
          : true;
      const matchesQuery =
        !query ||
        [
          booking.bookingId,
          booking.customer,
          booking.promotionCode || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesServiceType && matchesQuery;
    });
  };

  // Export functions for each tab
  const exportSalesReport = () => {
        const filteredSalesData = getFilteredSalesData();

    if (!filteredSalesData || filteredSalesData.length === 0) {
      alert("No booking data to export");
      return;
    }

    const data = filteredSalesData.map((booking) => ({
      "Booking ID": booking.bookingId,
      Customer: booking.customer,
      "Service Type": booking.serviceType,
      "Service Name": booking.serviceName,
      Duration: `${booking.duration} min`,
      "Service Date": new Date(booking.serviceDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      ),
      "Service Time": booking.serviceTime,
      Price: booking.price,
      "Booking Status": booking.bookingStatus,
      "Payment Status": booking.paymentStatus,
      "Booking Date": new Date(booking.bookingDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      ),
      "Promotion Code": booking.promotionCode || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add header information
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["Booking Report"],
        [`Date Range: ${getDateRangeDisplay()}`],
        [
          `Report Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        ],
        [],
      ],
      { origin: "A1" },
    );

    // Add data table below header
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A5" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings Report");

    // Set column widths
    const columnWidths = [
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, "bookings-report.xlsx");
  };

  const exportServicesReport = () => {
    const filteredServices =
      selectedServiceType !== "all"
        ? topServices.filter(
            (service) => service.serviceType === selectedServiceType,
          )
        : topServices;

    if (!filteredServices || filteredServices.length === 0) {
      alert("No service data to export");
      return;
    }

    const data = filteredServices.map((service, index) => ({
      Rank: index + 1,
      "Service Name": service.serviceName,
      "Service Type": service.serviceType,
      Bookings: service.bookings,
      Revenue: service.revenue,
      "Growth %": service.growth,
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add header information
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["Service Performance Report"],
        [`Date Range: ${getDateRangeDisplay()}`],
        [
          `Report Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        ],
        [],
      ],
      { origin: "A1" },
    );

    // Add data table below header
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A5" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Services Report");

    const columnWidths = [
      { wch: 8 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, "services-report.xlsx");
  };

  const exportCustomersReport = () => {
    if (!customerSegments || customerSegments.length === 0) {
      alert("No customer data to export");
      return;
    }

    const totalSegmentRevenue = customerSegments.reduce(
      (sum, s) => sum + s.revenue,
      0,
    );

    const data = customerSegments.map((segment) => {
      const revenuePercentage =
        totalSegmentRevenue > 0
          ? (segment.revenue / totalSegmentRevenue) * 100
          : 0;
      return {
        Segment: segment.segment,
        Customers: segment.count,
        "Total Revenue": segment.revenue,
        "Avg. Spending": segment.avgSpending,
        "% of Total Revenue": Math.round(revenuePercentage),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add header information
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["Customer Analytics Report"],
        [`Date Range: ${getDateRangeDisplay()}`],
        [
          `Report Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        ],
        [],
      ],
      { origin: "A1" },
    );

    // Add data table below header
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A5" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers Report");

    const columnWidths = [
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, "customers-report.xlsx");
  };

  const exportGuestReport = () => {
    const filteredGuestData = selectedNationality
      ? guestData.filter((guest) => guest.nationality === selectedNationality)
      : guestData;

    if (!filteredGuestData || filteredGuestData.length === 0) {
      alert("No guest data to export");
      return;
    }

    const data = filteredGuestData.map((guest) => ({
      Guest: guest.guest,
      Email: guest.email,
      Gender: guest.gender || "N/A",
      Nationality:
        COUNTRIES.find((c) => c.code === guest.nationality)?.title || "N/A",
      "Member Status": guest.memberStatus,
      "Total Amount": guest.totalAmount,
      "Last Service Date": guest.lastServiceDate
        ? new Date(guest.lastServiceDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add header information
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["Guest Report"],
        [`Date Range: ${getDateRangeDisplay()}`],
        [
          `Report Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        ],
        [],
      ],
      { origin: "A1" },
    );

    // Add data table below header
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A5" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Guest Report");

    const columnWidths = [
      { wch: 18 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, "guest-report.xlsx");
  };

  const handleExportExcel = () => {
    switch (reportType) {
      case "sales":
        exportSalesReport();
        break;
      case "services":
        exportServicesReport();
        break;
      case "customers":
        exportCustomersReport();
        break;
      case "guests":
        exportGuestReport();
        break;
      default:
        alert("Please select a report to export");
    }
  };

  // Fetch countries on mount
  useEffect(() => {
    async function fetchCountries() {
      try {
        const countries = await getCountries();
        setCOUNTRIES(countries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    }
    fetchCountries();
  }, []);

  // Fetch summary and booking report data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let start = startDate;
        let end = endDate;
        switch (dateRange) {
          case "today":
            start = new Date();
            end = new Date();
            break;
          case "week":
            start = new Date();
            start.setDate(start.getDate() - start.getDay());
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            break;
          case "month":
            start = new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1,
            );
            end = new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0,
            );
            break;
          case "quarter":
            const quarter = Math.floor(new Date().getMonth() / 3);
            start = new Date(new Date().getFullYear(), quarter * 3, 1);
            end = new Date(new Date().getFullYear(), (quarter + 1) * 3, 0);
            break;
          case "year":
            start = new Date(new Date().getFullYear(), 0, 1);
            end = new Date(new Date().getFullYear(), 11, 31);
            break;
          case "custom":
            if (!startDate || !endDate) {
              throw new Error("Please select a valid date range");
            }
        }

        // Fetch summary data
        const summaryData = await getReportSummary(
          branchId,
          dateType,
          start,
          end,
        );
        if (summaryData) {
          setSummary(summaryData);
        } else {
          throw new Error("Failed to fetch summary data");
        }

        // Fetch booking report data
        const bookingData = await getBookingReport(
          branchId,
          dateType,
          start,
          end,
        );
        if (bookingData) {
          setSalesData(bookingData);
        } else {
          setSalesData([]);
        }

        // Fetch top services data
        const servicesData = await getTopServicesReport(
          branchId,
          dateType,
          start,
          end,
        );
        if (servicesData) {
          setTopServices(servicesData);
        } else {
          setTopServices([]);
        }

        // Fetch customer segments data
        const segmentsData = await getCustomerSegmentsReport(
          branchId,
          dateType,
          start,
          end,
        );
        if (segmentsData) {
          setCustomerSegments(segmentsData);
        } else {
          setCustomerSegments([]);
        }

        // Fetch customer retention data
        const retentionData = await getCustomerRetentionReport(
          branchId,
          dateType,
          start,
          end,
        );
        if (retentionData) {
          setCustomerRetention(retentionData);
        } else {
          setCustomerRetention(null);
        }

        // Fetch guest report data
        const guestReportData = await getGuestReport(
          branchId,
          dateType,
          start,
          end,
        );
        if (guestReportData) {
          setGuestData(guestReportData);
        } else {
          setGuestData([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        // Set default values if API fails
        setSummary({
          totalRevenue: 1237500,
          totalBookings: 618,
          uniqueCustomers: 324,
          avgBookingValue: 2002,
          revenueGrowth: 12.5,
          bookingsGrowth: 8.2,
          customersGrowth: 15.3,
          avgValueGrowth: 3.8,
        });
        setSalesData([]);
        setTopServices([]);
        setCustomerSegments([]);
        setGuestData([]);
      } finally {
        setLoading(false);
      }
    };

    if (branchId && (dateRange !== "custom" || (startDate && endDate))) {
      fetchData();
    }
  }, [branchId, dateRange, dateType, startDate, endDate]);

  // Reset service type filter when switching tabs
  useEffect(() => {
    setSelectedServiceType("all");
    setSelectedNationality(null);
  }, [reportType]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            This report shows only bookings with Confirmed and Completed status
            to ensure accurate business insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateType} onValueChange={setDateType}>
            <SelectTrigger className="w-40 hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bookingDate">Booking Date</SelectItem>
              <SelectItem value="serviceDate">Service Date</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-37.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === "custom" && (
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          )}
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{summary?.totalRevenue?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp
                className={`h-3 w-3 ${!summary?.revenueGrowth ? "text-green-600" : summary?.revenueGrowth >= 0 ? "text-green-600" : "hidden"}`}
              />
              <TrendingDown
                className={`h-3 w-3 ${!summary?.revenueGrowth ? "hidden" : summary?.revenueGrowth < 0 ? "text-red-600" : "hidden"}`}
              />
              <span
                className={`${!summary?.revenueGrowth ? "text-green-600" : summary?.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {summary?.revenueGrowth !== undefined
                  ? `${summary.revenueGrowth >= 0 ? "+" : ""}${summary.revenueGrowth}%`
                  : "+0%"}
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalBookings || "0"}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp
                className={`h-3 w-3 ${!summary?.bookingsGrowth ? "text-green-600" : summary?.bookingsGrowth >= 0 ? "text-green-600" : "hidden"}`}
              />
              <TrendingDown
                className={`h-3 w-3 ${!summary?.bookingsGrowth ? "hidden" : summary?.bookingsGrowth < 0 ? "text-red-600" : "hidden"}`}
              />
              <span
                className={`${!summary?.bookingsGrowth ? "text-green-600" : summary?.bookingsGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {summary?.bookingsGrowth !== undefined
                  ? `${summary.bookingsGrowth >= 0 ? "+" : ""}${summary.bookingsGrowth}%`
                  : "+0%"}
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.uniqueCustomers || "0"}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp
                className={`h-3 w-3 ${!summary?.customersGrowth ? "text-green-600" : summary?.customersGrowth >= 0 ? "text-green-600" : "hidden"}`}
              />
              <TrendingDown
                className={`h-3 w-3 ${!summary?.customersGrowth ? "hidden" : summary?.customersGrowth < 0 ? "text-red-600" : "hidden"}`}
              />
              <span
                className={`${!summary?.customersGrowth ? "text-green-600" : summary?.customersGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {summary?.customersGrowth !== undefined
                  ? `${summary.customersGrowth >= 0 ? "+" : ""}${summary.customersGrowth}%`
                  : "+0%"}
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Booking Value
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{summary?.avgBookingValue?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp
                className={`h-3 w-3 ${!summary?.avgValueGrowth ? "text-green-600" : summary?.avgValueGrowth >= 0 ? "text-green-600" : "hidden"}`}
              />
              <TrendingDown
                className={`h-3 w-3 ${!summary?.avgValueGrowth ? "hidden" : summary?.avgValueGrowth < 0 ? "text-red-600" : "hidden"}`}
              />
              <span
                className={`${!summary?.avgValueGrowth ? "text-green-600" : summary?.avgValueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {summary?.avgValueGrowth !== undefined
                  ? `${summary.avgValueGrowth >= 0 ? "+" : ""}${summary.avgValueGrowth}%`
                  : "+0%"}
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Tabs */}
      <Tabs
        value={reportType}
        onValueChange={setReportType}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="sales">
            <DollarSign className="mr-2 h-4 w-4" />
            Bookings Report
          </TabsTrigger>
          <TabsTrigger value="services">
            <Package className="mr-2 h-4 w-4" />
            Service Performance
          </TabsTrigger>

          <TabsTrigger value="customers">
            <PieChart className="mr-2 h-4 w-4" />
            Customer Analytics
          </TabsTrigger>

          <TabsTrigger value="guests">
            <Users className="mr-2 h-4 w-4" />
            Guest Report
          </TabsTrigger>
        </TabsList>

        {/* Sales Report */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Booking Report</CardTitle>
                  <CardDescription>
                    Detailed booking information for the selected period.
                  </CardDescription>
                </div>
               <div className="flex items-center gap-3">
                  <Input
                    type="search"
                    placeholder="Search bookings..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="w-56"
                  />
                  <Select
                    value={selectedServiceType || ""}
                    onValueChange={(value) => setSelectedServiceType(value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Service Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="package">Package</SelectItem>
                      <SelectItem value="programme">Programme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {salesData && salesData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead>Service Time</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Booking Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Booking Date</TableHead>
                                            <TableHead>Promotion Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredSalesData().map((booking, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {booking.bookingId}
                          </TableCell>
                          <TableCell>{booking.customer}</TableCell>
                          <TableCell>{booking.serviceType}</TableCell>
                          <TableCell>{booking.serviceName}</TableCell>
                          <TableCell>{booking.duration} min</TableCell>
                          <TableCell>
                            {new Date(booking.serviceDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </TableCell>
                          <TableCell>{booking.serviceTime}</TableCell>
                          <TableCell className="font-semibold">
                            ฿{booking.price.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                booking.bookingStatus === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : booking.bookingStatus === "CONFIRMED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {booking.bookingStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                booking.paymentStatus === "Paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {booking.paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(booking.bookingDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </TableCell>
                          <TableCell>{booking.promotionCode || "-"}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No Booking Data"
                  description="Start by creating bookings to see detailed booking information here"
                  icon={Calendar}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Performance */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Performing Services</CardTitle>
                  <CardDescription>
                    Most popular services by bookings and revenue
                  </CardDescription>
                </div>
                <Select
                  value={selectedServiceType || ""}
                  onValueChange={(value) => setSelectedServiceType(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Service Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="programme">Programme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {topServices && topServices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topServices
                      .filter((service) =>
                        selectedServiceType !== "all"
                          ? service.serviceType.toLowerCase() ===
                            selectedServiceType
                          : true,
                      )
                      .map((service, index) => (
                        <TableRow key={service.serviceId}>
                          <TableCell className="font-bold">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {service.serviceName}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                              {service.serviceType}
                            </span>
                          </TableCell>
                          <TableCell>{service.bookings}</TableCell>
                          <TableCell className="font-semibold">
                            ฿{service.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`flex items-center gap-1 ${service.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              <TrendingUp
                                className={`h-3 w-3 ${service.growth < 0 ? "rotate-180" : ""}`}
                              />
                              {service.growth >= 0 ? "+" : ""}
                              {service.growth}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No Service Data"
                  description="Services will appear here once bookings are completed"
                  icon={Package}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Analytics */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segmentation</CardTitle>
              <CardDescription>
                Customer groups by behavior and spending patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customerSegments && customerSegments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead>Customers</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Avg. Spending</TableHead>
                      <TableHead>% of Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerSegments.map((segment) => {
                      // Calculate total revenue from all segments
                      const totalSegmentRevenue = customerSegments.reduce(
                        (sum, s) => sum + s.revenue,
                        0,
                      );
                      const revenuePercentage =
                        totalSegmentRevenue > 0
                          ? (segment.revenue / totalSegmentRevenue) * 100
                          : 0;

                      return (
                        <TableRow key={segment.segment}>
                          <TableCell className="font-medium">
                            {segment.segment}
                          </TableCell>
                          <TableCell>{segment.count}</TableCell>
                          <TableCell className="font-semibold">
                            ฿{segment.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ฿{segment.avgSpending.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{
                                    width: `${revenuePercentage}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-semibold">
                                {Math.round(revenuePercentage)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No Customer Segments"
                  description="Customer data will be segmented once there are bookings"
                  icon={Users}
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Guest Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customerRetention ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Repeat Guest Rate
                        </span>
                        <span className="text-2xl font-bold">
                          {customerRetention?.repeatCustomerRate || 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-green-600"
                          style={{
                            width: `${customerRetention?.repeatCustomerRate || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          New Guests
                        </p>
                        <p className="text-2xl font-bold">
                          {customerRetention?.newCustomersRate || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ({customerRetention?.newCustomersCount || 0} guests)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Returning
                        </p>
                        <p className="text-2xl font-bold">
                          {customerRetention?.returningCustomersRate || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ({customerRetention?.returningCustomersCount || 0}{" "}
                          guests)
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="No Retention Data"
                    description="Retention metrics will appear once customers have multiple bookings"
                    icon={TrendingUp}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customerRetention ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Average Visits Per Guest
                      </p>
                      <p className="text-3xl font-bold">
                        {customerRetention?.avgVisitsPerCustomer || 0}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Guests
                        </p>
                        <p className="text-xl font-bold">
                          {customerRetention?.totalCustomers || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Repeat Rate
                        </p>
                        <p className="text-xl font-bold">
                          {customerRetention?.repeatCustomerRate || 0}%
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="No Engagement Data"
                    description="Engagement metrics will appear once there are bookings"
                    icon={Star}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guest Report */}
        <TabsContent value="guests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Guest Report</CardTitle>
                  <CardDescription>
                    Detailed guest information and engagement metrics
                  </CardDescription>
                </div>
                <Popover
                  open={nationalityOpen}
                  onOpenChange={setNationalityOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={nationalityOpen}
                      className="w-48 justify-between"
                    >
                      {selectedNationality
                        ? COUNTRIES.find(
                            (country) => country.code === selectedNationality,
                          )?.title
                        : "Select nationality..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 max-h-80 p-0 overflow-y-auto">
                    <Command>
                      <CommandInput placeholder="Search nationality..." />
                      <CommandEmpty>No nationality found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedNationality(null);
                            setNationalityOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !selectedNationality
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          All Nationalities
                        </CommandItem>
                        {COUNTRIES.map((country) => (
                          <CommandItem
                            key={country.code}
                            value={country.title}
                            onSelect={() => {
                              setSelectedNationality(
                                selectedNationality === country.code
                                  ? null
                                  : country.code,
                              );
                              setNationalityOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedNationality === country.code
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {country.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              {guestData && guestData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Member Status</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Last Service Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guestData
                      .filter((guest) =>
                        selectedNationality
                          ? guest.nationality === selectedNationality
                          : true,
                      )
                      .map((guest) => (
                        <TableRow key={guest.guestId}>
                          <TableCell className="font-medium">
                            {guest.guest}
                          </TableCell>
                          <TableCell>{guest.email}</TableCell>
                          <TableCell>{guest.gender || "N/A"}</TableCell>
                          <TableCell>
                            {COUNTRIES.find((c) => c.code === guest.nationality)
                              ?.title || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                guest.memberStatus === "Platinum"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : guest.memberStatus === "Gold"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : guest.memberStatus === "Silver"
                                      ? "bg-slate-100 text-slate-800"
                                      : "bg-yellow-50 text-yellow-700"
                              }`}
                            >
                              {guest.memberStatus}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ฿{guest.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {guest.lastServiceDate
                              ? new Date(
                                  guest.lastServiceDate,
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No Guest Data"
                  description="Guest information will appear once bookings are created"
                  icon={Users}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
