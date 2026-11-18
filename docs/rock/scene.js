/* Build on the Rock: the 3D picture.
   Needs THREE (r128) loaded first. No game rules live here; the page tells the scene what to show.

   const scene = RockScene.create(canvas, stageElement)   -> null if 3D is unavailable
   scene.setRows(n)                 3, 4 or 5 rows high; rebuilds the frame and clears every piece
   scene.set(wall,c,r,type|null)    put a piece in a slot at once (no animation). wall: 'front'|'left'|'right'
   scene.drop(wall,c,r,type)        Promise: piece drops in from above
   scene.forgiven(wall,c,r)         pearl glow on a straw bale
   scene.pull(wall,c,r)             Promise: straw slides out by itself, pearl slides in
   scene.armPull(wall,c,r)          Promise<boolean>: the player must drag the bale out slowly; false if it slipped
   scene.wobble({front,left,right}) 0 steady, 1 sways, 2 leans
   scene.showSlots(list,onPick)     glowing open slots; onPick(wall,c,r) when one is tapped. list of {wall,c,r}
   scene.hideSlots()
   scene.onTapPiece = fn(wall,c,r)  a placed piece was tapped
   scene.fire()                     Promise: flames sweep the walls (resolves at the peak, about 0.9 s)
   scene.burn(wall,c,r)             Promise: that piece burns away
   scene.knock(wall,c,r)            Promise: that piece is knocked off and lands in the rubble
   scene.wallFall(wall)             Promise: the whole wall tumbles
   scene.caveIn()                   Promise: every wall tumbles
   scene.crack(wall,on)             white outline where a cracked wall should stand
   scene.setRubble(types)           lay these piece types on the ground (used when loading a saved game)
   scene.takeRubble(type)           remove one lying piece of that type
   scene.fuse(cells,pure)           Promise: three gems light up as a window. cells: [{wall,c,r}]
   scene.seal()                     Promise: the roof drops on, the camera pulls back to the City
   scene.setCity(n)                 how many finished buildings stand in the City (0 to 6)
   scene.home()                     camera back to the building
   Types: 'G' gold, 'S' silver, gems r o b t e y v k p, 'W' straw, 'P' pearl. */
(function(root){
function create(canvas,stage){
if(!root.THREE)return null;const THREE=root.THREE;let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true})}catch(e){return null}
renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,2));renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const reduce=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x4a2f66,70,170);
const camera=new THREE.PerspectiveCamera(30,4/3,0.5,400),camLook=new THREE.Vector3(0,5,0);
const world=new THREE.Group();scene.add(world);world.rotation.y=-0.55;
const Y0=1.6;let ROWS=3;

/* ---------- textures made in code ---------- */
let seed=11;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
function clamp(v){return Math.max(0,Math.min(255,v|0))}
function finish(cv){const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;return t}
function tex(base,style){
  const s=16,cv=document.createElement('canvas');cv.width=cv.height=s;const g=cv.getContext('2d');
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
    let n=(rnd()-0.5)*22;
    if(style!=='grass'&&style!=='leaf'){if(x===0||y===0)n+=20;if(x===s-1||y===s-1)n-=34;else if(x===s-2||y===s-2)n-=10}
    if(style==='brick'){if(y===8)n-=30;if((x+(y<8?0:4))%8===0&&y!==0)n-=22}
    if(style==='straw'){n+=((y*7)%5-2)*14;if(rnd()<0.16)n-=46}
    if(style==='gold'){n+=(16-(x+y))*1.8;if(rnd()<0.07)n+=44}
    if(style==='silver'){n=n*0.7+(x+y<10?14:0)}
    if(style==='pearl'){n=n*0.4+(x+y<12?10:-6)}
    if(style==='grass'){if(rnd()<0.14)n+=34;if(rnd()<0.08)n-=30}
    if(style==='leaf'){if((x+y)%4===0)n-=26;if(rnd()<0.12)n+=36}
    if(style==='wood'){n+=((x*3)%4-1.5)*9;if(y%8===7)n-=20}
    if(style==='tile'){if(y%4===3)n-=40;if((x+(y>>2)*2)%4===0)n-=18}
    g.fillStyle='rgb('+clamp(base[0]+n)+','+clamp(base[1]+n)+','+clamp(base[2]+n)+')';g.fillRect(x,y,1,1);
  }
  return finish(cv);
}
/* a cut gem: irregular facets with dark leading between them, brighter toward the top left */
function gemTex(base){
  const s=32,cv=document.createElement('canvas');cv.width=cv.height=s;const g=cv.getContext('2d'),pts=[];
  for(let i=0;i<11;i++)pts.push([2+rnd()*28,2+rnd()*28,(rnd()-0.4)*70]);
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
    let d1=1e9,d2=1e9,sh=0;for(let i=0;i<pts.length;i++){const d=Math.hypot(x-pts[i][0],y-pts[i][1]);if(d<d1){d2=d1;d1=d;sh=pts[i][2]}else if(d<d2)d2=d}
    let n=sh+(30-(x+y))*1.1;
    if(d2-d1<1.3)n=-85;
    if(x<2||y<2||x>s-3||y>s-3)n=-95;else if(x<4||y<4)n+=38;
    if(Math.abs(x-y+6)<1.2&&x>6&&x<22)n+=60;
    g.fillStyle='rgb('+clamp(base[0]+n)+','+clamp(base[1]+n)+','+clamp(base[2]+n)+')';g.fillRect(x,y,1,1);
  }
  const t=finish(cv);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;
}
function mat(base,style,emissive,ei){return new THREE.MeshLambertMaterial({map:tex(base,style),emissive:new THREE.Color(emissive||0x000000),emissiveIntensity:ei||0})}
function flat(c,e,ei){return new THREE.MeshLambertMaterial({color:c,emissive:new THREE.Color(e||0x000000),emissiveIntensity:ei||0})}
const GEMS={r:[220,50,70],o:[245,140,40],b:[50,110,235],t:[30,185,170],e:[50,185,90],y:[250,232,110],v:[130,90,230],k:[245,130,180],p:[170,70,200]};
function rgb(a){return (a[0]<<16)|(a[1]<<8)|a[2]}
const M={
  stone:mat([146,140,148],'brick'),rock:mat([78,72,98],'brick'),plinth:mat([98,94,110],'brick'),grass:mat([70,136,82],'grass'),
  leaf:mat([46,116,66],'leaf'),leaf2:mat([70,146,78],'leaf'),wood:mat([126,88,58],'wood'),trim:mat([58,40,34],'wood'),
  roof:mat([36,140,146],'tile',0x0a5a5a,0.22),char:mat([40,30,28],''),band:flat(0x6e4e1c),
  S:mat([208,218,236],'silver'),G:mat([232,160,30],'gold',0xb07a10,0.25),W:mat([170,130,52],'straw'),P:mat([248,238,244],'pearl',0xffd9ec,0.3),
  lamp:new THREE.MeshBasicMaterial({color:0xffd58a}),skin:flat(0xe9b78f),shirt:flat(0x4d7bd6),pants:flat(0x2c3558),
  fl:[flat(0xff6f7d,0xff3050,0.3),flat(0xffd95a,0xffb020,0.3),flat(0xf6f0ff,0xbfb0ff,0.25),flat(0xff9ad0,0xff50a0,0.3)],
  cap:flat(0xd8453a),stem:flat(0xf1e8dc),cloud:new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.14,fog:false,depthWrite:false}),
  slot:new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0.3,depthWrite:false})
};
const GEM={},GEMLIT={};Object.keys(GEMS).forEach(function(k){const t=gemTex(GEMS[k]),c=rgb(GEMS[k]);
  GEM[k]=new THREE.MeshPhongMaterial({map:t,emissive:new THREE.Color(c),emissiveIntensity:0.3,shininess:90,specular:0xffffff});
  GEMLIT[k]=new THREE.MeshPhongMaterial({map:t,emissive:new THREE.Color(c),emissiveIntensity:0.8,shininess:90,specular:0xffffff});
  M[k]=GEM[k]});
function boxGeo(w,h,d){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,dm=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*dm[f][0],uv.getY(k)*dm[f][1])}return g}
function mesh(w,h,d,m,x,y,z,parent,noShadow){const o=new THREE.Mesh(boxGeo(w,h,d),m);o.position.set(x,y,z);if(!noShadow){o.castShadow=true;o.receiveShadow=true}(parent||world).add(o);return o}
const haloTex=(function(){const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.35,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(cv)})();
function halo(color,size,op){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTex,color:color,blending:THREE.AdditiveBlending,transparent:true,opacity:op,depthWrite:false,fog:false}));s.scale.set(size,size,1);return s}
function glow(parent,color,size,op,x,y,z){const h=halo(color,size,op);h.position.set(x,y,z);parent.add(h);return h}

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0x9a90ff,0x3a2a22,0.58));
const sun=new THREE.DirectionalLight(0xffc48a,0.95);sun.position.set(-14,24,18);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);const sc=sun.shadow.camera;sc.left=-24;sc.right=24;sc.top=30;sc.bottom=-24;sc.near=1;sc.far=90;sun.shadow.bias=-0.002;scene.add(sun);
const doorLight=new THREE.PointLight(0xffb060,1.3,17,2);doorLight.position.set(0,Y0+2.2,6);world.add(doorLight);
const homeLight=new THREE.PointLight(0xffa040,0.9,14,2);homeLight.position.set(0,Y0+2.5,0);world.add(homeLight);
const fireLight=new THREE.PointLight(0xff6a20,0,34,2);fireLight.position.set(0,Y0+3,4);world.add(fireLight);

/* ---------- sky ---------- */
(function(){const n=280,pos=new Float32Array(n*3);for(let i=0;i<n;i++){const a=rnd()*Math.PI*2,e=0.15+rnd()*1.2,r=150;pos[i*3]=Math.cos(a)*Math.cos(e)*r;pos[i*3+1]=Math.sin(e)*r;pos[i*3+2]=Math.sin(a)*Math.cos(e)*r-20}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.1,transparent:true,opacity:0.85,fog:false})))})();
glow(scene,0xfff4d8,34,0.95,-52,58,-130);glow(scene,0xcdb8ff,80,0.25,-52,58,-131);
const clouds=[];[[-40,30,-80,1],[34,38,-95,1.3],[10,26,-70,0.8],[-70,22,-60,1.1]].forEach(function(c){const g=new THREE.Group();g.position.set(c[0],c[1],c[2]);g.scale.setScalar(c[3]);
  mesh(16,2.4,5,M.cloud,0,0,0,g,true);mesh(9,2.4,4,M.cloud,-3,2.2,0,g,true);mesh(7,2,4,M.cloud,5,1.8,0.5,g,true);scene.add(g);clouds.push(g)});

/* ---------- island, garden and the Rock (never change) ---------- */
function island(parent,sx,sz){mesh(sx,1,sz,M.grass,0,-0.5,0,parent);mesh(sx-2,2,sz-2,M.rock,0.3,-2,0,parent);mesh(sx*0.68,2.6,sz*0.62,M.rock,-0.6,-4.3,0.4,parent);mesh(sx*0.4,2.6,sz*0.38,M.rock,0.5,-6.9,-0.3,parent);mesh(sx*0.18,2,sz*0.2,M.rock,0,-9.2,0,parent)}
island(world,22,17);
mesh(4,1,3,M.grass,-11.6,-0.75,3.2);mesh(3,1,4,M.grass,11.9,-0.85,-2);mesh(5,1,2.6,M.grass,3.4,-0.75,9.2);mesh(3,1.6,2,M.rock,-11.4,-2,3.2);mesh(2.4,1.6,3,M.rock,11.6,-2.1,-2);
[[-5,-5.4,3,'p'],[4,-8,-2,'t'],[-1,-10.6,0.5,'k'],[7.5,-3.6,4,'b']].forEach(function(c){const o=mesh(0.8,2.4,0.8,M[c[3]],c[0],c[1],c[2],world,true);o.rotation.z=0.2;glow(world,rgb(GEMS[c[3]]),4,0.35,c[0],c[1]-0.6,c[2])});
mesh(15,Y0,9,M.stone,0,Y0/2,1.5);mesh(15.5,0.3,9.5,M.plinth,0,0.15,1.5);
mesh(1.6,1.1,2.4,M.stone,8.3,0.55,4.4);mesh(1.4,0.55,2.4,M.stone,9.7,0.28,4.4);
[[10.8,4.6,1.5],[10.4,6.3,1.2],[8.6,7.4,1.3],[6.4,7.7,1.1]].forEach(function(p){mesh(p[2],0.14,p[2]*0.8,M.stone,p[0],0.07,p[1],world,true)});
(function(){const cv=document.createElement('canvas');cv.width=1024;cv.height=128;const g=cv.getContext('2d');g.font='700 84px Georgia,"Times New Roman",serif';g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='rgba(255,255,255,.32)';g.fillText('JESUS CHRIST',513,69);g.fillStyle='rgba(22,16,30,.82)';g.fillText('JESUS CHRIST',510,65);
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;const p=new THREE.Mesh(new THREE.PlaneGeometry(11.5,1.44),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));p.position.set(0,Y0/2+0.05,6.02);world.add(p)})();
mesh(14,13,3,M.rock,0,6.5,-4.5);mesh(8,2,2.6,M.rock,-1.2,14,-4.6);mesh(4,1.6,2.2,M.rock,1.4,15.8,-4.6);mesh(3,3,2.4,M.rock,-8,1.5,-4.8);mesh(3,2,2.4,M.rock,8,1,-4.6);
mesh(14.3,0.35,3.3,M.grass,0,13.15,-4.5);mesh(8.3,0.35,2.9,M.grass,-1.2,15.15,-4.6);mesh(4.3,0.35,2.5,M.grass,1.4,16.75,-4.6);mesh(3.2,0.35,2.6,M.grass,-8,3.15,-4.8);mesh(3.2,0.35,2.6,M.grass,8,2.15,-4.6);
[[-6.4,1.6],[-4.6,2.4],[-2.2,1.2],[0.8,2],[3.4,1.4],[5.8,2.6],[6.6,1.2]].forEach(function(v){mesh(0.5,v[1],0.16,M.leaf2,v[0],13-v[1]/2,-2.92,world,true)});
[[4.6,14.2,-4.3,'p',0.25],[5.5,13.9,-4.0,'t',-0.3],[-5.6,13.9,-4.2,'k',0.2]].forEach(function(c){const o=mesh(0.8,2,0.8,M[c[3]],c[0],c[1],c[2]);o.rotation.z=c[4];glow(world,rgb(GEMS[c[3]]),5,0.4,c[0],c[1]+0.4,c[2])});
function tree(x,z,s){mesh(0.8*s,3.2*s,0.8*s,M.wood,x,1.6*s,z);mesh(3.4*s,1.6*s,3.4*s,M.leaf,x,3.8*s,z);mesh(2.4*s,1.4*s,2.4*s,M.leaf2,x,5.2*s,z);mesh(1.2*s,1*s,1.2*s,M.leaf,x,6.3*s,z)}
tree(-9.4,2.6,1);tree(9.6,-0.8,0.8);
[[-8.6,0.5,6.2,1.5,1],[9.2,0.4,6.6,1.3,0.8],[-10,0.4,-1.2,1.4,0.8],[4.6,0.35,7.6,1.1,0.7]].forEach(function(b,i){mesh(b[3],b[4],b[3],i%2?M.leaf2:M.leaf,b[0],b[1],b[2])});
for(let x=-10;x<=-3;x+=1.75)mesh(0.3,1.1,0.3,M.trim,x,0.55,7.9);mesh(7.3,0.15,0.15,M.trim,-6.5,0.8,7.9,world,true);mesh(7.3,0.15,0.15,M.trim,-6.5,0.42,7.9,world,true);
for(let i=0;i<34;i++){const x=(rnd()-0.5)*20.5,z=(rnd()-0.5)*15.5;if(Math.abs(x)<8.2&&z>-6.5&&z<6.4)continue;mesh(0.26,0.36,0.26,M.fl[i%4],x,0.18,z,world,true)}
[[-4.2,7.1],[-5,6.7],[7.6,6.9]].forEach(function(m){mesh(0.22,0.4,0.22,M.stem,m[0],0.2,m[1],world,true);mesh(0.6,0.26,0.6,M.cap,m[0],0.5,m[1],world,true)});
[-1.7,1.7].forEach(function(x){mesh(0.22,1.7,0.22,M.trim,x,Y0+0.85,5);mesh(0.6,0.12,0.6,M.trim,x,Y0+1.72,5,world,true);
  const l=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.5,0.4),M.lamp);l.position.set(x,Y0+2.05,5);world.add(l);glow(world,0xffb858,4.2,0.8,x,Y0+2.05,5)});
const flies=[];for(let i=0;i<16;i++){const h=glow(world,0xfff0a0,0.55,0.9,0,0,0);flies.push({h:h,x:(rnd()-0.5)*19,y:1+rnd()*6,z:1+(rnd()-0.3)*8,p:rnd()*6.28,s:0.4+rnd()*0.6})}

/* ---------- city ---------- */
const city=new THREE.Group();world.add(city);const minis=[];
function mini(x,y,z,body,h){const g=new THREE.Group();g.position.set(x,y,z);g.visible=false;city.add(g);island(g,9,8);mesh(6,0.8,5,M.stone,0,0.4,0,g);mesh(4.4,h,3.6,M[body],0,0.8+h/2,0,g);
  mesh(5.4,0.8,4.6,M.roof,0,0.8+h+0.4,0,g);mesh(5.4,0.8,2.8,M.roof,0,0.8+h+1.2,0,g);mesh(5.6,0.5,1,M.G,0,0.8+h+1.85,0,g);
  ['t','k','p'].forEach(function(k,i){mesh(0.8,0.9,0.2,GEMLIT[k],-1.4+i*1.4,0.8+h*0.55,1.85,g,true)});glow(g,0xffc070,9,0.5,0,0.8+h*0.5,2.6);
  mesh(0.5,1.8,0.5,M.wood,-3.4,0.9,2.6,g);mesh(1.8,1.4,1.8,M.leaf,-3.4,2.4,2.6,g);minis.push(g)}
mini(-27,-2,-20,'S',3);mini(27,-3,-17,'G',4);mini(5,-1,-44,'S',5);mini(-44,-4,-46,'G',3);mini(46,-2,-48,'S',4);mini(-12,-3,-66,'G',5);

/* ---------- the house ---------- */
const house=new THREE.Group();world.add(house);
const GEO={front:boxGeo(2,2,1),left:boxGeo(1,2,2),right:boxGeo(1,2,2)};
const GEMGEO={front:new THREE.BoxGeometry(1.84,1.84,1.1),left:new THREE.BoxGeometry(1.1,1.84,1.84),right:new THREE.BoxGeometry(1.1,1.84,1.84)};
const SLOTGEO={front:new THREE.BoxGeometry(1.8,1.8,0.9),left:new THREE.BoxGeometry(0.9,1.8,1.8),right:new THREE.BoxGeometry(0.9,1.8,1.8)};
const cgCache={};function cg(wall,w,h,t){const k=(wall==='front'?'f':'s')+w+'_'+h+'_'+t;return cgCache[k]||(cgCache[k]=wall==='front'?boxGeo(w,h,t):boxGeo(t,h,w))}
function child(m,wall,w,h,t,material,along,up){const c=new THREE.Mesh(cg(wall,w,h,t),material);if(wall==='front')c.position.set(along,up,0);else c.position.set(0,up,along);m.add(c);return c}
let pivots={},P={},fixed=[],bodies=[],rubble=[],fx=[],tweens=[],slots=[],onPick=null,cracks={},roofGhost=null,roofGroup=null,armed=null;
const sway={front:0,left:0,right:0},lean={front:0,left:0,right:0};let tremble=0;
const WALLS=['front','left','right'];
function key(w,c,r){return w+':'+c+':'+r}
function slot(wall,c,r){return wall==='front'?new THREE.Vector3(-4+2*c,1+2*r,0):new THREE.Vector3(0,1+2*r,2-2*c)}
function makePiece(wall,type){
  const isGem=!!GEMS[type],m=new THREE.Mesh(GEO[wall],isGem?M.trim:M[type]);m.castShadow=true;m.receiveShadow=true;
  m.userData={wall:wall,type:type,flat:wall==='front'?'x':'z'};
  if(isGem){const g=new THREE.Mesh(GEMGEO[wall],GEM[type]);g.userData.gem=true;m.add(g)}
  else if(type==='G'){child(m,wall,2.02,0.3,1.1,M.G,0,0.85);child(m,wall,0.6,0.6,1.16,M.G,0,-0.1)}
  else if(type==='W'){m.scale.set(1.03,1.03,1.03);child(m,wall,2.06,0.2,1.1,M.band,0,0.45);child(m,wall,2.06,0.2,1.1,M.band,0,-0.45)}
  else if(type==='P'){m.add(halo(0xffe6f2,3.2,0.3))}
  return m}
const ROOF=[[14.6,0.3,10,'trim',0.05,0.5],[14.2,0.8,9.6,'roof',0.5,0.5],[14.2,0.8,7.6,'roof',1.3,0.5],[14.2,0.8,5.6,'roof',2.1,0.5],[14.2,0.8,3.6,'roof',2.9,0.5],[14.6,0.6,1.5,'G',3.6,0.5]];
function frame(){
  while(house.children.length)house.remove(house.children[0]);P={};fixed=[];bodies=[];rubble=[];cracks={};slots=[];armed=null;roofGroup=null;
  WALLS.forEach(function(w){sway[w]=0;lean[w]=0});tremble=0;
  pivots={front:new THREE.Group(),left:new THREE.Group(),right:new THREE.Group()};
  pivots.front.position.set(0,Y0,3.5);pivots.left.position.set(-5.5,Y0,0);pivots.right.position.set(5.5,Y0,0);
  house.add(pivots.front,pivots.left,pivots.right);
  mesh(10,0.12,6,M.wood,0,Y0+0.06,0,house);
  mesh(5.2,0.5,0.45,M.plinth,-3.7,Y0+0.25,4.2,house);mesh(5.2,0.5,0.45,M.plinth,3.7,Y0+0.25,4.2,house);
  mesh(0.45,0.5,7.6,M.plinth,-6.2,Y0+0.25,0.6,house);mesh(0.45,0.5,7.6,M.plinth,6.2,Y0+0.25,0.6,house);
  const H=2*ROWS;
  [-5.5,5.5].forEach(function(x){const p=mesh(1,H,1,M.stone,x,Y0+H/2,3.5,house);
    const cp=new THREE.Mesh(boxGeo(1.3,0.4,1.3),M.trim);cp.position.y=H/2+0.1;p.add(cp);const ft=new THREE.Mesh(boxGeo(1.3,0.5,1.3),M.plinth);ft.position.y=-H/2+0.25;p.add(ft);fixed.push(p)});
  const door=mesh(2,2,1,M.wood,0,Y0+1,3.5,house);fixed.push(door);
  const pn=new THREE.Mesh(boxGeo(1.3,1.6,1.08),M.trim);pn.position.y=-0.2;door.add(pn);
  const kb=new THREE.Mesh(boxGeo(0.2,0.2,1.2),M.G);kb.position.set(0.4,-0.1,0);door.add(kb);
  const aw=new THREE.Mesh(boxGeo(2.8,0.22,1.3),M.roof);aw.position.set(0,1.18,0.95);aw.rotation.x=0.32;door.add(aw);
  const f=new THREE.Group();f.position.set(6.4,Y0,5);house.add(f);
  mesh(0.3,0.7,0.35,M.pants,-0.2,0.35,0,f);mesh(0.3,0.7,0.35,M.pants,0.2,0.35,0,f);mesh(0.8,0.85,0.45,M.shirt,0,1.12,0,f);mesh(0.62,0.62,0.62,M.skin,0,1.86,0,f);
  roofGhost=new THREE.Group();house.add(roofGhost);
  ROOF.slice(1).forEach(function(a){const l=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(a[0],a[1],a[2])),new THREE.LineBasicMaterial({color:0xffd27a,transparent:true,opacity:0.2}));l.position.set(0,Y0+H+a[4],a[5]);roofGhost.add(l)});
  homeLight.intensity=0.9;home();
}

/* ---------- engines ---------- */
const ease={io:function(k){return k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2},out:function(k){return 1-Math.pow(1-k,3)},lin:function(k){return k},
  bounce:function(k){const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+0.75;if(k<2.5/d)return n*(k-=2.25/d)*k+0.9375;return n*(k-=2.625/d)*k+0.984375}};
function tw(dur,fn,e){return new Promise(function(res){tweens.push({t:0,dur:reduce?0.01:dur,fn:fn,e:e||ease.io,done:res})})}
function wait(ms){return new Promise(function(r){setTimeout(r,reduce?Math.min(ms,150):ms)})}
function R(a,b){return a+Math.random()*(b-a)}
function tumble(m,vx,vy,vz){house.attach(m);m.traverse(function(o){if(o.isSprite)o.visible=false});bodies.push({m:m,v:new THREE.Vector3(vx,vy,vz),w:new THREE.Vector3(R(-4,4),R(-3,3),R(-4,4)),rest:false});rubble.push(m)}
function groundAt(x,z){return (Math.abs(x)<7.5&&z>-3&&z<6)?Y0:0}
function settle(b){const m=b.m,r0=m.rotation.clone(),tx=m.userData.flat==='x'?Math.PI/2:0,tz=m.userData.flat==='z'?Math.PI/2:0;
  tw(0.18,function(k){m.rotation.x=r0.x+(tx-r0.x)*k;m.rotation.z=r0.z+(tz-r0.z)*k},ease.out)}
function sparks(wp,color,n){for(let j=0;j<n;j++){const s=halo(color,2,0.9);s.visible=false;world.add(s);fx.push({s:s,t:-j*0.04,life:0.7,x:wp.x+R(-0.7,0.7),y:wp.y+R(-0.4,0.4),z:wp.z+R(-0.3,0.7),rise:R(1.5,3.5)})}}
function wpos(m){const v=new THREE.Vector3();m.getWorldPosition(v);world.worldToLocal(v);return v}
function outward(wall){return wall==='front'?[0,1]:wall==='left'?[-1,0]:[1,0]}

/* ---------- public actions ---------- */
function set(wall,c,r,type){const k=key(wall,c,r);if(P[k]){pivots[wall].remove(P[k]);delete P[k]}if(!type)return null;
  const m=makePiece(wall,type);m.position.copy(slot(wall,c,r));m.userData.c=c;m.userData.r=r;pivots[wall].add(m);P[k]=m;return m}
function drop(wall,c,r,type){const m=set(wall,c,r,type),y=m.position.y,s0=m.scale.x;
  return tw(0.42,function(k){m.position.y=y+7*(1-k)},ease.bounce).then(function(){sparks(wpos(m),type==='W'?0xcaa860:0xfff0c0,3)})}
function forgiven(wall,c,r){const m=P[key(wall,c,r)];if(m&&!m.userData.forgiven){m.userData.forgiven=true;m.add(halo(0xffe6f2,4.5,0.9))}}
function swapPearl(wall,c,r,m,off){const o=outward(wall),s0=m.scale.x;
  return tw(0.3,function(k){const v=s0*(1-k*0.98);m.scale.set(v,v,v)}).then(function(){
    pivots[wall].remove(m);delete P[key(wall,c,r)];const p=set(wall,c,r,'P'),base=p.position.clone();
    return tw(0.6,function(k){p.position.x=base.x+o[0]*off*(1-k);p.position.z=base.z+o[1]*off*(1-k)},ease.out)}).then(function(){tremble=0})}
function pull(wall,c,r){const m=P[key(wall,c,r)];if(!m)return Promise.resolve();forgiven(wall,c,r);tremble=1;const o=outward(wall),b=m.position.clone();
  return tw(1.0,function(k){m.position.x=b.x+o[0]*3.2*k;m.position.z=b.z+o[1]*3.2*k}).then(function(){return swapPearl(wall,c,r,m,3.2)})}
function armPull(wall,c,r){const m=P[key(wall,c,r)];if(!m)return Promise.resolve(false);forgiven(wall,c,r);
  return new Promise(function(res){armed={m:m,wall:wall,c:c,r:r,base:m.position.clone(),k:0,res:res,active:false}})}
function wobble(o){WALLS.forEach(function(w){const v=o[w]||0;sway[w]=v===1?0.02:v>=2?0.03:0;lean[w]=v>=2?0.05:0})}
function hideSlots(){slots.forEach(function(s){s.parent.remove(s)});slots=[];onPick=null}
function showSlots(list,cb){hideSlots();onPick=cb;list.forEach(function(q){const s=new THREE.Mesh(SLOTGEO[q.wall],M.slot);s.position.copy(slot(q.wall,q.c,q.r));s.userData={slot:true,wall:q.wall,c:q.c,r:q.r};pivots[q.wall].add(s);slots.push(s)})}
function fire(){tw(1.9,function(k){fireLight.intensity=Math.sin(k*Math.PI)*3.2},ease.lin);const top=2*ROWS;
  for(let i=0;i<54;i++){const side=i%3,s=halo(i%2?0xff7a20:0xffc040,2,0.9);let x,z;
    if(side===0){x=R(-5.5,5.5);z=4.5}else if(side===1){x=-6.5;z=R(-3,3.6)}else{x=6.5;z=R(-3,3.6)}
    s.visible=false;world.add(s);fx.push({s:s,t:-R(0,0.9),life:R(0.7,1.1),x:x,y:Y0,z:z,rise:R(top*0.8,top*1.3)})}
  return wait(900)}
function burn(wall,c,r){const k=key(wall,c,r),m=P[k];if(!m)return Promise.resolve();delete P[k];
  m.traverse(function(o){if(o.isMesh)o.material=M.char;if(o.isSprite)o.visible=false});sparks(wpos(m),0xff8a30,5);const s0=m.scale.x;
  return tw(0.5,function(q){const v=s0*(1-q*0.98);m.scale.set(v,v,v)}).then(function(){if(m.parent)m.parent.remove(m)})}
function knock(wall,c,r){const k=key(wall,c,r),m=P[k];if(!m)return Promise.resolve();delete P[k];const o=outward(wall);
  tumble(m,o[0]*R(5,7)+R(-1.5,1.5),4,o[1]*R(5,7)+R(-1.5,1.5));return wait(900)}
function fallOne(wall){const o=outward(wall);Object.keys(P).forEach(function(k){const m=P[k];if(m.userData.wall!==wall)return;delete P[k];
  tumble(m,o[0]*R(4,8)+R(-2,2),R(2,6),o[1]*R(4,8)+R(-1.5,1.5))});sway[wall]=0;lean[wall]=0}
function wallFall(wall){fallOne(wall);crack(wall,true);return wait(1400)}
function caveIn(){WALLS.forEach(function(w,i){setTimeout(function(){fallOne(w);crack(w,true)},i*380)});tw(1.2,function(k){homeLight.intensity=0.9*(1-k*0.7)},ease.lin);return wait(2400)}
function crack(wall,on){if(cracks[wall]){house.remove(cracks[wall]);delete cracks[wall]}if(!on)return;const H=2*ROWS,front=wall==='front';
  const l=new THREE.LineSegments(new THREE.EdgesGeometry(front?new THREE.BoxGeometry(10,H,1):new THREE.BoxGeometry(1,H,6)),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.4}));
  l.position.set(front?0:(wall==='left'?-5.5:5.5),Y0+H/2,front?3.5:0);house.add(l);cracks[wall]=l}
function setRubble(types){rubble.forEach(function(m){if(m.parent)m.parent.remove(m)});rubble=[];bodies=[];
  types.forEach(function(t,i){const x=R(-6.5,6.5),z=R(4.9,7.2),m=makePiece('front',t);m.rotation.set(Math.PI/2,R(0,3),0);m.position.set(x,groundAt(x,z)+0.55+(i%3)*0.3,z);house.add(m);rubble.push(m)})}
function takeRubble(type){let i=rubble.findIndex(function(m){return m.userData.type===type});if(i<0)i=rubble.length-1;if(i<0)return;const m=rubble.splice(i,1)[0];
  bodies=bodies.filter(function(b){return b.m!==m});sparks(wpos(m),0xfff0c0,2);if(m.parent)m.parent.remove(m)}
function fuse(cells,pure){cells.forEach(function(q){const m=P[key(q.wall,q.c,q.r)];if(!m||m.userData.lit)return;m.userData.lit=true;
  m.traverse(function(o){if(o.userData&&o.userData.gem)o.material=GEMLIT[m.userData.type]});m.add(halo(rgb(GEMS[m.userData.type]||[255,255,255]),pure?4.6:3.8,pure?0.45:0.32));sparks(wpos(m),0xffffff,4)});return wait(500)}
function seal(){const top=Y0+2*ROWS;roofGroup=new THREE.Group();house.add(roofGroup);
  const parts=ROOF.map(function(a){return [a[0],a[1],a[2],M[a[3]],0,top+a[4],a[5]]}).concat([
    [1.5,3.4,1.5,M.stone,-4.2,top+3.2,-1.2],[1.9,0.4,1.9,M.plinth,-4.2,top+5.1,-1.2],
    [2.4,1.8,1.4,M.trim,0,top+1.9,4.5],[1.6,1.2,1.5,GEMLIT.k,0,top+1.9,4.55],[3,0.3,1.8,M.roof,0,top+2.95,4.5],
    [1.3,2.8,1.3,GEMLIT.p,2.6,top+5.3,0.5],[0.8,0.8,0.8,M.G,2.6,top+7.1,0.5]]);
  let chain=Promise.resolve();
  parts.forEach(function(p,i){chain=chain.then(function(){if(i===0)roofGhost.visible=false;const o=mesh(p[0],p[1],p[2],p[3],p[4],p[5]+9,p[6],roofGroup);tw(0.5,function(k){o.position.y=p[5]+9*(1-k)},ease.bounce);return wait(220)})});
  return chain.then(function(){return wait(500)}).then(function(){glow(roofGroup,0xff7fb8,5,0.5,0,top+1.9,5.4);glow(roofGroup,0xa07bff,6,0.5,2.6,top+5.6,0.5);
    const h=halo(0xffd070,18,0);h.position.set(0,top+5,1);roofGroup.add(h);tw(1.4,function(k){h.material.opacity=Math.sin(k*Math.PI)*0.8;homeLight.intensity=0.9+k*0.9},ease.lin);
    const a=camera.position.clone(),b=camBase().multiplyScalar(1.85).add(new THREE.Vector3(0,7,0)),l0=camLook.clone(),l1=new THREE.Vector3(0,6,-10);
    return tw(2.4,function(k){camera.position.lerpVectors(a,b,k);camLook.lerpVectors(l0,l1,k)})})}
function setCity(n){minis.forEach(function(g,i){g.visible=i<n})}
function camBase(){const d=Math.max(1,1.3/camera.aspect)*(1+(ROWS-3)*0.15);return new THREE.Vector3(0,(10.5+(ROWS-3)*1.6)*d,35*d)}
function home(){camera.position.copy(camBase());camLook.set(0,Y0+ROWS+0.6,0)}
function setRows(n){ROWS=Math.max(3,Math.min(5,n|0));frame()}

/* ---------- pointer: tap a slot or piece, drag a bale, or turn the picture ---------- */
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();let down=null;
function hit(e){const b=canvas.getBoundingClientRect();ptr.set(((e.clientX-b.left)/b.width)*2-1,-((e.clientY-b.top)/b.height)*2+1);ray.setFromCamera(ptr,camera);
  const list=slots.concat(Object.keys(P).map(function(k){return P[k]})),hs=ray.intersectObjects(list,true);
  for(let i=0;i<hs.length;i++){let o=hs[i].object;while(o&&!(o.userData&&o.userData.wall))o=o.parent;if(o)return o}return null}
canvas.addEventListener('pointerdown',function(e){const o=hit(e);down={x:e.clientX,y:e.clientY,t:performance.now(),r:world.rotation.y,o:o,lt:performance.now(),lk:0};
  if(armed&&o===armed.m){armed.active=true;tremble=1}try{canvas.setPointerCapture(e.pointerId)}catch(_){}} );
canvas.addEventListener('pointermove',function(e){if(!down)return;
  if(armed&&armed.active){const d=Math.hypot(e.clientX-down.x,e.clientY-down.y),k=Math.min(1,d/150),now=performance.now(),v=(k-down.lk)/Math.max(0.001,(now-down.lt)/1000);
    down.lk=k;down.lt=now;armed.k=k;const o=outward(armed.wall);armed.m.position.x=armed.base.x+o[0]*3.2*k;armed.m.position.z=armed.base.z+o[1]*3.2*k;
    if(v>3.2&&k<1)slip();else if(k>=1){const a=armed;armed=null;down=null;swapPearl(a.wall,a.c,a.r,a.m,3.2).then(function(){a.res(true)})}
    return}
  world.rotation.y=Math.max(-1.3,Math.min(1.3,down.r+(e.clientX-down.x)*0.008))});
function slip(){const a=armed;if(!a)return;armed=null;down=null;const p=a.m.position.clone();sparks(wpos(a.m),0xcaa860,3);
  tw(0.25,function(k){a.m.position.lerpVectors(p,a.base,k)},ease.out).then(function(){tremble=0;a.res(false)})}
function up(e){if(!down)return;const d=down;down=null;if(armed&&armed.active){slip();return}
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<9&&performance.now()-d.t<500&&d.o){const u=d.o.userData;
    if(u.slot){if(onPick)onPick(u.wall,u.c,u.r)}else if(api.onTapPiece)api.onTapPiece(u.wall,u.c,u.r)}}
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',function(){if(armed&&armed.active)slip();down=null});

/* ---------- size and loop ---------- */
function size(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const moved=camera.aspect!==w/h;camera.aspect=w/h;camera.updateProjectionMatrix();if(moved&&!roofGroup)home()}
root.addEventListener('resize',size);if(root.ResizeObserver)new ResizeObserver(size).observe(stage);
let last=performance.now(),T=0;
function loop(now){root.requestAnimationFrame(loop);const dt=Math.min(0.05,(now-last)/1000);last=now;T+=dt;
  for(let i=tweens.length-1;i>=0;i--){const t=tweens[i];t.t+=dt;const k=Math.min(1,t.t/t.dur);t.fn(t.e(k));if(k>=1){tweens.splice(i,1);t.done()}}
  bodies.forEach(function(b){if(b.rest)return;const p=b.m.position;b.v.y-=32*dt;p.addScaledVector(b.v,dt);
    b.m.rotation.x+=b.w.x*dt;b.m.rotation.y+=b.w.y*dt;b.m.rotation.z+=b.w.z*dt;
    if(p.x>9.6){p.x=9.6;b.v.x*=-0.4}if(p.x<-9.6){p.x=-9.6;b.v.x*=-0.4}if(p.z>7.2){p.z=7.2;b.v.z*=-0.4}if(p.z<-2.4){p.z=-2.4;b.v.z*=-0.4}
    const gy=groundAt(p.x,p.z)+0.55;if(p.y<=gy){p.y=gy;if(Math.abs(b.v.y)>5){b.v.y*=-0.3;b.v.x*=0.6;b.v.z*=0.6;b.w.multiplyScalar(0.5)}else{b.rest=true;settle(b)}}});
  for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t+=dt;if(f.t<0)continue;const k=f.t/f.life;if(k>=1){world.remove(f.s);fx.splice(i,1);continue}
    f.s.visible=true;f.s.position.set(f.x+Math.sin(T*9+i)*0.2,f.y+k*f.rise,f.z);f.s.material.opacity=Math.sin(k*Math.PI)*0.9;const s2=1.6+k*2.4;f.s.scale.set(s2,s2,1)}
  if(!reduce){flies.forEach(function(f){f.h.position.set(f.x+Math.sin(T*f.s+f.p)*1.6,f.y+Math.sin(T*f.s*1.7+f.p)*0.8,f.z+Math.cos(T*f.s*0.8+f.p)*1.4);f.h.material.opacity=0.45+Math.sin(T*3+f.p)*0.45});
    clouds.forEach(function(c,i){c.position.x+=dt*(0.25+i*0.08);if(c.position.x>90)c.position.x=-90})}
  else flies.forEach(function(f){f.h.position.set(f.x,f.y,f.z)});
  M.slot.opacity=0.22+Math.sin(T*4)*0.12;
  const sw=reduce?0:Math.sin(T*5),tr=reduce?0:tremble*Math.sin(T*42)*0.006;
  if(pivots.front){pivots.front.rotation.x=lean.front+sw*sway.front+tr;pivots.left.rotation.z=lean.left+sw*sway.left+tr;pivots.right.rotation.z=-(lean.right+sw*sway.right+tr)}
  doorLight.intensity=1.3+Math.sin(T*7)*0.08;
  camera.lookAt(camLook);renderer.render(scene,camera)}
const api={setRows:setRows,set:set,drop:drop,forgiven:forgiven,pull:pull,armPull:armPull,wobble:wobble,showSlots:showSlots,hideSlots:hideSlots,onTapPiece:null,
  fire:fire,burn:burn,knock:knock,wallFall:wallFall,caveIn:caveIn,crack:crack,setRubble:setRubble,takeRubble:takeRubble,fuse:fuse,seal:seal,setCity:setCity,home:home,wait:wait,
  gemColors:GEMS};
size();frame();root.requestAnimationFrame(loop);return api;
}
root.RockScene={create:create};
})(typeof globalThis!=='undefined'?globalThis:window);
