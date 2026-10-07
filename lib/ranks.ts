import {levelFor} from './simulations';

export type Tier={id:string;name:string;minLevel:number;maxLevel:number|null;description:string;emblem:{outline:string;mark:string;accent:string;halo:number};color:string};
// Visual achievements, not credentials or evidence of a professional role.
// The level remains defined by the existing XP system (200 XP per level).
export const tiers:Tier[]=[
 {id:'core',name:'Core',minLevel:1,maxLevel:2,description:'بداية بناء الأساس التقني.',emblem:{outline:'M50 10 82 27 82 73 50 90 18 73 18 27Z',mark:'M50 36a14 14 0 1 0 0 28a14 14 0 1 0 0-28',accent:'M50 17v11 M50 72v11',halo:0},color:'#a7d9bf'},
 {id:'vector',name:'Vector',minLevel:3,maxLevel:4,description:'خطوات أكثر ثباتًا في التطبيق.',emblem:{outline:'M50 8 88 50 50 92 12 50Z',mark:'M29 58 49 31 71 58 M37 66h26',accent:'M50 11v13 M16 50h13 M71 50h13',halo:1},color:'#a6cadf'},
 {id:'circuit',name:'Circuit',minLevel:5,maxLevel:7,description:'تجارب متصلة ونتائج متراكمة.',emblem:{outline:'M31 8h38l23 23v38L69 92H31L8 69V31Z',mark:'M35 35h30v30H35z M50 35v30 M35 50h30',accent:'M50 13v13 M13 50h13 M74 50h13 M50 74v13',halo:2},color:'#c0d1ea'},
 {id:'protocol',name:'Protocol',minLevel:8,maxLevel:10,description:'منهج واضح للتحقق واتخاذ الخطوات.',emblem:{outline:'M50 6 84 17 94 50 84 83 50 94 16 83 6 50 16 17Z',mark:'M32 37h36 M32 50h36 M32 63h36 M40 30v40 M60 30v40',accent:'M50 10v13 M10 50h13 M77 50h13 M50 77v13',halo:3},color:'#b9dfd5'},
 {id:'signal',name:'Signal',minLevel:11,maxLevel:14,description:'نطاق إنجاز أوسع عبر أنشطة المنصة.',emblem:{outline:'M50 6 76 13 90 31 90 69 76 87 50 94 24 87 10 69 10 31 24 13Z',mark:'M27 57h12l8-18 10 26 7-13h10 M50 30v-9 M50 79v-9',accent:'M24 25l9 9 M76 25l-9 9 M24 75l9-9 M76 75l-9-9',halo:4},color:'#d7e6b8'},
 {id:'sentinel',name:'Sentinel',minLevel:15,maxLevel:19,description:'استمرارية عالية في الإنجاز والتدريب.',emblem:{outline:'M50 5 81 15 94 39 88 72 68 91 32 91 12 72 6 39 19 15Z',mark:'M50 25 70 35v20q0 15-20 24-20-9-20-24V35z M50 35v32 M37 49h26',accent:'M50 8v11 M19 33l10 7 M81 33l-10 7 M26 78l10-8 M74 78l-10-8',halo:5},color:'#e6cfaa'},
 {id:'horizon',name:'Horizon',minLevel:20,maxLevel:null,description:'أعلى نطاق بصري متاح حاليًا.',emblem:{outline:'M50 4 72 9 89 23 96 49 89 77 72 91 50 96 28 91 11 77 4 49 11 23 28 9Z',mark:'M22 59q28-43 56 0 M30 67q20-25 40 0 M50 35v45 M38 78h24',accent:'M50 6v13 M14 26l12 8 M86 26l-12 8 M9 50h12 M79 50h12 M22 80l12-9 M78 80l-12-9',halo:6},color:'#e8cfb0'}
];
export const tierForLevel=(level:number)=>tiers.findLast(t=>level>=t.minLevel)||tiers[0];
export function rankForXp(xp:number){const safe=Math.max(0,Math.floor(Number.isFinite(xp)?xp:0)),level=levelFor(safe),tier=tierForLevel(level),next=tiers[tiers.indexOf(tier)+1]||null,nextXp=next?(next.minLevel-1)*200:null,baseXp=(tier.minLevel-1)*200;
 return {xp:safe,level,tier,next,nextXp,progress:nextXp===null?100:Math.max(0,Math.min(100,Math.round((safe-baseXp)/(nextXp-baseXp)*100))),remaining:nextXp===null?0:nextXp-safe};}
export type RankEvent={kind:'level';fromLevel:number;toLevel:number;xp:number}|{kind:'tier';fromLevel:number;toLevel:number;fromTierId:string;toTierId:string;xp:number};
export function rankEvent(previousXp:number|null,nextXp:number):RankEvent|null{
 if(previousXp===null||!Number.isFinite(previousXp)||!Number.isFinite(nextXp)||nextXp<=previousXp)return null;
 const before=rankForXp(previousXp),after=rankForXp(nextXp);
 if(after.tier.id!==before.tier.id)return {kind:'tier',fromLevel:before.level,toLevel:after.level,fromTierId:before.tier.id,toTierId:after.tier.id,xp:after.xp};
 if(after.level>before.level)return {kind:'level',fromLevel:before.level,toLevel:after.level,xp:after.xp};
 return null;
}
