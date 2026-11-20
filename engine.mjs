
function obj(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Expected an object');return v;}
function arr(v,label='array'){if(!Array.isArray(v)||v.length>500)throw Error(label+' must be an array with at most 500 items');return v;}
function str(v){if(typeof v!=='string'||!v.trim()||v.length>100000)throw Error('Expected nonempty text (max 100000 characters)');return v;}
function num(v,label='number',min=-1e12){if(typeof v!=='number'||!Number.isFinite(v)||v<min||Math.abs(v)>1e12)throw Error(label+' must be a finite number in range');return v;}
function bool(v){if(typeof v!=='boolean')throw Error('Expected a boolean');return v;}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Expected YYYY-MM-DD');const t=Date.parse(v+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return t;}
export function run(x){obj(x);if(JSON.stringify(x).length>200000)throw Error('Input exceeds 200 KB limit');

obj(x.layers);for(const v of Object.values(x.layers))str(v);const allowed=new Set(arr(x.allowed,'allowed').map(e=>{str(e.from);str(e.to);return JSON.stringify([e.from,e.to]);}));const rows=arr(x.imports,'imports').map(e=>{str(e.from);str(e.to);const from=x.layers[e.from],to=x.layers[e.to];const known=Object.hasOwn(x.layers,e.from)&&Object.hasOwn(x.layers,e.to);return {from:e.from,to:e.to,sourceLayer:known?from:'unknown',targetLayer:known?to:'unknown',result:!known?'unmapped':from===to||allowed.has(JSON.stringify([from,to]))?'allowed':'forbidden'};});return {metrics:{edges:rows.length,forbidden:rows.filter(r=>r.result==='forbidden').length,unmapped:rows.filter(r=>r.result==='unmapped').length},rows};

}
