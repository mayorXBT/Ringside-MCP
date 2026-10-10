import { HostedGateway } from '@/components/ringside/hosted-gateway';
import { HostedApp } from '@/components/ringside/hosted-app';
import { sessionOwner } from '@/lib/hosted/http';
export default async function Layout({children}:{children:React.ReactNode}){let owner: string|undefined;try{owner=await sessionOwner()}catch{}return owner?<HostedApp/>:<HostedGateway>{children}</HostedGateway>}
