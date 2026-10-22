/* 离线语音包：音频已下载到手机时，直接从手机里取；没有就走网络 */
const CACHE = "ielts-audio-v1";
const HOST = new URL(self.location.href).searchParams.get("h") || "audio.goenkon.com";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const r = e.request; let u;
  try { u = new URL(r.url); } catch (x) { return; }
  if (u.host !== HOST || !u.pathname.endsWith(".mp3")) return;
  e.respondWith((async () => {
    try {
      const c = await caches.open(CACHE);
      const m = await c.match(u.href, { ignoreVary: true });
      if (!m) return fetch(r);
      const rg = r.headers.get("range");
      if (!rg) return m;
      const b = await m.blob();
      const mm = /bytes=(\d*)-(\d*)/.exec(rg);
      let s = mm && mm[1] ? parseInt(mm[1], 10) : 0;
      let en = mm && mm[2] ? parseInt(mm[2], 10) : b.size - 1;
      if (!mm || (!mm[1] && mm[2])) { s = Math.max(0, b.size - parseInt(mm ? mm[2] : "0", 10)); en = b.size - 1; }
      if (en >= b.size) en = b.size - 1;
      if (s > en) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + b.size } });
      return new Response(b.slice(s, en + 1), { status: 206, headers: { "Content-Type": "audio/mpeg", "Content-Range": "bytes " + s + "-" + en + "/" + b.size, "Content-Length": String(en - s + 1), "Accept-Ranges": "bytes" } });
    } catch (x) { return fetch(r); }
  })());
});
