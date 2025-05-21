<script>
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
</script>

<h1>Moin {page.data.user?.user_metadata.name}</h1>

<button class="dy-btn dy-btn-error dy-btn-dash border-2" onclick={() => goto("/dash/logout")}>Logout</button>
