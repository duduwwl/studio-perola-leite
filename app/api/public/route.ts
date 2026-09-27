import { NextRequest } from "next/server";
import { availableSlots, cleanPhone, cleanText, database, dayValid, getServices, getSetting, isPast, jsonError, weekday, seedBusinessHours } from "@/lib/booking";
import { reservationCalendar } from "@/lib/calendar";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  try{
    const db=database();
    await seedBusinessHours(db);
    const action=request.nextUrl.searchParams.get("action");
    if(action==="days"){
      const month=request.nextUrl.searchParams.get("month")??"", service=request.nextUrl.searchParams.get("service")??"";
      if(!/^\d{4}-\d{2}$/.test(month)||!service) return jsonError("Mês ou serviço inválido.");
      const [year,number]=month.split("-").map(Number);
      if(number<1||number>12||year<2025||year>2100) return jsonError("Mês inválido.");
      const count=new Date(Date.UTC(year,number,0)).getUTCDate();
      const days=await Promise.all(Array.from({length:count},async(_,i)=>{const day=`${month}-${String(i+1).padStart(2,"0")}`;const slots=await availableSlots(db,day,service);return slots.length?day:null}));
      return Response.json({days:days.filter(Boolean)});
    }
    if(action==="slots"){
      const day=request.nextUrl.searchParams.get("day")??"";
      const service=request.nextUrl.searchParams.get("service")??"";
      if(!dayValid(day)||!service) return jsonError("Escolha uma data e um serviço válidos.");
      return Response.json({slots:await availableSlots(db,day,service)});
    }
    const services=await getServices(db);
    const whatsapp=await getSetting(db,"whatsapp","");
    return Response.json({services,whatsapp});
  }catch(error){console.error("public GET",error);return jsonError("Não foi possível carregar a agenda agora. Tente novamente.",503)}
}

export async function POST(request:NextRequest){
  try{
    const payload=await request.json() as Record<string,unknown>;
    const day=cleanText(payload.day,10), serviceId=cleanText(payload.serviceId,80), name=cleanText(payload.name,100), phone=cleanPhone(payload.phone), email=cleanText(payload.email,160), notes=cleanText(payload.notes,500);
    const minute=Number(payload.minute);
    if(!dayValid(day)||!serviceId||!name||phone.length<10||!Number.isInteger(minute)||minute<0||minute>=1440) return jsonError("Confira os dados do agendamento.");
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Informe um e-mail válido.");
    if(isPast(day,minute)) return jsonError("Escolha um horário futuro.");
    const db=database();
    await seedBusinessHours(db);
    const slots=await availableSlots(db,day,serviceId);
    if(!slots.some(s=>s.minute===minute)) return jsonError("Esse horário não está mais disponível. Escolha outro.",409);
    const clientId=crypto.randomUUID(); const now=new Date().toISOString();
    await db.prepare("INSERT INTO clients (id,name,phone,email,created_at) VALUES (?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name,email=COALESCE(excluded.email,clients.email)").bind(clientId,name,phone,email||null,now).run();
    const client=await db.prepare("SELECT id FROM clients WHERE phone = ?").bind(phone).first<{id:string}>();
    if(!client) throw new Error("Client write failed");
    const buffer=Math.max(0,Math.min(120,Number(await getSetting(db,"buffer_minutes","0"))||0));
    const id=crypto.randomUUID();
    const service=await db.prepare("SELECT name,duration_minutes FROM services WHERE id=?").bind(serviceId).first<{name:string;duration_minutes:number}>();
    if(!service?.duration_minutes)return jsonError("Este serviço não está disponível para reserva.",409);
    const calendar=reservationCalendar(id,service.name,day,minute,service.duration_minutes);
    const result=await db.prepare(`INSERT INTO appointments (id,client_id,service_id,day,start_minute,end_minute,status,notes,price_cents,created_at,updated_at)
      SELECT ?,?,s.id,?,?,? + s.duration_minutes,'confirmed',?,s.price_cents,?,?
      FROM services s JOIN business_hours h ON h.weekday = ? AND h.enabled = 1
      WHERE s.id = ? AND s.active = 1 AND s.duration_minutes IS NOT NULL
        AND ? >= h.open_minute AND ? + s.duration_minutes <= h.close_minute
        AND (h.break_start IS NULL OR h.break_end IS NULL OR ? >= h.break_end OR ? + s.duration_minutes <= h.break_start)
        AND NOT EXISTS (SELECT 1 FROM blocked_times b WHERE b.day = ? AND ? < b.end_minute AND ? + s.duration_minutes > b.start_minute)
        AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.day = ? AND a.status NOT IN ('cancelled','no_show') AND ? < a.end_minute + ? AND ? + s.duration_minutes + ? > a.start_minute)`)
      .bind(id,client.id,day,minute,minute,notes||null,now,now,weekday(day),serviceId,minute,minute,minute,minute,day,minute,minute,day,minute,buffer,minute,buffer).run();
    if((result.meta.changes??0)!==1) return jsonError("Esse horário não está mais disponível. Escolha outro.",409);
    return Response.json({id,status:"confirmed",calendar},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("public POST",error);return jsonError("Não foi possível confirmar o agendamento. Tente novamente.",503)}
}
