import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild');
async function load(entry) {
  const output = await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}
const {tracks,lessons,labs} = await load('lib/curriculum.ts');
const {paths} = await load('lib/paths.ts');
const {trackHref,pathHref,lessonHref,labHref,labTracks,destinationExists} = await load('lib/navigation.ts');

test('every rendered curriculum card has a matching ID and dynamic page', () => {
  const ids = new Set();
  for (const [kind,rows,href] of [['tracks',tracks,trackHref],['paths',paths,pathHref],['lessons',lessons,lessonHref],['labs',labs,labHref]]) {
    for (const row of rows) {
      assert(!ids.has(`${kind}:${row.id}`),`duplicate ${kind} ID ${row.id}`);
      ids.add(`${kind}:${row.id}`);
      assert(destinationExists(href(row.id)),`${kind} card broken: ${row.id}`);
    }
  }
  for (const file of ['app/tracks/[id]/page.tsx','app/paths/[id]/page.tsx','app/learn/[id]/page.tsx','app/labs/[id]/page.tsx']) assert(existsSync(file),`${file} missing`);
  assert(!destinationExists('/labs/missing'));
  assert(!destinationExists('/tracks/missing'));
  assert(!destinationExists('/paths/missing'));
});

test('every learning path and linked challenge resolves to a real track or lab', () => {
  const trackIds = new Set(tracks.map(t => t.id));
  const labIds = new Set(labs.map(l => l.id));
  assert.equal(Object.keys(labTracks).length,labs.length,'each lab needs a track association');
  for (const path of paths) for (const id of path.tracks) assert(trackIds.has(id),`${path.id}: ${id}`);
  for (const lesson of lessons) assert(trackIds.has(lesson.track),`${lesson.id}: ${lesson.track}`);
  for (const [id,related] of Object.entries(labTracks)) {
    assert(labIds.has(id),`unknown challenge ${id}`);
    assert(related.length,`${id} has no related track`);
    for (const track of related) {
      assert(trackIds.has(track),`${id}: ${track}`);
      assert(destinationExists(labHref(id,track)));
      assert.equal(new URL(labHref(id,track),'https://cyberlab.example').searchParams.get('track'),track);
    }
  }
});
