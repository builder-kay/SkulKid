import { NextResponse } from "next/server";
import { adminContext, listAllAuthUsers, safeUser } from "@/lib/admin/admin-server";

function dayKey(value: string) {
  return value.slice(0, 10);
}

export async function GET() {
  try {
    const { admin } = await adminContext();
    const [authUsers, pendingReviews, pendingContent, pendingAppeals, disputes, incidents, audits] = await Promise.all([
      listAllAuthUsers(),
      admin.from("PublicLearningRevision").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      admin.from("ContentModerationCase").select("id", { count: "exact", head: true }).in("status", ["held", "error"]),
      admin.from("ModerationAppeal").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("PointDeductionDispute").select("status,createdAt,resolvedAt"),
      admin.from("AdminIncident").select("status,severity,createdAt,resolvedAt"),
      admin.from("AdminAuditEvent").select("id,action,targetType,targetId,result,reason,actorId,createdAt").order("createdAt", { ascending: false }).limit(12)
    ]);
    const users = authUsers.map(safeUser);
    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (29 - index));
      return date.toISOString().slice(0, 10);
    });
    const accountTrend = days.map((date) => ({
      date,
      students: users.filter((user) => user.role === "student" && dayKey(user.createdAt) === date).length,
      teachers: users.filter((user) => user.role === "teacher" && dayKey(user.createdAt) === date).length
    }));
    const activeTrend = days.map((date) => ({
      date,
      students: users.filter((user) => user.role === "student" && user.lastSignInAt && dayKey(user.lastSignInAt) === date).length,
      teachers: users.filter((user) => user.role === "teacher" && user.lastSignInAt && dayKey(user.lastSignInAt) === date).length
    }));
    const roles = ["student", "teacher", "admin"].map((role) => ({
      label: role, value: users.filter((user) => user.role === role).length
    }));
    const openDisputes = (disputes.data ?? []).filter((item) => item.status === "open").length;
    const openIncidents = (incidents.data ?? []).filter((item) => item.status !== "resolved").length;
    const pendingPublicReviews = pendingReviews.count ?? 0;
    const pendingContentModeration = pendingContent.count ?? 0;
    const moderationAppeals = pendingAppeals.count ?? 0;
    const pendingModeration = pendingPublicReviews + pendingContentModeration + moderationAppeals;
    return NextResponse.json({
      totals: {
        users: users.length,
        students: roles[0].value,
        teachers: roles[1].value,
        admins: roles[2].value,
        suspended: users.filter((user) => user.status === "suspended").length,
        pendingModeration,
        pendingPublicReviews,
        pendingContentModeration,
        moderationAppeals,
        openDisputes,
        openIncidents
      },
      alerts: [
        ...(openIncidents ? [{ tone: "danger", title: `${openIncidents} active incident${openIncidents === 1 ? "" : "s"}`, href: "/admin/operations" }] : []),
        ...(openDisputes ? [{ tone: "warning", title: `${openDisputes} point dispute${openDisputes === 1 ? "" : "s"} waiting`, href: "/admin/point-disputes" }] : []),
        ...(pendingContentModeration ? [{ tone: "warning", title: `${pendingContentModeration} AI-held content item${pendingContentModeration === 1 ? "" : "s"} waiting`, href: "/admin/moderation" }] : []),
        ...(moderationAppeals ? [{ tone: "info", title: `${moderationAppeals} teacher appeal${moderationAppeals === 1 ? "" : "s"} waiting`, href: "/admin/moderation" }] : []),
        ...(pendingPublicReviews ? [{ tone: "info", title: `${pendingPublicReviews} Public Learning submission${pendingPublicReviews === 1 ? "" : "s"} waiting`, href: "/admin/moderation" }] : [])
      ],
      accountTrend,
      activeTrend,
      roles,
      workload: [
        { label: "Moderation", value: pendingModeration },
        { label: "Disputes", value: openDisputes },
        { label: "Incidents", value: openIncidents }
      ],
      activity: audits.data ?? []
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load analytics." }, { status: 500 });
  }
}
