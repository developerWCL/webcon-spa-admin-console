/**
 * Service and Offerings Models
 *
 * Core entities related to spa services, packages, and offerings.
 */

import { ServiceTranslation } from "@/schemas/service.schema";

export interface ServiceClosure {
  id: string;
  serviceId: string;
  closeDate: string;
  closeTime: string;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: ServiceCategory;
  durationMinutes?: number;
  price?: number;
  status: "active" | "inactive";
  displayOrder?: number;
  imageUrl?: string;
  closures?: ServiceClosure[];
  subServices?: SubService[];
  translations?: ServiceTranslation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  translations?: CategoryTranslation[];
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryTranslation {
  id?: string;
  languageCode: string;
  name: string;
  description?: string | null;
}

export interface SubService {
  id: string;
  name: string;
  serviceId: string;
  service?: Service;
  onlyPackage?: boolean;
  durationMinutes?: number;
  status?: "active" | "inactive";
  price: string | number;
  translations?: ServiceTranslation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  services: Service[];
  subServices?: SubService[];
  price?: number;
  discount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Programme {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
