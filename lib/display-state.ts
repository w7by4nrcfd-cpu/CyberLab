export type DisplayState = {id:string;completedAt:string|null;session?:{replaying?:boolean}};

// A replay is a new attempt on a completed record, not a reversal of completion.
export function groupByDisplayState<T extends {id:string}>(entries:T[],states:DisplayState[]){
 const byId=new Map(states.map(state=>[state.id,state]));
 return {
  active:entries.filter(entry=>{const state=byId.get(entry.id);return !!state&&!state.completedAt}),
  available:entries.filter(entry=>!byId.has(entry.id)),
  completed:entries.filter(entry=>!!byId.get(entry.id)?.completedAt),
 };
}
