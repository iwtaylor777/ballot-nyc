// Run against a local production build: BASE_URL=http://127.0.0.1:3100 node scripts/check-public-pages.mjs
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:3100';
const plain = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'');
let count=0;
const check=(condition,label)=>{assert.ok(condition,label);count++;};
const pages = await Promise.all(['/', '/plan','/dates','/races','/proposals','/about','/privacy','/quiz','/ballot','/quiz/results','/sitemap.xml'].map(async p=>{
 const r=await fetch(base+p); check(r.status===200,`${p} HTTP 200`); return [p,await r.text()];
}));
const html=Object.fromEntries(pages), plan=plain(html['/plan']);
check(plan.includes('Check your registration.') || plan.includes('Register or check your record.'), 'plan instructions exist in initial HTML');
check(plan.includes('Do I need ID to vote?') && plan.includes('does not automatically make you ineligible'), 'FAQ and nuanced moving guidance exist without JS');
check(html['/plan'].includes('"@type":"FAQPage"'), 'plan structured FAQ exists');
check(!plan.includes('so do it now'), 'no stale address-update instruction');
const races=[...plain(html['/races']).matchAll(/href="(\/race\/[^"?#]+)"/g)].map(m=>m[1]);
check(new Set(races).size===114,'directory links to all 114 existing certified race pages');
for(let i=0;i<races.length;i+=8) await Promise.all(races.slice(i,i+8).map(async p=>{const r=await fetch(base+p);check(r.status===200,`valid race link ${p}`);}));
for(let i=1;i<=5;i++) check(html['/proposals'].includes(`href="#q${i}"`) && html['/proposals'].includes(`id="q${i}"`) && plain(html['/proposals']).includes(`Official abstract for Question <!-- -->${i}`), `proposal ${i} anchor and accessible source label`);
check(plain(html['/quiz']).includes('Not sure / Skip this question'), 'quiz landing renders uncertainty choice in initial HTML');
for (const route of ['/ballot','/quiz/results']) {
 check(/name="robots" content="noindex, follow"/.test(html[route]),`${route} remains noindex`);
 check(!html['/sitemap.xml'].includes(`<loc>https://ballotnyc.org${route}</loc>`), `${route} excluded from sitemap`);
}
for(const route of ['/races','/about','/privacy']) check(html['/sitemap.xml'].includes(`<loc>https://ballotnyc.org${route}</loc>`),`${route} in sitemap`);
for(const [p,body] of pages.filter(([p])=>p!='/sitemap.xml')) check(plain(body).includes('Sources and methodology') && plain(body).includes('Main navigation'),`${p} has consistent navigation and trust links`);
check((await fetch(base+'/race/governor/ush-12')).status===404,'invalid office/district still returns 404');
console.log(`${count} production HTML/link checks passed`);
