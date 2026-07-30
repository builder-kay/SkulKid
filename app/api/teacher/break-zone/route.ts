import { NextResponse } from "next/server";
import { z } from "zod";
import { listTeacherClasses, requireTeacher } from "@/lib/classes/classroom-server";
import { createAdminClient } from "@/lib/supabase/admin";

const decisionSchema=z.object({action:z.literal("decision"),videoId:z.string().length(11),classIds:z.array(z.string().uuid()).min(1),decision:z.enum(["approved","revoked","rejected"]),reason:z.string().trim().min(5).max(500)});
const scheduleSchema=z.object({action:z.literal("schedule"),classId:z.string().uuid(),windows:z.array(z.object({dayOfWeek:z.number().int().min(0).max(6),startsAt:z.string().regex(/^\d\d:\d\d$/),endsAt:z.string().regex(/^\d\d:\d\d$/),enabled:z.boolean().default(true)})).max(30)});
const schema=z.discriminatedUnion("action",[decisionSchema,scheduleSchema]);

export async function GET(){
 try{const teacher=await requireTeacher(),admin=createAdminClient(),classes=await listTeacherClasses(teacher.id),ids=classes.map(c=>c.id);
 const [{data:schedules},{data:approvals},{data:videos},{data:members}]=await Promise.all([
  ids.length?admin.from("BreakZoneSchedule").select("*").in("classId",ids):Promise.resolve({data:[]}),
  ids.length?admin.from("BreakZoneApproval").select("*").eq("actorRole","teacher").in("classId",ids).order("createdAt",{ascending:false}).limit(100):Promise.resolve({data:[]}),
  admin.from("BreakZoneVideo").select("*").in("moderationStatus",["pending","rejected","error"]).order("updatedAt",{ascending:false}).limit(50),
  ids.length?admin.from("ClassMembership").select("studentId,classId").in("classId",ids).eq("status","active"):Promise.resolve({data:[]})
 ]);
 const studentIds=[...new Set((members??[]).map(x=>String(x.studentId)))];
 const [{data:searches},{data:sessions},{data:reports}]=await Promise.all([
  studentIds.length?admin.from("BreakZoneSearchEvent").select("id,studentId,createdAt").in("studentId",studentIds):Promise.resolve({data:[]}),
  studentIds.length?admin.from("BreakZoneViewSession").select("studentId,watchedSeconds,completed").in("studentId",studentIds):Promise.resolve({data:[]}),
  studentIds.length?admin.from("BreakZoneReport").select("id,studentId,status").in("studentId",studentIds):Promise.resolve({data:[]})
 ]);
 return NextResponse.json({classes,schedules:schedules??[],approvals:approvals??[],videos:videos??[],analytics:{searches:searches?.length??0,watchMinutes:Math.round((sessions??[]).reduce((s,x)=>s+Number(x.watchedSeconds),0)/60),completions:(sessions??[]).filter(x=>x.completed).length,reports:reports?.length??0}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load Break Zone."},{status:400})}
}
export async function PATCH(request:Request){
 try{const teacher=await requireTeacher(),admin=createAdminClient(),input=schema.parse(await request.json()),classes=await listTeacherClasses(teacher.id),owned=new Set(classes.map(c=>c.id));
 if(input.action==="schedule"){if(!owned.has(input.classId))throw new Error("You do not own this class.");await admin.from("BreakZoneSchedule").delete().eq("classId",input.classId);if(input.windows.length){const{error}=await admin.from("BreakZoneSchedule").insert(input.windows.map(w=>({...w,classId:input.classId,teacherId:teacher.id,timezone:"Africa/Accra"})));if(error)throw new Error(error.message)}return NextResponse.json({ok:true});}
 if(input.classIds.some(id=>!owned.has(id)))throw new Error("You may approve videos only for classes you own.");
 const{data:video}=await admin.from("BreakZoneVideo").select("severity,categories").eq("id",input.videoId).single();
 const{error}=await admin.from("BreakZoneApproval").insert(input.classIds.map(classId=>({videoId:input.videoId,scope:"class",classId,decision:input.decision,actorId:teacher.id,actorRole:"teacher",reason:input.reason})));if(error)throw new Error(error.message);
 const severe=["high","critical"].includes(String(video?.severity));await admin.from("BreakZoneAudit").insert({videoId:input.videoId,actorId:teacher.id,action:severe&&input.decision==="approved"?"severe_teacher_override_alert":"teacher_class_decision",metadata:{classIds:input.classIds,decision:input.decision,reason:input.reason,categories:video?.categories??[]}});
 return NextResponse.json({ok:true,severeAlert:severe&&input.decision==="approved"});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Update failed."},{status:400})}
}
