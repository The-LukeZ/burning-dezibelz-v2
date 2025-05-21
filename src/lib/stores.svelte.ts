import { API_URL } from "./constants";

interface EventStoreState {
  /**
   * Concerts that are currently fetched.
   *
   * Is `null` if not fetched yet. Empty array if no concerts are available.
   */
  concerts: Map<string, Concert> | null;
  /**
   * Locations that are currently fetched.
   *
   * Is `null` if not fetched yet. Empty array if no locations are available.
   */
  venues: Map<string, VenueDetails> | null;
}

export const eventStore = $state<EventStoreState>({
  concerts: null,
  venues: null,
});

export function serializeConcerts(): Concert[] {
  if (eventStore.concerts !== null) {
    return Array.from(eventStore.concerts.values());
  }
  return [];
}

export function serializeVenues(): VenueDetails[] {
  if (eventStore.venues !== null) {
    return Array.from(eventStore.venues.values());
  }
  return [];
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

export async function fetchConcerts(options: FetchConcertOptions = {}) {
  // Implementation for fetching concerts based on the options
  const params = new URLSearchParams();

  if (options.before) {
    params.append("before", options.before.toISOString());
  }

  if (options.after) {
    params.append("after", options.after.toISOString());
  }

  if (options.venueId) {
    params.append("venue_id", options.venueId);
  }

  if (options.limit) {
    params.append("limit", options.limit.toString());
  }

  if (options.offset) {
    params.append("offset", options.offset.toString());
  }

  if (options.order) {
    const _order = options.order === "newestFirst" || options.order === "desc" ? "desc" : "asc";
    params.append("order", _order);
  }

  if (options.sort) {
    params.append("sort", options.sort);
  }

  const url = API_URL + "/concerts" + (params.size > 0 ? `?${params.toString()}` : "");

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    console.error("Failed to fetch concerts:", response);
    return;
  }

  const concerts = (await response.json()) as Concert[];
  if (eventStore.concerts === null) {
    eventStore.concerts = new Map();
  }
  for (const concert of concerts) {
    eventStore.concerts.set(concert.id, concert);
  }
}

export async function fetchVenues() {
  const response = await fetch(API_URL + "/venues", { method: "GET" });

  if (!response.ok) {
    console.error("Failed to fetch venues:", response);
    return;
  }

  const venues = (await response.json()) as VenueDetails[];
  if (eventStore.venues === null) {
    eventStore.venues = new Map();
  }
  for (const venue of venues) {
    eventStore.venues.set(venue.id, venue);
  }
}
