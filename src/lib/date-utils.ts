/**
 * Date and time utility functions for formatting and parsing
 */

/**
 * Format a date as a readable string
 * @param date Date object to format
 * @param locale Locale for formatting (default: 'en-US')
 * @returns Formatted date string (e.g., "Nov 24, 2026")
 */
export function formatDate(
  date: Date | string,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a time string as a readable string
 * @param time Time string in HH:mm format
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a date and time together
 * @param date Date string in YYYY-MM-DD format
 * @param time Time string in HH:mm format
 * @param locale Locale for formatting
 * @returns Formatted datetime string
 */
export function formatDateTime(
  date: string,
  time: string,
  locale: string = "en-US"
): string {
  return `${formatDate(date, locale)} at ${formatTime(time)}`;
}

/**
 * Check if a date is in the past
 * @param date Date string in YYYY-MM-DD format
 * @param time Time string in HH:mm format (optional)
 * @returns True if the date/time is in the past
 */
export function isPastDateTime(date: string, time?: string): boolean {
  const now = new Date();
  const dateObj = new Date(date);

  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
  } else {
    dateObj.setHours(23, 59, 59, 999);
  }

  return dateObj < now;
}

/**
 * Check if a date is today
 * @param date Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export function isToday(date: string): boolean {
  const today = new Date();
  const dateObj = new Date(date);
  return (
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate()
  );
}

/**
 * Get a formatted date string for input[type="date"]
 * @param date Date object or string
 * @returns Date string in YYYY-MM-DD format
 */
export function getDateInputValue(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get a formatted time string for input[type="time"]
 * @param time Time string in HH:mm format or Date object
 * @returns Time string in HH:mm format
 */
export function getTimeInputValue(time: string | Date): string {
  if (typeof time === "string") {
    return time;
  }
  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Calculate the difference between two dates in days
 * @param date1 First date string in YYYY-MM-DD format
 * @param date2 Second date string in YYYY-MM-DD format
 * @returns Number of days between the dates (can be negative)
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
