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

<div class="mx-auto mb-10 max-w-[800px] overflow-x-auto">
  <table class="dy-table dy-table-zebra min-w-[400px]">
    <thead class="bg-primary/20 text-neutral-content">
      <tr>
        <th class="w-1/2">Titel</th>
        <th class="w-1/2">Interpret</th>
        <th aria-details="Eigener Song Indikator"></th>
      </tr>
    </thead>
    <tbody>
      {#if loading}
        <tr>
          <td colspan="3" class="text-center">Laden...</td>
        </tr>
      {:else if songs.length === 0}
        <tr>
          <td colspan="3" class="bg-info text-info-content rounded-b text-center">Keine Songs gefunden.</td>
        </tr>
      {:else}
        {#each songs as song}
          <tr class="transition duration-75 hover:bg-(--color-light-base-100)">
            <td>{song.title}</td>
            <td>{song.artist}</td>
            <td class="size-4">
              {#if song.is_own}
                <div class="dy-tooltip dy-tooltip-left flex h-full items-center">
                  <div class="dy-tooltip-content">
                    <span>Eigner Song!</span>
                  </div>
                  <div class="bg-primary size-4 rounded-full"></div>
                </div>
              {/if}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  thead tr {
    border-bottom: 1px solid var(--color-primary);
    font-size: var(--text-lg);
  }
</style>
