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
  while (rawTarget.endsWith("/")) {
    rawTarget = rawTarget.slice(0, -1);
  }

  // Use URL object constructor to strictly manipulate origin + path
  const targetObj = new URL(rawTarget);
  const reqObj = new URL(req.url);

  let path = targetObj.pathname;
  if (path === "/") {
    path = "";
  }

  let reqPath = reqObj.pathname;
  if (reqPath === "/") {
    reqPath = "";
  }

  // Combine paths
  let combinedPath = path;
  if (reqPath) {
    if (path.endsWith("/v1") && reqPath.startsWith("/v1/")) {
      combinedPath = path + reqPath.substring(3);
    } else if (!path.includes("/chat/completions") && !path.includes("/messages")) {
      combinedPath = path + reqPath;
    }
  }

  const finalDestination = `${targetObj.origin}${combinedPath}${reqObj.search}`;

  const headers = new Headers(req.headers);
  headers.delete("x-relay-target");
  headers.delete("host");

  try {
    return await fetch(finalDestination, {
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
