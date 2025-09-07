<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import { EventStore } from "$lib/stores/events.svelte";
  import type { Database } from "$lib/supabase";
  import { fade } from "svelte/transition";

  let { supabase } = page.data;
  let { data: pageData } = $props();
  let venue = $state(pageData.venue ?? null);
  let loading = $state(false);
  let error = $state(pageData.error || null);

  async function handleSubmit() {
    if (!EventStore.venues || !venue) {
      console.error("Venue Map or venue data is null");
      error = "Venue data is not available.";
      return;
    }
    loading = true;
    error = null;

    try {
      // Combine timestamp and time
      const venueData: Database["public"]["Tables"]["venues"]["Update"] = {
        name: venue.name,
        address: venue.address,
        city: venue.city,
        country: venue.country,
        postal_code: venue.postal_code,
        state: venue.state,
        url: venue.url,
      };

      const response = await fetch(`/api/venues/${venue.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update venue");
      }

      const data = await response.json();

      EventStore.venues.set(data.id, data);

      // Navigate back to concerts list on success
      goto("/intern/venues");
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

{#if venue}
  <div class="container mx-auto flex h-full max-w-xl flex-col gap-4">
    <a href="/intern/venues" class="dy-btn dy-btn-soft dy-btn-sm dy-btn-info w-fit">
      <ChevronLeft />
      Go back
    </a>
    <h1 class="text-2xl font-bold">Update Venue</h1>

    {#if error}
      <div class="dy-alert dy-alert-error">
        <span>{error}</span>
      </div>
    {/if}

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">Name</legend>
      <input type="text" name="name" bind:value={venue.name} class="dy-input" />
    </fieldset>

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">Address</legend>
      <input
        type="text"
        name="address"
        bind:value={venue.address}
        class="dy-input"
        placeholder="Example Straße 31"
      />
    </fieldset>

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">Postal Code</legend>
      <input
        type="text"
        name="postal_code"
        bind:value={venue.postal_code}
        class="dy-input"
        placeholder="12345"
      />
    </fieldset>

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">City</legend>
      <input type="text" name="city" bind:value={venue.city} class="dy-input" placeholder="Zwickau" />
    </fieldset>

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">State</legend>
      <input type="text" name="state" bind:value={venue.state} class="dy-input" placeholder="Sachsen" />
    </fieldset>

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">Country</legend>
      <input
        type="text"
        name="country"
        bind:value={venue.country}
        class="dy-input"
        placeholder="Deutschland"
      />
      <p class="dy-label dy-label-info">Edit this if you know what you're doing.</p>
    </fieldset>

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">Venue URL</legend>
      <input
        type="text"
        name="url"
        bind:value={venue.url}
        class="dy-input"
        placeholder="https://example.com"
        required
      />
    </fieldset>

    <div class="mt-2 flex flex-row justify-end gap-4">
      <button class="dy-btn dy-btn-error" onclick={() => goto("/intern/venues")}>Cancel</button>
      <button class="dy-btn dy-btn-primary" disabled={loading} onclick={handleSubmit}>
        {loading ? "Updating..." : "Update Venue"}
      </button>
    </div>
  </div>
{/if}

{#if error}
  <div class="dy-toast dy-toast-top dy-toast-center mt-14" transition:fade>
    <div class="dy-alert dy-alert-error">
      <span>{error}</span>
    </div>
  </div>
{/if}
