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
  
  // Strip trailing slashes from target Base
  const cleanBase = targetBase.replace(/\/+$/, "");
  
  // If targetBase already ends with /v1 and pathname starts with /v1, strip duplicate /v1
  let cleanPath = url.pathname === "/" ? "" : url.pathname;
  if (cleanBase.endsWith("/v1") && cleanPath.startsWith("/v1/")) {
    cleanPath = cleanPath.substring(3);
  }

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
