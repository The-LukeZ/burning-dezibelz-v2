<script lang="ts">
  import { enhance } from "$app/forms";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { onMount } from "svelte";
  import type { SongBatchPayload } from "../../api/songs/+server";

  let oldSongs: Song[] = [];
  let songs = $state<Song[]>([]);
  let uniqueArtists = $state<string[]>([]);
  const deletedSongs = $state<number[]>([]);
  let loading = $state<boolean>(true);
  let error = $state<string | null>(null);
  let showAddSongModal = $state<boolean>(false);
  let artistInputValue = $state<string>("");
  let showArtistDropdown = $state<boolean>(false);
  let filteredArtists = $state<string[]>([]);
  let focusedSongId = $state<number | null>(null);

  $effect(() => {
    if (showArtistDropdown && artistInputValue.trim()) {
      filteredArtists = uniqueArtists
        .filter((artist) => artist.toLowerCase().includes(artistInputValue.toLowerCase()))
        .slice(0, 5);
    } else if (!showArtistDropdown || !artistInputValue.trim()) {
      filteredArtists = [];
    }
  });

  function updateUniqueArtists() {
    uniqueArtists = Array.from(new Set(songs.map((song) => song.artist).filter((artist) => artist.trim())));
  }

  function selectArtist(artist: string) {
    artistInputValue = artist;
    showArtistDropdown = false;
  }

  function selectArtistForSong(songId: number, artist: string) {
    const song = songs.find((s) => s.id === songId);
    if (song) {
      song.artist = artist;
    }
    focusedSongId = null;
  }

  function getFilteredArtistsForSong(currentArtist: string) {
    return uniqueArtists.filter((artist) => artist.toLowerCase().includes(currentArtist.toLowerCase()));
  }

  async function saveSongs() {
    loading = true;
    error = null;

    const _songs = $state.snapshot(songs);

    const payloadToSend: SongBatchPayload = {
      delete: deletedSongs,
      update: _songs.filter((song) => !deletedSongs.includes(song.id)),
    };

    const response = await fetch("/api/songs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadToSend),
    });

    if (response.ok) {
      const data = (await response.json()) as Song[];
      const sortedData = [...data];
      sortedData.sort((a, b) => a.title.localeCompare(b.title));
      oldSongs = structuredClone(sortedData);
      songs = sortedData;
      loading = false;
    } else {
      const data = await response.json();
      error = `Failed to save songs: ${data?.error || response.statusText}`;
      oldSongs = structuredClone(data);
      console.error(error);
      loading = false;
    }
    updateUniqueArtists();
  }

  function revertChanges() {
    songs = [...oldSongs];
    deletedSongs.length = 0; // Clear deleted songs
    updateUniqueArtists();
    console.log("Reverted changes to old songs:", $state.snapshot(songs));
  }

  onMount(async () => {
    const response = await fetch("/api/songs");
    if (response.ok) {
      const data = (await response.json()) as Song[];
      oldSongs = structuredClone(data);
      songs = data;
      loading = false;
      updateUniqueArtists();
      console.log("Fetched songs:", $state.snapshot(songs));
    } else {
      console.error("Failed to fetch songs:", response.statusText);
    }
  });
</script>

<button class="dy-btn dy-btn-primary mx-auto flex w-full max-w-xs" onclick={() => (showAddSongModal = true)}>
  Add Song
</button>

{#if error}
  <div class="dy-alert dy-alert-soft dy-alert-error mx-auto my-4 max-w-[750px]">
    <span>{error}</span>
    <button class="dy-btn dy-btn-square dy-btn-dash dy-btn-error ml-auto" onclick={() => (error = null)}>
      <Trashcan />
    </button>
  </div>
{/if}

<ul class="dy-list rounded-box bg-base-200 mx-auto mt-5 mb-20 max-w-[750px] shadow-md">
  {#if loading}
    <div class="flex w-full items-center justify-center">
      <span class="dy-loading dy-loading-dots"></span>
    </div>
  {:else if songs.length === 0}
    <div class="dy-alert dy-alert-info w-full">
      <span>No songs found. Please add some songs.</span>
    </div>
  {:else}
    {#each songs.filter((song) => !deletedSongs.includes(song.id)) as song}
      <li
        class="flex items-center gap-2 rounded-2xl p-4 transition duration-75 hover:bg-(--color-light-base-100)"
      >
        <div class="flex h-full grow flex-col gap-3 sm:flex-row">
          <input type="text" value={song.id} class="hidden" />
          <input type="text" bind:value={song.title} class="dy-input dy-input-md" />
          <div class="relative w-full">
            <input
              type="text"
              class="dy-input dy-input-md w-full"
              bind:value={song.artist}
              placeholder="Artist"
              onfocusin={() => (focusedSongId = song.id)}
              onblur={() => setTimeout(() => (focusedSongId = null), 150)}
            />
            {#if focusedSongId === song.id}
              <div
                class="border-base-300 bg-base-100 absolute top-full right-0 left-0 z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border shadow-lg"
              >
                {#if song.artist.trim() && !uniqueArtists.some((artist) => artist.toLowerCase() === song.artist.toLowerCase())}
                  <button
                    type="button"
                    class="hover:bg-base-200 border-base-300 block w-full border-b px-3 py-2 text-left text-sm font-medium"
                    onclick={() => selectArtistForSong(song.id, song.artist)}
                  >
                    {song.artist}
                  </button>
                {/if}
                {#each getFilteredArtistsForSong(song.artist) as artist}
                  <button
                    type="button"
                    class="hover:bg-base-200 block w-full px-3 py-2 text-left text-sm"
                    onclick={() => selectArtistForSong(song.id, artist)}
                  >
                    {artist}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          <label class="dy-label">
            <input type="checkbox" bind:checked={song.is_own} class="dy-checkbox" />
            Is Own Song
          </label>
        </div>
        <button
          class="dy-btn dy-btn-square dy-btn-dash dy-btn-warning"
          onclick={() => {
            deletedSongs.push(song.id);
          }}
        >
          <Trashcan />
        </button>
      </li>
    {/each}
  {/if}
</ul>

<div class="fixed right-0 bottom-0 left-0 flex w-full justify-end gap-2 p-4">
  <button class="dy-btn dy-btn-secondary" onclick={revertChanges} disabled={loading}>Revert Changes</button>
  <button class="dy-btn dy-btn-primary" onclick={saveSongs} disabled={loading}>Save Changes</button>
</div>

<Modal
  bind:open={showAddSongModal}
  onClose={(open) => {
    showAddSongModal = open;
    if (!open) {
      artistInputValue = "";
      showArtistDropdown = false;
    }
  }}
  closeOnEscape={true}
  class="w-full max-w-lg overflow-y-visible"
  withXButton={false}
>
  <form
    method="POST"
    action="?/create"
    class="flex w-full flex-col place-items-center items-center justify-center gap-4"
    use:enhance={() => {
      loading = true;
      showAddSongModal = false;
      artistInputValue = "";
      showArtistDropdown = false;
      return async ({ result, update }) => {
        await update({ reset: true, invalidateAll: false });
        if (result.type === "success" && result.data?.song) {
          songs.push(result.data.song as Song);
          songs.sort((a, b) => a.title.localeCompare(b.title));
        }
        loading = false;
      };
    }}
  >
    <label class="dy-floating-label">
      <span>Song Title</span>
      <input type="text" name="title" placeholder="Song Title" class="dy-input dy-input-md w-xs" required />
    </label>
    <div class="relative w-xs">
      <label class="dy-floating-label">
        <span>Artist</span>
        <input
          type="text"
          name="artist"
          placeholder="Artist"
          class="dy-input dy-input-md w-full"
          bind:value={artistInputValue}
          onfocusin={() => (showArtistDropdown = true)}
          onblur={() => setTimeout(() => (showArtistDropdown = false), 150)}
          required
          autocomplete="off"
        />
      </label>
      {#if showArtistDropdown}
        <div
          class="border-base-300 bg-base-100 absolute top-full right-0 left-0 z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border shadow-lg"
        >
          {#if artistInputValue.trim() && !uniqueArtists.some((artist) => artist.toLowerCase() === artistInputValue.toLowerCase())}
            <button
              type="button"
              class="hover:bg-base-200 border-base-300 block w-full border-b px-3 py-2 text-left text-sm font-medium"
              onclick={() => selectArtist(artistInputValue)}
            >
              {artistInputValue}
            </button>
          {/if}
          {#if filteredArtists.length === 0}
            <div class="px-3 py-2 text-sm text-gray-500">No suggestions found</div>
          {:else}
            {#each filteredArtists as artist}
              <button
                type="button"
                class="hover:bg-base-200 block w-full px-3 py-2 text-left text-sm"
                onclick={() => selectArtist(artist)}
              >
                {artist}
              </button>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
    <label class="dy-label mb-4">
      <input type="checkbox" name="is_own" class="dy-checkbox" />
      Is Own Song
    </label>
    <button type="submit" class="dy-btn dy-btn-primary px-10" disabled={loading}>Add Song</button>
  </form>
</Modal>
