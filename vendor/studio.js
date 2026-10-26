'use strict';
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),panel=document.querySelector('#panel');
let w,h,scale,yaw=-.55,pitch=.52,zoom=1,selected=0,time=0,playing=false,ready=false,last=0;
let actors=[{x:-1.1,z:.3,pose:1,turn:.25,color:'#efaa83'},{x:1.15,z:-.65,pose:2,turn:-.5,color:'#8bc8bd'}];
let keys=[],queue=[],hits=[];
const $=s=>document.querySelector(s),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function project(p){const x=p[0]*Math.cos(yaw)-p[2]*Math.sin(yaw),z=p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);return [w/2+x*scale,h*.53+(z*Math.sin(pitch)-p[1]*Math.cos(pitch))*scale,z*Math.cos(pitch)+p[1]*Math.sin(pitch)];}
function poly(points,color,stroke){const p=points.map(project);queue.push({d:p.reduce((a,b)=>a+b[2],0)/p.length,draw(){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}}});}
function line(a,b,color,width=1){const p=project(a),q=project(b);queue.push({d:(p[2]+q[2])/2,draw(){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}});}
function ball(p,r,color){const a=project(p);queue.push({d:a[2],draw(){const g=ctx.createRadialGradient(a[0]-r*scale*.35,a[1]-r*scale*.4,0,a[0],a[1],r*scale);g.addColorStop(0,color);g.addColorStop(1,shade(color,.61));ctx.fillStyle=g;ctx.beginPath();ctx.arc(a[0],a[1],r*scale,0,Math.PI*2);ctx.fill();}});}
function shade(hex,f){return '#'+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*f).toString(16).padStart(2,'0')).join('');}
function box(x,y,z,sx,sy,sz,c){const a=[x-sx/2,y,z-sz/2],b=[x+sx/2,y,z-sz/2],d=[x-sx/2,y,z+sz/2],e=[x+sx/2,y,z+sz/2],top=p=>[p[0],p[1]+sy,p[2]];poly([a,b,top(b),top(a)],shade(c,.7));poly([b,e,top(e),top(b)],shade(c,.55));poly([e,d,top(d),top(e)],shade(c,.83));poly([d,a,top(a),top(d)],shade(c,.6));poly([top(a),top(b),top(e),top(d)],c);}
function actor(a,i){const pose=a.pose,walk=pose===3?.45:0,raise=pose===1?1:0,sit=pose===2?.35:0;
 const t=p=>[a.x+p[0]*Math.cos(a.turn)-p[2]*Math.sin(a.turn),p[1],a.z+p[0]*Math.sin(a.turn)+p[2]*Math.cos(a.turn)];
 const joints=[[0,1.65-sit,0],[0,1.26-sit,0],[0,.8-sit,0],[-.28,1.32-sit,0],[.28,1.32-sit,0],[-.45,1-sit,.1],[.48,raise?1.65:1-sit,.1],[-.48,.78-sit,.14],[.53,raise?1.95:.77-sit,.2],[-.16,.78-sit,0],[.16,.78-sit,0],[-.2,.4,-walk+sit],[.23,.4,walk+sit],[-.24,.06,-walk+sit],[.26,.06,walk+sit]];
 const ring=[];for(let n=0;n<40;n++){let angle=n/40*Math.PI*2;ring.push([a.x+Math.cos(angle)*.55,.013,a.z+Math.sin(angle)*.55]);}poly(ring,i===selected?'#b8d5bd22':'#091c2544',i===selected?'#d6dfb5':null);
 for(const [j,k,thick] of [[1,2,.24],[3,4,.18],[1,3,.15],[1,4,.15],[3,5,.11],[5,7,.09],[4,6,.11],[6,8,.09],[2,9,.16],[2,10,.16],[9,11,.13],[11,13,.1],[10,12,.13],[12,14,.1]])line(t(joints[j]),t(joints[k]),a.color,thick*scale);
 joints.slice(1).forEach((p,j)=>ball(t(p),j<2?.13:.075,a.color));ball(t(joints[0]),.19,a.color);ball(t([.07,1.65-sit,.17]),.035,'#344d53');
 hits.push({i,p:project(t([0,1-sit,0]))});
}
function draw(){queue=[];hits=[];ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#17222e');bg.addColorStop(.55,'#263e47');bg.addColorStop(1,'#101c26');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 scale=Math.min(w/8.7,h/7.5)*zoom;
 // Procedural soundstage, with a gridded raised floor and a freestanding doorway.
 box(0,-.25,0,6.2,.24,5.3,'#53716d');
 queue.sort((a,b)=>a.d-b.d).forEach(item=>item.draw());queue=[];
 for(let x=-3;x<=3;x+=.5)line([x,.005,-2.6],[x,.005,2.6],'#93b7a74a',.6);
 for(let z=-2.5;z<=2.5;z+=.5)line([-3,.005,z],[3,.005,z],'#93b7a74a',.6);
 box(-1.65,0,-2, .35,3.05,.4,'#c8b999');box(.55,0,-2,.35,3.05,.4,'#c8b999');box(-.55,2.7,-2,2.55,.35,.4,'#d7c9a6');
 box(1.9,0,-1.75,1.1,.65,.85,'#697f89');box(-2,0,1.5,.8,.5,.8,'#a58d78');
 // Camera prop and its visible blocking cone.
 box(.5,.75,2, .55,.32,.4,'#d9dfc8');box(.5,.82,1.73,.24,.18,.24,'#829f99');
 for(const dx of [-.28,.28])line([.5,.75,2],[.5+dx,0,2.15],'#abc3b5',2);
 line([.5,.75,2],[.5,0,1.7],'#abc3b5',2);
 line([.5,.01,1.7],[-1.5,.01,-.5],'#e9c78b80');line([.5,.01,1.7],[1.6,.01,-.5],'#e9c78b80');
 actors.forEach(actor);queue.sort((a,b)=>a.d-b.d).forEach(item=>item.draw());
 // Scene lighting is artwork, not interface chrome.
 const glow=ctx.createRadialGradient(w*.4,h*.35,0,w*.4,h*.35,w*.65);glow.addColorStop(0,'#f6d5a509');glow.addColorStop(1,'#00000000');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
}
function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);draw();}new ResizeObserver(resize).observe(canvas);
function snapshot(){return {time,actors:structuredClone(actors),yaw,pitch,zoom};}
function apply(t){if(!keys.length)return;const left=[...keys].reverse().find(k=>k.time<=t)||keys[0],right=keys.find(k=>k.time>=t)||keys[keys.length-1],u=left===right?0:(t-left.time)/(right.time-left.time),mix=(a,b)=>a+(b-a)*u;yaw=mix(left.yaw,right.yaw);pitch=mix(left.pitch,right.pitch);zoom=mix(left.zoom,right.zoom);actors=left.actors.map((a,i)=>({...a,x:mix(a.x,right.actors[i].x),z:mix(a.z,right.actors[i].z),turn:mix(a.turn,right.actors[i].turn),pose:u<.5?a.pose:right.actors[i].pose}));}
function sync(){ $('#timeline').value=time;$('#clock').textContent=(time/1000).toFixed(1)+'s';$('#pose').value=actors[selected].pose;$('#actor').value=selected;$('#lens').value=zoom;$('#status').textContent=keys.length+' keyframes';}
$('#toggle').onclick=()=>{panel.hidden=!panel.hidden;$('#toggle').setAttribute('aria-expanded',String(!panel.hidden));};
for(const el of [panel,$('#toggle')])for(const type of ['pointerdown','pointermove','pointerup'])el.addEventListener(type,e=>e.stopPropagation());
$('#actor').onchange=e=>{selected=+e.target.value;sync();draw();};$('#pose').onchange=e=>{actors[selected].pose=+e.target.value;draw();};$('#lens').oninput=e=>{zoom=+e.target.value;draw();};
$('#key').onclick=()=>{keys=keys.filter(k=>Math.abs(k.time-time)>50);keys.push(snapshot());keys.sort((a,b)=>a.time-b.time);sync();};
$('#timeline').oninput=e=>{time=+e.target.value;apply(time);sync();draw();};
$('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?'Pause':'Play';};
$('#shot').onclick=()=>{yaw=yaw<0?.65:-.55;pitch=pitch>.4?.28:.52;draw();};
$('#reset').onclick=()=>{playing=false;$('#play').textContent='Play';time=0;keys=[];yaw=-.55;pitch=.52;zoom=1;actors[0]={x:-1.1,z:.3,pose:1,turn:.25,color:'#efaa83'};actors[1]={x:1.15,z:-.65,pose:2,turn:-.5,color:'#8bc8bd'};seed();sync();draw();};
function seed(){keys=[snapshot()];time=4000;actors[0].x=-.4;actors[0].pose=3;actors[1].pose=1;yaw=.3;keys.push(snapshot());time=0;apply(0);}seed();
let drag;
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let hit=hits.find(a=>Math.hypot(x-a.p[0],y-a.p[1])<36);if(hit)selected=hit.i;drag={x:e.clientX,y:e.clientY,actor:!!hit};canvas.setPointerCapture(e.pointerId);sync();draw();});
canvas.addEventListener('pointermove',e=>{if(!drag)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.actor){let a=actors[selected],v=dy/(scale*Math.sin(pitch));a.x=clamp(a.x+dx/scale*Math.cos(yaw)+v*Math.sin(yaw),-2.5,2.5);a.z=clamp(a.z-dx/scale*Math.sin(yaw)+v*Math.cos(yaw),-2.1,2.1);}else{yaw+=dx*.008;pitch=clamp(pitch+dy*.005,.22,.95);}drag.x=e.clientX;drag.y=e.clientY;draw();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
function loop(now){if(playing){time=(time+Math.min(now-last,60))%4001;apply(time);sync();draw();}last=now;if(!ready&&window.__gbSandbox){draw();window.__gbSandbox.ready();ready=true;}requestAnimationFrame(loop);}resize();sync();requestAnimationFrame(loop);
