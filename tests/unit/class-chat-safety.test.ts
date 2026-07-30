import { describe, expect, it } from "vitest";
import { analyseClassChatMessage } from "@/lib/classes/class-chat-safety";

describe("class chat safety", () => {
  it("allows ordinary classroom discussion", () => {
    expect(analyseClassChatMessage("Can someone explain question four?")).toMatchObject({
      allowed: true,
      categories: []
    });
  });

  it.each([
    ["Visit https://example.com", "link"],
    ["My number is 0548006722", "phone_number"],
    ["You are worthless", "bullying"],
    ["I will hurt you", "threat"],
    ["Send me nudes", "sexual_content"]
  ])("blocks %s", (message, category) => {
    const result = analyseClassChatMessage(message);
    expect(result.allowed).toBe(false);
    expect(result.categories).toContain(category);
  });
});
