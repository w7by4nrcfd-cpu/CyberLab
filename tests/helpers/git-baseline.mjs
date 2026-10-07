import {execFileSync} from 'node:child_process';

// Some suites compare against commits from the project's original development
// history. That history was not imported into this repository, so those
// comparisons only run when the baseline commit is actually available.
export function hasCommit(sha){
  try{execFileSync('git',['cat-file','-e',sha+'^{commit}'],{stdio:'ignore'});return true}catch{return false}
}
export function skipBaseline(sha,what){
  console.log(`SKIP: ${what} (baseline commit ${sha.slice(0,8)} is not in this repository's history)`);
}
