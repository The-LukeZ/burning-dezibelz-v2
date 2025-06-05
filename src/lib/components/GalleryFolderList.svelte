<script lang="ts">
  import { slide } from "svelte/transition";

  type Props = {
    folders: { name: string; count: number }[];
    onFolderClick?: (folder: string) => void;
    folder?: string;
  };

  let { folders, onFolderClick }: Props = $props();

  let innerWidth = $state(0);
</script>

<svelte:window bind:innerWidth />

<div class="gallery-folder-wrapper">
  {#if innerWidth >= 640}
    <ul class="gallery-folder-list" transition:slide={{ duration: 200, axis: "x" }}>
      {#each folders as { name, count }}
        <li>
          <button class="dy-btn dy-btn-soft dy-btn-primary" onclick={() => onFolderClick?.(name)}>
            <span>{name}</span>
            <span class="dy-badge dy-badge-secondary dy-badge-sm" style="margin-left: 0.5rem;">
              {count}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {:else}
    <!-- Button which opens a modal with the list -->
  {/if}
</div>

<style>
  .gallery-folder-wrapper {
    position: relative;
    z-index: 1000;
    width: 10rem;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .gallery-folder-list {
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;
    list-style: none;
    background-color: var(--bg-base-100);
    width: 100%;
  }

  .gallery-folder-list li {
    padding: 0.5rem;
  }

  .gallery-folder-list li button {
    width: 100%;
  }
</style>
