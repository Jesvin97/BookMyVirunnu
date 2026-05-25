export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

const defaultIntlCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = defaultIntlCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  defaultIntlCache.set(timeZone, formatter);
  return formatter;
}

export function formatDateKey(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return [
    parts.year.toString().padStart(4, "0"),
    parts.month.toString().padStart(2, "0"),
    parts.day.toString().padStart(2, "0")
  ].join("-");
}

export function getZonedParts(date: Date, timeZone: string): LocalDateParts {
  const formatter = getFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function parseTimeString(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function differenceInMinutes(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 60_000);
}

export function startOfDayInZone(date: Date, timeZone: string): Date {
  const zoned = getZonedParts(date, timeZone);
  return zonedDateTimeToUtc(
    {
      year: zoned.year,
      month: zoned.month,
      day: zoned.day,
      hour: 0,
      minute: 0,
      second: 0
    },
    timeZone
  );
}

export function endOfDayInZone(date: Date, timeZone: string): Date {
  const zoned = getZonedParts(date, timeZone);
  return zonedDateTimeToUtc(
    {
      year: zoned.year,
      month: zoned.month,
      day: zoned.day,
      hour: 23,
      minute: 59,
      second: 59
    },
    timeZone
  );
}

export function zonedDateTimeToUtc(parts: LocalDateParts, timeZone: string): Date {
  let utcMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second ?? 0,
    0
  );

  for (let i = 0; i < 4; i += 1) {
    const current = getZonedParts(new Date(utcMillis), timeZone);
    const desiredUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second ?? 0,
      0
    );
    const currentUtc = Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute,
      current.second ?? 0,
      0
    );
    const diffMinutes = Math.round((desiredUtc - currentUtc) / 60_000);
    if (diffMinutes === 0) break;
    utcMillis += diffMinutes * 60_000;
  }

  return new Date(utcMillis);
}

export function toUtcFromDateKeyAndTime(
  dateKey: string,
  timeString: string,
  timeZone: string
): Date {
  const { year, month, day } = parseDateKey(dateKey);
  const { hour, minute } = parseTimeString(timeString);
  return zonedDateTimeToUtc({ year, month, day, hour, minute, second: 0 }, timeZone);
}

export function compareDatesAsc(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}
