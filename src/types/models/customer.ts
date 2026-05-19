/**
 * Customer Models
 *
 * Core entities related to customer management and customer data.
 */

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerProfile extends Customer {
  addresses?: Address[];
  preferences?: CustomerPreferences;
}

export interface Address {
  id: string;
  customerId: string;
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface CustomerPreferences {
  customerId: string;
  newsletter?: boolean;
  smsNotifications?: boolean;
  emailNotifications?: boolean;
  preferredServices?: string[];
}
