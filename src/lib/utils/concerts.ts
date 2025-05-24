import type { Tables } from "$lib/supabase.ts";
import { eventStore } from "$lib/stores.svelte.js";

export function getConcertDisplayName(concert: Concert): string {
  if (concert.name) {
    return concert.name;
  }
  let displayName = concert.type === "closed" ? "Closed" : "Unknown";
  if (concert.venue_id) {
    displayName = eventStore.venues?.get(concert.venue_id)?.name || "Unknown Venue";
  }
  return displayName;
}

export function formatGermanDateTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString);
    return timestamp.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    });
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

interface FetchConcertOptions {
  before?: Date;
  after?: Date;
  venueId?: string;
  limit?: number;
  offset?: number;
  order?: "newestFirst" | "oldestFirst" | "asc" | "desc";
  sort?: "timestamp";
}

export function filterConcerts(concerts: Concert[], options: FetchConcertOptions = {}) {
  // Filter concerts based on the options
  let filteredConcerts = structuredClone(concerts);
  if (options.before) {
    filteredConcerts = filteredConcerts.filter((concert) => new Date(concert.timestamp) < options.before!);
  }
  if (options.after) {
    filteredConcerts = filteredConcerts.filter((concert) => new Date(concert.timestamp) > options.after!);
  }

  if (options.venueId) {
    filteredConcerts = filteredConcerts.filter((concert) => concert.venue_id === options.venueId);
  }

  const _order = options.order === "newestFirst" || options.order === "asc" ? "asc" : "desc";

  if (options.sort || _order === "asc") {
    filteredConcerts = filteredConcerts.sort((a, b) => {
      if (options.sort === "timestamp") {
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
