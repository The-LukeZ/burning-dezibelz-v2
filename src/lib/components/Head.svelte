<script lang="ts">
  /**
   * SEO configuration options for a web page.
   * Covers basic SEO, Open Graph, and Twitter Cards requirements.
   * Use this interface to define the SEO configuration for a webpage,
   * including meta tags and social media properties.
   * The properties in this interface can be used to generate the
   * necessary HTML meta tags.
   *
   * Adapted from https://github.com/spences10/svead
   */
  export interface SeoConfig {
    /**
     * The title of the web page.
     * Used in the <title> tag, og:title, and twitter:title properties.
     *
     * @type {string}
     */
    title: string;

    /**
     * The description of the web page.
     * Used in the description meta tag, og:description, and
     * twitter:description properties.
     *
     * Best practices suggest keeping the description between 50-160 characters.
     * Search engines may truncate descriptions longer than 155-160 characters.
     *
     * Note: The Head component does not enforce these limits,
     * it's up to the developer to ensure appropriate length.
     *
     * @type {string}
     */
    description: string;

    /**
     * The URL of the web page.
     * Used as the og:url property and twitter:url.
     *
     * @type {string}
     */
    url: string;

    /**
     * The website to which the web page belongs.
     * Used as twitter:domain.
     *
     * @type {string}
     */
    website?: string;

    /**
     * The language of the web page.
     * Used as the og:locale property.
     * Defaults to 'en'.
     *
     * @type {string}
     * @default 'en'
     */
    language?: string;

    /**
     * The URL of the Open Graph image for the web page.
     * Used as the og:image and twitter:image properties.
     *
     * @type {string}
     */
    open_graph_image?: string;

    /**
     * The payment pointer for Web Monetization.
     * Used in the monetization meta tag.
     *
     * @type {string}
     */
    payment_pointer?: string;

    /**
     * The name of the author of the web page.
     * Used in the author meta tag.
     *
     * @type {string}
     */
    author_name?: string;

    /**
     * The name of the site.
     * Used as the og:site_name property.
     *
     * @type {string}
     */
    site_name?: string;

    /**
     * The Twitter handle of the content creator or site.
     * Used as the twitter:creator property.
     * Should include the @ symbol.
     *
     * @type {string}
     */
    twitter_handle?: string;

    /**
     * The type of Twitter card to use.
     * Used as the twitter:card property.
     * Defaults to 'summary_large_image'.
     *
     * @type {'summary' | 'summary_large_image' | 'app' | 'player'}
     * @default 'summary_large_image'
     */
    twitter_card_type?: "summary" | "summary_large_image" | "app" | "player";

    /**
     * Alternative text for the Open Graph image.
     * Used as the og:image:alt property.
     *
     * @type {string}
     */
    open_graph_image_alt?: string;
  }

  const { seo_config }: { seo_config: SeoConfig } = $props();
</script>

<svelte:head>
  <link rel="canonical" href={seo_config.url} />

  <!-- Basic Meta Tags -->
  <title>{seo_config.title}</title>
  <meta name="title" content={seo_config.title} />
  <meta name="description" content={seo_config.description} />

  {#if seo_config.author_name}
    <meta name="author" content={seo_config.author_name} />
  {/if}

  <!-- Open Graph / Facebook Meta Tags -->
  <meta property="og:url" content={seo_config.url} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={seo_config.title} />
  <meta property="og:description" content={seo_config.description} />
  {#if seo_config.open_graph_image}
    <meta property="og:image" content={seo_config.open_graph_image} />
    <meta property="og:image:alt" content={seo_config.open_graph_image_alt || seo_config.title} />
  {/if}
  {#if seo_config.site_name}
    <meta property="og:site_name" content={seo_config.site_name} />
  {/if}

  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content={seo_config.twitter_card_type || "summary_large_image"} />
  <meta name="twitter:title" content={seo_config.title} />
  <meta name="twitter:description" content={seo_config.description} />
  {#if seo_config.open_graph_image}
    <meta name="twitter:image" content={seo_config.open_graph_image} />
  {/if}
  {#if seo_config.twitter_handle}
    <meta name="twitter:creator" content={seo_config.twitter_handle} />
  {/if}
  {#if seo_config.website}
    <meta property="twitter:domain" content={seo_config.website} />
    <meta property="twitter:url" content={seo_config.url} />
  {/if}

  <!-- Additional Structured Data -->
  <meta itemprop="name" content={seo_config.title} />
  <meta itemprop="description" content={seo_config.description} />
  {#if seo_config.open_graph_image}
    <meta itemprop="image" content={seo_config.open_graph_image} />
  {/if}

  <!-- Monetisation -->
  {#if seo_config.payment_pointer}
    <meta name="monetization" content={seo_config.payment_pointer} />
  {/if}

  <!-- Language -->
  {#if seo_config.language}
    <meta property="og:locale" content={seo_config.language} />
  {/if}
</svelte:head>
