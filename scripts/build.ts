// DONE: Fetch posts
// DONE: Render each post
// DONE: Render the blog index
// DONE: Separate load template function
// KILL: Copy default pages (e.g. index.html, about.html) to public/ 

import { readFile, writeFile, mkdir, cp } from "node:fs/promises"
import { join } from "node:path";


type Post = {
  id: string;
  title: string;
  slug: string;
  content_html: string;
  published_at: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1)
}

const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: "application/json" 
}

const POST_URL = `${SUPABASE_URL}/rest/v1/blogs?select=title,slug,content_html,published_at&order=published_at.desc`

async function fetchPosts(): Promise<Post[]> {
    const resp = await fetch(POST_URL, { headers })
    if (!resp.ok) throw new Error(`Supabase fetch failed ${resp.status}`)
    return (await resp.json()) as Post[]
}

async function loadTemplates() {

    let postTpl: string
    let indexTpl: string

    try {
        postTpl = await readFile("src/templates/post.html", "utf-8")
    } catch {
        postTpl = ""
    }

    try {
        indexTpl = await readFile("src/templates/blogs.html", "utf-8")
    } catch {
        indexTpl = ""
    }

    return { postTpl, indexTpl }
}

function renderPostPage(tpl: string, post: Post): string {
    const titleEsc = post.title
    return tpl
        .replaceAll("{{title}}", titleEsc)
        .replaceAll("{{date}}", formatDate(post.published_at))
        .replaceAll("{{content}}", post.content_html)
}

function renderIndexPage(tpl: string, posts: Post[]): string {
    const items = posts.map(
        (p) => 
            `<li><i class="muted">${formatDate(p.published_at)} </i><a href="/blogs/${encodeURIComponent(p.slug)}/">${p.title}</a></li>`
    ).join("")
    return tpl.replace("{{list}}", items || `<li class="muted">no posts</li>`)
}

function formatDate(iso: string): string {
    const d = new Date(iso)
    if(isNaN(d.getTime())) return iso
    const day = d.getDate()
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    return `${mon} ${day}, ${year}`
}

// Main build
(async function build () {
    console.log("Building site from Supabase...")
    const { postTpl, indexTpl } = await loadTemplates()
    const posts = await fetchPosts()

    // output dirs
    await mkdir("public/blogs", {recursive: true})
    await mkdir("public/assets", {recursive: true})

    // write post pages
    for (const p of posts) {
        const outDir = join("public", "blogs", p.slug)
        await mkdir(outDir, {recursive: true})
        const html = renderPostPage(postTpl, p)
        await writeFile(join(outDir, "index.html"), html, "utf8")
        console.log(`✓ ${p.slug}`)
    }

    // write blog index
    const indexHtml = renderIndexPage(indexTpl, posts)
    await writeFile(join("public", "blogs", "index.html"), indexHtml, "utf8")

    await cp("src", "public", {
        recursive: true,
        filter: (src) => !src.includes("templates")
    })

    console.log("Build complete -> public/")
})().catch((e) => {
    console.error(e)
    process.exit(1)
})