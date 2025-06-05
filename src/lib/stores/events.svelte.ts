import { SvelteMap } from "svelte/reactivity";
import { API_URL, UnknownVenue } from "../constants";
import { filterConcerts } from "../utils/concerts.js";

interface EventStoreState {
  /**
   * Concerts that are currently fetched.
   */
  concerts: SvelteMap<string, Concert>;
  /**
   * Locations that are currently fetched.
   */
  venues: SvelteMap<string, VenueDetails>;
}

export const EventStore = {
  concerts: new SvelteMap(),
  venues: new SvelteMap(),
} as EventStoreState;

export const EventMetadata = $state({
  concertsLoaded: false,
  venuesLoaded: false,
});

export function serializeConcerts(_concerts: SvelteMap<string, Concert> | null = null): Concert[] {
  return filterConcerts(Array.from(_concerts?.values() ?? EventStore.concerts.values()), {
    sortBy: "timestamp",
    order: "newestFirst",
  });
}

export function getVenueById(id: string | null, withFallback: true): VenueDetails;
export function getVenueById(id: string | null, withFallback?: boolean): VenueDetails | null;

export function getVenueById(id: string | null, withFallback = false): VenueDetails | null {
  if (!id) {
    return withFallback ? UnknownVenue : null;
  }
  const venue = EventStore.venues.get(id);
  return withFallback ? (venue ?? UnknownVenue) : null;
}

export function serializeVenues(): VenueDetails[] {
  return Array.from(EventStore.venues.values());
}

interface FetchConcertOptions {
  before?: Date;
  after?: Date;
  venueId?: string;
  limit?: number;
  offset?: number;
  order?: "newestFirst" | "oldestFirst" | "asc" | "desc";
  sortBy?: "timestamp";
}

export async function fetchConcerts(options: FetchConcertOptions = {}): Promise<Concert[] | null> {
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
    const _order = options.order === "newestFirst" || options.order === "asc" ? "asc" : "desc";
    params.append("order", _order);
  }
  if (options.sortBy) {
    params.append("sort_col", options.sortBy);
  }

  const url = API_URL + "/concerts" + (params.size > 0 ? `?${params.toString()}` : "");

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    console.error("Failed to fetch concerts:", response);
    return null;
  }

  const concerts = (await response.json()) as Concert[];
  return concerts;
}

export async function fetchVenues() {
  const response = await fetch(API_URL + "/venues", { method: "GET" });

  if (!response.ok) {
    console.error("Failed to fetch venues:", response);
    return null;
  }

  const venues = (await response.json()) as VenueDetails[];
  for (const venue of venues) {
    EventStore.venues.set(venue.id, venue);
  }

  console.log("Fetched venues:", EventStore.venues);
  EventMetadata.venuesLoaded = true;
}
