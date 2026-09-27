// Shared calendar export. Contains only details of this reservation, no client data.
export const calendarTimezone="America/Sao_Paulo";
const label=(minute:number)=>`${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`;
export function calendarInstant(day:string,minute:number){
  // Resolve studio wall time with IANA rules, independent of the browser/server timezone.
  const wall=Date.parse(`${day}T${label(minute)}:00Z`);
  let instant=wall;
  for(let i=0;i<3;i++){
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:calendarTimezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(new Date(instant));
    const part=(type:string)=>parts.find(p=>p.type===type)?.value;
    const rendered=Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`);
    const correction=wall-rendered;if(!correction)break;instant+=correction;
  }
  return new Date(instant).toISOString();
}
const stamp=(iso:string)=>iso.replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
const escapeText=(value:string)=>value.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
function fold(value:string){
  const encoder=new TextEncoder();let line="",bytes=0;const lines:string[]=[];
  for(const char of value){const size=encoder.encode(char).length;if(bytes+size>75){lines.push(line);line=" ";bytes=1}line+=char;bytes+=size}lines.push(line);return lines.join("\r\n");
}
export function reservationCalendar(id:string,title:string,day:string,minute:number,duration:number){
  const start=calendarInstant(day,minute),end=calendarInstant(day,minute+duration);
  const location="Studio Pérola Leite · Rua Evaristo Alves, 110 · Lavras, MG";
  const description=`Reserva confirmada no Studio Pérola Leite. Referência: ${id.slice(0,8).toUpperCase()}.`;
  const summary=`${title} · Studio Pérola Leite`;
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Studio Perola Leite//Agenda//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${id}@studio-perola-leite`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${escapeText(summary)}`,`LOCATION:${escapeText(location)}`,`DESCRIPTION:${escapeText(description)}`,"STATUS:CONFIRMED","END:VEVENT","END:VCALENDAR"].map(fold).join("\r\n")+"\r\n";
  const params=new URLSearchParams({action:"TEMPLATE",text:summary,dates:`${stamp(start)}/${stamp(end)}`,ctz:calendarTimezone,details:description,location});
  return {start,end,timeZone:calendarTimezone,ics,googleUrl:`https://calendar.google.com/calendar/render?${params}`};
}
