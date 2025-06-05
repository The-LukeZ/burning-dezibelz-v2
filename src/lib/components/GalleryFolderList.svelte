<script lang="ts">
  import { slide } from "svelte/transition";

  type Props = {
    folders: { name: string; count: number }[];
    activeFolder?: string;
    onFolderClick?: (folder: string) => void | Promise<void>;
    innerWidth?: number;
    /**
     * Indicates if the component is being used on a mobile device.
     *
     * - If true, the component will hide the folder list if the screen width is less than 640px.
     * - If false, it will hide the folder list if the screen width is 640px or more.
     */
    mobile?: boolean;
  };

  let {
    folders,
    onFolderClick,
    innerWidth = $bindable(640),
    mobile,
    activeFolder = $bindable("Alle Bilder"),
  }: Props = $props();
</script>

<svelte:window bind:innerWidth />

<div class="gallery-folder-wrapper">
  {#if (mobile && innerWidth < 640) || (!mobile && innerWidth >= 640)}
    <ul class="gallery-folder-list" transition:slide={{ duration: 200, axis: "x" }}>
      {#each folders as { name, count }}
        <li>
          <button
            class="dy-btn dy-btn-soft dy-btn-primary"
            class:dy-btn-active={activeFolder === name}
            onclick={async () => {
              activeFolder = name;
              await onFolderClick?.(name);
            }}
          >
            <span>{name}</span>
            <span class="dy-badge dy-badge-secondary dy-badge-sm" style="margin-left: 0.5rem;">
              {count}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .gallery-folder-wrapper {
    position: relative;
    width: 11.5rem;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: 1rem;
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
    justify-content: space-between;
  }
</style>
