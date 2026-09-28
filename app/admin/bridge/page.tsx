import { requireChatGPTUser, getChatGPTUser } from "@/app/chatgpt-auth";
import { isAdmin } from "@/lib/admin-auth";
import Bridge from "./bridge";
export const dynamic = "force-dynamic";
export const metadata = {title:"Conectar administração | Studio Pérola Leite"};
async function AuthenticatedBridge({embedded}:{embedded:boolean}){
  const user = embedded?await getChatGPTUser():await requireChatGPTUser("/admin/bridge");
  const authorized = await isAdmin();
  return <Bridge authorized={authorized} email={authorized&&user?user.email:""} anonymous={!user}/>;
}
export default async function BridgePage({searchParams}:{searchParams:Promise<{embed?:string}>}){const params=await searchParams;return <AuthenticatedBridge embedded={params?.embed==="1"}/>}
