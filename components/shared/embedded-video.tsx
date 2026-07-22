import { ExternalLink, Video } from "lucide-react";
import { resolveVideoEmbed } from "@/lib/video/embed";

export function EmbeddedVideo({ url, title, caption }: { url: string; title: string; caption?: string }) {
  const embed = resolveVideoEmbed(url);
  if (!embed) return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Enter a valid public YouTube, Vimeo or TikTok video link.</div>;
  return <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm"><div className={`relative w-full ${embed.provider === "tiktok" ? "mx-auto max-w-md aspect-[9/16]" : "aspect-video"}`}><iframe className="absolute inset-0 size-full" src={embed.embedUrl} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div><figcaption className="flex items-start justify-between gap-4 bg-white p-4"><div className="flex gap-3"><Video className="mt-0.5 size-5 shrink-0 text-violet-700" /><div><p className="font-bold text-slate-950">{title}</p>{caption ? <p className="mt-1 text-sm text-muted">{caption}</p> : null}</div></div><a className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-violet-700" href={embed.sourceUrl} target="_blank" rel="noreferrer">Open source<ExternalLink className="size-3.5" /></a></figcaption></figure>;
}
