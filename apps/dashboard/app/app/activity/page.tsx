'use client';
import { ActivityList } from '@/components/ringside/activity';
export default function Page(){return <div><h1 className="app-title">Activity</h1><p className="muted-text">Amounts are decrypted locally by your agent. Public explorers do not show private transfer amounts.</p><section className="card" style={{marginTop:24}}><ActivityList/></section></div>}
