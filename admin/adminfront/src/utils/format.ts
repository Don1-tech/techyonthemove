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

  /*
   * The admin frontend normally receives a date such as:
   *
   * 2026-10-08
   *
   * The realtime WebSocket can potentially provide a
   * different representation, so normalize it safely.
   */

  const dateOnlyMatch =
    /^(\d{4}-\d{2}-\d{2})/.exec(value);

  const dateValue = dateOnlyMatch
    ? dateOnlyMatch[1]
    : value;

  const parsedDate = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? `${dateValue}T00:00:00`
      : value,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}