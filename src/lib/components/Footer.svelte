<script lang="ts">
  import { page } from "$app/state";
  import dayjs from "dayjs";
  import Modal from "./Modal.svelte";
  import Instagram from "../assets/social/Instagram.svelte";
  import Youtube from "../assets/social/Youtube.svelte";

  const footerItems = [
    {
      title: "Navigation",
      items: [
        { label: "Home", href: "/" },
        { label: "Konzerte", href: "/konzerte" },
        { label: "Über uns", href: "/ueber-uns" },
        { label: "Kontakt", href: "/kontakt" },
        { label: "Gallerie", href: "/gallerie" },
        { label: "Setlist", href: "/setlist" },
        { label: "Impressum", href: "/impressum" },
        { label: "Intern", href: "/dash/login" },
      ],
    },
    {
      title: "Links",
      items: [
        { label: "Instagram", href: "https://www.instagram.com/burning_dezibelz", icon: Instagram },
        { label: "YouTube", href: "https://www.youtube.com/@BurningDezibelz", icon: Youtube },
      ],
    },
  ];

  let alertOpen = $state(false);
</script>

<div class="footer-container bg-base-200 text-base-content p-14">
  <footer class="dy-footer md:dy-footer-horizontal">
    {#each footerItems as section}
      <nav>
        <h6 class="dy-footer-title">{section.title}</h6>
        {#each section.items as item}
          <a
            href={item.href}
            class="dy-link dy-link-hover items-center"
            target={item.href[0] == "/" ? "_self" : "_blank"}
          >
            {#if "icon" in item}
              <item.icon class="mr-1 inline-block" />
            {/if}
            {item.label}
          </a>
        {/each}
      </nav>
    {/each}
    <aside>
      <img src="/favicon.png" alt="Burning Dezibelz Logo" class="mb-4 size-16 drop-shadow-md" />
      <p>
        Copyright © {dayjs(page.data.currentISODate).year()} - Alle Rechte vorbehalten.
      </p>
    </aside>
  </footer>
</div>

<Modal bind:open={alertOpen} class="w-64">
  <div class="dy-alert dy-alert-error mt-10 w-full">
    <p>
      Sorry, dieses Social Media Profil ist noch in Arbeit...<br />Schau doch bald mal wieder vorbei!
    </p>
  </div>
</Modal>

<style>
  .footer-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    box-shadow: 0 -30px 30px -10px rgba(0, 0, 0, 0.33);
  }

  footer {
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
