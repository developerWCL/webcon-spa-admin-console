import { ActiveDayWithTime } from "@/schemas/promotion.schema";

/**
 * Convert legacy string array format to new ActiveDayWithTime format
 * Handles both JSON strings and object formats from backend
 * @param activeDays - Can be string[], ActiveDayWithTime[], or array of JSON strings
 * @returns ActiveDayWithTime[]
 */
export function normalizeActiveDays(activeDays: any): ActiveDayWithTime[] {
  if (!activeDays || !Array.isArray(activeDays)) {
    return [];
  }

  return activeDays.map((item: any) => {
    let dayObj = item;

    // If it's a string, try to parse it as JSON
    if (typeof item === "string") {
      try {
        // First check if it's a JSON string
        if (item.startsWith("{")) {
          dayObj = JSON.parse(item);
        } else {
          // Legacy format: simple day string like "mon", "tue", etc.
          dayObj = { day: item, allDay: true };
        }
      } catch (e) {
        // If parsing fails, treat it as a day string
        dayObj = { day: item, allDay: true };
      }
    }

    // If it's already an object with 'day' property, return as-is
    if (typeof dayObj === "object" && "day" in dayObj) {
      return dayObj as ActiveDayWithTime;
    }

    // Fallback for unexpected format
    return { day: dayObj, allDay: true };
  });
}
