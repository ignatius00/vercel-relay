export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const targetBase = req.headers.get("x-relay-target");
  if (!targetBase) {
    return new Response(JSON.stringify({ error: "Missing x-relay-target header" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const url = new URL(req.url);

  // Clean target base and pathname to prevent double slashes or trailing slash 404s
  const cleanBase = targetBase.replace(/\/+$/, "");
  const cleanPath = url.pathname === "/" ? "" : url.pathname;
  const destinationUrl = `${cleanBase}${cleanPath}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("x-relay-target");
  headers.delete("host");

  try {
    return await fetch(destinationUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : null,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }
}
