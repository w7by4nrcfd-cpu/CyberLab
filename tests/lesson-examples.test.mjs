// Verify the new command examples against real tools in disposable fixtures.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const b=await build({entryPoints:['lib/curriculum.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'}),{lessons}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const directory=await mkdtemp(join(tmpdir(),'cyberlab-lesson-examples-'));
try{
 const student=join(directory,'home/student'),audit=join(directory,'srv/audit');await mkdir(student,{recursive:true});await mkdir(audit,{recursive:true});
 await writeFile(join(student,'notes.txt'),'hello world\n');await writeFile(join(student,'.config'),'training=true\n');await writeFile(join(audit,'report.txt'),'service=audit-worker\nstatus=running\nchecked_at=2026-10-07T09:00:00Z\n');await writeFile(join(student,'secret.txt'),'training secret\n');
 const lesson=id=>lessons.find(l=>l.id===id);
 const run=code=>execFileSync('bash',['--noprofile','--norc','-c',code],{cwd:student,encoding:'utf8',timeout:3000,env:{...process.env,LC_ALL:'C'}}).trimEnd();
 const adapt=code=>code.replaceAll('/srv/audit',audit).replaceAll('/home/student',student);
 assert.equal(run(lesson('linux-3').code),student);
 assert.equal(run(adapt(lesson('linux-5').code)),audit+'\n'+join(directory,'srv'));
 assert.equal(run(adapt(lesson('linux-6').code)),lesson('linux-6').output,'cat result matches the lesson fixture');
 const listing=run(adapt(lesson('linux-4').code));assert(listing.includes('notes.txt')&&listing.includes('.config'));assert(!run('ls').includes('.config'),'hidden-name example agrees with actual default listing');
 const after=run(lesson('linux-8').code);assert(after.startsWith('-rw-------'));assert.equal((await stat(join(student,'secret.txt'))).mode&0o777,0o600);
 let processCheck='passed';
 try{const processes=run(lesson('linux-9').code);assert(processes.split('\n')[0].trim().match(/^USER\s+PID\s+COMMAND$/));assert(processes.split('\n').length>1)}catch(error){if(error.status===1&&String(error.stderr).includes('fatal library error, lookup self')){processCheck='blocked: runtime cannot expose its own process table';console.warn('BLOCKED: ps execution in this managed runtime; syntax reviewed against the original procps manual.')}else throw error}
 // Arithmetic verifies the subnet examples without requiring live networks.
 const ip=s=>s.split('.').reduce((a,n)=>(a*256+Number(n))>>>0,0),subnet=s=>(ip(s)&ip('255.255.255.0'))>>>0;
 assert.equal(subnet('192.168.10.20'),subnet('192.168.10.50'));assert.notEqual(subnet('192.168.10.20'),subnet('192.168.20.50'));assert.notEqual(subnet('192.168.10.20'),subnet('192.168.11.50'));
 // Parse the learner-visible timeline and its reflection example, including offset.
 const rows=lesson('soc-8').code.split('\n').map(row=>({at:Date.parse('2026-10-07T'+row.split(' | ')[0].replace('Z',':00Z')),session:row.split('session: ')[1]}));
 assert(rows.every(r=>Number.isFinite(r.at)));assert(rows[0].at<rows[1].at&&rows[1].at<rows[2].at);assert.equal(rows[1].session,rows[2].session);assert.notEqual(rows[0].session,rows[1].session);
 const offset=Date.parse('2026-10-07T05:04:00+03:00');assert(rows[1].at<offset&&offset<rows[2].at);
 console.log('PASS: actual pwd/cd/ls/cat/chmod examples in disposable fixtures, /24 address arithmetic and parsed UTC/session timeline. ps execution: '+processCheck+'. Sample accounts/process IDs are illustrative, not live lab output.');
}finally{await rm(directory,{recursive:true,force:true})}
