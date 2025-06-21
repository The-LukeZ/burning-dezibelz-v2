import { normalizeName } from "$lib";
import { EventStore } from "$lib/stores/events.svelte";

export function getConcertDisplayName(concert: Concert): string {
  if (concert.name) {
    return concert.name;
  }
  let displayName = concert.type === "closed" ? "Geschlossene Veranstaltung" : "Unbekannte Veranstaltung";
  if (concert.venue_id) {
    displayName = EventStore.venues?.get(concert.venue_id)?.name || "Unbekannter Veranstaltungsort";
  }
  return displayName;
}

export function formatGermanDateTime(dateString: string | null, onlyDate = false): string {
  if (!dateString) {
    return "Ungültiges Datum";
  }

  try {
    const timestamp = new Date(dateString);
    if (onlyDate) {
      return timestamp.toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Europe/Berlin",
      });
    } else {
      return timestamp.toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin",
      });
    }
  } catch (e) {
    return "Invalid Date";
  }
}

/**
 * Convert to local timezone and format for datetime-local input.
 */
export function formatDateTimeLocal(dateString: string): string {
  try {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  } catch (e) {
    return "";
  }
}

export function buildConcertTitle(concert: Concert | null): string {
  if (!concert) {
    return "Konzert nicht gefunden";
  }

  if (concert.type === "closed") {
    return `Privates Konzert | ${formatGermanDateTime(concert.timestamp, true)}`;
  }

  const displayName = getConcertDisplayName(concert);
  const date = formatGermanDateTime(concert.timestamp, true);
  return `Konzert am ${date} | ${displayName}`;
}

export function buildConcertDescription(concert: Concert | null, venueCity: string | null = null): string {
  if (!concert) {
    return "Konzert nicht gefunden.";
  }

  if (concert.type === "closed") {
    return `Privates Konzert am ${formatGermanDateTime(concert.timestamp, true)}`;
  }

  const displayName = getConcertDisplayName(concert);
  const date = formatGermanDateTime(concert.timestamp, true);
  const venue =
    venueCity ||
    (concert.venue_id ? EventStore.venues?.get(concert.venue_id)?.city : "Unbekannter Veranstaltungsort");
  return `${displayName} am ${date} | ${venue}`;
}

interface FetchConcertOptions {
  /**
   * Filter concerts before this date.
   *
   * Compares with `<` operator.
   */
  before?: Date;
  /**
   * Filter concerts after this date.
   *
   * Compares with `>` operator.
   */
  after?: Date;
  /**
   * Filter concerts by venue ID.
   */
  venueId?: string;
  /**
   * Limit the number of concerts returned.
   */
  limit?: number;
  /**
   * Offset the number of concerts returned.
   */
  offset?: number;
  /**
   * Order of the concerts.
   *
   * If provided, then `sort` must also be set!
   *
   * - "newestFirst" - Sort by newest first (equivalent to "desc", default).
   * - "oldestFirst" - Sort by oldest first (equivalent to "asc").
   * - "asc" - Sort in ascending order (equivalent to "oldestFirst").
   * - "desc" - Sort in descending order (equivalent to "newestFirst").
   *
   * @default "newestFirst"
   */
  order?: "newestFirst" | "oldestFirst" | "asc" | "desc";
  /**
   * Sort concerts by a specific field.
   *
   * Currently only supports sorting by `timestamp`.
   *
   * Orders by "newestFirst" by default.
   */
  sortBy?: "timestamp";
}

export function filterConcerts(concerts: Concert[], options: FetchConcertOptions = {}) {
  // Filter concerts based on the options
  let filteredConcerts = [...concerts];
  if (options.before) {
    filteredConcerts = filteredConcerts.filter((concert) => new Date(concert.timestamp) < options.before!);
  }
  if (options.after) {
    filteredConcerts = filteredConcerts.filter((concert) => new Date(concert.timestamp) > options.after!);
  }

  if (options.venueId) {
    filteredConcerts = filteredConcerts.filter((concert) => concert.venue_id === options.venueId);
  }

  const _order = options.order === "oldestFirst" || options.order === "asc" ? "asc" : "desc";

  if (options.sortBy && _order === "asc") {
    filteredConcerts = filteredConcerts.sort((a, b) => {
      if (options.sortBy === "timestamp") {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return 0;
    });
  }

  if (_order === "desc") {
    filteredConcerts = filteredConcerts.reverse();
  } else if (_order === "asc") {
    filteredConcerts = filteredConcerts.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  if (options.offset) {
    filteredConcerts = filteredConcerts.slice(options.offset);
  }

  if (options.limit) {
    filteredConcerts = filteredConcerts.slice(0, options.limit);
  }

  return filteredConcerts;
}

export const concertHref = (concertId: string, venueName: string | null = null) =>
  `/konzerte/k/${concertId}${venueName ? `#${normalizeName(venueName)}` : ""}` as const;

export async function copyConcertLink(concertId: string, venueName: string | null = null) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${concertHref(concertId, venueName)}`);
    alert("✅ Konzert Link wurde in die Zwischenablage kopiert!");
  } catch (error) {
    console.error("Failed to copy concert link:", error);
  }
}
