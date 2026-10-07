import type {AnswerRule} from './missions';

export function normalizeAnswer(value:string){
 return value.normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
function containsPhrase(answer:string,phrase:string){const term=normalizeAnswer(phrase),padded=' '+answer+' ';return !!term&&(padded.includes(' '+term+' ')||(/[\u0600-\u06ff]/.test(term[0])&&padded.includes(' و'+term+' ')))}
export function acceptsAnswer(input:string,rule:AnswerRule){
 const answer=normalizeAnswer(input);
 if(!answer)return false;
 if([...rule.acceptedAnswers,...rule.aliases||[]].some(value=>answer===normalizeAnswer(value)))return true;
 return (rule.keywords||[]).some(pattern=>pattern.all.every(group=>group.some(word=>containsPhrase(answer,word)))&&!(pattern.none||[]).some(word=>containsPhrase(answer,word)));
}
