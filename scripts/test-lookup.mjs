import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const src=ts.transpileModule(fs.readFileSync(new URL('../lib/geocode.ts',import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {lookupAddress}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const original=globalThis.fetch;
let count=0;
try {
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await assert.rejects(()=>lookupAddress({address:'350 5th Ave'}),/Failed to fetch/);count++;
  globalThis.fetch=async()=>new Response(JSON.stringify({status:'not_found',message:'No exact address'}),{status:200});
  assert.equal((await lookupAddress({address:'9999 Bond St'})).status,'not_found');count++;
  globalThis.fetch=async()=>new Response(JSON.stringify({status:'error',message:'Service timed out'}),{status:502});
  assert.equal((await lookupAddress({address:'350 5th Ave'})).kind,'service');count++;
  globalThis.fetch=async()=>new Response(JSON.stringify({status:'error',message:'Type your address'}),{status:400});
  assert.equal((await lookupAddress({address:'x'})).kind,'input');count++;
  globalThis.fetch=async()=>new Response('<html>upstream unavailable</html>',{status:502});
  assert.equal((await lookupAddress({address:'350 5th Ave'})).kind,'service');count++;
  const choice={status:'choose',reason:'ambiguous',message:'Which borough?',choices:[{label:'350 5th Avenue, Manhattan'},{label:'350 5th Avenue, Brooklyn'}]};
  globalThis.fetch=async(url,init)=>{
    assert.equal(url,'/api/geocode');assert.equal(init.method,'POST');assert.deepEqual(JSON.parse(init.body),{address:'350 5th Ave'});
    return new Response(JSON.stringify(choice),{status:200});
  };
  assert.deepEqual(await lookupAddress({address:'350 5th Ave'}),choice);count++;
} finally {globalThis.fetch=original;}
console.log(`${count} lookup transport/error checks passed`);
