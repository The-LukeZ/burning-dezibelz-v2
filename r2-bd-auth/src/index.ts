// Cloudflare Worker Script for Authenticated R2 Image Access

/**
 * Authenticates the request based on a Bearer token.
 * @param request The incoming request object.
 * @param env The environment object containing secrets and bindings.
 * @returns True if authenticated, false otherwise.
 */
function authenticated(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  return token === env.IMG_TOKEN;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    // 1. Authenticate the request
    const isAuthenticated = authenticated(request, env);
    if (!isAuthenticated) {
      return new Response("Unauthorized: Invalid or missing API token.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Bearer realm="R2 Images"' },
      });
    }

    // 2. Only allow GET requests for images
    if (request.method !== "GET") {
      return new Response("Method Not Allowed. Only GET requests are permitted.", { status: 405 });
    }

    // 3. Extract the image key from the URL path
    const url = new URL(request.url);
    let imageKey = url.pathname;

    // Remove leading slash if present (pathname usually starts with /)
    if (imageKey.startsWith("/")) {
      imageKey = imageKey.substring(1);
    }

    // IMPORTANT: Adjust this prefix based on your Worker's route configuration.
    // If your Worker route is `yourdomain.com/secure-images/*`, and you want
    // `yourdomain.com/secure-images/foo.jpg` to map to `foo.jpg` in R2,
    // then set `routePrefixToRemove` to `secure-images/`.
    // If your route is `images.yourdomain.com/*` and you want `images.yourdomain.com/foo.jpg`
    // to map to `foo.jpg` in R2, then `routePrefixToRemove` should be empty or not used,
    // assuming `imageKey` directly matches the R2 object key.
    const routePrefixToRemove: string = "images/"; // Example: "secure-images/"
    if (routePrefixToRemove && imageKey.startsWith(routePrefixToRemove)) {
      imageKey = imageKey.substring(routePrefixToRemove.length);
    }

    if (!imageKey) {
      return new Response("Bad Request: Image name not specified in the path.", { status: 400 });
    }

    // 4. Fetch directly from R2 (caching handled by SvelteKit app)
    if (!env.R2_BUCKET) {
      console.error("[Worker Error] R2 bucket binding 'R2_BUCKET' is not configured in Worker settings.");
      return new Response("Internal Server Error: Storage backend not configured.", { status: 500 });
    }

    const object = await env.R2_BUCKET.get(imageKey);

    if (object === null) {
      return new Response("Not Found: The requested image does not exist.", { status: 404 });
    }

    // 5. Construct the response from the R2 object
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    // Simple cache headers - let your SvelteKit app handle the heavy caching
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(object.body, {
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
