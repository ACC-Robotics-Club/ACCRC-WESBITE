export type EventStatusType = "upcoming" | "open" | "closed";

export interface EventStatusResult {
  status: EventStatusType;
  label: string;
  timeRemaining?: number; // milliseconds
}

/**
 * Compute the registration status of an event by comparing current time
 * to the event's registrationOpensAt and registrationClosesAt timestamps.
 * This is the core time-gating logic — never hardcode open/closed state.
 */
export function getEventStatus(
  registrationOpensAt?: Date,
  registrationClosesAt?: Date
): EventStatusResult {
  const now = new Date();

  if (!registrationOpensAt || !registrationClosesAt) {
    return {
      status: "open",
      label: "REGISTRATION OPEN",
    };
  }

  if (now < registrationOpensAt) {
    return {
      status: "upcoming",
      label: "OPENS IN",
      timeRemaining: registrationOpensAt.getTime() - now.getTime(),
    };
  }

  if (now >= registrationOpensAt && now <= registrationClosesAt) {
    return {
      status: "open",
      label: "REGISTRATION OPEN",
      timeRemaining: registrationClosesAt.getTime() - now.getTime(),
    };
  }

  return {
    status: "closed",
    label: "REGISTRATION CLOSED",
  };
}

/**
 * Format milliseconds into a human-readable countdown string.
 * Output format: "12D 04H 32M 15S" for the telemetry/mono display.
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00D 00H 00M 00S";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const s = seconds % 60;
  const m = minutes % 60;
  const h = hours % 24;

  return `${String(days).padStart(2, "0")}D ${String(h).padStart(2, "0")}H ${String(m).padStart(2, "0")}M ${String(s).padStart(2, "0")}S`;
}

/**
 * Format a date for display in the telemetry style.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/**
 * Format a date with time.
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Convert a Firestore Timestamp to a JS Date.
 */
export function toDate(timestamp: { seconds: number; nanoseconds: number } | Date): Date {
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000);
}

/**
 * Truncate text to a given length with an ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number (Bangladeshi format).
 */
export function isValidPhone(phone: string): boolean {
  return /^(\+880|0)?1[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""));
}
