"use client";
import { useEffect, useState } from "react";
const pagesOrigin="https://duduwwl.github.io";
export default function Bridge({authorized,email}:{authorized:boolean;email:string}){
  const [connected,setConnected]=useState(false);
  useEffect(()=>{
    const opener=window.opener;
    if(!opener)return;
    const announce=()=>opener.postMessage({channel:"perola-admin",type:authorized?"ready":"denied",email},pagesOrigin);
    const listener=async(event:MessageEvent)=>{
      if(!authorized||event.origin!==pagesOrigin||event.source!==opener||event.data?.channel!=="perola-admin"||event.data.type!=="request")return;
      const {id,path,method,body}=event.data;
      if(typeof id!=="string"||id.length>80||typeof path!=="string"||!/^\/api\/admin(?:\?|$)/.test(path)||!["GET","POST"].includes(method))return;
      try{
        const response=await fetch(path,{method,credentials:"same-origin",headers:{"content-type":"application/json"},...(method==="POST"?{body}:{} )});
        const result=await response.json();
        opener.postMessage({channel:"perola-admin",type:"response",id,status:response.status,body:result},pagesOrigin);
        setConnected(true);
      }catch{opener.postMessage({channel:"perola-admin",type:"response",id,status:503,body:{error:"Não foi possível conectar à agenda."}},pagesOrigin)}
    };
    window.addEventListener("message",listener);announce();
    return()=>window.removeEventListener("message",listener);
  },[authorized,email]);
  return <main className="admin-gate"><h1>{authorized?"Conta conectada":"Acesso restrito"}</h1><p>{authorized?"Volte à aba do painel para gerenciar a agenda. Mantenha esta janela aberta durante o uso.":"Entre com a conta administradora autorizada."}</p>{connected&&<p role="status">Conexão com o painel ativa.</p>}<a className="button-main" href="/admin">Abrir administração aqui</a></main>;
}
