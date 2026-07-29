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

  // Parse raw target URL string cleanly
  let rawTarget = targetBase.trim();
  
  // Strip trailing slashes
  while (rawTarget.endsWith("/")) {
    rawTarget = rawTarget.slice(0, -1);
  }

  const reqUrl = new URL(req.url);
  let extraPath = reqUrl.pathname;
  if (extraPath === "/") {
    extraPath = "";
  }

  // If target URL already contains full endpoint path (e.g. /v1/chat/completions), don't append extra pathname
  if (rawTarget.includes("/chat/completions") || rawTarget.includes("/messages")) {
    extraPath = "";
  } else if (rawTarget.endsWith("/v1") && extraPath.startsWith("/v1/")) {
    extraPath = extraPath.substring(3);
  }

  const finalUrl = rawTarget + extraPath + reqUrl.search;

  const headers = new Headers(req.headers);
  headers.delete("x-relay-target");
  headers.delete("host");

  try {
    return await fetch(finalUrl, {
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
