
function obj(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Expected an object');return v;}
function arr(v,label='array'){if(!Array.isArray(v)||v.length>500)throw Error(label+' must be an array with at most 500 items');return v;}
function str(v){if(typeof v!=='string'||!v.trim()||v.length>100000)throw Error('Expected nonempty text (max 100000 characters)');return v;}
function num(v,label='number',min=-1e12){if(typeof v!=='number'||!Number.isFinite(v)||v<min||Math.abs(v)>1e12)throw Error(label+' must be a finite number in range');return v;}
function bool(v){if(typeof v!=='boolean')throw Error('Expected a boolean');return v;}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Expected YYYY-MM-DD');const t=Date.parse(v+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return t;}
export function run(x){obj(x);if(JSON.stringify(x).length>200000)throw Error('Input exceeds 200 KB limit');

obj(x.layers);for(const v of Object.values(x.layers))str(v);const allowed=new Set(arr(x.allowed,'allowed').map(e=>{str(e.from);str(e.to);return JSON.stringify([e.from,e.to]);}));const rows=arr(x.imports,'imports').map(e=>{str(e.from);str(e.to);const from=x.layers[e.from],to=x.layers[e.to];const known=Object.hasOwn(x.layers,e.from)&&Object.hasOwn(x.layers,e.to);return {from:e.from,to:e.to,sourceLayer:known?from:'unknown',targetLayer:known?to:'unknown',result:!known?'unmapped':from===to||allowed.has(JSON.stringify([from,to]))?'allowed':'forbidden'};});const cycles = cycleGroups(rows);
return {metrics:{edges:rows.length,forbidden:rows.filter(r=>r.result==='forbidden').length,unmapped:rows.filter(r=>r.result==='unmapped').length,cycleGroups:cycles.length},rows,cycles};

}


// Reachability groups are bounded by the 500 supplied import edges.
function cycleGroups(rows) {
  const adjacency = new Map();
  for (const {from,to} of rows) {
    if (!adjacency.has(from)) adjacency.set(from,new Set());
    if (!adjacency.has(to)) adjacency.set(to,new Set());
    adjacency.get(from).add(to);
  }
  const nodes = [...adjacency.keys()].sort();
  const graph = new Map(nodes.map(node=>[node,[...adjacency.get(node)].sort()]));
  const reach = new Map();
  for (const start of nodes) {
    const seen=new Set([start]), queue=[start];
    for(let i=0;i<queue.length;i++) for(const next of graph.get(queue[i]))
      if(!seen.has(next)){seen.add(next);queue.push(next);}
    reach.set(start,seen);
  }
  const assigned=new Set(), groups=[];
  for(const start of nodes) {
    if(assigned.has(start)) continue;
    const members=nodes.filter(node=>reach.get(start).has(node)&&reach.get(node).has(start));
    members.forEach(node=>assigned.add(node));
    if(members.length===1&&!adjacency.get(start).has(start))continue;
    // Deterministic shortest nonempty return path from the group's first node.
    const queue=[[start]], seen=new Set([start]); let witness=null;
    for(let i=0;i<queue.length&&!witness;i++) {
      const path=queue[i];
      for(const next of graph.get(path.at(-1))) {
        if(next===start){witness=[...path,start];break;}
        if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}
      }
    }
    groups.push({members,witness});
  }
  return groups;
}
