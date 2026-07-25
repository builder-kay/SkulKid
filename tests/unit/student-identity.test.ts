import { describe, expect, it } from "vitest";
import { normalizeUsername, slugUsernameFromDisplayName, usernameIdentityEmail } from "@/lib/auth/username";

describe("student username identity", () => {
  it("normalises and builds identity email", () => {
    expect(normalizeUsername("Ama_Kid")).toBe("ama_kid");
    expect(usernameIdentityEmail("Ama_Kid")).toBe("u-ama_kid@users.skulkid.app");
  });

  it("rejects invalid usernames", () => {
    expect(() => normalizeUsername("ab")).toThrow("3–20");
    expect(() => normalizeUsername("Bad-Name")).toThrow("letters, numbers or underscores");
    expect(() => normalizeUsername("admin")).toThrow("reserved");
  });

  it("slugs display names for migration", () => {
    expect(slugUsernameFromDisplayName("Ama Mensah")).toBe("ama_mensah");
    expect(slugUsernameFromDisplayName("!!!")).toBe("learner");
  });
});
