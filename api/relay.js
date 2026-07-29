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

  let rawTarget = targetBase.trim();
  while (rawTarget.endsWith("/")) {
    rawTarget = rawTarget.slice(0, -1);
  }

  const reqObj = new URL(req.url);
  let reqPath = reqObj.pathname;
  if (reqPath === "/") {
    reqPath = "";
  }

  let finalUrl = rawTarget;
  if (reqPath) {
    if (rawTarget.endsWith("/v1") && reqPath.startsWith("/v1/")) {
      finalUrl = rawTarget + reqPath.substring(3);
    } else if (!rawTarget.includes("/chat/completions") && !rawTarget.includes("/messages")) {
      finalUrl = rawTarget + reqPath;
    }
  }
  finalUrl += reqObj.search;

  const targetParsed = new URL(finalUrl);

  const headers = new Headers(req.headers);
  headers.delete("x-relay-target");
  headers.set("Host", targetParsed.host);

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
