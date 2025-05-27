<script lang="ts">
  import XIcon from "$lib/assets/XIcon.svelte";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import { scale } from "svelte/transition";

  type Props = {
    children?: Snippet;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /**
     * Whether to show an "X" button in the top right corner of the modal to close it.
     */
    withXButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEscape?: boolean;
    /**
     * Additional classes to apply to the modal box.
     */
    class?: ClassValue;
    /**
     * Optional title for the modal.
     */
    title?: string;
  };

  let {
    open = $bindable(false),
    onOpenChange = $bindable(() => {}),
    withXButton = true,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    class: className = "",
    children,
    title = "",
  }: Props = $props();

  $effect(() => {
    if (!className.includes("max-w")) {
      className = `${className} max-w-[32rem]`;
    }
  });

  $effect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
      document.body.style.pointerEvents = "none";
    } else {
      // Prevent flicker when closing (when clicking outside the modal box on mobile could cause a flicker)
      setTimeout(() => {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.body.style.pointerEvents = "";
      }, 150);
    }
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape" && open && closeOnEscape) {
      open = false;
      onOpenChange(false);
    }
  }}
/>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-[700] grid place-items-center bg-black/25 backdrop-blur-xs"
  class:hidden={!open}
  class:pointer-events-auto={open}
  onclick={() => {
    if (closeOnBackdropClick) {
      open = false;
      onOpenChange(false);
    }
  }}
>
  {#if open}
    <div
      class="modal-box shadow-xl {className}"
      class:hidden={!open}
      transition:scale={{ duration: 150 }}
      onclick={(e) => e.stopPropagation()}
    >
      {#if title}
        <h2 class="mb-4 text-xl font-semibold">{title}</h2>
      {/if}
      {#if withXButton}
        <button
          class="dy-btn dy-btn-circle dy-btn-ghost x-button"
          onclick={() => {
            open = false;
            onOpenChange(false);
          }}
        >
          <XIcon />
        </button>
      {/if}
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .modal-box {
    position: relative;
    grid-column-start: 1;
    grid-row-start: 1;
    background-color: var(--color-base-100);
    box-shadow:
      var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow),
      var(--tw-ring-shadow), var(--tw-shadow);
    border-radius: var(--radius-box);
    padding-inline: calc(var(--spacing) * 8);
    padding-block: calc(var(--spacing) * 6);
    max-height: 100dvh;
    overflow-x: clip;
    overscroll-behavior: contain;
    width: 98%;
    max-height: 100dvh;
    height: fit-content;
  }

  .x-button {
    position: absolute;
    top: calc(var(--spacing) * 4);
    right: calc(var(--spacing) * 4);
  }
</style>
