<script lang="ts">
  import Head from "$lib/components/Head.svelte";
  import SiteHeader from "$lib/components/SiteHeader.svelte";

  let mailData = $state({
    subject: "",
    body: "",
  });
</script>

<Head
  seo_config={{
    title: "Kontakt | Burning Dezibelz",
    description: "Kontaktiere uns über dieses Formular.",
    url: "https://burningdezibelz.de/kontakt",
    author_name: "Burning Dezibelz",
    language: "de",
  }}
/>

<SiteHeader title={"Kontakt"} />
<p class="text-base-content/65 mx-auto mb-2 text-center text-sm">Kontaktiere uns hier!</p>

<div class="grid place-items-center px-3 py-7">
  <form
    class="flex w-full max-w-[700px] flex-col items-center"
    onsubmit={(e) => {
      e.preventDefault();
      open(
        `mailto:burningdezibelz@gmail.com?${new URLSearchParams({
          subject: mailData.subject,
          body: mailData.body,
        }).toString()}`,
        "_blank",
      );
    }}
  >
    <input
      {@attach (e) => e.focus({ preventScroll: true })}
      type="text"
      class="dy-input mb-[3px] w-full font-semibold text-white"
      style="font-family: Poppins, sans-serif;"
      placeholder="Betreff"
      bind:value={mailData.subject}
      required
    />
    <textarea
      class="dy-textarea mt-[3px] h-72 w-full resize-none font-sans text-white"
      style="font-family: Poppins, sans-serif;"
      placeholder="Deine Nachricht"
      bind:value={mailData.body}
      required
    ></textarea>
    <button type="submit" class="dy-btn dy-btn-primary dy-btn-soft dy-btn-wide mt-5"> Senden </button>
  </form>
</div>
