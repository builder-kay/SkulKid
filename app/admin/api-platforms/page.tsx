import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Bot,
  Cable,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  KeyRound,
  MessageSquareText,
  ShieldCheck,
  TriangleAlert,
  Youtube
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { cn } from "@/lib/utils";

type Platform = {
  name: string;
  category: "Infrastructure" | "Artificial intelligence" | "Messaging" | "Notifications";
  description: string;
  purpose: string;
  platformUrl: string;
  platformLabel: string;
  documentationUrl?: string;
  icon: LucideIcon;
  colour: string;
  environmentVariables: string[];
  configured: boolean;
  note?: string;
};

const platforms: Platform[] = [
  {
    name: "Supabase",
    category: "Infrastructure",
    description: "Database, authentication, file storage and server-side data access.",
    purpose: "Core application backend",
    platformUrl: "https://supabase.com/dashboard",
    platformLabel: "Open Supabase",
    documentationUrl: "https://supabase.com/docs",
    icon: Database,
    colour: "from-emerald-500 to-teal-700",
    environmentVariables: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    configured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      && process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  },
  {
    name: "Vercel",
    category: "Infrastructure",
    description: "Production hosting, deployments, build logs and release metadata.",
    purpose: "Application hosting",
    platformUrl: "https://vercel.com/dashboard",
    platformLabel: "Open Vercel",
    documentationUrl: "https://vercel.com/docs",
    icon: Cloud,
    colour: "from-slate-700 to-slate-950",
    environmentVariables: ["VERCEL_ENV", "VERCEL_URL", "VERCEL_GIT_COMMIT_SHA"],
    configured: Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL),
    note: "Vercel supplies these values automatically during deployment."
  },
  {
    name: "Google Gemini",
    category: "Artificial intelligence",
    description: "Lesson extraction, curriculum generation, content moderation and Break Zone video analysis.",
    purpose: "AI generation and safety",
    platformUrl: "https://aistudio.google.com/",
    platformLabel: "Open AI Studio",
    documentationUrl: "https://ai.google.dev/gemini-api/docs",
    icon: Bot,
    colour: "from-violet-600 to-indigo-800",
    environmentVariables: ["GEMINI_API_KEY"],
    configured: Boolean(process.env.GEMINI_API_KEY),
    note: "Feature-specific model variables are optional and fall back to GEMINI_MODEL."
  },
  {
    name: "YouTube Data API",
    category: "Artificial intelligence",
    description: "Safe video search and metadata retrieval for the student Break Zone.",
    purpose: "Video discovery",
    platformUrl: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    platformLabel: "Open Google Cloud",
    documentationUrl: "https://developers.google.com/youtube/v3",
    icon: Youtube,
    colour: "from-red-500 to-rose-700",
    environmentVariables: ["YOUTUBE_DATA_API_KEY"],
    configured: Boolean(process.env.YOUTUBE_DATA_API_KEY),
    note: "Break Zone is currently disabled, but this integration remains part of the platform."
  },
  {
    name: "PushAlert",
    category: "Notifications",
    description: "Browser push subscription and notification delivery across supported mobile and desktop browsers.",
    purpose: "Web push notifications",
    platformUrl: "https://dashboard.pushalert.co/",
    platformLabel: "Open PushAlert",
    documentationUrl: "https://pushalert.co/documentation/integration",
    icon: BellRing,
    colour: "from-cyan-600 to-blue-800",
    environmentVariables: [],
    configured: true,
    note: "Configured through the site-specific PushAlert script and root service worker. No environment variable is required for the current client integration."
  },
  {
    name: "BMS Africa",
    category: "Messaging",
    description: "Primary SMS provider for signup, recovery and verification-code delivery.",
    purpose: "Primary SMS and OTP",
    platformUrl: "https://app.bms.africa/",
    platformLabel: "Open BMS Africa",
    documentationUrl: "https://developer.bms.africa/",
    icon: MessageSquareText,
    colour: "from-blue-600 to-cyan-700",
    environmentVariables: ["BMS_API_KEY", "BMS_SENDER_ID"],
    configured: Boolean(process.env.BMS_API_KEY),
    note: "A sender ID is recommended; the application has a fallback sender name."
  },
  {
    name: "Clifze SMS",
    category: "Messaging",
    description: "Second SMS provider in the verification delivery fallback order.",
    purpose: "Fallback SMS and OTP",
    platformUrl: "https://clifze.shop/",
    platformLabel: "Open Clifze",
    icon: MessageSquareText,
    colour: "from-sky-600 to-blue-800",
    environmentVariables: ["CLIFZE_API_KEY", "CLIFZE_SENDER_ID"],
    configured: Boolean(process.env.CLIFZE_API_KEY && process.env.CLIFZE_SENDER_ID),
    note: "SkulKid uses the Clifze v3 API."
  },
  {
    name: "Arkesel",
    category: "Messaging",
    description: "Third SMS provider used when earlier delivery attempts are delayed or rejected.",
    purpose: "Fallback SMS delivery",
    platformUrl: "https://sms.arkesel.com/",
    platformLabel: "Open Arkesel",
    documentationUrl: "https://developers.arkesel.com/",
    icon: MessageSquareText,
    colour: "from-indigo-600 to-violet-800",
    environmentVariables: ["ARKESEL_API_KEY", "ARKESEL_SENDER_ID"],
    configured: Boolean(process.env.ARKESEL_API_KEY),
    note: "A sender ID is recommended; the application has a fallback sender name."
  }
];

const categories = ["Infrastructure", "Artificial intelligence", "Messaging", "Notifications"] as const;

export default function ApiPlatformsPage() {
  const configuredCount = platforms.filter((platform) => platform.configured).length;

  return (
    <main className="mx-auto grid w-full max-w-[100rem] gap-6">
      <AdminPageHeader
        description="A secure directory of the external platforms connected to SkulKid, what each service supports, and whether its server-side configuration is ready."
        eyebrow="Integrations · credentials · ownership"
        icon={Cable}
        title="API platforms"
        tone="dark"
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Platforms catalogued" value={platforms.length} detail="Across the production codebase" />
        <SummaryCard label="Configured" value={configuredCount} detail="Detected in this environment" good={configuredCount === platforms.length} />
        <SummaryCard label="Need attention" value={platforms.length - configuredCount} detail="Missing or not detected" warning={configuredCount !== platforms.length} />
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-700"><ShieldCheck className="size-5" /></span>
        <div>
          <h2 className="font-black">Credentials remain private</h2>
          <p className="mt-1 text-sm leading-6 text-blue-900">This directory checks whether required environment variables exist. It never displays, copies or sends their values to the browser.</p>
        </div>
      </section>

      {categories.map((category) => (
        <section className="grid gap-4" key={category}>
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-blue-700">{category}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{category === "Messaging" ? "SMS and verification providers" : category === "Notifications" ? "Push notification services" : `${category} services`}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platforms.filter((platform) => platform.category === category).map((platform) => (
              <PlatformCard key={platform.name} platform={platform} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function PlatformCard({ platform }: { platform: Platform }) {
  const Icon = platform.icon;
  return (
    <article className="group flex min-h-[25rem] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(15,23,42,.12)]">
      <div className={cn("relative overflow-hidden bg-gradient-to-br p-5 text-white", platform.colour)}>
        <span className="absolute -right-8 -top-10 size-32 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Icon className="size-6" /></span>
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black ring-1",
            platform.configured ? "bg-white/15 text-white ring-white/25" : "bg-amber-300 text-amber-950 ring-amber-200"
          )}>
            {platform.configured ? <CheckCircle2 className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
            {platform.configured ? "Configured" : "Needs setup"}
          </span>
        </div>
        <p className="relative mt-5 text-xs font-black uppercase tracking-wider text-white/75">{platform.purpose}</p>
        <h3 className="relative mt-1 text-2xl font-black">{platform.name}</h3>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-6 text-slate-600">{platform.description}</p>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500"><KeyRound className="size-3.5" />Environment readiness</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {platform.environmentVariables.length
              ? platform.environmentVariables.map((variable) => <code className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700" key={variable}>{variable}</code>)
              : <span className="text-xs font-bold text-slate-600">No environment variables required</span>}
          </div>
        </div>
        {platform.note ? <p className="mt-3 text-xs leading-5 text-slate-500">{platform.note}</p> : null}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Link className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 text-sm font-black text-white hover:bg-blue-800", !platform.documentationUrl && "col-span-2")} href={platform.platformUrl} rel="noreferrer" target="_blank">
            {platform.platformLabel}<ExternalLink className="size-4" />
          </Link>
          {platform.documentationUrl ? <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-black text-slate-700 hover:bg-slate-50" href={platform.documentationUrl} rel="noreferrer" target="_blank">Documentation<ExternalLink className="size-4" /></Link> : null}
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ label, value, detail, good = false, warning = false }: { label: string; value: number; detail: string; good?: boolean; warning?: boolean }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><strong className="mt-2 block text-3xl font-black text-slate-950">{value}</strong></div>
        <span className={cn("grid size-10 place-items-center rounded-xl", warning ? "bg-amber-100 text-amber-700" : good ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
          {warning ? <TriangleAlert className="size-5" /> : good ? <CheckCircle2 className="size-5" /> : <Cable className="size-5" />}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </article>
  );
}
