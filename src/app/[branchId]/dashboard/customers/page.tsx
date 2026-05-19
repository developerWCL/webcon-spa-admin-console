"use client";

import { Checkbox } from "@/components/ui/checkbox";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  getCustomers,
  getAppUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Guest,
  type AppUser,
} from "@/actions/customer.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  OctagonAlert,
  FilterX,
} from "lucide-react";
import {
  EditGuestDialog,
  EditGuestFormData,
} from "@/components/dialogs/edit-guest-dialog";
import { Pagination, PaginationMeta } from "@/components/pagination";

const genderConfig = {
  male: { label: "Male", color: "bg-blue-500" },
  female: { label: "Female", color: "bg-pink-500" },
  other: { label: "Other", color: "bg-gray-500" },
};
const membershipConfig = {
  platinum: {
    label: "Platinum",
    color: "bg-purple-500",
    textColor: "text-purple-600",
  },
  gold: { label: "Gold", color: "bg-yellow-500", textColor: "text-yellow-600" },
  silver: { label: "Silver", color: "bg-gray-400", textColor: "text-gray-600" },
  bronze: {
    label: "Bronze",
    color: "bg-orange-600",
    textColor: "text-orange-600",
  },
};

/**
 * Get membership tier based on booking items count
 * Bronze: <= 5 bookings
 * Silver: > 5 AND <= 15 bookings
 * Gold: > 15 AND <= 25 bookings
 * Platinum: > 25 bookings
 */
function getMembershipByBookings(
  bookingCount: number,
): keyof typeof membershipConfig {
  if (bookingCount > 25) return "platinum";
  if (bookingCount > 15) return "gold";
  if (bookingCount > 5) return "silver";
  return "bronze";
}

export default function CustomersPage() {
  const params = useParams();
  const branchId = params.branchId as string;
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const [customers, setCustomers] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Guest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null,
  );
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [appUsersLoading, setAppUsersLoading] = useState(false);
  const [appUsersError, setAppUsersError] = useState<string | null>(null);
  const [appUsersPage, setAppUsersPage] = useState(1);
  const [appUsersPageMeta, setAppUsersPageMeta] =
    useState<PaginationMeta | null>(null);
  const [appUsersSearchQuery, setAppUsersSearchQuery] = useState("");
  const [appUsersDropdownOpen, setAppUsersDropdownOpen] = useState<
    number | null
  >(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOpeningDetails, setIsOpeningDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Guest | null>(null);
  const [activeTab, setActiveTab] = useState("guests");

  // Fetch customers on component mount or when branchId changes
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!branchId) return;

      setIsLoading(true);
      setError(null);
      const result = await getCustomers(
        branchId,
        currentPage,
        itemsPerPage,
        searchQuery,
      );

      if (result.success && result.data) {
        setCustomers(result.data);
        result.meta && setPaginationMeta(result.meta || null);
      } else {
        setError(result.error || "Failed to load customers");
      }

      setIsLoading(false);
    };

    fetchCustomers();
  }, [branchId, currentPage, itemsPerPage, searchQuery]);

  // Fetch app users when tab is active
  useEffect(() => {
    if (activeTab !== "appuser") return;

    const fetchAppUsers = async () => {
      if (!branchId) return;

      setAppUsersLoading(true);
      setAppUsersError(null);
      const result = await getAppUsers(
        branchId,
        appUsersPage,
        itemsPerPage,
        appUsersSearchQuery,
      );

      if (result.success && result.data) {
        setAppUsers(result.data);
        result.meta && setAppUsersPageMeta(result.meta || null);
      } else {
        setAppUsersError(result.error || "Failed to load app users");
      }

      setAppUsersLoading(false);
    };

    fetchAppUsers();
  }, [branchId, activeTab, appUsersPage, itemsPerPage, appUsersSearchQuery]);

  useEffect(() => {
    if (type === "new") {
      setSelectedCustomer(null);
      setIsEditDialogOpen(true);
    } else {
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
    }
  }, [type]);
  const handleCreateCustomer = async (
    customerId: string,
    customerData: any,
  ) => {
    setIsSubmitting(true);
    try {
      const result = await createCustomer(branchId, customerData);
      if (result.success && result.data) {
        setCustomers([...customers, result.data]);
        setIsEditDialogOpen(false);
        setSelectedCustomer(null);
        setError(null);
      } else {
        setError(result.error || "Failed to create customer");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (
    customerId: string,
    customerData: EditGuestFormData,
  ) => {
    setIsSubmitting(true);
    try {
      const result = await updateCustomer(customerId, branchId, customerData);
      if (result.success && result.data) {
        setCustomers(
          customers.map((c) =>
            c.id === customerId ? (result.data as Guest) : c,
          ),
        );
        setSelectedCustomer(null);
        setIsEditDialogOpen(false);
        setError(null);
      } else {
        setError(result.error || "Failed to update customer");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setIsSubmitting(true);
    try {
      const result = await deleteCustomer(customerId, branchId);
      if (result.success) {
        setCustomers(customers.filter((c) => c.id !== customerId));
        setDeleteConfirmOpen(false);
        setCustomerToDelete(null);
      } else {
        setError(result.error || "Failed to delete customer");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);
    const matchesGender =
      genderFilter === "all" || customer.gender === genderFilter;
    return matchesSearch && matchesGender;
  });
  const TIERS = [
    {
      label: "Platinum",
      requirement: ">25",
      color: "bg-purple-500",
      initial: "P",
    },
    { label: "Gold", requirement: ">15", color: "bg-yellow-500", initial: "G" },
    { label: "Silver", requirement: ">5", color: "bg-gray-400", initial: "S" },
    {
      label: "Bronze",
      requirement: "≤5",
      color: "bg-orange-600",
      initial: "B",
    },
  ];
  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <p>{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {"Guest And Customer Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {"Manage guest and customer profiles, memberships, and history"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="guests">Guest Management</TabsTrigger>
          <TabsTrigger value="appuser">App User</TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="space-y-4">
          {/* Filters and Add Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-center flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                    />
                  </div>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{"All Genders"}</SelectItem>
                      <SelectItem value="male">{"Male"}</SelectItem>
                      <SelectItem value="female">{"Female"}</SelectItem>
                      <SelectItem value="other">{"Other"}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      // reset all filters and pagination
                      setSearchQuery("");
                      setGenderFilter("all");
                      setCurrentPage(1);
                      setItemsPerPage(10);
                    }}
                  >
                    <FilterX className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {"Add Guest"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">{"Loading guests..."}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Color Legend */}
              <Card className="">
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-3">
                        Gender
                      </p>
                      <div className="flex flex-row gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            M
                          </div>
                          <span className="text-xs">Male</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            F
                          </div>
                          <span className="text-xs">Female</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold">
                            O
                          </div>
                          <span className="text-xs">Other</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-3">
                        Membership Tier
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {TIERS.map((tier) => (
                          <div
                            key={tier.label}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={`w-6 h-6 rounded-full ${tier.color} flex items-center justify-center text-white text-[10px] font-bold`}
                            >
                              {tier.initial}
                            </div>
                            <div className="flex flex-col text-xs leading-tight">
                              <span className="font-medium">{tier.label}</span>
                              <span className="text-muted-foreground text-[10px]">
                                ({tier.requirement} bookings)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Gender</TableHead>
                        {/* <TableHead>Status</TableHead> */}
                        <TableHead>Visit</TableHead>
                        <TableHead className="flex justify-center items-center">
                          Membership
                        </TableHead>

                        <TableHead>Join Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer, index) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {/* <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {`${customer.firstName[0]}${customer.lastName[0]}`}
                                </AvatarFallback>
                              </Avatar> */}
                              <div>
                                <p className="font-medium capitalize">{`${customer.firstName} ${customer.lastName}`}</p>
                                {/* <p className="text-xs text-muted-foreground">
                                  {customer.id}
                                </p> */}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {customer.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {customer.phone}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                                  genderConfig[
                                    customer.gender as keyof typeof genderConfig
                                  ]?.color || "bg-gray-500"
                                }`}
                                title={
                                  genderConfig[
                                    customer.gender as keyof typeof genderConfig
                                  ]?.label || "Other"
                                }
                              >
                                {customer.gender === "male"
                                  ? "M"
                                  : customer.gender === "female"
                                    ? "F"
                                    : "O"}
                              </div>
                            </div>
                          </TableCell>
                          {/* <TableCell>
                            <Badge
                              variant={
                                customer.customer ? "default" : "secondary"
                              }
                            >
                              {customer.customer
                                ? "Registered"
                                : "Non-registered"}
                            </Badge>
                          </TableCell> */}
                          <TableCell>
                            <span className="text-sm">
                              {customer?.bookingItems?.length || 0}
                              {/* Placeholder - replace with actual visit count */}
                            </span>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const membership = getMembershipByBookings(
                                customer?.bookingItems?.length || 0,
                              );
                              return (
                                <div className="flex items-center justify-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                      membershipConfig[membership]?.color ||
                                      "bg-gray-500"
                                    }`}
                                    title={membershipConfig[membership]?.label}
                                  >
                                    {membership.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(
                                customer.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu
                              open={dropdownOpen === index}
                              onOpenChange={(open) => {
                                if (open) {
                                  setDropdownOpen(index);
                                } else {
                                  setDropdownOpen(null);
                                }
                              }}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setDropdownOpen(null);
                                    setIsOpeningDetails(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDropdownOpen(null);
                                    setIsEditDialogOpen(true);
                                    setSelectedCustomer(customer);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={() => {
                                    setCustomerToDelete(customer);
                                    setDeleteConfirmOpen(true);
                                    setDropdownOpen(null);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Guest
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination Controls */}
              <Pagination
                meta={paginationMeta || undefined}
                onPageChange={setCurrentPage}
                onLimitChange={setItemsPerPage}
                showLimitSelector={true}
                className="mt-8"
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="appuser" className="space-y-4">
          {/* Filters for AppUser */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    className="pl-10"
                    value={appUsersSearchQuery}
                    onChange={(e) => {
                      setAppUsersSearchQuery(e.target.value);
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // reset all filters and pagination
                    setAppUsersSearchQuery("");
                    setAppUsersPage(1);
                    setItemsPerPage(10);
                  }}
                >
                  <FilterX className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {appUsersLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {"Loading app users..."}
                </p>
              </CardContent>
            </Card>
          ) : appUsersError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-destructive">{appUsersError}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Join Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appUsers.length > 0 ? (
                        appUsers.map((appUser, index) => (
                          <TableRow key={appUser.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {/* <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {`${appUser.firstName[0]}${appUser.lastName[0]}`}
                                  </AvatarFallback>
                                </Avatar> */}
                                <div>
                                  <p className="font-medium capitalize">{`${appUser.firstName} ${appUser.lastName}`}</p>
                                  {/* <p className="text-xs text-muted-foreground">
                                    {appUser.id}
                                  </p> */}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {appUser.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm">
                                    {appUser.phone}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* <TableCell>
                              <span className="text-sm font-medium">
                                {appUser.loyaltyPoints} pts
                              </span>
                            </TableCell> */}
                            <TableCell>
                              <span className="text-sm">
                                {new Date(
                                  appUser.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </TableCell>
                            {/* <TableCell className="text-right">
                              <DropdownMenu
                                open={appUsersDropdownOpen === index}
                                onOpenChange={(open) => {
                                  if (open) {
                                    setAppUsersDropdownOpen(index);
                                  } else {
                                    setAppUsersDropdownOpen(null);
                                  }
                                }}
                              >
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setAppUsersDropdownOpen(null);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onSelect={() => {
                                      setAppUsersDropdownOpen(null);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remove User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell> */}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-muted-foreground">
                              No app users found
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination Controls */}
              <Pagination
                meta={appUsersPageMeta || undefined}
                onPageChange={setAppUsersPage}
                onLimitChange={setItemsPerPage}
                showLimitSelector={true}
                className="mt-8"
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Customer Details Dialog */}
      <Dialog open={isOpeningDetails} onOpenChange={setIsOpeningDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>{`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      {"Email"}
                    </Label>
                    <p className="font-medium mt-1">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {"Phone"}
                    </Label>
                    <p className="font-medium mt-1">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {"Nationality"}
                    </Label>
                    <p className="font-medium mt-1">
                      {selectedCustomer.nationality || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {"Gender"}
                    </Label>
                    <p className="font-medium mt-1">
                      {selectedCustomer.gender.charAt(0).toUpperCase() +
                        selectedCustomer.gender.slice(1)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {"Join Date"}
                    </Label>
                    <p className="font-medium mt-1">
                      {new Date(
                        selectedCustomer.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-accent/50 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {"Total Bookings"}
                    </Label>
                    <p className="font-bold mt-1 text-2xl">
                      {selectedCustomer?.bookingItems?.length || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {"Total Spent"}
                    </Label>
                    <p className="font-bold mt-1 text-2xl">
                      ฿{" "}
                      {Number(
                        selectedCustomer?.bookingItems?.reduce(
                          (sum, item) => sum + (Number(item.price) || 0),
                          0,
                        ) || 0,
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                {/* {selectedCustomer.customer && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-accent/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {"Loyalty Points"}
                      </Label>
                      <p className="font-bold mt-1 text-2xl">
                        {selectedCustomer.customer.loyaltyPoints}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {"Account Status"}
                      </Label>
                      <p className="font-bold mt-1">
                        {selectedCustomer.customer.isVerified
                          ? "Verified"
                          : "Unverified"}
                      </p>
                    </div>
                  </div>
                )} */}
                {selectedCustomer.specialRequest && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Label className="text-xs text-muted-foreground">
                      {"Special request (Latest)"}
                    </Label>
                    <p className="text-sm mt-1 flex gap-2">
                      {selectedCustomer.specialRequest && (
                        <OctagonAlert
                          strokeWidth={2}
                          className="text-yellow-500 w-5 h-5"
                        />
                      )}
                      {selectedCustomer.specialRequest}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpeningDetails(false);
                    setSelectedCustomer(null);
                  }}
                >
                  {"Close"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(true);
                    setIsOpeningDetails(false);
                  }}
                >
                  {"Edit Profile"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <EditGuestDialog
        guest={selectedCustomer}
        isOpen={isEditDialogOpen}
        onOpenChange={() => {
          setIsEditDialogOpen(!isEditDialogOpen);
          if (!isEditDialogOpen) setSelectedCustomer(null);
        }}
        onSubmit={
          selectedCustomer ? handleUpdateCustomer : handleCreateCustomer
        }
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Guest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {customerToDelete &&
                  `${customerToDelete.firstName} ${customerToDelete.lastName}`}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (customerToDelete) {
                  handleDeleteCustomer(customerToDelete.id);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
