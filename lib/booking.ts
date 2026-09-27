import { env } from "cloudflare:workers";

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
export async function availableSlots(db:D1Database, day:string, serviceId:string, excludeId=""):Promise<Slot[]> {
  if (!dayValid(day)) return [];
  const service=await db.prepare("SELECT * FROM services WHERE id = ? AND active = 1").bind(serviceId).first<Service>();
  if (!service?.duration_minutes || service.duration_minutes<15) return [];
  const hours=await db.prepare("SELECT * FROM business_hours WHERE weekday = ? AND enabled = 1").bind(weekday(day)).first<Hour>();
  if (!hours) return [];
  const buffer=Math.max(0,Math.min(120,Number(await getSetting(db,"buffer_minutes","0"))||0));
  const step=Math.max(15,Math.min(120,Number(await getSetting(db,"slot_step_minutes","30"))||30));
  const now=studioNow();
  const appointments=(await db.prepare("SELECT start_minute,end_minute FROM appointments WHERE day = ? AND id != ? AND status NOT IN ('cancelled','no_show')").bind(day,excludeId).all<{start_minute:number;end_minute:number}>()).results;
  const blocks=(await db.prepare("SELECT start_minute,end_minute FROM blocked_times WHERE day = ?").bind(day).all<{start_minute:number;end_minute:number}>()).results;
  const slots:Slot[]=[];
  for(let minute=hours.open_minute;minute+service.duration_minutes<=hours.close_minute;minute+=step){
    const end=minute+service.duration_minutes;
    if(day<now.day || (day===now.day && minute<=now.minute)) continue;
    if(hours.break_start!==null&&hours.break_end!==null&&minute<hours.break_end&&end>hours.break_start) continue;
    if(blocks.some(b=>minute<b.end_minute&&end>b.start_minute)) continue;
    if(appointments.some(a=>minute<a.end_minute+buffer&&end+buffer>a.start_minute)) continue;
    slots.push({minute,label:toLabel(minute)});
  }
  return slots;
}

export const cleanText=(value:unknown,max=200)=>typeof value==="string"?value.trim().replace(/[\u0000-\u001f<>]/g,"").slice(0,max):"";
export const cleanPhone=(value:unknown)=>typeof value==="string"?value.replace(/\D/g,"").slice(0,15):"";
export function jsonError(message:string,status=400){return Response.json({error:message},{status});}
