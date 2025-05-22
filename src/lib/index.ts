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

  const _order = options.order === "newestFirst" || options.order === "desc" ? "desc" : "asc";

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
