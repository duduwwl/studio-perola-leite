import { NextRequest } from "next/server";
import { calendarAvailability, database, dayValid, jsonError } from "@/lib/booking";
import { calendarInstant, calendarTimezone } from "@/lib/calendar";
import { publicCors } from "@/lib/public-cors";

export const dynamic="force-dynamic";
// Public availability only. Booked events and client details stay private.
async function handleGet(request:NextRequest){
  try{
    const db=database(),params=request.nextUrl.searchParams;
    const serviceId=params.get("service")??"";
    const headers={"Cache-Control":"no-store"};
    const day=params.get("day");
    const month=params.get("month")??"";
    if(day!==null && !dayValid(day))return jsonError("Escolha uma data válida.");
    if(day===null && !/^\d{4}-\d{2}$/.test(month))return jsonError("Escolha um mês válido.");
    const [year,number]=month.split("-").map(Number);
    if(day===null && (number<1||number>12||year<2025||year>2100))return jsonError("Mês inválido.");
    const last=day??`${month}-${String(new Date(Date.UTC(year,number,0)).getUTCDate()).padStart(2,"0")}`;
    const availability=await calendarAvailability(db,day??`${month}-01`,last,serviceId);
    const service=availability.service;
    if(!service)return jsonError("Escolha um serviço válido.",404);
    if(!service.duration_minutes)return jsonError("Este serviço ainda não tem duração cadastrada.",409);
    const common={timeZone:calendarTimezone,serviceId,durationMinutes:service.duration_minutes};
    if(day!==null){
      const slots=(availability.slotsByDay[day]??[]).map(slot=>({...slot,start:calendarInstant(day,slot.minute),end:calendarInstant(day,slot.minute+service.duration_minutes!)}));
      return Response.json({...common,day,slots},{headers});
    }
    return Response.json({...common,month,days:availability.days,slotsByDay:availability.slotsByDay},{headers});
  }catch(error){console.error("calendar GET",error);return jsonError("Não foi possível consultar o calendário. Tente novamente.",503)}
}
export const GET=(request:NextRequest)=>publicCors(request,()=>handleGet(request));
export const OPTIONS=(request:NextRequest)=>publicCors(request,async()=>new Response(null,{status:204}));
