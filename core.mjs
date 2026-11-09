export const colors = ['#ec6550','#2f9ba6','#995bb8'];
export const levels = [
  {name:'First Light', wood:8, reserve:2, sky:0, nodes:[[.25,.77,'start'],[.25,.48],[.72,.50,'star'],[.70,.21,'goal']], edges:[[0,1,2],[0,2,4],[1,2,2],[1,3,3],[2,3,2]]},
  {name:'Twin Pines', wood:9, reserve:2, sky:1, nodes:[[.50,.81,'start'],[.23,.61],[.77,.63],[.27,.34,'star'],[.72,.33],[.53,.14,'goal']], edges:[[0,1,2],[0,2,2],[1,3,3],[1,4,4],[2,3,5],[2,4,2],[3,5,2],[4,5,2],[3,4,3]]},
  {name:'Sunken Ridge', wood:10, reserve:2, sky:2, nodes:[[.50,.81,'start'],[.22,.65,'star'],[.80,.64],[.22,.37],[.77,.34,'star'],[.51,.16,'goal']], edges:[[0,1,2],[0,2,2],[1,3,2],[1,4,5],[2,4,2],[3,4,2],[3,5,2],[4,5,2]]},
  {name:'Copper Keys', wood:10, reserve:2, sky:0, nodes:[[.21,.79,'start'],[.68,.80],[.23,.51,'star'],[.72,.52],[.22,.24],[.70,.19,'goal']], edges:[[0,1,2],[0,2,3],[1,2,3],[1,3,2],[2,3,2],[2,4,2],[3,5,3],[4,5,3]]},
  {name:'Cloud Orchard', wood:11, reserve:2, sky:3, nodes:[[.49,.84,'start'],[.19,.68],[.80,.68,'star'],[.22,.40,'star'],[.76,.40],[.27,.18],[.69,.15,'goal']], edges:[[0,1,2],[0,2,2],[1,3,2],[1,4,5],[2,4,2],[2,3,3],[3,4,3],[3,5,2],[4,6,2],[5,6,2]]},
  {name:'Moth Passage', wood:11, reserve:3, sky:2, nodes:[[.28,.82,'start'],[.73,.79,'star'],[.24,.56],[.76,.53],[.26,.29,'star'],[.75,.22,'goal']], edges:[[0,1,2],[0,2,2],[1,2,2],[1,3,2],[2,4,2],[2,3,4],[3,4,3],[3,5,2],[4,5,2]]},
  {name:'The Amber Loop', wood:13, reserve:3, sky:1, nodes:[[.50,.83,'start'],[.18,.66,'star'],[.81,.66],[.23,.39],[.76,.41,'star'],[.24,.18],[.70,.15,'goal']], edges:[[0,1,2],[0,2,2],[1,3,3],[1,4,6],[2,4,2],[3,4,2],[3,5,2],[4,6,3],[5,6,3]]},
  {name:'Last Lighthouse', wood:14, reserve:3, sky:3, nodes:[[.49,.84,'start'],[.20,.69,'star'],[.80,.68],[.25,.43],[.77,.43,'star'],[.22,.20,'star'],[.71,.16,'goal']], edges:[[0,1,2],[0,2,2],[1,3,2],[1,4,5],[2,4,2],[3,4,2],[3,5,2],[4,5,3],[4,6,2],[5,6,3]]}
];

export function profile(value) {
  return {
    best:levels.map((_,i)=>Number.isInteger(value?.best?.[i])?Math.max(0,Math.min(3,value.best[i])):0),
    rewards:{like:value?.rewards?.like===true,comment:value?.rewards?.comment===true},
    mute:value?.mute===true,
    color:Number.isInteger(value?.color)&&colors[value.color]?value.color:0
  };
}

export function total(p) { return p.best.reduce((sum,stars)=>sum+stars,0); }
export function unlocked(p,i) { return i===0 || p.best[i-1]>0; }
export function colorAllowed(p,i) {
  return i===0 || i===1&&(total(p)>=8||p.rewards.like) || i===2&&(total(p)>=16||p.rewards.comment);
}

export function mergeProfile(local, incoming) {
  const other=profile(incoming);
  return {
    ...local,
    best:local.best.map((stars,i)=>Math.max(stars,other.best[i])),
    rewards:{like:local.rewards.like||other.rewards.like,comment:local.rewards.comment||other.rewards.comment}
  };
}

export function newRoute(level) { return {level,path:[0],wood:levels[level].wood,stars:0}; }
export function current(route) { return route.path.at(-1); }

export function options(route) {
  if (route.stars) return [];
  const from=current(route);
  return levels[route.level].edges.flatMap(([a,b,cost])=>{
    const index=a===from?b:b===from?a:-1;
    if(index<0||route.path.includes(index)) return [];
    return [{index,cost,available:cost<=route.wood}];
  });
}

export function extend(route,index) {
  const edge=options(route).find(option=>option.index===index&&option.available);
  if(!edge) return false;
  const level=levels[route.level];
  route.path.push(index);
  route.wood-=edge.cost;
  if(level.nodes[index][2]==='goal') {
    const allBeacons=level.nodes.every((node,i)=>node[2]!=='star'||route.path.includes(i));
    route.stars=1+Number(allBeacons)+Number(route.wood>=level.reserve);
  }
  return true;
}

export function undo(route) {
  if(route.stars||route.path.length<2) return false;
  const end=route.path.pop(), from=current(route);
  const edge=levels[route.level].edges.find(([a,b])=>a===from&&b===end||b===from&&a===end);
  route.wood+=edge[2];
  return true;
}

export function restore(data,p) {
  const index=Number.isInteger(data?.level)&&levels[data.level]&&unlocked(p,data.level)?data.level:0;
  const route=newRoute(index);
  if(data?.level!==index || !Array.isArray(data.path) || data.path[0]!==0) return route;
  for(const next of data.path.slice(1,levels[index].nodes.length)) {
    if(!extend(route,next)) break;
  }
  return route;
}

