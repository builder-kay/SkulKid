import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema=z.object({videoId:z.string().length(11),decision:z.enum(["approved","rejected","suspended","revoked","reanalyze"]),reason:z.string().trim().min(5).max(500)});
export async function GET(){
 try{await requireAdmin();const admin=createAdminClient();const[{data:videos},{data:jobs},{data:reports},{data:alerts},{count:searchCount},{data:sessions},{data:config}]=await Promise.all([
  admin.from("BreakZoneVideo").select("*").order("updatedAt",{ascending:false}).limit(100),admin.from("BreakZoneModerationJob").select("*").order("createdAt",{ascending:false}).limit(100),admin.from("BreakZoneReport").select("*,BreakZoneVideo(title,channelTitle)").order("createdAt",{ascending:false}).limit(100),admin.from("BreakZoneAudit").select("*").in("action",["severe_teacher_override_alert","student_report_global_suspension"]).order("createdAt",{ascending:false}).limit(50),admin.from("BreakZoneSearchEvent").select("id",{count:"exact",head:true}),admin.from("BreakZoneViewSession").select("watchedSeconds,completed"),admin.from("BreakZoneConfig").select("*").eq("id",true).single()
 ]);
 const all=videos??[];return NextResponse.json({videos:all,jobs:jobs??[],reports:reports??[],alerts:alerts??[],config,readiness:{youtube:Boolean(process.env.YOUTUBE_DATA_API_KEY),gemini:Boolean(process.env.GEMINI_API_KEY),cron:Boolean(process.env.BREAK_ZONE_CRON_SECRET??process.env.CRON_SECRET)},stats:{catalogue:all.length,approved:all.filter(x=>x.moderationStatus==="approved").length,pending:all.filter(x=>["pending","error"].includes(x.moderationStatus)).length,searches:searchCount??0,watchMinutes:Math.round((sessions??[]).reduce((s,x)=>s+Number(x.watchedSeconds),0)/60),reports:(reports??[]).filter(x=>x.status==="open").length}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load moderation."},{status:400})}
}
export async function PUT(request:Request){
 try{const actor=await requireAdmin(),admin=createAdminClient(),input=z.object({enabled:z.boolean(),dailyXpCap:z.number().int().min(0).max(100),completionXp:z.number().int().min(0).max(25),retentionDays:z.number().int().min(30).max(365),moderationModel:z.string().trim().min(3).max(100)}).parse(await request.json());const{error}=await admin.from("BreakZoneConfig").update({...input,updatedBy:actor.id,updatedAt:new Date().toISOString()}).eq("id",true);if(error)throw new Error(error.message);await admin.from("BreakZoneAudit").insert({actorId:actor.id,action:"admin_config_updated",metadata:input});return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Configuration failed."},{status:400})}
}
export async function PATCH(request:Request){
 try{const actor=await requireAdmin(),admin=createAdminClient(),input=schema.parse(await request.json());
 if(input.decision==="reanalyze"){await admin.from("BreakZoneVideo").update({moderationStatus:"pending",updatedAt:new Date().toISOString()}).eq("id",input.videoId);await admin.from("BreakZoneModerationJob").delete().eq("videoId",input.videoId).in("status",["completed","dead"]);const{error}=await admin.from("BreakZoneModerationJob").insert({videoId:input.videoId,status:"queued"});if(error)throw new Error(error.message);}
 else{const status=input.decision==="revoked"?"rejected":input.decision;await admin.from("BreakZoneVideo").update({moderationStatus:status,updatedAt:new Date().toISOString()}).eq("id",input.videoId);await admin.from("BreakZoneApproval").insert({videoId:input.videoId,scope:"global",classId:null,decision:input.decision==="suspended"?"revoked":input.decision,actorId:actor.id,actorRole:"admin",reason:input.reason});}
 await admin.from("BreakZoneAudit").insert({videoId:input.videoId,actorId:actor.id,action:`admin_${input.decision}`,metadata:{reason:input.reason}});
 return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Decision failed."},{status:400})}
}
