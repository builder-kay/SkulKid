import { describe, expect, it } from "vitest";
import { adminResponsibilities } from "@/lib/admin/operations";

describe("admin responsibility coverage", () => {
  it("covers the major CISA and O*NET system-administration domains", () => {
    const areas = new Set(adminResponsibilities.map((item) => item.area));
    for (const area of ["Identity", "Security", "Monitoring", "Recovery", "Maintenance", "Troubleshooting", "Configuration", "Documentation", "Capacity", "Inventory", "Training", "Continuity"]) {
      expect(areas.has(area)).toBe(true);
    }
  });

  it("has an explicit implementation status and destination for every duty", () => {
    expect(adminResponsibilities.length).toBeGreaterThanOrEqual(15);
    for (const item of adminResponsibilities) {
      expect(["available", "integration", "runbook"]).toContain(item.status);
      expect(item.destination.startsWith("/admin/")).toBe(true);
    }
  });
});
