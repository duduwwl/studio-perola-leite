import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { isAdmin } from "@/lib/admin-auth";
import Bridge from "./bridge";
export const dynamic = "force-dynamic";
export const metadata = {title:"Conectar administração | Studio Pérola Leite"};
async function AuthenticatedBridge(){
  const user = await requireChatGPTUser("/admin/bridge");
  const authorized = await isAdmin();
  return <Bridge authorized={authorized} email={authorized?user.email:""}/>;
}
export default function BridgePage(){return <AuthenticatedBridge/>}
