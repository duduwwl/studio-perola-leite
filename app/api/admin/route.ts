import { NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { cleanText, database, dayValid, getServices, jsonError, toMinute, availableSlots, getSetting, seedBusinessHours, weekday } from "@/lib/booking";

export const dynamic="force-dynamic";
const statuses=["confirmed","pending","completed","cancelled","no_show"];
const minute=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)?v:typeof v==="string"?toMinute(v):-1;

export async function GET(request:NextRequest){
  if(!await isAdmin()) return jsonError("Acesso restrito à administração.",403);
  try{
    const db=database(), action=request.nextUrl.searchParams.get("action")??"overview";
    if(action==="services") return Response.json({services:await getServices(db,true)});
    if(action==="hours") { await seedBusinessHours(db); return Response.json({hours:(await db.prepare("SELECT * FROM business_hours ORDER BY weekday").all()).results,settings:(await db.prepare("SELECT * FROM settings").all()).results}); }
    if(action==="blocks") return Response.json({blocks:(await db.prepare("SELECT * FROM blocked_times ORDER BY day,start_minute").all()).results});
    if(action==="clients"){
      const query=`%${cleanText(request.nextUrl.searchParams.get("q"),60)}%`;
      const clients=(await db.prepare("SELECT c.*, COUNT(a.id) AS visits, MAX(a.day) AS last_visit FROM clients c LEFT JOIN appointments a ON a.client_id=c.id AND a.status!='cancelled' WHERE c.name LIKE ? OR c.phone LIKE ? GROUP BY c.id ORDER BY c.name").bind(query,query).all()).results;
      return Response.json({clients});
    }
    if(action==="client-history"){
      const id=cleanText(request.nextUrl.searchParams.get("id"),80);
      if(!id)return jsonError("Cliente inválida.");
      const history=(await db.prepare("SELECT a.id,a.day,a.start_minute,a.status,s.name AS service_name FROM appointments a JOIN services s ON s.id=a.service_id WHERE a.client_id=? ORDER BY a.day DESC,a.start_minute DESC").bind(id).all()).results;
      return Response.json({history});
    }
    const start=cleanText(request.nextUrl.searchParams.get("start"),10);
    const end=cleanText(request.nextUrl.searchParams.get("end"),10);
    const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    const from=dayValid(start)?start:today, through=dayValid(end)?end:from;
    const appointments=(await db.prepare("SELECT a.*,c.name AS client_name,c.phone,c.email,s.name AS service_name FROM appointments a JOIN clients c ON c.id=a.client_id JOIN services s ON s.id=a.service_id WHERE a.day BETWEEN ? AND ? ORDER BY a.day,a.start_minute").bind(from,through).all()).results;
    const stats=(await db.prepare("SELECT (SELECT COUNT(*) FROM clients) AS clients,(SELECT COUNT(*) FROM appointments WHERE day=? AND status NOT IN ('cancelled','no_show')) AS today,(SELECT COUNT(*) FROM appointments WHERE status='cancelled') AS cancelled,(SELECT COUNT(*) FROM appointments WHERE status IN ('confirmed','pending') AND day>=?) AS upcoming,(SELECT COUNT(*) FROM appointments WHERE status NOT IN ('cancelled','no_show')) AS occupied").bind(today,today).first())??{};
    const popular=(await db.prepare("SELECT s.name,COUNT(a.id) AS total FROM services s LEFT JOIN appointments a ON a.service_id=s.id AND a.status NOT IN ('cancelled','no_show') GROUP BY s.id ORDER BY total DESC,s.name LIMIT 3").all()).results;
    return Response.json({appointments,stats,popular});
  }catch(error){console.error("admin GET",error);return jsonError("Não foi possível carregar os dados.",503)}
}

export async function POST(request:NextRequest){
  if(!await isAdmin()) return jsonError("Acesso restrito à administração.",403);
  try{
    const data=await request.json() as Record<string,unknown>;
    const action=cleanText(data.action,40), db=database();
    if(action==="service"){
      const id=cleanText(data.id,80)||crypto.randomUUID(), name=cleanText(data.name,100), description=cleanText(data.description,400), notes=cleanText(data.notes,400);
      const duration=data.durationMinutes===""||data.durationMinutes==null?null:Number(data.durationMinutes);
      const price=data.priceCents===""||data.priceCents==null?null:Number(data.priceCents);
      if(!name||(duration!==null&&(!Number.isInteger(duration)||duration<15||duration>720))||(price!==null&&(!Number.isInteger(price)||price<0))) return jsonError("Confira nome, duração e valor.");
      await db.prepare("INSERT INTO services (id,name,description,duration_minutes,price_cents,notes,active,sort_order) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,duration_minutes=excluded.duration_minutes,price_cents=excluded.price_cents,notes=excluded.notes,active=excluded.active,sort_order=excluded.sort_order")
        .bind(id,name,description||null,duration,price,notes||null,data.active===false?0:1,Number(data.sortOrder)||0).run();
      return Response.json({ok:true,id});
    }
    if(action==="hours"){
      const day=Number(data.weekday), open=minute(data.openMinute), close=minute(data.closeMinute), breakStart=data.breakStart==null||data.breakStart===""?null:minute(data.breakStart), breakEnd=data.breakEnd==null||data.breakEnd===""?null:minute(data.breakEnd);
      if(!Number.isInteger(day)||day<0||day>6||open<0||close<=open||close>1440||(breakStart!==null&&breakEnd!==null&&(breakStart<open||breakEnd>close||breakEnd<=breakStart))) return jsonError("Confira o horário de atendimento.");
      await db.prepare("INSERT INTO business_hours (weekday,open_minute,close_minute,break_start,break_end,enabled) VALUES (?,?,?,?,?,?) ON CONFLICT(weekday) DO UPDATE SET open_minute=excluded.open_minute,close_minute=excluded.close_minute,break_start=excluded.break_start,break_end=excluded.break_end,enabled=excluded.enabled").bind(day,open,close,breakStart,breakEnd,data.enabled===false?0:1).run();
      return Response.json({ok:true});
    }
    if(action==="setting"){
      const key=cleanText(data.key,50), value=cleanText(data.value,100);
      if(!["buffer_minutes","slot_step_minutes","whatsapp","deposit_mode","deposit_value"].includes(key)) return jsonError("Configuração inválida.");
      if(["buffer_minutes","slot_step_minutes"].includes(key)&&(!Number.isInteger(Number(value))||Number(value)<(key==="slot_step_minutes"?15:0)||Number(value)>120)) return jsonError("Intervalo inválido.");
      if(key==="deposit_mode"&&! ["none","fixed","percent"].includes(value)) return jsonError("Modo de sinal inválido.");
      if(key==="deposit_value"&&(!Number.isInteger(Number(value))||Number(value)<0||Number(value)>1000000)) return jsonError("Valor de sinal inválido.");
      await db.prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(key,value).run();return Response.json({ok:true});
    }
    if(action==="block"){
      const day=cleanText(data.day,10), start=minute(data.startMinute), end=minute(data.endMinute);
      if(!dayValid(day)||start<0||end<=start||end>1440) return jsonError("Confira a data e o período bloqueado.");
      const id=crypto.randomUUID();await db.prepare("INSERT INTO blocked_times (id,day,start_minute,end_minute,reason,kind) VALUES (?,?,?,?,?,?)").bind(id,day,start,end,cleanText(data.reason,160)||null,cleanText(data.kind,20)||"block").run();return Response.json({ok:true,id});
    }
    if(action==="unblock"){
      await db.prepare("DELETE FROM blocked_times WHERE id=?").bind(cleanText(data.id,80)).run();return Response.json({ok:true});
    }
    if(action==="appointment"){
      const id=cleanText(data.id,80), status=cleanText(data.status,30), notes=cleanText(data.notes,500), day=cleanText(data.day,10), start=minute(data.startMinute), serviceId=cleanText(data.serviceId,80);
      if(!id) return jsonError("Agendamento inválido.");
      const current=await db.prepare("SELECT * FROM appointments WHERE id=?").bind(id).first<{id:string;day:string;start_minute:number;service_id:string;status:string}>();
      if(!current) return jsonError("Agendamento não encontrado.",404);
      if(status&&!statuses.includes(status)) return jsonError("Status inválido.");
      const nextDay=dayValid(day)?day:current.day, nextStart=start>=0?start:current.start_minute, nextService=serviceId||current.service_id;
      const moved=nextDay!==current.day||nextStart!==current.start_minute||nextService!==current.service_id;
      if(moved){
        const slot=await availableSlots(db,nextDay,nextService,id);
        if(!slot.some(s=>s.minute===nextStart)) return jsonError("Novo horário indisponível.",409);
        const service=await db.prepare("SELECT duration_minutes,price_cents FROM services WHERE id=?").bind(nextService).first<{duration_minutes:number|null;price_cents:number|null}>();
        if(!service?.duration_minutes) return jsonError("Configure a duração do serviço.");
        const buffer=Number(await getSetting(db,"buffer_minutes","0"))||0;
        const result=await db.prepare(`UPDATE appointments SET day=?,start_minute=?,end_minute=? + ?,service_id=?,price_cents=?,status=?,notes=?,updated_at=? WHERE id=?
          AND EXISTS (SELECT 1 FROM business_hours h WHERE h.weekday=? AND h.enabled=1 AND ? >= h.open_minute AND ? + ? <= h.close_minute AND (h.break_start IS NULL OR h.break_end IS NULL OR ? >= h.break_end OR ? + ? <= h.break_start))
          AND NOT EXISTS (SELECT 1 FROM blocked_times b WHERE b.day=? AND ? < b.end_minute AND ? + ? > b.start_minute)
          AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.id != ? AND a.day=? AND a.status NOT IN ('cancelled','no_show') AND ? < a.end_minute + ? AND ? + ? + ? > a.start_minute)`)
          .bind(nextDay,nextStart,nextStart,service.duration_minutes,nextService,service.price_cents,status||current.status,notes||null,new Date().toISOString(),id,weekday(nextDay),nextStart,nextStart,service.duration_minutes,nextStart,nextStart,service.duration_minutes,nextDay,nextStart,nextStart,service.duration_minutes,id,nextDay,nextStart,buffer,nextStart,service.duration_minutes,buffer).run();
        if((result.meta.changes??0)!==1) return jsonError("Conflito com outro agendamento.",409);
      }else await db.prepare("UPDATE appointments SET status=?,notes=?,updated_at=? WHERE id=?").bind(status||current.status,notes||null,new Date().toISOString(),id).run();
      return Response.json({ok:true});
    }
    if(action==="client"){
      const id=cleanText(data.id,80);await db.prepare("UPDATE clients SET notes=? WHERE id=?").bind(cleanText(data.notes,500)||null,id).run();return Response.json({ok:true});
    }
    return jsonError("Ação inválida.");
  }catch(error){console.error("admin POST",error);return jsonError("Não foi possível salvar. Tente novamente.",503)}
}
