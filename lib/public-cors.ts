const pagesOrigin = "https://duduwwl.github.io";
function allowed(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const local = ["localhost","127.0.0.1"].includes(url.hostname);
  return !origin || origin === url.origin || origin === pagesOrigin || (local && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
}
export async function publicCors(request: Request, handler: () => Promise<Response>) {
  if (!allowed(request)) return Response.json({error:"Origem não autorizada."},{status:403});
  const response = request.method === "OPTIONS" ? new Response(null,{status:204}) : await handler();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control","no-store");
  headers.set("Vary","Origin");
  const origin = request.headers.get("origin");
  if (origin) {
    headers.set("Access-Control-Allow-Origin",origin);
    headers.set("Access-Control-Allow-Methods","GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers","Content-Type");
    headers.set("Access-Control-Max-Age","600");
  }
  return new Response(response.body,{status:response.status,headers});
}
