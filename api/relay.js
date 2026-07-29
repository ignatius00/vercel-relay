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

  const targetUrl = new URL(targetBase);
  const reqUrl = new URL(req.url);

  // If incoming path is not root and target doesn't already specify a path, append incoming path
  let finalPath = targetUrl.pathname;
  if (reqUrl.pathname !== "/" && reqUrl.pathname !== "") {
    if (finalPath.endsWith("/")) {
      finalPath = finalPath.slice(0, -1);
    }
    if (finalPath.endsWith("/v1") && reqUrl.pathname.startsWith("/v1")) {
      finalPath = finalPath + reqUrl.pathname.substring(3);
    } else {
      finalPath = finalPath + reqUrl.pathname;
    }
  }

  targetUrl.pathname = finalPath;
  targetUrl.search = reqUrl.search;

  const headers = new Headers(req.headers);
  headers.delete("x-relay-target");
  headers.delete("host");

  try {
    return await fetch(targetUrl.toString(), {
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
