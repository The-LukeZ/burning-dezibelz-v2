import { SvelteMap } from "svelte/reactivity";
import { API_URL, UnknownVenue } from "./constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";
import { filterConcerts } from "./utils/concerts";
import { onMount } from "svelte";

interface EventStoreState {
  /**
   * Concerts that are currently fetched.
   */
  concerts: SvelteMap<string, Concert>;
  /**
   * Locations that are currently fetched.
   */
  venues: SvelteMap<string, VenueDetails>;
  metadata: {
    concertsLoaded: boolean;
    venuesLoaded: boolean;
  };
}

export const eventStore = {
  concerts: new SvelteMap(),
  venues: new SvelteMap(),
  metadata: {
    concertsLoaded: false,
    venuesLoaded: false,
  },
} as EventStoreState;

export function serializeConcerts(): Concert[] {
  return filterConcerts(Array.from(eventStore.concerts.values()), {
    sort: "timestamp",
    order: "newestFirst",
  });
}

export function getVenueById(id: string | null, withFallback: true): VenueDetails;
export function getVenueById(id: string | null, withFallback?: boolean): VenueDetails | null;

export function getVenueById(id: string | null, withFallback = false): VenueDetails | null {
  if (!id) {
    return withFallback ? UnknownVenue : null;
  }
  const venue = eventStore.venues.get(id);
  return withFallback ? (venue ?? UnknownVenue) : null;
}

export function serializeVenues(): VenueDetails[] {
  return Array.from(eventStore.venues.values());
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
    const _order = options.order === "newestFirst" || options.order === "asc" ? "asc" : "desc";
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
  for (const concert of concerts) {
    eventStore.concerts.set(concert.id, concert);
  }
  console.log("Fetched concerts:", eventStore.concerts);
  eventStore.metadata.concertsLoaded = true;
}

export async function fetchVenues() {
  const response = await fetch(API_URL + "/venues", { method: "GET" });

  if (!response.ok) {
    console.error("Failed to fetch venues:", response);
    return;
  }

  const venues = (await response.json()) as VenueDetails[];
  for (const venue of venues) {
    eventStore.venues.set(venue.id, venue);
  }
  console.log("Fetched venues:", eventStore.venues);
  eventStore.metadata.venuesLoaded = true;
}

export async function fetchConcertCounts(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("get_concert_counts_per_venue");

  if (error) {
    console.error("Error calling function:", error);
  } else {
    console.log("Concert counts per venue:", data);
    return data;
  }
}
