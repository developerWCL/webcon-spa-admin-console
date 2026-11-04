"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { getCatalogueItems } from "@/actions/catalogue.actions";
import { getPromotions } from "@/actions/promotion.actions";
import {
  validateCoupon,
  validateCouponDay,
  validateCouponMinPurchase,
  validateCouponUsageLimit,
} from "@/utils/coupon.utils";
import type { BookingFormData } from "../../../../schemas/booking.schema";

interface ServiceData {
  id: string;
  serviceId?: string;
  name: string;
  duration?: string;
  service?: { name: string };
  price?: number;
}

interface PromotionData {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  dayActivated?: "booking_day" | "service_day";
  guestType?: "all_guests" | "authenticated_only";
  maxUsedPerAccount?: number;
  activeDays?: string[];
  minPurchaseAmount?: number | string;
  maxUsed?: number;
  used?: number;
  services?: Array<{ id: string; service?: { id: string; name: string } }>;
  packages?: Array<{ id: string; package?: { id: string; name: string } }>;
  programmes?: Array<{
    id: string;
    programme?: { id: string; name: string };
  }>;
}

interface UseBookingPageOptions {
  branchId: string;
  isCreating: boolean;
}

export const useBookingPage = (options: UseBookingPageOptions) => {
  const { branchId, isCreating } = options;

  // Service data states
  const [treatments, setTreatments] = useState<ServiceData[]>([]);
  const [packages, setPackages] = useState<ServiceData[]>([]);
  const [programmes, setProgrammes] = useState<ServiceData[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Promotion states
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [couponError, setCouponError] = useState<string>("");

  // UI states
  const [selectedTab, setSelectedTab] = useState("treatments");
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<PromotionData | null>(
    null,
  );
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAction, setPaymentAction] = useState<"deposit" | "refund">(
    "deposit",
  );
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "paid" | "failed" | "refunded"
  >("pending");
  const [method, setMethod] = useState<
    "on_arrival" | "bank_transfer" | "credit_card" | "paypal"
  >();

  // Payment states
  const [payments, setPayments] = useState<any[]>([]);
  const [tempPaymentAmount, setTempPaymentAmount] = useState(0);

  // Fetch services based on selected tab
  useEffect(() => {
    const fetchData = async () => {
      if (!branchId) return;

      setIsLoadingServices(true);
      try {
        const catalogueType =
          selectedTab === "treatments"
            ? "services"
            : selectedTab === "packages"
              ? "packages"
              : "programmes";

        const result = await getCatalogueItems(catalogueType, branchId);

        if (!result.success || !result.data) {
          console.error(`Failed to fetch ${selectedTab}:`, result.error);
          return;
        }

        if (selectedTab === "treatments") {
          setTreatments(result.data);
        } else if (selectedTab === "packages") {
          setPackages(result.data);
        } else if (selectedTab === "programmes") {
          setProgrammes(result.data);
        }
      } catch (error) {
        console.error(`Error fetching ${selectedTab}:`, error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchData();
  }, [selectedTab, branchId]);

  // Fetch promotions
  useEffect(() => {
    const fetchPromotions = async () => {
      if (!branchId) return;

      setIsLoadingPromotions(true);
      try {
        const data = await getPromotions(branchId);

        const transformedPromotions = Array.isArray(data.data)
          ? data.data
              .filter((promo: any) => {
                const end = promo.endDate
                  ? new Date(promo.endDate).setHours(23, 59, 59, 999)
                  : null;
                return (
                   promo.status === "active" &&
                  end &&
                  end > new Date().getTime() &&
                  promo.guestType === "all_guests"
                );
              })
              .map((promo: any) => ({
                id: promo.id,
                code: promo.code || "",
                discount: promo.discountValue || 0,
                type: (promo.discountType === "percentage"
                  ? "percentage"
                  : "fixed") as "percentage" | "fixed",
                dayActivated: promo.dayActivated || "booking_day",
                activeDays: promo.activeDays || [],
                minPurchaseAmount: promo.minPurchaseAmount || 0,
                maxUsed: promo.maxUsed || 0,
                used: promo.used || 0,
                services: promo.services || [],
                packages: promo.packages || [],
                programmes: promo.programmes || [],
                guestType: promo.guestType || "all_guests",
                maxUsedPerAccount: promo.maxUsedPerAccount || 0,
              }))
          : [];
        setPromotions(transformedPromotions);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        setPromotions([]);
      } finally {
        setIsLoadingPromotions(false);
      }
    };

    fetchPromotions();
  }, [branchId]);

  // Get current service data source
  const getCurrentServiceList = (): ServiceData[] => {
    return selectedTab === "treatments"
      ? treatments
      : selectedTab === "packages"
        ? packages
        : programmes;
  };

  // Filter promotions by selected service IDs from booking items
  const getFilteredPromotions = (bookingItems: any[]): PromotionData[] => {
    if (bookingItems.length === 0) {
      return promotions;
    }
    // Extract unique service IDs from booking items
    const selectedServiceIds = new Set<string>();
    bookingItems.forEach((item) => {
      if (item.service) {
        selectedServiceIds.add(String(item.serviceId));
      }
    });

    if (selectedServiceIds.size === 0) {
      return promotions;
    }
    // Filter promotions: show if they apply to any of the selected services
    // or if they have no service restrictions (apply to all)
    const filterd = promotions.filter((promotion) => {
      const applicableServices = promotion.services || [];
      const applicablePackages = promotion.packages || [];
      const applicableProgrammes = promotion.programmes || [];

      // If promotion has no service restrictions, it applies to all
      if (
        applicableServices.length === 0 &&
        applicablePackages.length === 0 &&
        applicableProgrammes.length === 0
      ) {
        return true;
      }

      // Check if any of the selected service IDs match the promotion's applicable items
      for (const serviceId of selectedServiceIds) {
        const matchesService = applicableServices.some(
          (s) => s.service?.id === serviceId || s.id === serviceId,
        );
        const matchesPackage = applicablePackages.some(
          (p) => p.package?.id === serviceId || p.id === serviceId,
        );
        const matchesProgramme = applicableProgrammes.some(
          (p) => p.programme?.id === serviceId || p.id === serviceId,
        );

        if (matchesService || matchesPackage || matchesProgramme) {
          return true;
        }
      }

      return false;
    });
    return filterd;
  };

  // Get service label for selected tab
  const getServiceLabel = (): string => {
    return selectedTab === "treatments"
      ? "treatments"
      : selectedTab === "packages"
        ? "packages"
        : "programmes";
  };

  // Apply coupon with validation
  const applyCoupon = (
    bookingItems: any[],
    totalPrice: number,
    serviceDate?: Date,
    bookingDate?: Date,
  ) => {
    const coupon = promotions.find((c) => c.code === couponCode.toUpperCase());
    if (!coupon) {
      // setCouponError("Coupon code not found");
      return;
    }

    // Validate coupon conditions
    const validationResult = validateCoupon(
      coupon,
      totalPrice,
      bookingDate || new Date(), // Use provided bookingDate or default to now
      serviceDate,
    );

    if (!validationResult.isValid) {
      setCouponError(validationResult.error || "Coupon is not valid");
      return;
    }

    // Calculate total price only for items that are applicable to the coupon
    let couponApplicableTotal = 0;

    const dataSource = getCurrentServiceList();
    const applicableServices = coupon.services || [];
    const applicablePackages = coupon.packages || [];
    const applicableProgrammes = coupon.programmes || [];

    // If coupon has no restrictions, all items are applicable
    const hasNoRestrictions =
      applicableServices.length === 0 &&
      applicablePackages.length === 0 &&
      applicableProgrammes.length === 0;

    bookingItems.forEach((item) => {
      const service = dataSource.find(
        (s) => String(s.id) === String(item.service),
      );

      if (service) {
        const itemServiceId = String(item.serviceId || item.service);
        const numberOfGuests = item.numberOfGuests || 1;
        const itemPrice = Number(service.price || 0) * numberOfGuests;

        // Check if this item is applicable to the coupon
        const isApplicable =
          hasNoRestrictions ||
          applicableServices.some(
            (s) => s.service?.id === itemServiceId || s.id === itemServiceId,
          ) ||
          applicablePackages.some(
            (p) => p.package?.id === itemServiceId || p.id === itemServiceId,
          ) ||
          applicableProgrammes.some(
            (p) => p.programme?.id === itemServiceId || p.id === itemServiceId,
          );

        if (isApplicable) {
          couponApplicableTotal += itemPrice;
        }
      }
    });

    // All validations passed, apply the coupon
    const discount =
      coupon.type === "percentage"
        ? (couponApplicableTotal * coupon.discount) / 100
        : coupon.discount;

    setAppliedCoupon(coupon);
    setAppliedDiscount(discount);
    setCouponCode("");
    setCouponError(""); // Clear any previous errors
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setAppliedDiscount(0);
    setCouponCode("");
    setCouponError("");
  };

  // Reset payment dialog
  const openPaymentDialog = (type: "deposit" | "refund") => {
    setPaymentAction(type);
    setShowPaymentDialog(true);
  };

  // Add payment
  const addPayment = (payment: any) => {
    setPayments([...payments, payment]);
  };

  // Remove payment
  const removePayment = (paymentId: string) => {
    setPayments(payments.filter((p) => p.id !== paymentId));
  };

  // Update payment
  const updatePayment = (updatedPayment: any) => {
    setPayments(
      payments.map((p) => (p.id === updatedPayment.id ? updatedPayment : p)),
    );
  };

  return {
    // Service data
    treatments,
    packages,
    programmes,
    isLoadingServices,
    selectedTab,
    setSelectedTab,
    getCurrentServiceList,
    getServiceLabel,

    // Selected service
    selectedServiceId,
    setSelectedServiceId,
    serviceSearchOpen,
    setServiceSearchOpen,

    // Promotions
    promotions,
    isLoadingPromotions,
    appliedCoupon,
    setAppliedCoupon,
    appliedDiscount,
    setAppliedDiscount,
    couponCode,
    setCouponCode,
    applyCoupon,
    removeCoupon,
    couponError,
    setCouponError,
    getFilteredPromotions,

    // Payment dialog
    showPaymentDialog,
    setShowPaymentDialog,
    paymentAction,
    setPaymentAction,
    openPaymentDialog,
    paymentStatus,
    setPaymentStatus,
    method,
    setMethod,

    // Payments
    payments,
    addPayment,
    removePayment,
    updatePayment,
    tempPaymentAmount,
    setTempPaymentAmount,
    setPayments,
  };
};
