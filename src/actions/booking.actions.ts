"use server";

import { auth } from "@/auth";
import { ApiResponse } from "@/types";
import { GetBookingsResponse } from "@/types/api/booking";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getBookings(
  branchId: string,
  page?: number | string,
  limit?: number | string,
  search?: string,
  status?: string,
  startDateTime?: string,
  endDateTime?: string,
  hasBedOrRoom?: boolean,
): Promise<ApiResponse<GetBookingsResponse[]>> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (startDateTime) params.append("startDateTime", startDateTime);
    if (endDateTime) params.append("endDateTime", endDateTime);
    if (hasBedOrRoom !== undefined)
      params.append("hasBedOrRoom", String(hasBedOrRoom));
    params.append("branchId", branchId);

    const response = await fetch(
      `${API_BASE_URL}/bookings?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          "spa-id": session.spaIds?.[0] || "",
        },
      },
    );

    if (!response.ok) {
      console.error("Failed to fetch bookings");
      return { success: false, error: "Failed to fetch bookings", data: [] };
    }

    const result = await response.json();

    // Transform backend pagination format to frontend format
    const pagination = result.meta;

    return {
      success: true,
      data: result.data || result,
      meta: pagination,
    };
  } catch (error) {
    console.error("Get bookings error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: [],
    };
  }
}

export async function getBookingById(
  bookingId: string,
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized", data: undefined };
    }

    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "Booking not found",
          data: undefined,
        };
      }
      console.error("Failed to fetch booking details");
      return {
        success: false,
        error: "Failed to fetch booking details",
        data: undefined,
      };
    }

    const result = await response.json();

    // Check if booking data actually exists
    if (!result || !result.id) {
      return {
        success: false,
        error: "Booking not found",
        data: undefined,
      };
    }

    // Transform API response to match BookingFormData structure
    const transformedData = {
      id: result.id || "",
      bookingId: result.bookingId || "",
      date: result.bookingTime
        ? new Date(result.bookingTime).toISOString().split("T")[0]
        : "",
      customer: {
        firstName: result.customer?.firstName || "Guest",
        lastName: result.customer?.lastName || "",
        email: result.customer?.email || "",
        phone: result.customer?.phone || "",
      },
      branch: {
        id: result.branch?.id || "",
        name: result.branch?.name || "",
        phone: result.branch?.phone || "",
        email: result.branch?.email || "",
      },
      bookingItems:
        result.items?.map((item: any) => ({
          id: item.id,
          service:
            item.subService?.id || item.package?.id || item.programme?.id || "",
          price: item.price,
          name: item.subService
            ? `${item.subService.service?.name || "No service name"} - ${item.subService.name || "No name"}`
            : item.package
              ? item.package?.name
              : item.programme
                ? item.programme?.name
                : "",
          duration:
            item.duration ||
            item.subService?.durationMinutes ||
            item.package?.durationMinutes ||
            item.programme?.durationMinutes ||
            0,
          type: item.itemType || "sub_service",
          numberOfGuests: item.quantity || 1,
          therapist: item.staff?.id || item.staffId || "",
          room: item.room?.id || item.roomId,
          bed: item.bed?.id || item.bedId || "",
          date: item.scheduledDate,
          time: item.scheduledTime || "",
          guests: item.guests || [],
        })) || [],
      totalPrice: result.amount || 0,
      status: result.status || "pending",
      payments:
        result.payments?.map((payment: any) => ({
          id: payment.id,
          amount: Number(payment.amount) || 0,
          paidAmount: payment.paidAmount || payment.amount || 0,
          status: payment.status || "pending",
          paymentStatus: payment.paymentStatus || payment.status || "pending",
          method: payment.method || payment.paymentType || "on_arrival",
          paymentType: payment.paymentType || payment.method || "on_arrival",
          date: payment.date,
          note: payment.note,
          paypalOrderId: payment.paypalOrderId || null,
          paypalCaptureId: payment.paypalCaptureId || null,
        })) || [],
      appliedPromotion: result.promotion
        ? {
            id: result.promotion.id,
            code: result.promotion.code || "",
            discount:
              result.promotion.discountValue || result.promotion.discount || 0,
            type: (result.promotion.discountType === "percentage"
              ? "percentage"
              : "fixed") as "percentage" | "fixed",
            discountAmount: result.discountAmount || 0,
          }
        : null,
    };

    return {
      success: true,
      data: transformedData,
    };
  } catch (error) {
    console.error("Get booking by ID error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: undefined,
    };
  }
}

export async function createBooking(data: any): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Failed to create booking:", error);
      return {
        success: false,
        error: error.message || "Failed to create booking",
        data: null,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Create booking error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: null,
    };
  }
}

export async function updateBooking(
  bookingId: string,
  data: any,
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Transform frontend booking data to backend format
    const updateData: any = {};

    // Basic booking fields
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentStatus !== undefined)
      updateData.paymentStatus = data.paymentStatus;
    if (data.paymentType !== undefined)
      updateData.paymentType = data.paymentType;
    if (data.totalPrice !== undefined)
      updateData.totalAmount = String(data.totalPrice);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.discountAmount !== undefined)
      updateData.discountAmount = String(data.discountAmount);

    // Handle promotion
    if (data.appliedPromotion !== undefined) {
      updateData.promotion = data.appliedPromotion?.id || null;
    }

    // Handle payments
    if (data.payments && Array.isArray(data.payments)) {
      updateData.payments = data.payments.map((p: any) => ({
        id: p.id,
        amount: p.amount || p.paidAmount,
        status: p.status,
        paymentType: p.paymentType || p.method,
        date: p.date,
        note: p.note,
      }));
    }

    // Handle booking items
    if (data.bookingItems && Array.isArray(data.bookingItems)) {
      updateData.items = data.bookingItems.map((item: any) => {
        const itemPayload: any = {
          itemType: item.type || "sub_service",
          quantity: item.numberOfGuests || 1,
          duration: item.duration || 0,
          scheduledTime: item.time || null,
          notes: item.notes || null,
        };

        // Add service ID based on type
        if (item.service) {
          if (item.type === "package") {
            itemPayload.packageId = item.service;
          } else if (item.type === "programme") {
            itemPayload.programmeId = item.service;
          } else {
            itemPayload.subServiceId = item.service;
          }
        }

        // Add optional fields
        if (item.date) itemPayload.scheduledDate = item.date;
        if (item.therapist) itemPayload.staffId = item.therapist;
        if (item.room) itemPayload.roomId = item.room;
        if (item.bed) itemPayload.bedId = item.bed;
        if (item.guests || item.guestData) {
          itemPayload.guests = item.guests;
          itemPayload.guestData = item.guestData;
        }
        if (item.spaId) itemPayload.spaId = item.spaId;

        // Handle new vs existing items and deletions
        if (item.bookingItemId || item.id) {
          itemPayload.id = item.bookingItemId || item.id;
        }
        if (item._destroy) {
          itemPayload._destroy = true;
        }

        return itemPayload;
      });
    }

    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Failed to update booking:", error);
      return {
        success: false,
        error: error.message || "Failed to update booking",
        data: null,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Update booking error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: null,
    };
  }
}

export interface CreateBookingWithItemsPayload {
  branchId: string;
  bookingTime: Date;
  totalAmount: string;
  amount: string;
  discountAmount: string;
  itemsCount: number;
  customerId?: string;
  promotionId?: string;
  duration?: number;
  notes?: string;
  payments?: Array<{
    id?: string;
    amount: number;
    status: string;
    paymentType?: string;
    date?: string;
    note?: string;
  }>;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
}

export interface BookingItem {
  itemType: "sub_service" | "package" | "programme";
  quantity?: number;
  duration?: number;
  subServiceId?: string;
  price: string;
  subtotal: string;
  packageId?: string;
  programmeId?: string;
  scheduledDate?: string | Date;
  scheduledTime?: string | null;
  notes?: string | null;
  staffId?: string;
  roomId?: string;
  bedId?: string;
  guests?: string[] | Array<any>;
  guestData?: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    specialRequest?: string;
  }>;
  spaId?: string;
}

export async function createBookingWithItems(
  payload: CreateBookingWithItemsPayload,
  items: BookingItem[],
): Promise<ApiResponse<any>> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // First, create the booking
    const bookingData = {
      branch: payload.branchId,
      bookingTime: payload.bookingTime,
      amount: payload.amount,
      discountAmount: payload.discountAmount,
      totalAmount: payload.totalAmount,
      itemsCount: payload.itemsCount,
      duration: payload.duration,
      notes: payload.notes,
      customer: payload.customer,
      promotion: payload.promotionId,
      payments: payload.payments?.map((p) => ({
        amount: p.amount,
        status: p.status,
        paymentType: p.paymentType,
        date: p.date,
        note: p.note,
      })),
    };

    const bookingResponse = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "spa-id": session.spaIds?.[0] || "",
      },
      body: JSON.stringify(bookingData),
    });

    if (!bookingResponse.ok) {
      const error = await bookingResponse.json().catch(() => ({}));
      console.error("Failed to create booking:", error);
      return {
        success: false,
        error: error.message || "Failed to create booking",
        data: null,
      };
    }

    const createdBooking = await bookingResponse.json();
    const bookingId = createdBooking.id || createdBooking.data?.id;

    if (!bookingId) {
      return {
        success: false,
        error: "Failed to retrieve booking ID",
        data: null,
      };
    }

    // Then, add booking items
    for (const item of items) {
      try {
        const itemResponse = await fetch(
          `${API_BASE_URL}/bookings/${bookingId}/items`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.accessToken}`,
              "spa-id": session.spaIds?.[0] || "",
            },
            body: JSON.stringify(item),
          },
        );

        if (!itemResponse.ok) {
          console.error(
            `Failed to add item to booking ${bookingId}:`,
            itemResponse.status,
          );
          // Continue adding other items even if one fails
        }
      } catch (error) {
        console.error("Error adding booking item:", error);
        // Continue adding other items
      }
    }

    return {
      success: true,
      data: createdBooking,
    };
  } catch (error) {
    console.error("Create booking with items error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
      data: null,
    };
  }
}
