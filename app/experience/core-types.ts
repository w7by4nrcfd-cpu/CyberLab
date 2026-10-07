import type {BoardDecision,BoardDefinition,RelationshipType} from '@/lib/investigation-board';
import type {SocSession} from '@/lib/soc-engine';
import type {Severity} from '@/lib/soc-alerts';
export type CoreBoardData={board:Omit<BoardDefinition,'expected'|'allowedLinks'>;workspace:{status:string;decision:BoardDecision|null};evidence:{evidenceId:string;reviewedAt:string|null;collectedAt:string|null;note:string;classification:string|null}[];links:{fromId:string;relation:RelationshipType;toId:string;reason:string}[]};
export type CoreSocData={alert:{id:string;title:string;summary:string;scenario:string;severity:Severity;user:string;host:string;sourceIp:string;evidence:{id:string;title:string;time:string;content:string|null}[];tools:{id:string;label:string;description:string}[]};state:{closedAt:string|null;bestScore:number;session:SocSession}|null;skillAwarded:boolean};
