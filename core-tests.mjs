import assert from 'node:assert/strict';
import * as C from './core.mjs';

const profile=C.profile();
let visited=0;
for(const [index,level] of C.levels.entries()){
  assert(C.unlocked(profile,index));
  const wins=[];
  function explore(route){
    visited++;
    assert(route.wood>=0);
    assert.deepEqual(C.restore(structuredClone(route),profile),route);
    if(route.stars){wins.push(route.stars);return;}
    for(const option of C.options(route)){
      const copy=structuredClone(route);
      assert.equal(C.extend(copy,option.index),option.available);
      if(!option.available){assert.deepEqual(copy,route);continue;}
      assert.equal(copy.wood,route.wood-option.cost);
      if(!copy.stars){
        const backup=structuredClone(copy);
        assert(C.undo(copy));
        assert.deepEqual(copy,route);
        explore(backup);
      } else explore(copy);
    }
  }
  explore(C.newRoute(index));
  assert(wins.includes(3),level.name+' must have a perfect route');
  assert(wins.some(stars=>stars<3),level.name+' must have a tradeoff');
  profile.best[index]=3;
}
assert.equal(C.total(profile),24);
assert(C.colorAllowed(profile,2));
assert(!C.colorAllowed(C.profile(),1));
assert(C.colorAllowed(C.profile({rewards:{like:true}}),1));
assert.deepEqual(C.restore({level:5,path:[0,4]},C.profile()),C.newRoute(0));
console.log(JSON.stringify({visited,levels:C.levels.length,scope:'Every affordable simple path, refunds, restore, and star tradeoffs'}));
