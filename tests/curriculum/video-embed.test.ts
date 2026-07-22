import { describe, expect, it } from "vitest";
import { resolveVideoEmbed } from "@/lib/video/embed";

describe("lesson video embeds", () => {
  it("converts common YouTube links to safe embed URLs", () => {
    expect(resolveVideoEmbed("https://youtu.be/M7lc1UVf-VE")?.embedUrl).toContain("youtube.com/embed/M7lc1UVf-VE");
    expect(resolveVideoEmbed("https://www.youtube.com/watch?v=M7lc1UVf-VE")?.provider).toBe("youtube");
  });

  it("supports Vimeo and full TikTok video links", () => {
    expect(resolveVideoEmbed("https://vimeo.com/123456789")?.embedUrl).toBe("https://player.vimeo.com/video/123456789");
    expect(resolveVideoEmbed("https://www.tiktok.com/@teacher/video/7481234567890123456")?.embedUrl).toContain("tiktok.com/player/v1/7481234567890123456");
  });

  it("rejects unsupported and malformed links", () => {
    expect(resolveVideoEmbed("https://example.com/video/123")).toBeNull();
    expect(resolveVideoEmbed("not a link")).toBeNull();
  });
});
