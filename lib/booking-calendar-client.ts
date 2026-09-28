import { apiFetch } from "./client-runtime";

export type CalendarSlot={minute:number;label:string};
export type CalendarMonth={days:string[];slotsByDay?:Record<string,CalendarSlot[]>};
const freshness=15_000;
const cache=new Map<string,{data?:CalendarMonth;expires:number;pending?:Promise<CalendarMonth>}>();
const cacheKey=(service:string,month:string)=>`${service}:${month}`;

export function loadCalendarMonth(service:string,month:string):Promise<CalendarMonth>{
  const id=cacheKey(service,month),entry=cache.get(id);
  if(entry?.data && entry.expires>Date.now())return Promise.resolve(entry.data);
  if(entry?.pending)return entry.pending;
  const pending=apiFetch(`/api/calendar?service=${encodeURIComponent(service)}&month=${month}`).then(async response=>{
    const data=await response.json() as CalendarMonth & {error?:string};
    if(!response.ok)throw new Error(data.error??"Falha ao carregar datas");
    return data as CalendarMonth;
  }).then(data=>{cache.set(id,{data,expires:Date.now()+freshness});return data},error=>{cache.delete(id);throw error});
  cache.set(id,{expires:0,pending});
  return pending;
}
export function cachedDaySlots(service:string,day:string):CalendarSlot[]|undefined{
  const entry=cache.get(cacheKey(service,day.slice(0,7)));
  if(!entry?.data?.slotsByDay || entry.expires<=Date.now())return undefined;
  return entry.data.slotsByDay[day]??[];
}
export function invalidateCalendar(service:string,day:string){cache.delete(cacheKey(service,day.slice(0,7)))}
