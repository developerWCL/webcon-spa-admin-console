import { Bed } from "@/app/[branchId]/dashboard/inventory/components/BedsTab";
import { Package, Programme, Service, SubService } from "../models/service";
import { Promotion } from "../models";

export interface GetBookingsResponse {
  id: string;
  bookingId: string;
  bookingTime: string;
  status: string;
  totalAmount: string;
  itemsCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  customer: Customer;
  branch: Branch;
  promotion: Promotion | null;
  items: BookingItem[];
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: string;
  paymentType: string;
  status: string;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  isVerified: boolean;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  specialRequest: string | null;
  email: string;
  phone: string;
  nationality: string;
  gender: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BookingItem {
  id: string;
  itemType: "sub_service" | "package" | "programme";
  quantity: number;
  price: string;
  subtotal: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  subService: SubServiceDetail | null;
  package: PackageDetail | null;
  programme: ProgrammeDetail | null;
  bed: BedDetail | null;
  room: RoomDetail | null;
  guests: Guest[];
}

export interface SubServiceDetail {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  service: ServiceDetail;
  translations: TranslationDetail[];
}

export interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  durationMinutes: number;
  status: string;
  maxConcurrentBookings: number;
  maxBookingsPerDay: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  translations: TranslationDetail[];
}

export interface TranslationDetail {
  id: string;
  languageCode: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageDetail {
  id: string;
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  translations: TranslationDetail[];
}

export interface ProgrammeDetail {
  id: string;
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  translations: TranslationDetail[];
}

export interface BedDetail {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface RoomDetail {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
