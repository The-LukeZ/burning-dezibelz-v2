export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cache = caches.default;

    // Cache-Key basierend auf URL
    const cacheKey = new Request(url.toString());
    let response = await cache.match(cacheKey);

    if (response) {
      return response;
    }

    // R2 Object abrufen
    const objectKey = url.pathname.slice(1);
    const object = await env.R2_BUCKET.get(objectKey);

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    response = new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
        ETag: object.etag,
        "Access-Control-Allow-Origin": "https://burningdezibelz.de",
      },
    });

    // In Cache speichern
    await cache.put(cacheKey, response.clone());
    return response;
  },
};
