declare const __GITHUB_PAGES__: boolean;
export const onGitHubPages = typeof __GITHUB_PAGES__ !== "undefined" && __GITHUB_PAGES__;
export const apiOrigin = "https://studio-perola-leite.duducraft11.chatgpt.site";
export const siteHref = (path: string) => onGitHubPages ? `/studio-perola-leite${path === "/" ? "/" : path + "/"}` : path;

let adminWindow: Window | null = null;
let adminReady = false;
let adminListenerInstalled = false;
const pending = new Map<string, {resolve: (response: Response) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>}>();

export function connectAdmin(onReady: (email: string) => void, onError: (message: string) => void) {
  adminReady = false;
  if (!adminListenerInstalled) {
    window.addEventListener("message", event => {
      if (event.origin !== apiOrigin || event.source !== adminWindow || event.data?.channel !== "perola-admin") return;
      const message = event.data;
      if (message.type === "response" && typeof message.id === "string") {
        const item = pending.get(message.id);
        if (!item) return;
        clearTimeout(item.timer); pending.delete(message.id);
        item.resolve(new Response(JSON.stringify(message.body), {status: message.status, headers: {"content-type":"application/json"}}));
      }
    });
    adminListenerInstalled = true;
  }
  const listener = (event: MessageEvent) => {
    if (event.origin !== apiOrigin || event.source !== adminWindow || event.data?.channel !== "perola-admin") return;
    if (event.data.type === "ready") {adminReady = true; onReady(event.data.email); window.removeEventListener("message", listener)}
    if (event.data.type === "denied") {onError("Esta conta não está autorizada a administrar o Studio."); window.removeEventListener("message", listener)}
  };
  window.addEventListener("message", listener);
  adminWindow = window.open(`${apiOrigin}/admin/bridge`, "perola-admin", "popup,width=560,height=680");
  if (!adminWindow) {window.removeEventListener("message", listener); onError("Permita a janela de login para entrar na administração.")}
  return () => window.removeEventListener("message", listener);
}

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  if (!onGitHubPages) return fetch(path, options);
  if (path.startsWith("/api/admin")) {
    if (!adminReady || !adminWindow || adminWindow.closed) return Promise.reject(new Error("Reconecte sua conta para acessar a administração."));
    const id = crypto.randomUUID();
    return new Promise((resolve,reject) => {
      const timer = setTimeout(() => {pending.delete(id);reject(new Error("A conexão com a administração demorou. Tente novamente."))},30000);
      pending.set(id,{resolve,reject,timer});
      adminWindow!.postMessage({channel:"perola-admin",type:"request",id,path,method:options?.method??"GET",body:options?.body??null},apiOrigin);
    });
  }
  return fetch(apiOrigin + path, {...options,credentials:"omit"});
}
