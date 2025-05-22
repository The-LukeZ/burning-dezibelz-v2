<script lang="ts">
  import { goto } from "$app/navigation";
  import { eventStore } from "$lib/stores.svelte";

  let venueDetails = $state<Omit<VenueDetails, "id">>({
    name: "",
    address: "",
    city: "",
    country: "Deutschland",
    postal_code: "",
    state: "",
    url: "",
  });

  let loading = $state(false);
  let error = $state(null);

  async function handleSubmit() {
    if (!eventStore.venues) return console.error("Venue Map null???");
    loading = true;
    error = null;

    try {
      // Combine timestamp and time
      const venueData: Omit<VenueDetails, "id"> = {
        name: venueDetails.name,
        address: venueDetails.address,
        city: venueDetails.city,
        country: venueDetails.country,
        postal_code: venueDetails.postal_code,
        state: venueDetails.state,
        url: venueDetails.url,
      };

      console.log("venueData:", venueData);

      const response = await fetch("/api/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create venue");
      }

      const data = await response.json();
      console.log("Venue created:", data);
      eventStore.venues.set(data.id, data);

      // Navigate back to concerts list on success
      goto("/dash/venues");
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto flex h-full max-w-xl flex-col gap-4">
  <h1 class="text-2xl font-bold">Add New Venue</h1>

  {#if error}
    <div class="dy-alert dy-alert-error">
      <span>{error}</span>
    </div>
  {/if}

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Name</legend>
    <input type="text" name="name" bind:value={venueDetails.name} class="dy-input" />
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Address</legend>
    <input
      type="text"
      name="address"
      bind:value={venueDetails.address}
      class="dy-input"
      placeholder="Example Straße 31"
    />
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Postal Code</legend>
    <input
      type="text"
      name="postal_code"
      bind:value={venueDetails.postal_code}
      class="dy-input"
      placeholder="12345"
    />
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">City</legend>
    <input type="text" name="city" bind:value={venueDetails.city} class="dy-input" placeholder="Zwickau" />
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">State</legend>
    <input type="text" name="state" bind:value={venueDetails.state} class="dy-input" placeholder="Sachsen" />
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Country</legend>
    <input
      type="text"
      name="country"
      bind:value={venueDetails.country}
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
      bind:value={venueDetails.url}
      class="dy-input"
      placeholder="https://example.com"
      required
    />
  </fieldset>

  <div class="mt-2 flex flex-row justify-end gap-4">
    <button class="dy-btn dy-btn-error" onclick={() => goto("/dash/venues")}>Cancel</button>
    <button class="dy-btn dy-btn-primary" disabled={loading} onclick={handleSubmit}>
      {loading ? "Creating..." : "Create Venue"}
    </button>
  </div>
</div>
