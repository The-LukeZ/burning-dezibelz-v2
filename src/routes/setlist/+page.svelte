<script lang="ts">
  import { onMount } from "svelte";

  let songs = $state<Song[]>([]);
  let loading = $state<boolean>(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    const response = await fetch("/api/songs");
    if (response.ok) {
      const data = (await response.json()) as Song[];
      songs = data;
      loading = false;
    } else {
      error = `Failed to fetch songs: ${response.statusText}`;
      loading = false;
    }
  });
</script>

<div class="mx-auto max-w-[800px] overflow-x-auto">
  <table class="dy-table">
    <thead class="bg-base-200">
      <tr>
        <th class="w-1/2">Titel</th>
        <th class="w-1/2">Interpret</th>
      </tr>
    </thead>
    <tbody>
      {#if loading}
        <tr>
          <td colspan="2" class="text-center">Laden...</td>
        </tr>
      {:else if error}
        <tr>
          <td colspan="2" class="text-red-500">{error}</td>
        </tr>
      {:else if songs.length === 0}
        <tr>
          <td colspan="2" class="bg-info text-info-content rounded-b text-center">Keine Songs gefunden.</td>
        </tr>
      {:else}
        {#each songs as song}
          <tr class="transition duration-75 hover:bg-(--color-light-base-100)">
            <td>{song.title}</td>
            <td>{song.artist}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
