<!-- ImageSelector.svelte -->
<script lang="ts">
  import { buildImageUrl } from "$lib";
  import Modal from "./Modal.svelte";

  type Props = {
    /**
     * List of images to select from.
     */
    images: DBImage[];
    /**
     * Callback function to handle image selection.
     *
     * Remember: Modal is automatically closed before this function is called.
     */
    onselect: (image: DBImage) => void;
    /**
     * Controls the visibility of the modal.
     * Set to true to show the modal, false to hide it.
     */
    show: boolean;
  };

  let { images, onselect, show = $bindable(false) }: Props = $props();
</script>

<Modal
  bind:open={show}
  title="Select Image"
  closeOnBackdropClick={false}
  withXButton={false}
  class="flex min-h-1/2 flex-col"
>
  <div class="image-grid mt-4">
    {#each images as image}
      <button
        class="dy-skeleton rounded-lg transition-opacity duration-100 hover:opacity-80"
        onclick={() => {
          show = false;
          onselect(image);
        }}
      >
        <img
          src={buildImageUrl(image.r2_key, {
            width: 300,
            height: 300,
            fit: "cover",
            format: "webp",
          })}
          alt={image.name}
          class="h-full w-full object-cover"
        />
      </button>
    {/each}
  </div>
  <div class="dy-modal-action mt-auto">
    <button class="dy-btn dy-btn-error dy-btn-outline" onclick={() => (show = false)}>Cancel</button>
  </div>
</Modal>

<style>
  .image-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;

    button {
      flex: 0 1 150px;
      aspect-ratio: 1 / 1;
      overflow: hidden;
    }
  }
</style>
