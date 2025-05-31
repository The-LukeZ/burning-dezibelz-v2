<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import { onMount } from "svelte";

  let error = $state<string | null>(null);

  onMount(() => {
    const url = new URL(page.url);
    if (url.searchParams.has("error")) {
      error = url.searchParams.get("error")!;
      url.searchParams.delete("error");
      goto(url, { replaceState: true });
    }
  });
</script>

<!-- Login with Google -->
<div class="absolute top-0 right-0 bottom-0 left-0 flex flex-col items-center justify-center gap-4">
  {#if error}
    <div class="dy-alert dy-alert-error dy-alert-vertical w-xs justify-center px-8">
      <div>
        <strong>{error}</strong>
      </div>
      <a href="/" class="dy-btn dy-btn-outline">
        <ChevronLeft class="size-4" />
        Back
      </a>
    </div>
  {/if}

  <form method="POST" action="?/login">
    <button
      type="submit"
      class="dy-btn dy-btn-lg gap-2 bg-white px-4 text-black hover:bg-[#3b3b3b] hover:text-white"
    >
      <svg
        aria-label="Google logo"
        width="16"
        height="16"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        class="block size-8"
      >
        <g>
          <path d="m0 0H512V512H0" fill="transparent"></path>
          <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path>
          <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path>
          <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
          <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path>
        </g>
      </svg>
      Login with Google
    </button>
  </form>
</div>
