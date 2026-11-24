import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from './engine.mjs';
import {sample} from './sample.mjs';
test('domain behavior and boundary cases',()=>{assert.equal(run(sample).metrics.forbidden,1);assert.equal(run({...sample,imports:[{from:'missing',to:'db'}]}).metrics.unmapped,1);assert.equal(run({...sample,imports:[]}).metrics.edges,0);});
test('deterministic result and input preservation',()=>{const copy=JSON.stringify(sample);assert.deepEqual(run(sample),run(sample));assert.equal(JSON.stringify(sample),copy);});
test('reject malformed root and oversized input',()=>{assert.throws(()=>run(null));assert.throws(()=>run([]));assert.throws(()=>run({...sample,oversized:'x'.repeat(200001)}));});

test('allowed layer edges can still form a cycle',()=>{
 const r=run({layers:{a:'same',b:'same'},allowed:[],imports:[{from:'a',to:'b'},{from:'b',to:'a'}]});
 assert.equal(r.metrics.forbidden,0);assert.equal(r.metrics.cycleGroups,1);
 assert.deepEqual(r.cycles,[{members:['a','b'],witness:['a','b','a']}]);
});
test('self loops and unmapped modules remain visible',()=>{
 const r=run({layers:{},allowed:[],imports:[{from:'x',to:'x'}]});
 assert.equal(r.metrics.unmapped,1);assert.deepEqual(r.cycles[0],{members:['x'],witness:['x','x']});
});
test('one-way bridges do not merge independent cycles',()=>{
 const imports=[['a','b'],['b','a'],['b','c'],['c','d'],['d','c']].map(([from,to])=>({from,to}));
 const r=run({layers:{},allowed:[],imports});
 assert.deepEqual(r.cycles.map(c=>c.members),[['a','b'],['c','d']]);
 assert.deepEqual(run({layers:{},allowed:[],imports:imports.reverse()}).cycles,r.cycles);
});
test('duplicate edges do not duplicate groups; acyclic graphs have none',()=>{
 assert.deepEqual(run(sample).cycles,[]);
 const e={from:'x',to:'x'};
 assert.equal(run({layers:{},allowed:[],imports:[e,e]}).cycles.length,1);
});
test('all 512 three-node graphs yield valid cycle witnesses and correct membership',()=>{
 const nodes=['a','b','c'],possible=nodes.flatMap(from=>nodes.map(to=>({from,to})));
 for(let mask=0;mask<512;mask++){
  const imports=possible.filter((_,i)=>mask&(1<<i));
  const r=run({layers:{},allowed:[],imports});
  // Independent transitive-closure matrix oracle.
  const reach=nodes.map(a=>nodes.map(b=>imports.some(e=>e.from===a&&e.to===b)));
  for(let k=0;k<3;k++)for(let i=0;i<3;i++)for(let j=0;j<3;j++)reach[i][j] ||= reach[i][k]&&reach[k][j];
  const actual=new Set(r.cycles.flatMap(c=>c.members));
  nodes.forEach((n,i)=>assert.equal(actual.has(n),reach[i][i]));
  for(const group of r.cycles){
   assert.equal(group.witness[0],group.witness.at(-1));
   for(let i=1;i<group.witness.length;i++)assert.ok(imports.some(e=>e.from===group.witness[i-1]&&e.to===group.witness[i]));
   for(const a of group.members)for(const b of group.members)assert.ok(reach[nodes.indexOf(a)][nodes.indexOf(b)]);
  }
 }
});
