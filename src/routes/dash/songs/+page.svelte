<script lang="ts">
  import { onMount } from "svelte";
  import type { SongBatchPayload } from "../../api/songs/+server";
  import { enhance } from "$app/forms";
  import Modal from "$lib/components/Modal.svelte";
  import Trashcan from "$lib/assets/Trashcan.svelte";

  let oldSongs: Song[] = [];
  let songs = $state<Song[]>([]);
  const deletedSongs = $state<number[]>([]);
  let loading = $state<boolean>(true);
  let error = $state<string | null>(null);
  let showAddSongModal = $state<boolean>(false);

  async function saveSongs() {
    loading = true;

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
      oldSongs = structuredClone(data);
      songs = data;
      loading = false;
      console.log("Saved songs:", $state.snapshot(songs));
    } else {
      error = `Failed to save songs: ${response.statusText}`;
      console.error(error);
      loading = false;
    }
  }

  function revertChanges() {
    songs = structuredClone(oldSongs);
    console.log("Reverted changes to old songs:", songs);
  }

  onMount(async () => {
    const response = await fetch("/api/songs");
    if (response.ok) {
      const data = (await response.json()) as Song[];
      oldSongs = structuredClone(data);
      songs = data;
      loading = false;
      console.log("Fetched songs:", songs);
    } else {
      console.error("Failed to fetch songs:", response.statusText);
    }
  });
</script>

<button class="dy-btn dy-btn-primary mx-auto flex w-xs" onclick={() => (showAddSongModal = true)}>
  Add Song
</button>

<ul class="dy-list rounded-box bg-base-200 mx-auto mt-5 mb-20 max-w-[750px] overflow-hidden shadow-md">
  {#if loading}
    <div class="flex w-full items-center justify-center">
      <span class="dy-loading dy-loading-dots"></span>
    </div>
  {:else if error}
    <div class="dy-alert dy-alert-error w-full">
      <span>{error}</span>
    </div>
  {:else if songs.length === 0}
    <div class="dy-alert dy-alert-info w-full">
      <span>No songs found. Please add some songs.</span>
    </div>
  {:else}
    {#each songs.filter((s) => !deletedSongs.includes(s.id)) as song}
      <li
        class="flex items-center gap-1 rounded-2xl p-4 transition duration-75 hover:bg-(--color-light-base-100)"
      >
        <div class="flex h-full grow flex-col gap-1 sm:flex-row">
          <input type="text" value={song.id} class="hidden" />
          <input type="text" bind:value={song.title} class="dy-input dy-input-md" />
          <input type="text" class="dy-input dy-input-md" bind:value={song.artist} />
        </div>
        <button
          class="dy-btn dy-btn-square dy-btn-soft dy-btn-warning"
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

<div class="absolute right-0 bottom-0 left-0 flex w-full justify-end gap-2 p-4">
  <button class="dy-btn dy-btn-secondary" onclick={revertChanges} disabled={loading}>Revert Changes</button>
  <button class="dy-btn dy-btn-primary" onclick={saveSongs} disabled={loading}>Save Changes</button>
</div>

<Modal
  bind:open={showAddSongModal}
  onOpenChange={(open) => (showAddSongModal = open)}
  class="w-full max-w-lg"
  withXButton={false}
>
  <form
    method="POST"
    action="?/create"
    class="flex w-full flex-col place-items-center items-center justify-center gap-2"
    use:enhance={() => {
      loading = true;
      showAddSongModal = false;
      return async ({ result, update }) => {
        await update({ reset: true, invalidateAll: false });
        if (result.type === "success" && result.data?.song) {
          songs.push(result.data.song as Song);
        }
        loading = false;
      };
    }}
  >
    <label class="dy-floating-label">
      <span>Song Title</span>
      <input type="text" name="title" placeholder="Song Title" class="dy-input dy-input-md w-xs" required />
    </label>
    <label class="dy-floating-label mb-4">
      <span>Artist</span>
      <input type="text" name="artist" placeholder="Artist" class="dy-input dy-input-md w-xs" required />
    </label>
    <button type="submit" class="dy-btn dy-btn-primary px-10" disabled={loading}>Add Song</button>
  </form>
</Modal>
