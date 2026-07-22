export type VideoProvider = "youtube" | "vimeo" | "tiktok";
export type VideoEmbed = { provider: VideoProvider; embedUrl: string; sourceUrl: string };

export function resolveVideoEmbed(value: string): VideoEmbed | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
      const id = host === "youtu.be" ? url.pathname.split("/")[1] : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
      if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
      return { provider: "youtube", sourceUrl: value, embedUrl: `https://www.youtube.com/embed/${id}?controls=1&playsinline=1&rel=0` };
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.match(/(?:video\/)?(\d+)/)?.[1];
      if (!id) return null;
      return { provider: "vimeo", sourceUrl: value, embedUrl: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "tiktok.com" || host === "m.tiktok.com") {
      const id = url.pathname.match(/\/video\/(\d+)/)?.[1];
      if (!id) return null;
      return { provider: "tiktok", sourceUrl: value, embedUrl: `https://www.tiktok.com/player/v1/${id}?controls=1` };
    }
    return null;
  } catch { return null; }
}
