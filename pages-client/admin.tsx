import { createRoot } from "react-dom/client";
import { useEffect,useRef,useState } from "react";
import AdminDashboard from "../app/admin/panel";
import { connectAdmin,siteHref } from "../lib/client-runtime";
import "../app/globals.css";
function Admin(){
  const [email,setEmail]=useState(""),[error,setError]=useState(""),[waiting,setWaiting]=useState(false);
  const cleanup=useRef<(()=>void)|null>(null);
  useEffect(()=>()=>cleanup.current?.(),[]);
  const connect=()=>{cleanup.current?.();setError("");setWaiting(true);cleanup.current=connectAdmin(value=>{setEmail(value);setWaiting(false)},message=>{setError(message);setWaiting(false)})};
  if(email)return <><AdminDashboard email={email}/><button className="pages-reconnect" onClick={connect}>Reconectar conta</button></>;
  return <main className="admin-gate"><h1>Área da profissional</h1><p>Entre com sua conta autorizada para gerenciar reservas, clientes, serviços e horários.</p><button className="button-main" onClick={connect}>{waiting?"Já entrei, conectar painel":"Entrar com ChatGPT"}</button>{waiting&&<p role="status">Conclua o login na janela aberta. Se o painel não aparecer, clique em conectar painel.</p>}{error&&<p role="alert">{error}</p>}<a href={siteHref("/")}>Voltar ao site</a></main>;
}
createRoot(document.getElementById("app")!).render(<Admin/>);
