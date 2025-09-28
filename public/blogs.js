// public/blogs.ts
var { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__config;
var POST_URL = `${SUPABASE_URL}/rest/v1/blogs?select=id,title,slug,content_html,published_at&order=published_at.desc`;
var K_DATA = "posts:data";
var K_ETAG = "posts:etag";
var listEl = document.getElementById("blog-list");
var postViewEl = document.getElementById("post-view");
var postTitleEl = document.getElementById("post-title");
var postHtmlEl = document.getElementById("post-html");
function renderList(posts) {
  if (!listEl)
    return;
  listEl.innerHTML = posts.length ? "" : `<li class="muted">no posts</li>`;
  for (const p of posts) {
    const li = document.createElement("li");
    li.innerHTML = `<a href="/${p.slug}">${p.title}</a>`;
    listEl.appendChild(li);
  }
}
function getCached() {
  try {
    const raw = localStorage.getItem(K_DATA);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setCached(posts, etag) {
  localStorage.setItem(K_DATA, JSON.stringify(posts));
  if (etag)
    localStorage.setItem(K_ETAG, etag);
}
async function fetchPosts() {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Accept: "application/json"
  };
  const etag = localStorage.getItem(K_ETAG);
  if (etag)
    headers["If-None-Match"] = etag;
  const resp = await fetch(POST_URL, { headers });
  if (resp.status == 304) {
    return getCached() ?? [];
  }
  if (!resp.ok) {
    throw new Error(`Failed to fetch post: ${resp.status}`);
  }
  const data = await resp.json();
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
    if (listEl)
      listEl.innerHTML = `<li class="muted">failed to load</li>`;
  }
}
main();
