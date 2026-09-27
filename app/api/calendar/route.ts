import { NextRequest } from "next/server";
import { availableSlots, database, dayValid, getServices, jsonError } from "@/lib/booking";
import { calendarInstant, calendarTimezone } from "@/lib/calendar";

export const dynamic="force-dynamic";
// Public availability only. Booked events and client details stay private.
export async function GET(request:NextRequest){
  try{
    const db=database(),params=request.nextUrl.searchParams;
    const serviceId=params.get("service")??"";
    const services=await getServices(db);
    const service=services.find(s=>s.id===serviceId);
    if(!service)return jsonError("Escolha um serviço válido.",404);
    if(!service.duration_minutes)return jsonError("Este serviço ainda não tem duração cadastrada.",409);
    const common={timeZone:calendarTimezone,serviceId,durationMinutes:service.duration_minutes};
    const headers={"Cache-Control":"no-store"};
    const day=params.get("day");
    if(day!==null){
      if(!dayValid(day))return jsonError("Escolha uma data válida.");
      const slots=(await availableSlots(db,day,serviceId)).map(slot=>({...slot,start:calendarInstant(day,slot.minute),end:calendarInstant(day,slot.minute+service.duration_minutes!)}));
      return Response.json({...common,day,slots},{headers});
    }
    const month=params.get("month")??"";
    if(!/^\d{4}-\d{2}$/.test(month))return jsonError("Escolha um mês válido.");
    const [year,number]=month.split("-").map(Number);
    if(number<1||number>12||year<2025||year>2100)return jsonError("Mês inválido.");
    const count=new Date(Date.UTC(year,number,0)).getUTCDate();
    const dates=await Promise.all(Array.from({length:count},async(_,i)=>{const date=`${month}-${String(i+1).padStart(2,"0")}`;return (await availableSlots(db,date,serviceId)).length?date:null}));
    return Response.json({...common,month,days:dates.filter(Boolean)},{headers});
  }catch(error){console.error("calendar GET",error);return jsonError("Não foi possível consultar o calendário. Tente novamente.",503)}
}
