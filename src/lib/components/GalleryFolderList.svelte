<script lang="ts">
  import { slide } from "svelte/transition";

  type Props = {
    folders: { name: string; count: number }[];
    onFolderClick?: (folder: string) => void;
    folder?: string;
  };

  let { folders, onFolderClick }: Props = $props();
</script>

<div class="gallery-folder-wrapper">
  <ul class="gallery-folder-list hidden md:flex" transition:slide={{ duration: 200, axis: "x" }}>
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
</div>

<style>
  .gallery-folder-wrapper {
    --spacing: 0;
    position: relative;
    left: var(--spacing);
    top: 0;
    z-index: 1000;
    width: 10rem;
    bottom: 0;
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
