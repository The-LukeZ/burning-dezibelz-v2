<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  type Props = {
    class?: ClassValue;
  };

  let { class: className = "" }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
>
  <!-- Icon from Material Line Icons by Vjacheslav Trushkin - https://github.com/cyberalien/line-md/blob/master/license.txt -->
  <g
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="1.5"
    color="currentColor"
  >
    <circle cx="12" cy="12" r="10" />
    <path
      d="M7.5 12.069c1.1-.37 2.276-.569 3.5-.569c2.024 0 3.92.547 5.549 1.5M18 10c-1.85-1.262-4.088-2-6.5-2c-1.597 0-3.118.324-4.5.908M15.129 16a9.04 9.04 0 0 0-6.497-.685"
    />
  </g>
</svg>
