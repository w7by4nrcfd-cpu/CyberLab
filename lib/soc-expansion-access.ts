import {database} from './storage';
import {isDefensiveId} from './soc-expansion';
export async function defensiveAccess(userId:string,id:string){
 if(!isDefensiveId(id))return false;
 const rows=await database().prepare('SELECT alert_id AS id,closed_at AS closedAt,session_json AS sessionJson FROM soc_investigations WHERE user_id=? AND alert_id IN (?,?)').bind(userId,'SOC-002',id).all<{id:string;closedAt:string|null;sessionJson:string}>();
 return rows.results.some(r=>{if(r.id===id){try{return !!r.closedAt||JSON.parse(r.sessionJson).defensiveStarted===true}catch{return !!r.closedAt}}if(!r.closedAt)return false;try{return JSON.parse(r.sessionJson).lastResult?.correct===true}catch{return false}});
}
