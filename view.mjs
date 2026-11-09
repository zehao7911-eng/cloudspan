import {levels, colors} from './core.mjs';

const skies = [
  ['#78b7bd','#edf0cd','#f4db99','#598e6c','#9dc788'],
  ['#809aba','#ffe4b6','#fff0b8','#628b68','#abc886'],
  ['#607baa','#d8dcce','#fae7b0','#507b78','#90bc9d'],
  ['#788db6','#f8c0a5','#f8d794','#657d75','#acc08f']
];

function polygon(ctx, points, fill, stroke) {
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();
  ctx.fillStyle=fill;
  ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.9;ctx.stroke();}
}

function ellipse(ctx,x,y,rx,ry,fill) {
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fillStyle=fill;
  ctx.fill();
}

function glint(ctx,x,y,r,fill) {
  polygon(ctx,[[x,y-r],[x+r*.22,y-r*.22],[x+r,y],[x+r*.22,y+r*.22],[x,y+r],[x-r*.22,y+r*.22],[x-r,y],[x-r*.22,y-r*.22]],fill);
}

function cloud(ctx,x,y,r,color) {
  ellipse(ctx,x,y,r,r*.17,color);
  ellipse(ctx,x-r*.32,y-r*.08,r*.46,r*.18,color);
  ellipse(ctx,x+r*.11,y-r*.11,r*.5,r*.26,color);
}

function pine(ctx,x,y,scale,dark=false) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  polygon(ctx,[[-2,1],[2,1],[2,-11],[-2,-11]],'#7b624a');
  for(let i=0;i<3;i++){
    const half=10-i*2.1;
    polygon(ctx,[[-half,-3-i*5],[0,-20-i*4],[half,-3-i*5],[1,-.3-i*5]],dark?'#356c65':'#38795e');
    polygon(ctx,[[0,-20-i*4],[half,-3-i*5],[1,-.3-i*5]],dark?'#285551':'#27624e');
  }
  ctx.restore();
}

function lighthouse(ctx, lit) {
  ellipse(ctx,4,5,16,5,'#30565948');
  polygon(ctx,[[-10,4],[9,4],[5,-32],[-6,-32]],'#f7e8be','#755e50');
  polygon(ctx,[[2,4],[9,4],[5,-32],[2,-32]],'#cfb995');
  polygon(ctx,[[-8,-9],[7,-9],[6,-17],[-8,-17]],'#cb6557');
  polygon(ctx,[[-5,4],[0,4],[0,-3],[-5,-3]],'#314755');
  polygon(ctx,[[-8,-32],[7,-32],[7,-41],[-8,-41]],lit?'#fff6ac':'#d6e9df','#654748');
  polygon(ctx,[[-11,-42],[-1,-49],[10,-42],[7,-40],[-8,-40]],'#a64d49','#75453d');
  if(lit){glint(ctx,-1,-37,18,'#fff1a765');glint(ctx,-1,-37,8,'#fff9d1');}
}

function beacon(ctx, lit) {
  ellipse(ctx,1,4,13,4,'#2f594b50');
  polygon(ctx,[[-9,2],[8,2],[6,-5],[-6,-5]],'#b69054','#716348');
  polygon(ctx,[[-2,-5],[3,-5],[2,-19],[-2,-19]],'#b59152');
  glint(ctx,0,-20,lit?13:10,lit?'#fff5a9':'#f5ce70');
  glint(ctx,0,-20,5,lit?'#fffde6':'#fff0b2');
}

function courier(ctx,x,y,coat,t) {
  ctx.save();
  ctx.translate(x,y);
  ellipse(ctx,2,2,11,4,'#21444c70');
  ctx.translate(0,-Math.sin(t*Math.PI)*8);
  polygon(ctx,[[-7,-3],[-1,-3],[-1,2],[-8,2]],'#243b43');
  polygon(ctx,[[2,-3],[7,-3],[8,2],[2,2]],'#243b43');
  polygon(ctx,[[-8,-15],[7,-15],[9,-3],[-9,-3]],coat,'#6b4c4a');
  polygon(ctx,[[-4,-13],[5,-13],[5,-7],[-4,-7]],'#eedaa8');
  ellipse(ctx,0,-19,8,7,'#efbe8e');
  ellipse(ctx,0,-22,9,5,'#2e5262');
  ellipse(ctx,4,-19,7,2,'#284453');
  ellipse(ctx,3,-17,1,1,'#172f39');
  ctx.restore();
}

export class View {
  constructor(canvas) {
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.back=document.createElement('canvas');
    this.points=[];
    this.w=this.h=0;
    this.scale=1;
  }

  resize(level) {
    const w=this.canvas.clientWidth, h=this.canvas.clientHeight, dpr=Math.min(1.65,devicePixelRatio||1);
    if(!w||!h) return;
    if(w!==this.w||h!==this.h||dpr!==this.dpr){
      this.w=w;this.h=h;this.dpr=dpr;
      this.canvas.width=Math.round(w*dpr);
      this.canvas.height=Math.round(h*dpr);
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
      this.skyIndex=-1;
    }
    this.scale=Math.max(.75,Math.min(1.24,Math.min(w,h)/322));
    this.points=level.nodes.map(([x,y])=>[x*w, y*h]);
    if(this.skyIndex!==level.sky) this.background(level.sky);
  }

  background(index) {
    const {w,h,back}=this;
    this.skyIndex=index;
    back.width=w;back.height=h;
    const ctx=back.getContext('2d');
    const [high,low,sun]=skies[index];
    const g=ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,high);g.addColorStop(1,low);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ellipse(ctx,w*.16,h*.12,w*.075,w*.075,sun);
    for(let i=0;i<14;i++){
      const x=((i*173.37+49)%995)/995*w;
      const y=((i*281.33+115)%911)/911*h;
      cloud(ctx,x,y,w*(.08+i%3*.038),i%4?'#fff8df69':'#fffcf2a8');
    }
    for(let i=0;i<10;i++){
      const x=(.08+i*.10)*w,y=(.87+(i%3)*.04)*h;
      polygon(ctx,[[x-35,y],[x-9,y-22],[x+6,y-16],[x+26,y+4],[x-20,y+9]],'#648b8e25');
    }
    for(let i=0;i<1250;i++){
      ctx.fillStyle=i%2?'#fffcee17':'#2755670e';
      ctx.fillRect(i*63.79%w,i*87.43%h,1.5,.65);
    }
    ctx.strokeStyle='#fff8df65';
    ctx.lineWidth=1;
    ctx.strokeRect(6.5,6.5,w-13,h-13);
  }

  rail(a,b,built) {
    const ctx=this.ctx;
    const dx=b[0]-a[0],dy=b[1]-a[1],distance=Math.hypot(dx,dy),thickness=this.scale*12;
    ctx.save();ctx.translate(a[0],a[1]);ctx.rotate(Math.atan2(dy,dx));
    if(built){
      ctx.fillStyle='#25434f4f';ctx.fillRect(0,3,distance,thickness);
      ctx.fillStyle='#76543b';ctx.fillRect(0,-thickness*.55,distance,thickness);
      for(let x=0;x<distance;x+=9*this.scale){
        ctx.fillStyle=Math.floor(x/(9*this.scale))%2?'#e7b881':'#f1ca90';
        ctx.fillRect(x,-thickness*.48,Math.min(8*this.scale,distance-x),thickness*.92);
      }
      ctx.strokeStyle='#fff1b7';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,-thickness*.52);ctx.lineTo(distance,-thickness*.52);ctx.stroke();
    }else{
      ctx.strokeStyle='#1c526b64';ctx.lineWidth=1.6;ctx.setLineDash([3,6]);
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(distance,0);ctx.stroke();
    }
    ctx.restore();
  }

  island(point,index,kind,visited,active,lit,theme) {
    const {ctx,scale}=this;
    const [, , ,grass, rim]=skies[theme];
    ctx.save();ctx.translate(...point);ctx.scale(scale,scale);
    const shelf=[[-42,1],[-27,-16],[8,-21],[35,-9],[45,3],[29,18],[-12,20],[-36,11]];
    ellipse(ctx,4,31,32,11,'#38617b25');
    polygon(ctx,[[-42,1],[-36,11],[-12,20],[29,18],[45,3],[39,23],[24,37],[7,49],[-13,41],[-31,28]],'#506a70','#425b68');
    polygon(ctx,[[-36,11],[-12,20],[-13,41],[-31,28]],'#65807c');
    polygon(ctx,[[-12,20],[29,18],[24,37],[7,49],[-13,41]],'#455d67');
    polygon(ctx,[[17,18],[30,17],[24,37],[7,49]],'#3a5665');
    polygon(ctx,[[-37,17],[-12,25],[28,24],[39,16],[36,22],[27,29],[-12,31],[-32,23]],'#c2a581');
    polygon(ctx,shelf,grass,'#466b67');
    polygon(ctx,[[-41,1],[-26,-15],[8,-20],[35,-9],[40,-3],[12,-11],[-16,-10],[-30,1]],rim);
    for(let i=0;i<18;i++){
      const x=-29+(i*19.7%57),y=-9+(i*11.3%20);
      ellipse(ctx,x,y,i%4===0?1.7:1,.7,i%4===0?'#f6deb1':'#d6e1ab82');
    }
    if(kind==='goal'){
      ctx.save();ctx.translate(5,1);lighthouse(ctx,lit);ctx.restore();
    }else if(kind==='star'){
      pine(ctx,-25,-3,.57,true);
      beacon(ctx,visited);
    }else{
      pine(ctx,-24,-2,index%2?.68:.8);
      pine(ctx,23,-4,.6,true);
      if(kind==='start'){
        polygon(ctx,[[-7,1],[8,1],[8,-10],[-7,-10]],'#eed4a3','#776047');
        polygon(ctx,[[-10,-10],[0,-18],[11,-10]],'#b8614e');
      }
    }
    if(active){
      ctx.strokeStyle='#fff0b7';ctx.lineWidth=1.7;
      ctx.beginPath();ctx.ellipse(0,3,40,15,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }

  draw(route,color,motion,time) {
    if(!this.points.length) return;
    const level=levels[route.level], {ctx,w,h,points}=this;
    const at=route.path.at(-1);
    ctx.drawImage(this.back,0,0,w,h);
    for(const [a,b] of level.edges) this.rail(points[a],points[b],false);
    for(let i=1;i<route.path.length;i++){
      const a=route.path[i-1], b=route.path[i];
      const to=motion?.adding&&motion.to===b?[points[a][0]+(points[b][0]-points[a][0])*Math.min(1,time*2.8),points[a][1]+(points[b][1]-points[a][1])*Math.min(1,time*2.8)]:points[b];
      this.rail(points[a],to,true);
    }
    const travelTime=motion?Math.max(0,(time-.18)/.82):1;
    if(motion&&!motion.adding&&time<1){
      const from=points[motion.from],to=points[motion.to];
      const end=[from[0]+(to[0]-from[0])*travelTime,from[1]+(to[1]-from[1])*travelTime];
      this.rail(to,end,true);
    }
    const order=level.nodes.map((_,i)=>i).sort((a,b)=>points[a][1]-points[b][1]);
    for(const i of order) this.island(points[i],i,level.nodes[i][2],route.path.includes(i),i===at,route.stars>0,level.sky);
    const t=travelTime;
    const from=motion?points[motion.from]:points[at];
    const to=motion?points[motion.to]:points[at];
    courier(ctx,from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t+4,colors[color],motion?t:0);
    if(route.stars){
      const [x,y]=points[at];
      for(let i=0;i<12;i++) {
        const angle=i*2.399;
        const d=24+i*3+time*20;
        glint(ctx,x+Math.cos(angle)*d,y-30+Math.sin(angle)*d*.6,2+i%3,'#fff8d5');
      }
    }
  }
}
