export type AvailabilityHour = { open_minute:number; close_minute:number; break_start:number|null; break_end:number|null };
export type TimeRange = { start_minute:number; end_minute:number };
export type AvailableSlot = { minute:number; label:string };

// A single calculation is shared by the month view and reservation validation.
export function calculateSlots(day:string, duration:number, hours:AvailabilityHour|undefined, appointments:TimeRange[], blocks:TimeRange[], buffer:number, step:number, now:{day:string;minute:number}):AvailableSlot[] {
  if (!hours || duration<15 || day<now.day) return [];
  const slots:AvailableSlot[]=[];
  for(let minute=hours.open_minute;minute+duration<=hours.close_minute;minute+=step){
    const end=minute+duration;
    if(day===now.day && minute<=now.minute) continue;
    if(hours.break_start!==null&&hours.break_end!==null&&minute<hours.break_end&&end>hours.break_start) continue;
    if(blocks.some(b=>minute<b.end_minute&&end>b.start_minute)) continue;
    if(appointments.some(a=>minute<a.end_minute+buffer&&end+buffer>a.start_minute)) continue;
    slots.push({minute,label:`${String(Math.floor(minute/60)).padStart(2,"0")}:${String(minute%60).padStart(2,"0")}`});
  }
  return slots;
}
