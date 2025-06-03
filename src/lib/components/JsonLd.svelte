<!--
/**
 * Adapted from 
 */
-->

<script lang="ts">
  import type { Thing, WithContext, Graph } from "schema-dts";

  interface JsonLdOptions {
    /** Adds indentation, white space, and line break characters to JSON-LD output. {@link JSON.stringify} */
    space?: string | number;
  }

  interface Props {
    /**
     * The JSON-LD item to include in the script tag.
     * This can be a `Graph` or a `WithContext<Thing>`.
     */
    item: Graph | WithContext<Thing>;
    /**
     * Optional JSON.stringify options.
     * This can be used to format the JSON-LD output to be more readable.
     */
    space?: number;
  }

  let { item, space }: Props = $props();

  type JsonValueScalar = string | boolean | number;
  type JsonValue = JsonValueScalar | Array<JsonValue> | { [key: string]: JsonValue };
  type JsonReplacer = (_: string, value: JsonValue) => JsonValue | undefined;

  const ESCAPE_ENTITIES = Object.freeze({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  });
  const ESCAPE_REGEX = new RegExp(`[${Object.keys(ESCAPE_ENTITIES).join("")}]`, "g");
  const ESCAPE_REPLACER = (t: string): string => ESCAPE_ENTITIES[t as keyof typeof ESCAPE_ENTITIES];

  /**
   * A replacer for JSON.stringify to strip JSON-LD of illegal HTML entities
   * per https://www.w3.org/TR/json-ld11/#restrictions-for-contents-of-json-ld-script-elements
   */
  const safeJsonLdReplacer: JsonReplacer = (() => {
    // Replace per https://www.w3.org/TR/json-ld11/#restrictions-for-contents-of-json-ld-script-elements
    // Solution from https://stackoverflow.com/a/5499821/864313
    return (_: string, value: JsonValue): JsonValue | undefined => {
      switch (typeof value) {
        case "object":
          // Omit null values.
          if (value === null) {
            return undefined;
          }

          return value; // JSON.stringify will recursively call replacer.
        case "number":
        case "boolean":
        case "bigint":
          return value; // These values are not risky.
        case "string":
          return value.replace(ESCAPE_REGEX, ESCAPE_REPLACER);
        default: {
          // We shouldn't expect other types.
          isNever(value);

          // JSON.stringify will remove this element.
          return undefined;
        }
      }
    };
  })();

  // Utility: Assert never
  function isNever(_: never): void {}

  /**
   * Produces necessary props for a script tag that includes JSON-LD.
   */
  function processJsonLd(item: Graph | WithContext<Thing>, options: JsonLdOptions = {}) {
    return JSON.stringify(item, safeJsonLdReplacer, options.space);
  }

  /**
   * Produces a Helmet-style script prop for a given JSON-LD datum.
   */
  export function helmetJsonLdProp(
    item: WithContext<Thing> | Graph,
    options: JsonLdOptions = {},
  ): {
    type: "application/ld+json";
    innerHTML: string;
  } {
    return {
      type: "application/ld+json" as const,
      innerHTML: JSON.stringify(item, safeJsonLdReplacer, options.space),
    };
  }

  const processed_schema = processJsonLd(item, { space });

  const jsonLdData = `<script type="application/ld+json">${processed_schema}</scr` + `ipt>`;
</script>

<!--
Component that inline-includes a JSON-LD script where specified.

Usage example:
<JsonLd 
  item={{
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Grace Hopper",
    alternateName: "Grace Brewster Murray Hopper",
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: ["Yale University", "Vassar College"]
    },
    knowsAbout: ["Compilers", "Computer Science"]
  }}
  space={2}
/>
-->

<svelte:head>
  {@html jsonLdData}
</svelte:head>
