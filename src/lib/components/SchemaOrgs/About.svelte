<script lang="ts">
  import JsonLd from "../JsonLd.svelte";

  const schema_org: SchemaOrgSchema = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    "@id": "https://burningdezibelz.de",
    name: "Burning Dezibelz",
    url: "https://burningdezibelz.de",
    genre: "Rock, Metal",
    email: "burningdezibelz@gmail.com",
    description:
      "Entdecke die Burning Dezibelz, eine junge Rock- und Metal-Band aus Zwickau. Konzerte, Musik, Gallerie und mehr!",
    image: "https://burningdezibelz.de/burningdezibelz-banner.webp",
    sameAs: ["https://www.youtube.com/@BurningDezibelz", "https://www.instagram.com/burning_dezibelz"],
    logo: {
      "@type": "ImageObject",
      url: "https://burningdezibelz.de/favicon.png",
      width: "512",
      height: "512",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://burningdezibelz.de",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "burningdezibelz@gmail.com",
      contactType: "Kontakt",
      url: "https://burningdezibelz.de/kontakt",
    },
    areaServed: "DE",
    foundingDate: "2023-12-23",
    members: [
      {
        "@type": "Person",
        name: "Jan",
        jobTitle: "Gitarrist, Sänger",
        familyName: "Mehlhorn",
        givenName: "Jan",
        image: "https://burningdezibelz.de/members/jan.jpg",
      },
      {
        "@type": "Person",
        name: "Maikel Dee",
        jobTitle: "Gitarrist, Sänger",
        familyName: "Dörste",
        givenName: "Michael",
        callSign: "Micha",
        additionalName: "Maikel Dee",
        image: "https://burningdezibelz.de/members/micha.jpg",
      },
      {
        "@type": "Person",
        name: "Robert",
        jobTitle: "Bassist, Sänger",
        familyName: "Hertel",
        givenName: "Robert",
        image: "https://burningdezibelz.de/members/robert.jpg",
      },
      {
        "@type": "Person",
        name: "Luca",
        jobTitle: "Schlagzeuger",
        familyName: "Hentschel",
        givenName: "Luca",
        image: "https://burningdezibelz.de/members/luca.jpg",
        birthDate: "2004-11-24",
      },
    ],
  };
</script>

<JsonLd item={schema_org} />
