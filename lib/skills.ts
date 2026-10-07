import {lessons} from './curriculum';
import {missionById} from './missions';

import {type SkillId} from './skill-catalog';
export {skillCatalog,skillName,skillLevel,skillProgress} from './skill-catalog';
const reward=(id:SkillId,xp:number)=>({skill:id,points:xp});
export function lessonSkillRewards(id:string){
 const lesson=lessons.find(l=>l.id===id);if(!lesson)return [];
 switch(lesson.track){
  case 'network':return [reward('networking',25),reward('troubleshooting',10)];
  case 'linux':return [reward('linux',25)];
  case 'windows':return [reward('windows',25)];
  case 'it':return [reward('troubleshooting',25)];
  case 'security':case 'web-security':case 'network-security':case 'iam':return [reward('cybersecurity',25)];
  case 'soc':case 'forensics':return [reward('logs',25)];
  case 'response':return [reward('incident',25)];
  default:return [];
 }
}
export function missionSkillRewards(id:string){return missionById(id)?.skillRewards||[]}
