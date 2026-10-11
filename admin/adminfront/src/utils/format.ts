export function formatCurrency(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const dateOnlyMatch =
    /^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/.exec(value);

  const parsedDate = dateOnlyMatch
    ? parseCalendarDate(dateOnlyMatch[1])
    : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function formatDateTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(parsedDate);
}

export function formatAppointmentTime(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) {
    return value;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return "—";
  }

  const date = new Date(Date.UTC(2020, 0, 1, hours, minutes));
  const formatted = new Intl.DateTimeFormat("en-KE", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${formatted} EAT`;
}

export function getNairobiDateKey(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parseCalendarDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return new Date(Number.NaN);
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return new Date(Number.NaN);
  }

  return date;
}

export function formatCustomerName(value: string): string {
  return value.replace(/\S+/g, (word) => {
    if (/^[A-Z0-9]{2,5}$/.test(word)) {
      return word;
    }

    if (/[a-z][A-Z]|[A-Z]{2,}/.test(word)) {
      return word;
    }

    return word
      .toLowerCase()
      .replace(/(^|[-'])[a-z]/g, (letter) => letter.toUpperCase());
  });
}