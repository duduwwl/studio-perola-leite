import { env } from "cloudflare:workers";
import { calculateSlots } from "./availability";

export type Service = { id:string; name:string; description:string|null; price_cents:number|null; duration_minutes:number|null; image:string|null; notes:string|null; active:number; sort_order:number; price_is_demo?:boolean };
export type Hour = { weekday:number; open_minute:number; close_minute:number; break_start:number|null; break_end:number|null; enabled:number };
export type Slot = { minute:number; label:string };

export function database(): D1Database {
  if (!env.DB) throw new Error("Agenda indisponível: banco de dados não configurado.");
  return env.DB;
}
export const toLabel = (minute:number) => `${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`;
export const toMinute = (value:string) => { const match=/^(\d{2}):(\d{2})$/.exec(value); if(!match) return -1; const n=Number(match[1])*60+Number(match[2]); return (Number(match[1])<24&&Number(match[2])<60)||value==="24:00"?n:-1; };
export const dayValid = (day:string) => { if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;const date=new Date(`${day}T12:00:00Z`);return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===day; };
export const weekday = (day:string) => new Date(`${day}T12:00:00Z`).getUTCDay();
export const studioNow = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
  const value = (kind:string) => parts.find(p=>p.type===kind)?.value ?? "00";
  const today = `${value("year")}-${value("month")}-${value("day")}`;
  return {day:today,minute:Number(value("hour"))*60+Number(value("minute"))};
};
export const isPast = (day:string, minute:number) => {const now=studioNow();return day<now.day || (day===now.day && minute<=now.minute)};

const catalog: Array<[string,string,string,string,number,number]> = [
  ["fibra","Alongamento em fibra de vidro","Alongamento com estrutura em fibra de vidro.","/images/francesinha.webp",60,15000],
  ["gel","Alongamento em gel","Alongamento e acabamento em gel.","/images/glitter.webp",50,13000],
  ["esmalte-gel","Esmaltação em gel","Cor e brilho com esmaltação em gel.","/images/rosa.webp",30,6000],
  ["blindagem","Blindagem e esmaltação em gel","Proteção da unha natural com esmaltação em gel.","/images/preto.webp",60,9000],
  ["cutilagem","Cutilagem e esmaltação comum","Cuidado das cutículas e esmaltação tradicional.","/images/colorido.webp",50,4500],
];
export async function seedServices(db:D1Database) {
  const statements=catalog.map(([id,name,description,image,duration,price],i)=>db.prepare("INSERT OR IGNORE INTO services (id,name,description,image,duration_minutes,price_cents,active,sort_order) VALUES (?,?,?,?,?,?,1,?)").bind(id,name,description,image,duration,price,i));
  statements.push(db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('demo_price_cents',?)").bind(JSON.stringify(Object.fromEntries(catalog.map(([id,,,,,price])=>[id,price])))));
  await db.batch(statements);
}
export async function seedBusinessHours(db:D1Database){
  await db.batch([1,2,3,4,5].map(weekday=>db.prepare("INSERT OR IGNORE INTO business_hours (weekday,open_minute,close_minute,break_start,break_end,enabled) VALUES (?,480,1080,720,810,1)").bind(weekday)));
}
export async function getServices(db:D1Database, includeInactive=false) {
  await seedServices(db);
  await seedBusinessHours(db);
  const sql=`SELECT * FROM services ${includeInactive?"":"WHERE active = 1"} ORDER BY sort_order, name`;
  const demoPrices=JSON.parse(await getSetting(db,"demo_price_cents","{}")) as Record<string,number>;
  return (await db.prepare(sql).all<Service>()).results.map(s=>({...s,price_is_demo:s.price_cents!==null&&demoPrices[s.id]===s.price_cents}));
}
export async function getSetting(db:D1Database,key:string, fallback:string) {
  const row=await db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first<{value:string}>();
  return row?.value ?? fallback;
}
export async function calendarAvailability(db:D1Database, startDay:string, endDay:string, serviceId:string, excludeId="") {
  // Five SELECTs in one D1 batch, regardless of the number of days requested.
  const rows=await db.batch([
    db.prepare("SELECT * FROM services WHERE id = ? AND active = 1").bind(serviceId),
    db.prepare("SELECT * FROM business_hours WHERE enabled = 1"),
    db.prepare("SELECT key,value FROM settings WHERE key IN ('buffer_minutes','slot_step_minutes')"),
    db.prepare("SELECT day,start_minute,end_minute FROM appointments WHERE day BETWEEN ? AND ? AND id != ? AND status NOT IN ('cancelled','no_show')").bind(startDay,endDay,excludeId),
    db.prepare("SELECT day,start_minute,end_minute FROM blocked_times WHERE day BETWEEN ? AND ?").bind(startDay,endDay),
  ]);
  const service=rows[0].results[0] as Service|undefined;
  const hours=rows[1].results as unknown as Hour[];
  const settings=Object.fromEntries((rows[2].results as {key:string;value:string}[]).map(row=>[row.key,row.value]));
  const buffer=Math.max(0,Math.min(120,Number(settings.buffer_minutes)||0));
  const step=Math.max(15,Math.min(120,Number(settings.slot_step_minutes)||30));
  type Range={day:string;start_minute:number;end_minute:number};
  const group=(ranges:Range[])=>{const map=new Map<string,Range[]>();for(const range of ranges){const list=map.get(range.day)??[];list.push(range);map.set(range.day,list)}return map};
  const appointments=group(rows[3].results as unknown as Range[]),blocks=group(rows[4].results as unknown as Range[]);
  const now=studioNow(), slotsByDay:Record<string,Slot[]>={};
  if(service?.duration_minutes && dayValid(startDay) && dayValid(endDay)){
    for(let date=new Date(`${startDay}T12:00:00Z`);date.toISOString().slice(0,10)<=endDay;date.setUTCDate(date.getUTCDate()+1)){
      const day=date.toISOString().slice(0,10);
      const slots=calculateSlots(day,service.duration_minutes,hours.find(h=>h.weekday===weekday(day)),appointments.get(day)??[],blocks.get(day)??[],buffer,step,now);
      if(slots.length)slotsByDay[day]=slots;
    }
  }
  return {service,slotsByDay,days:Object.keys(slotsByDay)};
}
export async function availableSlots(db:D1Database, day:string, serviceId:string, excludeId=""):Promise<Slot[]> {
  if(!dayValid(day))return [];
  return (await calendarAvailability(db,day,day,serviceId,excludeId)).slotsByDay[day]??[];
}
export const cleanText=(value:unknown,max=200)=>typeof value==="string"?value.trim().replace(/[\u0000-\u001f<>]/g,"").slice(0,max):"";
export const cleanPhone=(value:unknown)=>typeof value==="string"?value.replace(/\D/g,"").slice(0,15):"";
export function jsonError(message:string,status=400){return Response.json({error:message},{status});}
