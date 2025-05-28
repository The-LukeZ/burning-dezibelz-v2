<script lang="ts">
  import { markdownToHtml } from "$lib";
  import ContentContainer from "$lib/components/ContentContainer.svelte";
  import Modal from "$lib/components/Modal.svelte";

  let { data } = $props();
  let aboutUs = $derived(data.about.map((s) => markdownToHtml(s)));
  let bandMembers = $derived(
    data.members.map((m) => ({
      ...m,
      bio: m.bio.map((s) => markdownToHtml(s)),
    })),
  );

  const memberSelection = $state<{
    open: boolean;
    member: any;
  }>({
    open: false,
    member: null,
  });

  function toggleBio(memberId: string) {
    if (memberSelection.open && memberSelection.member?.id === memberId) {
      memberSelection.open = false;
      memberSelection.member = bandMembers.find((m) => m.id === memberId)!;
    } else {
      memberSelection.open = true;
      memberSelection.member = bandMembers.find((m) => m.id === memberId)!;
    }
  }
</script>

<ContentContainer>
  <section class="dy-prose flex flex-col-reverse items-center justify-center gap-4 lg:flex-row">
    <div class="max-w-2xl text-center">
      <h2>Über uns</h2>
      {#each aboutUs as line}
        <p>{@html line}</p>
      {/each}
      <a href="/setlist" class="dy-link dy-link-primary">Erfahre mehr über unsere Setlist.</a>
    </div>
    <aside class="h-fit max-w-xl overflow-hidden rounded-md shadow-lg">
      <img src="/band_bild_2025-05-28.jpg" alt="Bandfoto" />
    </aside>
  </section>

  <section>
    <h2 class="text-primary mb-16 text-center font-bold">Bandmitglieder</h2>
    <!-- Members Grid -->
    <div class="members-grid gap-8">
      {#each bandMembers as member (member.id)}
        <div
          class="dy-card bg-secondary/55 transform shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
          <!-- Member Image -->
          <figure class="member-image-container relative overflow-hidden">
            <div class="aspect-square w-full">
              <img
                src={member.image || "/placeholder.svg"}
                alt={member.name}
                class="member-image h-full w-full object-cover transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <!-- Overlay with roles -->
            <div class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div class="flex flex-wrap gap-1">
                {#each member.roles as role}
                  <span class="dy-badge dy-badge-primary dy-badge-sm text-xs font-medium">
                    {role}
                  </span>
                {/each}
              </div>
            </div>
          </figure>

          <!-- Member Info -->
          <div class="dy-card-body p-6">
            <h2 class="dy-card-title text-primary mb-2 text-2xl font-bold">
              {member.name}
            </h2>

            <!-- Bio Preview -->
            <div class="text-base-content/80 mb-4">
              <p class="line-clamp-3 text-sm leading-relaxed">
                {@html markdownToHtml(member.bio[0].substring(0, 120) + "...")}
              </p>
            </div>

            <!-- Expand Button -->
            <div class="dy-card-actions mt-auto justify-center">
              <button
                class="dy-btn dy-btn-primary dy-btn-sm w-full"
                onclick={() => toggleBio(member.id)}
                aria-expanded={memberSelection.open && memberSelection.member?.id === member.id}
                aria-controls="bio-{member.id}"
              >
                {memberSelection.open ? "Weniger anzeigen" : "Mehr erfahren"}
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>
</ContentContainer>

<Modal
  bind:open={memberSelection.open}
  onOpenChange={(open) => {
    if (!open) {
      memberSelection.member = null;
    }
  }}
  class="w-full max-w-4xl"
  closeOnBackdropClick={true}
  closeOnEscape={true}
  withXButton={true}
>
  {#if memberSelection.member}
    <!-- Modal Header -->
    <div class="mb-6 flex items-center gap-4">
      <div class="dy-avatar">
        <div class="h-16 w-16 rounded-full">
          <img
            src={memberSelection.member.image || "/placeholder.svg"}
            alt={memberSelection.member.name}
            class="h-full w-full object-cover"
          />
        </div>
      </div>
      <div>
        <h3 class="text-primary text-3xl font-bold">
          {memberSelection.member.name}
        </h3>
        <div class="mt-1 flex gap-2">
          {#each memberSelection.member.roles as role}
            <span class="dy-badge dy-badge-primary dy-badge-sm">
              {role}
            </span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Full Bio -->
    <div class="dy-prose max-h-[60vh] max-w-none overflow-y-auto">
      {#each memberSelection.member.bio as paragraph}
        <p class="text-base-content mb-4 leading-relaxed">
          {@html markdownToHtml(paragraph)}
        </p>
      {/each}
    </div>
  {/if}
</Modal>

<style>
  section {
    width: 100%;
    padding: 2rem;
    &:not(:last-child) {
      margin-bottom: 2rem;
    }

    h2 {
      font-weight: bold;
      font-size: var(--text-3xl);
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    p:not(:last-child) {
      margin-bottom: 0.7rem;
    }
  }

  .members-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;

    > * {
      flex: 0 1 260px;
    }
  }

  .member-image-container:hover .member-image {
    transform: scale(1.05);
  }
</style>
