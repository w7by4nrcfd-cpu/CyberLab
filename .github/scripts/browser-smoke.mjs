// Opens key pages of the locally served production build in Chromium (desktop
// and mobile), saves screenshots, and fails on server errors, uncaught page
// errors or console errors. Guest session only: sign-in is provided by the
// hosting platform and is not available here.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';

const require=createRequire(process.env.PLAYWRIGHT_DIR+'/');
const {chromium}=require('playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:8787';
const out=process.env.OUT_DIR||'smoke-screenshots';
const pages=[['home','/'],['learn','/learn'],['lesson','/learn/network-1'],['roadmap','/roadmap'],['labs','/labs'],['lab','/labs/v2/v2-network'],['missions','/missions'],['soc','/soc'],['progress','/progress'],['guide','/guide']];
const viewports=[['desktop',{width:1366,height:900}],['mobile',{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}]];

await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const problems=[];
for(const [vpName,vp] of viewports){
  const {width,height,...rest}=vp;
  const context=await browser.newContext({viewport:{width,height},...rest,locale:'ar'});
  for(const [name,path] of pages){
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push('pageerror: '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
    const res=await page.goto(base+path,{waitUntil:'networkidle',timeout:60000});
    const status=res?.status()??0;
    await page.waitForTimeout(500);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    await page.screenshot({path:`${out}/${vpName}-${name}.png`,fullPage:false});
    const title=await page.title();
    console.log(`${vpName.padEnd(7)} ${String(status).padEnd(3)} ${path.padEnd(22)} overflowX=${overflow}px title="${title}"${errors.length?' errors='+errors.length:''}`);
    for(const e of errors)console.log('    '+e.slice(0,300));
    if(status>=400)problems.push(`${vpName} ${path}: HTTP ${status}`);
    if(errors.length)problems.push(`${vpName} ${path}: ${errors.length} page/console error(s)`);
    if(vpName==='mobile'&&overflow>1)problems.push(`${vpName} ${path}: horizontal overflow ${overflow}px`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if(problems.length){console.log('\nProblems:\n'+problems.map(p=>' - '+p).join('\n'));process.exit(1)}
console.log('\nAll pages loaded without server, page or console errors.');
