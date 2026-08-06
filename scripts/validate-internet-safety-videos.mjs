import fs from "node:fs";
const t = fs.readFileSync("F:/SkulKid/supabase/seeds/teacher_kay_public_internet_safety.sql", "utf8");
const ids = [...new Set([...t.matchAll(/youtube\.com\/watch\?v=([\w-]+)/g)].map((m) => m[1]))];
console.log("unique", ids.length);
for (const id of ids) {
  const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
  console.log(r.ok ? "OK" : "FAIL", id, r.ok ? (await r.json()).title.slice(0, 70) : r.status);
}
