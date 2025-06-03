<script lang="ts">
  import { markdownToHtml } from "$lib";
  import Facebook from "$lib/assets/social/Facebook.svelte";
  import Globe from "$lib/assets/social/Globe.svelte";
  import Instagram from "$lib/assets/social/Instagram.svelte";
  import Spotify from "$lib/assets/social/Spotify.svelte";
  import Youtube from "$lib/assets/social/Youtube.svelte";
  import ContentContainer from "$lib/components/ContentContainer.svelte";
  import type { SeoConfig } from "$lib/components/Head.svelte";
  import Head from "$lib/components/Head.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import AboutSchemaOrg from "$lib/components/SchemaOrgs/About.svelte";

  let { data } = $props();
  let bandMembers = $derived<BandMember[]>(data.members);

  const memberSelection = $state<{
    open: boolean;
    member: BandMember | null;
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

  const seo_config: SeoConfig = {
    title: "Über Uns | Burning Dezibelz",
    description:
      "Entdecke die Burning Dezibelz, eine junge Rock- und Metal-Band aus Zwickau. Konzerte, Musik, Gallerie und mehr!",
    url: "https://burningdezibelz.de",
    author_name: "Burning Dezibelz",
    language: "de",
    open_graph_image: "https://burningdezibelz.de/band_bild_2025-05-28.jpg",
    open_graph_image_alt: "Burning Dezibelz Banner",
    site_name: "Burning Dezibelz",
    twitter_card_type: "summary_large_image",
    website: "https://burningdezibelz.de",
  };
</script>

<Head {seo_config} />
<AboutSchemaOrg />

<ContentContainer>
  <section class="flex flex-col-reverse items-center justify-center gap-4 lg:flex-row">
    <div class="max-w-2xl text-center">
      <h2 class="text-base-content">Über uns</h2>
      {#each data.about as line}
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
            <h2 class="dy-card-title text-primary mb-2 text-lg font-bold">
              {member.shortName}
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
                Mehr lesen
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>
</ContentContainer>

{#snippet memberLinks(member: BandMember, mobile: boolean = false)}
  {#if member.links?.length}
    <div class={mobile ? "inline-flex sm:hidden" : "hidden sm:inline-flex"}>
      {#each member.links as link}
        <div class="dy-tooltip dy-tooltip-bottom dy-tooltip-secondary duration-100" data-tip={link.text}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:text-secondary inline-flex rounded-full p-2 transition-colors hover:bg-white/10"
            aria-label="Link zu {link.text}"
          >
            {#if link.type === "youtube"}
              <Youtube />
            {:else if link.type === "facebook"}
              <Facebook />
            {:else if link.type === "instagram"}
              <Instagram />
            {:else if link.type === "spotify"}
              <Spotify />
            {:else}
              <Globe />
            {/if}
          </a>
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

<Modal
  bind:open={memberSelection.open}
  onClose={() => {
    memberSelection.member = null;
  }}
  class="w-full max-w-4xl space-y-4"
  closeOnBackdropClick={true}
  closeOnEscape={true}
  withXButton={true}
>
  {#if memberSelection.member}
    <!-- Modal Header -->
    <div class="flex items-center gap-4">
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
        <div class="inline-flex gap-3">
          <h3 class="text-primary text-3xl font-bold">
            {memberSelection.member.shortName}
          </h3>
          {@render memberLinks(memberSelection.member, false)}
        </div>
        <div class="mt-2 flex gap-2">
          {#each memberSelection.member.roles as role}
            <span class="dy-badge dy-badge-primary dy-badge-sm">
              {role}
            </span>
          {/each}
        </div>
      </div>
    </div>

    {@render memberLinks(memberSelection.member, true)}

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
