export type ResponsibilityStatus = "available" | "integration" | "runbook";

export const adminResponsibilities: Array<{
  area: string;
  duty: string;
  status: ResponsibilityStatus;
  destination: string;
}> = [
  { area: "Identity", duty: "Create and maintain user accounts, roles and access", status: "available", destination: "/admin/users" },
  { area: "Security", duty: "Apply access controls and platform security policy", status: "available", destination: "/admin/security" },
  { area: "Monitoring", duty: "Monitor application, database and authentication health", status: "available", destination: "/admin/operations" },
  { area: "Monitoring", duty: "Monitor hosting, network and server performance", status: "integration", destination: "/admin/operations" },
  { area: "Recovery", duty: "Run and verify backups and disaster recovery", status: "integration", destination: "/admin/operations" },
  { area: "Maintenance", duty: "Install upgrades, patches and system software", status: "integration", destination: "/admin/operations" },
  { area: "Troubleshooting", duty: "Diagnose application, authentication and data problems", status: "available", destination: "/admin/operations" },
  { area: "Troubleshooting", duty: "Repair physical server, network or device hardware", status: "runbook", destination: "/admin/operations" },
  { area: "Configuration", duty: "Maintain platform configuration and usage policy", status: "available", destination: "/admin/settings" },
  { area: "Documentation", duty: "Maintain procedures, change and repair records", status: "available", destination: "/admin/security" },
  { area: "Capacity", duty: "Assess usage, capacity and future system needs", status: "integration", destination: "/admin/operations" },
  { area: "Inventory", duty: "Track providers, licences, services and renewal dates", status: "available", destination: "/admin/operations" },
  { area: "Procurement", duty: "Coordinate purchases, vendors and replacement parts", status: "runbook", destination: "/admin/operations" },
  { area: "Training", duty: "Train users and document safe system use", status: "runbook", destination: "/admin/operations" },
  { area: "Continuity", duty: "Test operability, redundancy and recovery procedures", status: "integration", destination: "/admin/operations" },
  { area: "Communications", duty: "Maintain email, voice and telecom services", status: "integration", destination: "/admin/operations" }
];
