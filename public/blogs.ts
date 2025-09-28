type Post = {
  id: string;
  title: string;
  slug: string;
  content_html: string;
  published_at: string;
};

// Supabase keys
const { SUPABASE_URL, SUPABASE_ANON_KEY } = (window as any).__config;
const POST_URL = `${SUPABASE_URL}/rest/v1/blogs?select=id,title,slug,content_html,published_at&order=published_at.desc`;
// LocalStorage keys
const K_DATA = "posts:data";
const K_ETAG = "posts:etag";

// DOM refs
const listEl = document.getElementById("blog-list") as HTMLUListElement | null;
const postViewEl = document.getElementById("post-view") as HTMLElement | null;
const postTitleEl = document.getElementById("post-title") as HTMLElement | null;
const postHtmlEl = document.getElementById("post-html") as HTMLElement | null;

// Render list of posts
function renderList(posts: Post[]) {
  if (!listEl) return;
  listEl.innerHTML = posts.length ? "" : `<li class="muted">no posts</li>`;
  for (const p of posts) {
    const li = document.createElement("li");
    li.innerHTML = `<a href="/${p.slug}">${p.title}</a>`;
    listEl.appendChild(li);
  }
}

// TODO: Render single post

// Cache helpers
function getCached(): Post[] | null {
  try {
    const raw = localStorage.getItem(K_DATA);
    return raw ? (JSON.parse(raw) as Post[]) : null;
  } catch {
    return null;
  }
}

function setCached(posts: Post[], etag?: string | null) {
  localStorage.setItem(K_DATA, JSON.stringify(posts));
  if (etag) localStorage.setItem(K_ETAG, etag);
}

async function fetchPosts(): Promise<Post[]> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: "application/json",
  };
  const etag = localStorage.getItem(K_ETAG);
  if (etag) headers["If-None-Match"] = etag;

  const resp = await fetch(POST_URL, { headers });

  if (resp.status == 304) {
    return getCached() ?? [];
  }

  if (!resp.ok) {
    throw new Error(`Failed to fetch post: ${resp.status}`);
  }

  const data = (await resp.json()) as Post[];
  const newEtag = resp.headers.get("ETag");
  setCached(data, newEtag);
  return data ?? [];
}

async function main() {
  try {
    const posts = await fetchPosts();
    renderList(posts);
  } catch (err) {
    console.error(err);
    if (listEl) listEl.innerHTML = `<li class="muted">failed to load</li>`;
  }
}

main();
