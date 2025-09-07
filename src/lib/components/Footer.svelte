<script lang="ts">
  import { version } from "$app/environment";
  import { page } from "$app/state";
  import dayjs from "dayjs";
  import Instagram from "../assets/social/Instagram.svelte";
  import Youtube from "../assets/social/Youtube.svelte";
  console.log(version);

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
        { label: "Intern", href: "/intern/login" },
      ],
    },
    {
      title: "Links",
      items: [
        { label: "Instagram", href: "https://www.instagram.com/burning_dezibelz", icon: Instagram },
        { label: "YouTube", href: "https://www.youtube.com/@BurningDezibelz", icon: Youtube },
      ],
    },
    {
      title: "Rechtliches",
      items: [
        { label: "Datenschutz", href: "/datenschutz" },
        { label: "Impressum", href: "/impressum" },
      ],
    },
  ];
</script>

<div class="footer-container bg-base-300 text-base-content mt-auto px-10 py-5">
  <footer class="dy-footer dy-footer-horizontal bg-base-300 dy-footer-center p-1">
    <!-- Made by Luca -->
    <aside>
      <a
        href="https://github.com/The-LukeZ"
        target="_blank"
        class="un text-primary w-full cursor-pointer text-center italic no-underline transition hover:opacity-80"
      >
        Seite erstellt von Luca
      </a>
    </aside>
  </footer>
  <div class="dy-divider my-2"></div>
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
      <p class="text-xs text-gray-500">
        Version {version.replace(/"/gi, "")}
      </p>
    </aside>
  </footer>
</div>

<style>
  .footer-container {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    box-shadow: 0 -30px 30px -10px rgba(0, 0, 0, 0.33);

    > * {
      max-width: 1200px;
      width: 100%;
      margin-inline: auto;
    }
  }
</style>
