import { answerKey } from './answer-key';
import {extraLessons} from './expanded';
import {challenges} from './extra-labs';
import {gradeAppliedQuiz} from './applied-grading';
import {gradeDeepPracticeQuiz} from './deep-practice-grading';
export function gradeQuiz(id: string, answers: unknown) {
    const deep=gradeDeepPracticeQuiz(id,answers);
    if(deep)return deep;
    const applied=gradeAppliedQuiz(id,answers);
    if(applied)return applied;
    const advanced=extraLessons.find(l=>l.id===id);
    if(advanced){
      if(!Array.isArray(answers)||answers.length!==3)throw Error('أجب عن جميع الأسئلة.');
      const feedback=advanced.questions.map((q,i)=>{
       const ordinal=Number(advanced.id.split('-').at(-1))-1;
       const expected: number|number[]|string = i<2?(ordinal+i)%3:q.type==='truefalse'?0:q.type==='multi'?[0,1]:q.type==='order'?[0,1,2]:advanced.terms![0].en;
       const chosen=answers[i];
       const correct=Array.isArray(expected)?Array.isArray(chosen)&&expected.length===chosen.length&&expected.every((v,j)=>q.type==='multi'?chosen.includes(v):chosen[j]===v):typeof expected==='string'?typeof chosen==='string'&&chosen.trim().toLocaleLowerCase()===expected.toLocaleLowerCase():chosen===expected;
       const explanation=i===0?`التعريف الصحيح: ${advanced.intro} الخيارات الأخرى تسمي مفاهيم مختلفة.`:i===1?`المثال يرتبط بـ ${advanced.title}: ${advanced.sections.find(s=>s.title==='مثال عملي')!.text} ولا يصف البدائل.`:q.type==='multi'?`المصطلحان ${advanced.title} و${advanced.terms![0].en} يشيران إلى المفهوم نفسه؛ البقية مفاهيم أخرى.`:q.type==='order'?`الترتيب: ${q.options.join('، ثم ')}.`:q.type==='practical'?`المصطلح الإنجليزي هو ${advanced.terms![0].en}.`:`العبارة صحيحة: ${advanced.intro}`;
       return {correct,answer:expected,chosen,explanation,topic:advanced.title,options:q.options};
      });
      const score=feedback.filter(f=>f.correct).length;
      return {score,total:3,passed:score>=2,feedback,reviewTopics:feedback.filter(f=>!f.correct).map(f=>f.topic)};
    }
    const questions = answerKey[id as keyof typeof answerKey];
    const lesson = questions ? { questions } : undefined;
    if (!lesson || !Array.isArray(answers) || answers.length !== lesson.questions.length || answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= lesson.questions[i].options.length))
        throw new Error('أجب عن جميع الأسئلة باختيارات صالحة.');
    const feedback = lesson.questions.map((q, i) => ({ correct: answers[i] === q.answer, answer: q.answer, chosen: answers[i], explanation: q.explanation, topic:q.prompt, options:q.options }));
    const score = feedback.filter(f => f.correct).length;
    return { score, total: feedback.length, passed: score >= 2, feedback, reviewTopics:feedback.filter(f=>!f.correct).map(f=>f.topic) };
}
export function gradeLab(id: string, input: unknown) {
    const a = input as Record<string, unknown> | null;
    if (!a || typeof a !== 'object')
        throw Error('مدخلات غير صالحة.');
    const challenge=challenges.find(c=>c.id===id);
    if(challenge)return {passed:a.answer===challenge.answer,message:challenge.explanation};
    if (id === 'caesar')
        return { passed: typeof a.answer === 'string' && a.answer.trim().toUpperCase() === 'HELLO', message: 'KHOOR بإزاحة عكسية قدرها 3 تصبح HELLO. قيصر للتعلم فقط.' };
    if (id === 'firewall')
        return { passed: Array.isArray(a.ports) && a.ports.length === 1 && a.ports[0] === 443, message: 'المطلوب السماح بـ TCP 443 فقط ومنع 23 و80. هذا يحقق سياسة المختبر للويب المشفر.' };
    if (id === 'phishing')
        return { passed: a.action === 'verify' && a.clue === 'code', message: 'طلب رمز التحقق هو الإشارة الحاسمة. تحقق عبر التطبيق الرسمي ولا ترسل الرمز.' };
    throw Error('المختبر غير موجود.');
}
