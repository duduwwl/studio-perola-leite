"use client";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
const photos=[
  ["estrelas","Nail art com estrelas"],["vinho","Esmaltação em tom vinho"],["colorido","Nail art colorida"],
  ["glitter","Unhas rosa com brilho"],["nail-art","Nail art em tons pastel"],["verde","Esmaltação verde decorada"]
];
export default function Gallery(){const [selected,setSelected]=useState<(typeof photos)[number]|null>(null);return <><div className="gallery-grid">{photos.map(([name,label])=><button className="gallery-photo" key={name} onClick={()=>setSelected([name,label])} aria-label={`Ampliar ${label}`}><Image src={`/images/${name}.webp`} alt={label} fill sizes="(max-width: 700px) 45vw, 16vw"/></button>)}</div><Dialog open={!!selected} onOpenChange={open=>{if(!open)setSelected(null)}}><DialogContent className="gallery-dialog"><DialogTitle>{selected?.[1]}</DialogTitle>{selected&&<div className="gallery-dialog-photo"><Image src={`/images/${selected[0]}.webp`} alt={selected[1]} fill sizes="80vw"/></div>}</DialogContent></Dialog></>}
