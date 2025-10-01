import { serve, file } from "bun";

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".woff2": "font/woff2"
};

serve({
    port:3000,
    fetch(req) {
        const url = new URL(req.url) 
        let pathname = url.pathname == "/" ? "/index.html" : url.pathname
        if (pathname.endsWith("/")) pathname = pathname + "index.html";
        const ext = pathname.slice(pathname.lastIndexOf("."))
        try {
            return new Response(file(`./public${pathname}`), {
                headers: { "Content-Type": MIME[ext] ?? "application/octet-stream"}
            })
        } catch {
            return new Response("Not found", {status: 404})
        }
    }
})

console.log("Static dev server: http://localhost:3000")