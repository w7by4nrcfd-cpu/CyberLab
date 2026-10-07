import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {build}=createRequire(require.resolve('vite/package.json'))('esbuild');
const bundle=await build({entryPoints:['lib/ranks.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {tiers,tierForLevel,rankForXp,rankEvent}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));

assert.equal(tiers.length,7);
for(let i=0;i<tiers.length;i++){
 const tier=tiers[i];
 assert.equal(tierForLevel(tier.minLevel).id,tier.id);
 assert(tier.emblem.outline&&tier.emblem.mark&&tier.emblem.accent);
 if(i)assert.equal(tiers[i-1].maxLevel+1,tier.minLevel);
}
assert.equal(rankForXp(0).level,1);
assert.equal(rankForXp(2595).level,13);
assert.equal(rankForXp(2595).tier.id,'signal');
assert.equal(rankForXp(2595).next.id,'sentinel');
assert.equal(rankForXp(2595).remaining,205);
assert.equal(rankForXp(2595).xp,2595);
assert.equal(rankForXp(2800).tier.id,'sentinel');
assert.equal(rankForXp(3800).tier.id,'horizon');
assert.equal(rankForXp(30000).progress,100);
assert.equal(rankEvent(null,2595),null,'old account hydration should not play retroactive promotions');
assert.equal(rankEvent(2595,2595),null,'refresh or signing in should not replay promotions');
assert.equal(rankEvent(2800,2799),null,'stale state must not announce an increase');
assert.equal(rankEvent(2595,2600).kind,'level');
assert.deepEqual(rankEvent(2595,2600).toLevel,14);
assert.equal(rankEvent(2799,2800).kind,'tier');
assert.equal(rankEvent(2799,2800).toTierId,'sentinel');
assert.equal(rankEvent(195,3000).kind,'tier','multiple levels crossed should generate one current tier event');
assert.equal(rankEvent(195,3000).toTierId,'sentinel');
assert.equal(rankEvent(400,599),null);
console.log('PASS: seven contiguous tiers, level and tier thresholds, existing level 13 account, old-account hydration, refresh, and multi-level promotion.');
