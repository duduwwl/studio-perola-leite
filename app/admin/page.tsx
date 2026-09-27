import { env } from "cloudflare:workers";
import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import AdminDashboard from "./panel";

export const dynamic="force-dynamic";
export const metadata={title:"Administração | Studio Pérola Leite"};
export default async function AdminPage(){
  const user=await getChatGPTUser();
  if(!user)return <div className="admin-gate"><h1>Área da profissional</h1><p>Entre com a conta autorizada para gerenciar a agenda.</p><a className="button-main" href={chatGPTSignInPath("/admin")} target="_top">Entrar com ChatGPT</a><a href="/">Voltar ao site</a></div>;
  const allowed=env.ADMIN_EMAIL?.trim().toLowerCase();
  if(!allowed)return <div className="admin-gate"><h1>Configuração administrativa pendente</h1><p>O e-mail da conta administradora ainda precisa ser configurado. Nenhum acesso à agenda ou aos dados das clientes foi liberado.</p><a href="/">Voltar ao site</a></div>;
  if(user.email.toLowerCase()!==allowed)return <div className="admin-gate"><h1>Acesso restrito</h1><p>Esta conta não está autorizada a administrar o Studio.</p><a href="/">Voltar ao site</a></div>;
  return <AdminDashboard email={user.email}/>;
}
