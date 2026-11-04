/**
 * Coupon Validation Utilities
 * Handles validation of coupon conditions including day activation,
 * minimum purchase, and usage limits
 */

interface CouponValidationData {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  id?: string;
  dayActivated?: "booking_day" | "service_day";
  activeDays?:
    | string[]
    | Array<{
        day: string;
        allDay?: boolean;
        startTime?: string;
        endTime?: string;
      }>;
  minPurchaseAmount?: number | string;
  maxUsed?: number;
  used?: number;
    guestType?: "all_guests" | "authenticated_only";
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Gets the day of week from a date (0-6, where 0 is Sunday)
 */
const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

/**
 * Converts day of week number to short name (sun, mon, tue, etc.)
 */
const getDayName = (dayNum: number): string => {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[dayNum];
};

/**
 * Checks if a given day is in the list of active days and validates time if applicable
 * Handles various day formats (sun, mon, 0, 1, etc.) and both string and object formats
 */
const isDayInActiveDays = (
  dayNum: number,
  activeDays:
    | string[]
    | Array<{
        day: string;
        allDay?: boolean;
        startTime?: string;
        endTime?: string;
      }>,
  dateToCheck?: Date,
): boolean => {
  if (!activeDays || activeDays.length === 0) return true;

  const dayName = getDayName(dayNum);
  const dayNumStr = dayNum.toString();

  const matchedDay = activeDays.find((day) => {
    // Handle object format (new format with time info)
    if (typeof day === "object" && "day" in day) {
      const dayMatch =
        (day.day as string).toLowerCase() === dayName ||
        (day.day as string).toLowerCase() === dayNumStr;

      return dayMatch;
    }
    // Handle string JSON format
    if (typeof day === "string" && day.startsWith("{")) {
      try {
        const parsedDay = JSON.parse(day);
        const dayMatch =
          (parsedDay.day as string).toLowerCase() === dayName ||
          (parsedDay.day as string).toLowerCase() === dayNumStr;
        return dayMatch;
      } catch {
        // Fall through to legacy format handling
      }
    }
    // Handle string format (legacy format)
    const normalizedDay = (day as string).toLowerCase();
    return normalizedDay === dayName || normalizedDay === dayNumStr;
  });

  if (!matchedDay) {
    return false;
  }

  // If day is found and it's an object with time constraints, validate time
  if (
    typeof matchedDay === "object" &&
    "day" in matchedDay &&
    !matchedDay.allDay &&
    matchedDay.startTime &&
    matchedDay.endTime &&
    dateToCheck
  ) {
    const currentTime = dateToCheck.toTimeString().slice(0, 5); // HH:mm format

    // Convert times to minutes for easier comparison
    const [startHour, startMin] = matchedDay.startTime.split(":").map(Number);
    const [endHour, endMin] = matchedDay.endTime.split(":").map(Number);
    const [currentHour, currentMin] = currentTime.split(":").map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const currentTotalMin = currentHour * 60 + currentMin;

    // Check if current time is within the active time range
    return currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
  }

  return true;
};

/**
 * Validates coupon day activation conditions
 * Checks if the booking is on a valid day based on dayActivated setting
 * Also validates time ranges if the promotion has specific active hours
 *
 * @param coupon - Coupon data with dayActivated and activeDays
 * @param bookingDate - The date/time when the booking was made (for booking_day)
 * @param serviceDate - The date/time when the service is scheduled (for service_day)
 */
export const validateCouponDay = (
  coupon: CouponValidationData,
  bookingDate?: Date,
  serviceDate?: Date,
): ValidationResult => {
  // If no active days specified, coupon is valid for all days
  if (!coupon.activeDays || coupon.activeDays.length === 0) {
    return { isValid: true };
  }

  const dayActivated = "service_day" as "booking_day" | "service_day"; // Todo: disscuss

  // Check booking_day: validate against the day the booking was created
  if (dayActivated === "booking_day") {
    if (!bookingDate) {
      return {
        isValid: false,
        error: "Booking date is required to validate coupon",
      };
    }

    const bookingDayNum = getDayOfWeek(bookingDate);
    const bookingDayName = getDayName(bookingDayNum);

    if (!isDayInActiveDays(bookingDayNum, coupon.activeDays, bookingDate)) {
      // Find the matched day to show its schedule
      let matchedDaySchedule = coupon.activeDays.find((d) => {
        // Handle string JSON format
        let dayData = d;
        if (typeof d === "string" && d.startsWith("{")) {
          try {
            dayData = JSON.parse(d);
          } catch {
            dayData = d;
          }
        }

        if (typeof dayData === "string") {
          return dayData.toLowerCase() === bookingDayName;
        }
        if (typeof dayData === "object" && dayData.day) {
          return (dayData.day as string).toLowerCase() === bookingDayName;
        }
        return false;
      });

      // Parse matched day if it's a JSON string
      if (
        typeof matchedDaySchedule === "string" &&
        matchedDaySchedule.startsWith("{")
      ) {
        try {
          matchedDaySchedule = JSON.parse(matchedDaySchedule);
        } catch {
          // Keep as string if parse fails
        }
      }

      let dayInfo = bookingDayName;
      if (typeof matchedDaySchedule === "object" && matchedDaySchedule?.day) {
        if (matchedDaySchedule.allDay) {
          dayInfo = `${matchedDaySchedule.day} (All Day)`;
        } else if (matchedDaySchedule.startTime && matchedDaySchedule.endTime) {
          dayInfo = `${matchedDaySchedule.day} (${matchedDaySchedule.startTime} - ${matchedDaySchedule.endTime})`;
        } else {
          dayInfo = `${matchedDaySchedule.day}`;
        }
      }

      return {
        isValid: false,
        error: `Coupon is not available on this day (${bookingDayName}) or at this time. Active schedule for ${bookingDayName}: ${dayInfo}`,
      };
    }

    return { isValid: true };
  }

  // Check service_day: validate against the day the service is scheduled
  if (dayActivated === "service_day") {
    if (!serviceDate) {
      return {
        isValid: false,
        error: "Service date is required to validate coupon",
      };
    }

    const serviceDayNum = getDayOfWeek(serviceDate);
    const serviceDayName = getDayName(serviceDayNum);

    if (!isDayInActiveDays(serviceDayNum, coupon.activeDays, serviceDate)) {
      // Find the matched day to show its schedule
      let matchedDaySchedule = coupon.activeDays.find((d) => {
        // Handle string JSON format
        let dayData = d;
        if (typeof d === "string" && d.startsWith("{")) {
          try {
            dayData = JSON.parse(d);
          } catch {
            dayData = d;
          }
        }

        if (typeof dayData === "string") {
          return dayData.toLowerCase() === serviceDayName;
        }
        if (typeof dayData === "object" && dayData.day) {
          return (dayData.day as string).toLowerCase() === serviceDayName;
        }
        return false;
      });

      // Parse matched day if it's a JSON string
      if (
        typeof matchedDaySchedule === "string" &&
        matchedDaySchedule.startsWith("{")
      ) {
        try {
          matchedDaySchedule = JSON.parse(matchedDaySchedule);
        } catch {
          // Keep as string if parse fails
        }
      }

      let dayInfo = serviceDayName;
      if (typeof matchedDaySchedule === "object" && matchedDaySchedule?.day) {
        if (matchedDaySchedule.allDay) {
          dayInfo = `${matchedDaySchedule.day} (All Day)`;
        } else if (matchedDaySchedule.startTime && matchedDaySchedule.endTime) {
          dayInfo = `${matchedDaySchedule.day} (${matchedDaySchedule.startTime} - ${matchedDaySchedule.endTime})`;
        } else {
          dayInfo = `${matchedDaySchedule.day}`;
        }
      }

      return {
        isValid: false,
        error: `Coupon is not available on this day (${serviceDayName}) or at this time. Active schedule for ${serviceDayName}: ${dayInfo}`,
      };
    }

    return { isValid: true };
  }

  return { isValid: true };
};

/**
 * Validates coupon minimum purchase requirement
 *
 * @param coupon - Coupon data with minPurchaseAmount
 * @param totalPrice - The total price of the booking
 */
export const validateCouponMinPurchase = (
  coupon: CouponValidationData,
  totalPrice: number,
): ValidationResult => {
  if (!coupon.minPurchaseAmount) {
    return { isValid: true };
  }

  const minAmount = Number(coupon.minPurchaseAmount);

  if (isNaN(minAmount) || minAmount <= 0) {
    return { isValid: true };
  }

  if (totalPrice < minAmount) {
    return {
      isValid: false,
      error: `Minimum purchase amount of ${minAmount} required. Current total: ${totalPrice}`,
    };
  }

  return { isValid: true };
};

/**
 * Validates coupon usage limit
 *
 * @param coupon - Coupon data with maxUsed and used count
 */
export const validateCouponUsageLimit = (
  coupon: CouponValidationData,
): ValidationResult => {
  if (!coupon.maxUsed || coupon.maxUsed <= 0) {
    return { isValid: true };
  }

  const usedCount = coupon.used || 0;

  if (usedCount >= coupon.maxUsed) {
    return {
      isValid: false,
      error: `Coupon usage limit has been reached (${coupon.maxUsed} uses)`,
    };
  }

  return { isValid: true };
};

/**
 * Validates coupon guest type
 * Only allows promotions with guestType = "all_guests"
 *
 * @param coupon - Coupon data with guestType
 */
export const validateCouponGuestType = (
  coupon: CouponValidationData,
): ValidationResult => {
  console.log("coupon.guestType", coupon.guestType);

  // If guestType is not specified, default to all_guests
  if (!coupon.guestType) {
    return { isValid: true };
  }

  // Only allow all_guests type
  if (coupon.guestType !== "all_guests") {
    return {
      isValid: false,
      error: `This promotion is only available to authenticated guests. Please prompt the user to log in to use this promotion.`,
    };
  }

  return { isValid: true };
};

/**
 * Performs all coupon validations
 *
 * @param coupon - Complete coupon data
 * @param totalPrice - Total booking price
 * @param bookingDate - Date when booking is created (optional, defaults to now)
 * @param serviceDate - Date when service is scheduled (optional)
 */
export const validateCoupon = (
  coupon: CouponValidationData,
  totalPrice: number,
  bookingDate?: Date,
  serviceDate?: Date,
): ValidationResult => {
   const guestTypeValidation = validateCouponGuestType(coupon);
  if (!guestTypeValidation.isValid) {
    return guestTypeValidation;
  }
  
  // Validate day activation
  const dayValidation = validateCouponDay(
    coupon,
    bookingDate || new Date(),
    serviceDate,
  );
  if (!dayValidation.isValid) {
    return dayValidation;
  }

  // Validate minimum purchase
  const minPurchaseValidation = validateCouponMinPurchase(coupon, totalPrice);
  if (!minPurchaseValidation.isValid) {
    return minPurchaseValidation;
  }

  // Validate usage limit
  const usageLimitValidation = validateCouponUsageLimit(coupon);
  if (!usageLimitValidation.isValid) {
    return usageLimitValidation;
  }

  return { isValid: true };
};
