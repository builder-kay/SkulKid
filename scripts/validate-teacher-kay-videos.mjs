import fs from "node:fs";

const files = [
  "F:/SkulKid/supabase/seeds/teacher_kay_basic_6_curriculum.sql",
  "F:/SkulKid/supabase/seeds/teacher_kay_public_self_improvement_curriculum.sql",
  "F:/SkulKid/supabase/seeds/teacher_kay_visual_discovery_public_learning.sql",
];

const urlRe = /https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|tiktok\.com\/@[\w.]+\/video\/\d+)/g;
const urls = new Set();
for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  for (const m of t.matchAll(urlRe)) urls.add(m[0]);
}

console.log("unique video urls", urls.size);

const ytIds = [...urls]
  .filter((u) => u.includes("youtube.com"))
  .map((u) => u.split("v=")[1]);

const uniqueIds = [...new Set(ytIds)];
console.log("unique youtube ids", uniqueIds.length);

const results = [];
for (const id of uniqueIds) {
  const oembed = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  try {
    const res = await fetch(oembed);
    results.push({ id, ok: res.ok, status: res.status, title: res.ok ? (await res.json()).title : null });
  } catch (e) {
    results.push({ id, ok: false, status: 0, title: String(e) });
  }
}

const bad = results.filter((r) => !r.ok);
const good = results.filter((r) => r.ok);
console.log("valid", good.length, "invalid", bad.length);
for (const b of bad) console.log("BAD", b.id, b.status);
for (const g of good.slice(0, 8)) console.log("OK", g.id, g.title);
