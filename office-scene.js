import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { roomLayout } from './office-layout.mjs';


const $=s=>document.querySelector(s), mobile=matchMedia('(max-width:700px)').matches;
// Esta sala e uma visualizacao operacional: o movimento faz parte da experiencia
// solicitada e deve continuar ativo mesmo se o Windows estiver em "reduzir movimento".
const reducedMotion=false;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#d9ddd2');scene.fog=new THREE.Fog('#d9ddd2',75,170);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.08,200);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:1.8));
renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
renderer.outputColorSpace=THREE.SRGBColorSpace;$('#room').appendChild(renderer.domElement);
const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(new RoomEnvironment(),.04);
scene.environment=environment.texture;pmrem.dispose();
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;
controls.maxPolarAngle=Math.PI*.48;controls.minDistance=2.2;controls.maxDistance=130;controls.autoRotateSpeed=.3;
controls.enablePan=true;controls.target.set(-.7,1.1,-2);camera.position.set(mobile?10:7.1,mobile?6:3.65,mobile?13:8.7);
const palette={wood:'#997951',oak:'#bea078',wall:'#dddcd0',white:'#eeeee5',teal:'#16434a',fabric:'#657e71',metal:'#343e37',brass:'#ab966b'};
function mat(color,roughness=.6,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
let seed=781;function noise(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
 if(kind==='wood'){x.fillStyle='#a58a65';x.fillRect(0,0,512,512);for(let i=0;i<1500;i++){const y=noise()*512;x.strokeStyle=`rgba(${noise()>.5?'52,35,15':'231,216,178'},${noise()*.10})`;x.lineWidth=.4+noise()*1.2;x.beginPath();x.moveTo(0,y);for(let p=0;p<=512;p+=16)x.lineTo(p,y+Math.sin(p*.018+i)*(.3+noise()*2));x.stroke()}for(let i=0;i<7;i++){x.fillStyle='#38291513';x.fillRect(0,i*80,512,1)}}
 else if(kind==='fabric'){x.fillStyle='#d0d0c1';x.fillRect(0,0,512,512);for(let i=0;i<512;i+=3){x.strokeStyle=i%2?'#253a2513':'#ffffff24';x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.moveTo(0,i);x.lineTo(512,i);x.stroke()}}
 else{x.fillStyle='#d8d8cc';x.fillRect(0,0,512,512);for(let i=0;i<13000;i++){x.fillStyle=noise()>.5?'#ffffff16':'#3f423b0a';x.fillRect(noise()*512,noise()*512,noise()*3+1,noise()*2+1)}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
const woodTex=texture('wood'),fabricTex=texture('fabric'),stoneTex=texture('stone');
const materials={wood:new THREE.MeshStandardMaterial({map:woodTex,color:'#e1c79f',roughness:.43}),darkwood:new THREE.MeshStandardMaterial({map:woodTex,color:'#816146',roughness:.48}),wall:new THREE.MeshStandardMaterial({map:stoneTex,color:palette.wall,roughness:.95}),stone:new THREE.MeshStandardMaterial({map:stoneTex,color:'#c9c5b5',roughness:.7}),fabric:new THREE.MeshStandardMaterial({map:fabricTex,color:palette.fabric,roughness:.98}),cream:new THREE.MeshStandardMaterial({map:fabricTex,color:'#d8ccb2',roughness:1}),metal:mat(palette.metal,.35,.55),brass:mat(palette.brass,.35,.68),white:mat(palette.white,.5),teal:mat(palette.teal,.6),black:mat('#202923',.5)};
function box(w,h,d,m,x=0,y=0,z=0,parent=scene,r=.025){const g=r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!m.isMeshBasicMaterial;o.receiveShadow=true;parent.add(o);return o}
function cyl(rt,rb,h,m,x,y,z,parent=scene,segments=24){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function sphere(r,m,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o}
function lineBetween(a,b,r,m,parent){const dir=new THREE.Vector3().subVectors(b,a);const o=cyl(r,r,dir.length(),m,0,0,0,parent,10);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return o}

// Architecture: parquet, plaster, tall windows and a continuous oak ceiling edge.
box(17,.2,17,materials.stone,0,-.25,0,scene,.02);
for(let row=0;row<18;row++)for(let col=0;col<7;col++){const w=1.98;const p=box(w,.08,.735,materials.wood,-6+col*2,-.10,-6.3+row*.75,scene,.008);if(row%2)p.position.x+=.35}
// Real openings let directional daylight pass through the glazing.
box(14.2,1.29,.18,materials.wall,0,.535,-6.85,scene,.01);
box(14.2,.72,.18,materials.wall,0,4.34,-6.85,scene,.01);
for(const [x,w] of [[-6.70,.8],[-.375,4.5],[6.36,1.67]])box(w,2.8,.18,materials.wall,x,2.68,-6.85,scene,.01);
box(.18,1.18,13.5,materials.wall,-7,.49,-.15,scene,.01);
box(.18,.67,13.5,materials.wall,-7,4.365,-.15,scene,.01);
for(const [z,d] of [[-5.99,1.82],[-.90,.85],[4.94,3.33]])box(.18,2.95,d,materials.wall,-7,2.655,z,scene,.01);
box(14.1,.10,.065,materials.darkwood,0,.05,-6.71);
box(.07,.10,13.4,materials.darkwood,-6.85,.05,-.12);
box(14.3,.26,.5,materials.wood,0,4.52,-6.65);
box(.5,.26,13.5,materials.wood,-6.82,4.52,-.1);
for(let i=0;i<8;i++)box(.07,2.92,.04,materials.wood,-1.24+i*.11,2.05,-6.69);
// Back wall glazing uses luminous daylight surfaces instead of a fictitious live city feed.
const sky= new THREE.MeshBasicMaterial({color:'#e5eee2'});
for(const wx of [-4.45,3.7]){
 box(3.65,2.8,.12,materials.darkwood,wx,2.72,-6.67);
 box(3.44,2.59,.035,sky,wx,2.72,-6.59,scene,0);
 box(.06,2.68,.07,materials.metal,wx,2.72,-6.51);
 box(3.55,.045,.07,materials.metal,wx,2.43,-6.51);
 box(3.92,.12,.38,materials.stone,wx,1.29,-6.48);
 for(let i=0;i<12;i++)box(.04,2.7,.06,mat('#bcbdb0',.8),wx-1.75+i*.045,2.74,-6.40);
}
for(const wz of [-3.2,1.4]){
 box(.10,2.9,3.75,materials.darkwood,-6.83,2.68,wz);
 box(.025,2.68,3.54,sky,-6.76,2.68,wz,scene,0);
 box(.06,2.79,.06,materials.metal,-6.70,2.68,wz);
 box(.06,.05,3.64,materials.metal,-6.7,2.42,wz);
 box(.4,.1,4,materials.stone,-6.64,1.23,wz);
}
const sun=new THREE.DirectionalLight('#fff0cd',3.4);sun.position.set(-9,12,-7);sun.target.position.set(2,0,1);sun.castShadow=true;
sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:40});sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;sun.shadow.radius=4;scene.add(sun,sun.target);
scene.add(new THREE.HemisphereLight('#edf1df','#9a8061',1.3));
const fill=new THREE.DirectionalLight('#dce8ec',.65);fill.position.set(5,7,9);scene.add(fill);
// Window mullions cast distinct light bands across the floor and furniture.
for(const x of [-5.8,-4.45,-3.1,2.35,3.7,5.05])box(.055,2.8,.13,materials.metal,x,2.72,-6.44);

function canvasLabel(text,sub,w=1024,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;const q=c.getContext('2d');q.fillStyle='#173f41';q.fillRect(0,0,w,h);q.fillStyle='#e6e8db';q.font='500 96px Manrope, sans-serif';q.textAlign='center';q.fillText(text,w/2,132);q.fillStyle='#78a89a';q.font='18px DM Sans, sans-serif';q.fillText(sub,w/2,185);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const sign=canvasLabel('GeoOps · DEMO','I N T E L I G Ê N C I A   T E R R I T O R I A L');box(3.05,.90,.08,materials.teal,-.18,3.18,-6.60);
const signMesh=new THREE.Mesh(new THREE.PlaneGeometry(2.97,.74),new THREE.MeshBasicMaterial({map:sign}));signMesh.position.set(-.18,3.18,-6.551);scene.add(signMesh);
// Acoustic runner defines circulation rather than a dense grid of identical labels.
const rug=box(3.35,.025,9.45,materials.cream,.10,-.043,-.15,scene,.02);
for(const x of [-1.46,1.66])box(.018,.005,9.0,materials.fabric,x,-.026,-.15,scene,.002);

const stations=[],pickables=[];
const avatarProfiles=[
 {skin:'#c58b6b',hair:'#30261f',shirt:'#345b59',accent:'#ddcbb0',trousers:'#343c3d',style:'part',glasses:true},
 {skin:'#935d43',hair:'#211c1a',shirt:'#63758e',accent:'#ddd9cf',trousers:'#303846',style:'curls'},
 {skin:'#dbab89',hair:'#68422e',shirt:'#b1a18b',accent:'#eeebe1',trousers:'#4b514a',style:'bob'},
 {skin:'#77503d',hair:'#211e1d',shirt:'#647667',accent:'#d8d2c4',trousers:'#3d4245',style:'crop',glasses:true}
];
function avatarMaterial(color){return mat(color,.86,0)}
// Smooth anatomical cross-sections, in metres. A single continuous surface replaces
// the stacked boxes/cylinders; these are stylised representations, not real staff.
function avatarForm(rings,material,parent,segments=32){
 const curve=new THREE.CatmullRomCurve3(rings.map(r=>new THREE.Vector3(r[1],r[0],r[2]))),vertices=[],indices=[];
 const rows=32;
 for(let j=0;j<=rows;j++){
  const t=j/rows,p=curve.getPoint(t),r=t*(rings.length-1),lo=Math.floor(r),hi=Math.min(lo+1,rings.length-1),z=THREE.MathUtils.lerp(rings[lo][3]||0,rings[hi][3]||0,r-lo);
  for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(Math.sin(a)*Math.max(.0001,p.x),p.y,Math.cos(a)*Math.max(.0001,p.z)+z)}
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;if(rings[0][0]<rings[rings.length-1][0])indices.push(a,a+1,b,a+1,b+1,b);else indices.push(a,b,a+1,a+1,b,b+1)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function avatarEllipsoid(parent,material,position,scale){const mesh=sphere(1,material,...position,parent);mesh.scale.set(...scale);return mesh}
function avatarCurve(parent,points,radius,material){
 const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,radius,6,false);
 const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function avatarLimb(parent,end,radii,material){
 const length=new THREE.Vector3(...end).length();
 const mesh=avatarForm([[0,.001,.001],[-length*.08,radii[0],radii[0]*.84],[-length*.32,radii[1],radii[1]*.87],[-length*.76,radii[2],radii[2]*.86],[-length*.97,radii[3],radii[3]*.90],[-length,.001,.001]],material,parent,24);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),new THREE.Vector3(...end).normalize());return mesh;
}
function makeHand(parent,side,skin,nail){
 const hand=new THREE.Group();parent.add(hand);
 avatarEllipsoid(hand,skin,[0,0,-.033],[.035,.016,.047]);
 const fingers=[];
 for(let i=0;i<4;i++){
  const finger=new THREE.Group();finger.position.set((i-1.5)*.017,-.002,-.064+Math.abs(i-1.5)*.007);hand.add(finger);
  const length=[.050,.060,.056,.043][i];
  avatarLimb(finger,[0,-.006,-length*.53],[.009,.0085,.0077,.007],skin);
  const tip=new THREE.Group();tip.position.set(0,-.006,-length*.48);finger.add(tip);
  avatarLimb(tip,[0,-.010,-length*.51],[.0078,.0075,.006,.005],skin);
  avatarEllipsoid(tip,nail,[0,-.001,-length*.33],[.0048,.0015,.007]);fingers.push(finger);
 }
 const thumb=new THREE.Group();thumb.position.set(-side*.025,-.004,-.012);thumb.rotation.y=side*.60;hand.add(thumb);
 avatarLimb(thumb,[-side*.023,-.008,-.042],[.011,.012,.009,.006],skin);
 return{hand,fingers};
}
function makeHair(parent,profile,hair){
 // The crown is explicitly closed. The asymmetric hairline leaves a forehead,
 // while side/back coverage follows the skull instead of floating above it.
 const vertices=[],indices=[],rows=22,columns=64;
 for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
  const a=i/columns*Math.PI*2,front=(1-Math.cos(a))/2;
  const edge=1.93-front*.84+(profile.style==='part'?.12*Math.sin(a)*front:0),p=j/rows*edge;
  const wave=profile.style==='curls'?.004*Math.sin(a*13+p*18)*Math.sin(p):0;
  vertices.push((.105+wave)*Math.sin(p)*Math.sin(a),.018+(.156+wave)*Math.cos(p),.008+(.109+wave)*Math.sin(p)*Math.cos(a));
 }
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const scalp=new THREE.Mesh(geometry,hair);scalp.castShadow=true;parent.add(scalp);
 const highlight=avatarMaterial(new THREE.Color(profile.hair).multiplyScalar(1.18));
 if(profile.style==='curls'){
  for(let i=0;i<34;i++){const a=i*2.399,p=.23+Math.sqrt(i/34)*1.22;avatarEllipsoid(parent,i%4?hair:highlight,[.102*Math.sin(p)*Math.sin(a),.022+.158*Math.cos(p),.010+.105*Math.sin(p)*Math.cos(a)],[.019,.017,.020])}
 }else{
  for(let i=0;i<8;i++){
   const a=.5+i*.27;
   avatarCurve(parent,[[.010,.174,.019],[Math.sin(a)*.065,.155,-.045],[Math.sin(a)*.099,.102,-.077],[Math.sin(a)*.099,.065,-.075]],.006,i%3?hair:highlight);
  }
 }
 if(profile.style==='bob'){
  // Tucked side panels and a soft nape; no strands cover the eyes.
  for(const side of [-1,1]){const lock=avatarForm([[-.16,.025,.042,.028],[-.13,.046,.059,.025],[-.04,.043,.075,.018],[.05,.035,.070,.011],[.10,.014,.042,.008]],hair,parent,24);lock.position.x=side*.080;lock.rotation.z=side*.09}
  avatarEllipsoid(parent,hair,[0,-.066,.078],[.089,.106,.039]);
 }
}
function makeAvatar(station,index){
 const profile=avatarProfiles[index%avatarProfiles.length],root=new THREE.Group(),body=new THREE.Group();
 root.position.set(0,.50,.90);station.group.add(root);root.add(body);
 const skin=avatarMaterial(profile.skin),hair=avatarMaterial(profile.hair),shirt=avatarMaterial(profile.shirt),accent=avatarMaterial(profile.accent),trousers=avatarMaterial(profile.trousers);
 const nail=avatarMaterial(new THREE.Color(profile.skin).lerp(new THREE.Color('#f1d0b7'),.25)),shoes=mat('#34302c',.59);
 const torso=avatarForm([[.12,.13,.083,.03],[.17,.166,.108,.018],[.29,.158,.103,.010],[.42,.179,.112,-.009],[.52,.215,.102,-.026],[.57,.206,.090,-.023],[.60,.151,.074,-.021],[.62,.069,.056,-.020]],shirt,body);
 avatarEllipsoid(body,trousers,[0,.10,.025],[.178,.102,.136]);
 avatarForm([[.595,.052,.047,-.023],[.620,.051,.046,-.026],[.650,.049,.045,-.028],[.680,.047,.043,-.030]],skin,body,24);
 // Shirt opening, folded collar, cuffs and seams make clothing read as clothing.
 const opening=avatarForm([[.40,.010,.004,-.115],[.49,.032,.008,-.128],[.565,.060,.013,-.108],[.601,.051,.021,-.070]],accent,body,20);
 for(const side of [-1,1]){
  avatarCurve(body,[[side*.055,.605,-.072],[side*.083,.569,-.110],[side*.048,.535,-.130]],.012,accent);
  avatarCurve(body,[[side*.060,.594,-.077],[side*.105,.527,-.119],[side*.039,.403,-.116],[side*.026,.200,-.093]],.0025,accent);
 }
 for(const y of [.24,.30,.36])avatarEllipsoid(body,accent,[0,y,-.098],[.004,.004,.003]);
 avatarCurve(body,[[.10,.435,-.111],[.143,.432,-.106],[.168,.429,-.094]],.0025,accent);
 const head=new THREE.Group();head.position.set(0,.774,-.056);body.add(head);
 avatarForm([[-.142,.020,.034,-.026],[-.129,.045,.048,-.025],[-.099,.068,.069,-.012],[-.060,.082,.082,-.002],[.003,.090,.085,.003],[.061,.089,.083,.007],[.111,.074,.071,.010],[.143,.040,.041,.012],[.153,.001,.001,.012]],skin,head);
 const skinShade=avatarMaterial(new THREE.Color(profile.skin).multiplyScalar(.84)),lip=avatarMaterial(new THREE.Color(profile.skin).lerp(new THREE.Color('#884f45'),.36));
 for(const side of [-1,1]){
  avatarEllipsoid(head,skin,[side*.091,-.018,.006],[.017,.031,.019]);
  avatarEllipsoid(head,skinShade,[side*.102,-.019,-.002],[.005,.017,.010]);
  // Small inset eyes avoid the old toy-like goggle silhouette.
  avatarEllipsoid(head,skinShade,[side*.038,.014,-.077],[.024,.011,.010]);
  const eye=new THREE.Group();eye.position.set(side*.038,.015,-.084);head.add(eye);
  avatarEllipsoid(eye,avatarMaterial('#ded8c8'),[0,0,0],[.018,.0065,.005]);
  avatarEllipsoid(eye,hair,[0,0,-.0045],[.006,.006,.002]);
  avatarCurve(head,[[side*.020,.041,-.080],[side*.039,.044,-.079],[side*.058,.040,-.070]],.0037,hair);
 }
 const nose=avatarForm([[-.045,.010,.009,-.090],[-.033,.017,.015,-.095],[-.019,.013,.017,-.097],[.015,.008,.008,-.085],[.039,.004,.003,-.080]],skin,head,20);
 avatarCurve(head,[[-.026,-.072,-.077],[0,-.075,-.084],[.026,-.072,-.077]],.0028,lip);
 avatarEllipsoid(head,skin, [0,-.109,-.064],[.025,.015,.012]);
 makeHair(head,profile,hair);
 const eyes=head.children.filter(child=>child.isGroup);
 if(profile.glasses){
  const frameMat=mat('#514f44',.38,.45);
  for(const side of [-1,1]){
   avatarCurve(head,[[side*.013,.026,-.093],[side*.039,.030,-.095],[side*.065,.022,-.086],[side*.062,-.003,-.087],[side*.037,-.008,-.094],[side*.015,0,-.093],[side*.013,.026,-.093]],.0027,frameMat);
   avatarCurve(head,[[side*.065,.022,-.086],[side*.088,.023,-.049],[side*.098,.010,.008]],.0025,frameMat);
  }
  avatarCurve(head,[[-.012,.017,-.094],[0,.020,-.100],[.012,.017,-.094]],.0025,frameMat);
 }
 const arms=[];
 for(const side of [-1,1]){
  const shoulder=new THREE.Group();shoulder.position.set(side*.200,.559,-.020);body.add(shoulder);
  avatarLimb(shoulder,[side*.042,-.240,-.180],[.069,.073,.059,.048],shirt);
  const forearm=new THREE.Group();forearm.position.set(side*.042,-.240,-.180);shoulder.add(forearm);
  avatarEllipsoid(forearm,shirt,[0,.005,.006],[.047,.050,.049]);
  avatarLimb(forearm,[-side*.089,.060,-.272],[.047,.049,.039,.032],shirt);
  avatarLimb(forearm,[-side*.111,.068,-.348],[.039,.043,.029,.024],skin);
  const cuff=new THREE.Group();cuff.position.set(-side*.085,.057,-.259);forearm.add(cuff);
  avatarLimb(cuff,[-side*.010,.006,-.032],[.033,.035,.033,.032],accent);
  const wrist=new THREE.Group();wrist.position.set(-side*.111,.068,-.348);forearm.add(wrist);
  const {hand,fingers}=makeHand(wrist,side,skin,nail);hand.rotation.y=side*.09;
  arms.push({shoulder,forearm,wrist,hand,fingers});
 }
 for(const side of [-1,1]){
  const thigh=new THREE.Group();thigh.position.set(side*.101,.093,-.025);root.add(thigh);
  avatarLimb(thigh,[side*.018,-.095,-.398],[.088,.097,.077,.068],trousers);
  const shin=new THREE.Group();shin.position.set(side*.018,-.095,-.398);thigh.add(shin);
  avatarEllipsoid(shin,trousers,[0,0,0],[.069,.074,.069]);
  avatarLimb(shin,[side*.016,-.473,-.030],[.063,.068,.050,.041],trousers);
  avatarCurve(shin,[[0,-.07,-.061],[0,-.25,-.059],[side*.011,-.43,-.068]],.002,accent);
  avatarEllipsoid(shin,shoes,[side*.016,-.510,-.083],[.061,.048,.128]);
  box(.118,.013,.224,accent,side*.016,-.546,-.089,shin,.006);
  for(let lace=0;lace<3;lace++)avatarCurve(shin,[[-.029+side*.016,-.476-lace*.003,-.054-lace*.020],[side*.016,-.471-lace*.003,-.054-lace*.020],[.029+side*.016,-.476-lace*.003,-.054-lace*.020]],.002,accent);
 }
 return{root,body,torso,head,eyes,arms,materials:{shirt,accent},status:'unavailable',phase:index*1.71,activity:0};
}
function setAvatar(station,agent){
 if(!agent){if(station.avatar){station.avatar.root.visible=false;station.avatar.status='unavailable';station.avatar.activity=0}return}
 if(!station.avatar)station.avatar=makeAvatar(station,stations.indexOf(station));
 const avatar=station.avatar;avatar.root.visible=true;avatar.status=agent.status;
 // Identity colours are stable. Only the verified station indicator signals work.
 if(agent.status!=='running')avatar.activity=0;
}
let avatarFrameTime=0;
function animateAvatars(now){
 const seconds=now*.001,dt=Math.min(.05,(now-avatarFrameTime)*.001);avatarFrameTime=now;
 stations.forEach(station=>{const avatar=station.avatar;if(!avatar||!avatar.root.visible)return;
  const wave=seconds+avatar.phase,connected=['running','recent','idle','waiting'].includes(avatar.status);
  const moving=!reducedMotion; // Decorative breathing does not signal a job.
  // Movimento ambiental não indica execução; digitação depende da etapa demonstrativa.
  const realRunning=avatar.status==='running'&&Date.now()-Date.parse(station.agent?.lastSeen)<90000;
  const working=moving&&realRunning;
  const pulse=.5+.5*Math.sin(wave*(realRunning?2.2:1.15));
  const targetActivity=working?(realRunning?.72+.28*pulse:.34+.18*pulse):0;
  avatar.activity=THREE.MathUtils.damp(avatar.activity,targetActivity,8,dt);
  const activity=avatar.activity;
  avatar.root.position.y=.50+(moving?.012*Math.sin(wave*1.1):0);
  avatar.body.rotation.x=moving?.032*Math.sin(wave*1.1):0;
  avatar.head.rotation.set(moving?-.045+.055*Math.sin(wave*.83):0,moving?.15*Math.sin(wave*.37)+activity*.075*Math.sin(wave*1.8):0,moving?.038*Math.sin(wave*.61):0);
  const blink=moving&&Math.sin(wave*1.37)>.997?.12:1;avatar.eyes.forEach(eye=>eye.scale.y=blink);
  avatar.arms.forEach((arm,i)=>{
   arm.shoulder.rotation.x=activity*.22*Math.sin(wave*4.2+i*2.2);
   arm.forearm.rotation.x=activity*.34*Math.sin(wave*5.1+i*2.7);
   arm.wrist.rotation.x=activity*.24*Math.sin(wave*6.3+i*1.7);
   arm.fingers.forEach((finger,j)=>{finger.rotation.x=-activity*.34*Math.pow(Math.max(0,Math.sin(wave*(6.2+j*.71)+i*2.6+j*1.4)),4)});
  });
 });
}
function makeScreen(){const c=document.createElement('canvas');c.width=768;c.height=432;const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return{canvas:c,texture:tex}}
function drawStation(s,a){const q=s.screen.canvas.getContext('2d'),w=768,h=432;
q.fillStyle='#102f33';q.fillRect(0,0,w,h);q.fillStyle='#bad5c7';q.font='500 23px DM Sans';q.fillText('GeoOps · DEMO',40,48);q.fillStyle='#285054';q.fillRect(40,76,688,1);
q.fillStyle='#e0e9dc';q.font='500 38px DM Sans';q.fillText(a?String(a.name).slice(0,28):'Espaço para inteligência',40,153);
q.fillStyle='#83a49a';q.font='20px DM Sans';q.fillText(a?String(a.role||'').slice(0,52):'Sala de operações',40,197);
q.fillStyle=a?.status==='running'?'#6fc3a3':a?.status==='recent'?'#b2c96f':'#a5b3a7';q.beginPath();q.arc(48,267,5,0,Math.PI*2);q.fill();q.font='20px DM Sans';q.fillText(a?statusLabel(a.status):'Sem dados confirmados',66,275);
q.fillStyle='#42655d';q.font='16px DM Sans';q.fillText(a?.lastSeen?'Último sinal · '+timeLabel(a.lastSeen):'Aguardando informação da fonte',40,365);
s.screen.texture.needsUpdate=true;s.agent=a||null;s.indicator.material.color.set(a?.status==='running'?'#63b79b':'#859181');s.indicator.material.emissive.set(a?.status==='running'?'#173d2d':'#000000');setAvatar(s,a)}
function chair(parent){const g=new THREE.Group();parent.add(g);g.position.set(0,0,.90);
cyl(.043,.055,.41,materials.metal,0,.28,0,g);cyl(.16,.17,.05,materials.metal,0,.09,0,g);
for(let i=0;i<5;i++){const a=i*Math.PI*2/5;lineBetween(new THREE.Vector3(0,.13,0),new THREE.Vector3(Math.cos(a)*.36,.08,Math.sin(a)*.36),.025,materials.metal,g);const wh=cyl(.043,.043,.055,materials.black,Math.cos(a)*.36,.055,Math.sin(a)*.36,g,12);wh.rotation.z=Math.PI/2}
box(.60,.11,.58,materials.fabric,0,.49,0,g,.055);
const back=box(.55,.59,.095,materials.fabric,0,.84,.28,g,.065);back.rotation.x=-.12;
for(const x of [-.31,.31]){box(.034,.26,.034,materials.metal,x,.65,.11,g,.01);box(.07,.05,.32,materials.black,x,.79,.02,g,.024)}
box(.44,.10,.06,materials.metal,0,.54,.27,g,.02);return g}
function desk(x,z,rotation,index){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;scene.add(group);
box(2.15,.075,1.08,materials.wood,0,.79,0,group,.035);
for(const lx of [-.91,.91]){box(.06,.72,.68,materials.teal,lx,.39,0,group,.018);box(.24,.035,.82,materials.metal,lx,.04,0,group,.012)}
box(1.60,.11,.045,materials.teal,0,.60,-.32,group,.015);
box(.37,.025,.29,materials.metal,0,.85,-.28,group,.022);box(.055,.28,.045,materials.metal,0,.98,-.31,group,.008);
box(1.08,.67,.055,materials.black,0,1.36,-.33,group,.035);
const screen=makeScreen();const sm=new THREE.Mesh(new THREE.PlaneGeometry(1.015,.578),new THREE.MeshStandardMaterial({map:screen.texture,emissiveMap:screen.texture,emissive:'#ffffff',emissiveIntensity:.22,roughness:.4}));sm.position.set(0,1.373,-.296);group.add(sm);
box(.74,.012,.37,mat('#6a7466',.95),0,.838,.19,group,.025);
box(.49,.022,.17,materials.white,-.05,.86,.18,group,.014);
const keys=new THREE.InstancedMesh(new THREE.BoxGeometry(.025,.006,.025),materials.white,52),keyMatrix=new THREE.Matrix4();for(let row=0;row<4;row++)for(let col=0;col<13;col++){keyMatrix.makeTranslation(-.266+col*.035,.874,.128+row*.033);keys.setMatrixAt(row*13+col,keyMatrix)}group.add(keys);
const mouse=sphere(.045,materials.white,.32,.86,.22,group);mouse.scale.set(.72,.36,1.15);
box(.28,.045,.37,materials.teal,-.78,.855,.12,group,.012);box(.255,.016,.34,materials.cream,-.78,.88,.12,group,.008);
cyl(.06,.045,.1,materials.stone,.80,.89,.24,group);const handle=new THREE.Mesh(new THREE.TorusGeometry(.034,.008,8,16),materials.stone);handle.position.set(.862,.90,.24);group.add(handle);
// Brass task lamp, with a real pool of light rather than a pulsing activity effect.
cyl(.11,.12,.022,materials.brass,.82,.845,-.29,group);lineBetween(new THREE.Vector3(.82,.85,-.29),new THREE.Vector3(.82,1.45,-.35),.013,materials.brass,group);lineBetween(new THREE.Vector3(.82,1.45,-.35),new THREE.Vector3(.61,1.52,-.19),.013,materials.brass,group);
const hood=cyl(.075,.12,.085,materials.teal,.61,1.49,-.19,group);hood.rotation.z=-.3;
const bulb=new THREE.Mesh(new THREE.CircleGeometry(.085,20),new THREE.MeshBasicMaterial({color:'#fff0b9'}));bulb.position.set(.61,1.443,-.19);bulb.rotation.x=-Math.PI/2;group.add(bulb);
const lamp=new THREE.PointLight('#ffdc9a',.30,1.8,2);lamp.position.set(.61,1.40,-.19);group.add(lamp);
const indicator=sphere(.017,mat('#859181',.6),.49,1.06,-.295,group);
chair(group);const station={group,screen,indicator,agent:null,avatar:null,index};stations.push(station);
const hit=box(2.2,1.6,1.18,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),0,.85,0,group,0);hit.userData.station=index;pickables.push(hit);drawStation(station,null);}
// Geometria original preservada. Identidades abaixo são exemplos locais.
for(let i=0;i<3;i++){desk(-3.60,-4.65+i*3.15,Math.PI/2,i);desk(3.65,-4.65+i*3.15,-Math.PI/2,i+3)}
stations.sort((a,b)=>a.index-b.index);

function plant(x,z,scale=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);cyl(.28,.21,.5,materials.stone,0,.25,0,g);cyl(.24,.24,.024,mat('#463e2c',1),0,.50,0,g);const leafMat=mat('#3c6243',.88);const leafLight=mat('#66805a',.9);
for(let i=0;i<13;i++){const angle=i*2.399,ht=.62+(i%5)*.19;const endpoint=new THREE.Vector3(Math.cos(angle)*(.24+(i%3)*.08),ht,Math.sin(angle)*(.25+(i%3)*.07));lineBetween(new THREE.Vector3(0,.46,0),endpoint,.012,materials.darkwood,g);const leaf=sphere(.15,i%3?leafMat:leafLight,endpoint.x,endpoint.y,endpoint.z,g);leaf.scale.set(.58,1.65,.17);leaf.rotation.set(.25,angle,.4*Math.sin(angle))}}
plant(-5.95,-5.6,1.25);plant(5.90,-5.7,1.4);plant(-5.95,4.25,1.45);plant(5.75,3.7,1.25);
// Low credenza, books and ceramics make the interior usable without simulated employees.
box(3.25,.80,.47,materials.darkwood,.20,.43,-6.25,scene,.028);
for(let i=0;i<4;i++){box(.79,.71,.025,materials.wood,-1.0+i*.80,.44,-5.997,scene,.01);box(.24,.018,.025,materials.brass,-1+i*.8,.65,-5.972,scene,.004)}
for(let i=0;i<5;i++)box(.18,.26+(i%3)*.055,.18,[materials.teal,materials.cream,materials.fabric][i%3],-.70+i*.19,.95+(i%3)*.027,-6.20,scene,.006);
cyl(.12,.10,.25,materials.stone,1.14,.96,-6.19);sphere(.13,materials.cream,.89,.89,-6.18).scale.y=.55;
// Foreground lounge and circular stone table.
function lounge(x,z,rot){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);for(const dx of [-.40,.40])for(const dz of [-.31,.31])cyl(.028,.023,.26,materials.darkwood,dx,.14,dz,g,12);box(.94,.19,.85,materials.cream,0,.38,0,g,.08);box(.92,.60,.19,materials.cream,0,.70,-.37,g,.09);for(const dx of [-.46,.46])box(.17,.37,.80,materials.cream,dx,.55,0,g,.08);const p=box(.45,.39,.15,materials.fabric,.02,.66,-.24,g,.06);p.rotation.z=.12;return g}
lounge(-2.65,5.10,.28);lounge(-4.8,4.7,-.52);
cyl(.52,.55,.055,materials.stone,-3.64,.42,4.11,scene,48);cyl(.16,.25,.40,materials.darkwood,-3.64,.21,4.11,scene,32);
box(.29,.018,.24,materials.teal,-3.64,.46,4.11,scene,.006);cyl(.043,.035,.07,materials.cream,-3.38,.48,4.20);
// Slender ceiling luminaires suggest an enclosure while keeping navigation open.
for(const z of [-3.9,.3]){box(2.0,.055,.12,materials.brass,0,3.66,z,scene,.025);box(1.9,.015,.09,new THREE.MeshBasicMaterial({color:'#fff2d0'}),0,3.623,z,scene,.01);for(const x of [-.7,.7])cyl(.006,.006,.86,materials.metal,x,4.12,z,scene,8)}

const annex=new THREE.Group();scene.add(annex);let layoutCount=-1;
function ensureRoom(count){
 if(layoutCount===count)return;layoutCount=count;const layout=roomLayout(count);
 while(stations.length<count){const i=stations.length,p=layout.positions[i];desk(p.x,p.z,p.rotation,i)}
 stations.forEach((st,i)=>{st.group.visible=i<count});pickables.forEach(hit=>hit.visible=hit.userData.station<count);
 for(const child of [...annex.children]){child.geometry?.dispose();annex.remove(child)}
 if(count>6){const depth=layout.end-6.6,center=6.6+depth/2;
 box(14.6,.2,depth,materials.stone,0,-.25,center,annex,.01);
 for(let row=0;row<Math.ceil(depth/.75);row++)box(14,.08,.735,materials.wood,0,-.10,6.95+row*.75,annex,.005);
 for(const x of [-7,7]){box(.15,1.15,depth,materials.wall,x,.47,center,annex,.01);box(.35,.22,depth,materials.wood,x,4.5,center,annex,.01)}
 for(let z=9;z<layout.end;z+=6.3){box(2,.055,.12,materials.brass,0,3.66,z,annex,.02);box(.20,3.1,.18,materials.darkwood,-7,2.7,z-1.4,annex,.01);box(.04,2.7,4.6,sky,-7,2.7,z+.7,annex,0);box(.06,.05,4.6,materials.metal,-6.94,2.45,z+.7,annex,0);}
 }
 camera.far=Math.max(200,layout.span*4);camera.updateProjectionMatrix();controls.maxDistance=Math.max(40,layout.span*3);
 cameras.wide={position:[layout.span*.65,layout.span*.65,layout.end+layout.span*.75],target:[0,.8,layout.center]};
 if(count>6)flyTo(new THREE.Vector3(...cameras.wide.position),new THREE.Vector3(...cameras.wide.target));
 window.__roomLayout={agents:count,stations:stations.filter(st=>st.group.visible).length,pages:1};
}

// Adaptador local demonstrativo, sem APIs ou agentes de produção.
function statusLabel(status){return {running:'Executando · DEMO',recent:'Etapa concluída · DEMO',idle:'Aguardando fluxo',waiting:'Revisão humana necessária',unavailable:'Indisponível'}[status]||'Aguardando fluxo'}
function timeLabel(value){const t=new Date(value);return Number.isFinite(t.getTime())?new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(t):'Não iniciado'}
const demoAgents=[
 ['Imagem','Preparação da base','Imagem fictícia preparada. Nenhum acervo de satélite consultado.'],
 ['Vetorização','Sugestão de feições','Polígonos preparados para a demonstração; sem classificação automática real.'],
 ['QA','Revisão técnica','Classificação encaminhada para revisão humana; validação GIS real pendente.'],
 ['Cartografia','Composição do mapa','Simbologia e layout demonstrativos organizados.'],
 ['Memória','Histórico do projeto','Contexto demonstrativo registrado localmente.'],
 ['Coordenação','Sequência da equipe','Fluxo demonstrativo concluído; decisões continuam com o responsável técnico.']
];
let dataAgents=demoAgents.map(([name,role,lastAction],i)=>({id:'geoops-demo-'+i,name,role,lastAction,status:'idle',lastSeen:null})),selected=-1,selectionAnimation=null;
let flowTimer=null,flowRunning=false,flowFinished=false,parentVisible=true,officeVisible=!document.hidden,lastFrame=0;
function safeText(tag,text,cls){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=text;return el}
function selectAgent(index,focus=true){
 selected=index;const a=dataAgents[index];if(!a)return;
 document.querySelectorAll('.agent-row').forEach((row,i)=>row.classList.toggle('selected',i===index));
 const detail=$('#agent-detail');detail.replaceChildren();detail.append(safeText('strong',a.name),safeText('p',a.role),safeText('p',statusLabel(a.status)),safeText('p',a.status==='idle'?'Etapa ainda não iniciada.':a.lastAction));detail.hidden=false;
 if(focus&&index<stations.length){const st=stations[index],p=st.group.position.clone(),axis=new THREE.Vector3(0,1,0);const offset=new THREE.Vector3(1.8,1.65,-.65).applyAxisAngle(axis,st.group.rotation.y),target=new THREE.Vector3(0,1.02,.55).applyAxisAngle(axis,st.group.rotation.y);flyTo(p.clone().add(offset),p.clone().add(target));document.querySelectorAll('[data-camera]').forEach(b=>b.classList.remove('active'))}
}
function renderDemo(){
 ensureRoom(dataAgents.length);const list=$('#agent-list');list.replaceChildren();
 dataAgents.forEach((a,i)=>{const b=document.createElement('button');b.className='agent-row';b.append(safeText('span',String(i+1).padStart(2,'0'),'agent-number'));const info=safeText('span','','agent-info');info.append(safeText('strong',a.name),safeText('small',statusLabel(a.status)));b.append(info,safeText('span','','state-mark '+a.status));b.addEventListener('click',()=>selectAgent(i));list.append(b)});
 stations.forEach((station,i)=>drawStation(station,dataAgents[i]));
 $('#connection-text').textContent=flowRunning?'DEMO local · fluxo em andamento':flowFinished?'DEMO local · fluxo concluído':'DEMO local · aguardando início';
 $('#source-time').textContent='Sem dados externos. QA permanece sujeito à revisão humana.';$('#run-flow').disabled=flowRunning;
 if(selected>=0)selectAgent(selected,false);
}
function emitOffice(title,detail){if(parent!==window)parent.postMessage({type:'geoops:office-event',title,detail},location.origin)}
function executarFluxo(){
 if(flowRunning)return;clearTimeout(flowTimer);dataAgents.forEach(a=>{a.status='idle';a.lastSeen=null});flowRunning=true;flowFinished=false;
 const order=[0,1,2,3,4,5];let step=0;
 function advance(){
  if(step){const prev=dataAgents[order[step-1]];prev.status=prev.name==='QA'?'waiting':'recent'}
  if(step===order.length){flowRunning=false;flowFinished=true;renderDemo();emitOffice('Fluxo demonstrativo concluído','Seis etapas simuladas. O resultado permanece sujeito à revisão humana.');return}
  const a=dataAgents[order[step++]];a.status='running';a.lastSeen=new Date().toISOString();renderDemo();emitOffice(a.name+' · etapa demonstrativa',a.lastAction);flowTimer=setTimeout(advance,1100);
 } advance();
}
$('#run-flow').addEventListener('click',executarFluxo);
document.addEventListener('visibilitychange',()=>{officeVisible=!document.hidden&&parentVisible});
window.addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin||!event.data)return;if(event.data.type==='geoops:office-visibility'){parentVisible=Boolean(event.data.visible);officeVisible=!document.hidden&&parentVisible}if(event.data.type==='geoops:office-run')executarFluxo()});
// Preset views, smooth camera travel and individual station selection.
const cameras={interior:{position:[7.1,3.65,8.7],target:[-.7,1.1,-2]},wide:{position:[13,10.5,16],target:[0,.7,-.4]},front:{position:[.5,2.2,8.9],target:[0,1.55,-4.6]}};
function flyTo(position,target){controls.autoRotate=false;$('#orbit').classList.remove('active');$('#orbit').setAttribute('aria-pressed','false');if(reducedMotion){camera.position.copy(position);controls.target.copy(target);return}selectionAnimation={start:performance.now(),from:camera.position.clone(),to:position,fromTarget:controls.target.clone(),toTarget:target}}
document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-camera]').forEach(x=>x.classList.toggle('active',x===b));const c=cameras[b.dataset.camera];flyTo(new THREE.Vector3(...c.position),new THREE.Vector3(...c.target))}));
$('#orbit').addEventListener('click',()=>{selectionAnimation=null;controls.autoRotate=!controls.autoRotate;$('#orbit').classList.toggle('active',controls.autoRotate);$('#orbit').setAttribute('aria-pressed',String(controls.autoRotate))});controls.addEventListener('start',()=>{selectionAnimation=null;controls.autoRotate=false;$('#orbit').classList.remove('active');$('#orbit').setAttribute('aria-pressed','false')});
let panelOpen=!mobile;function togglePanel(){panelOpen=!panelOpen;$('#panel-body').hidden=!panelOpen;$('#panel-toggle').setAttribute('aria-expanded',String(panelOpen));$('#panel-toggle-icon').textContent=panelOpen?'−':'+'}$('#panel-toggle').addEventListener('click',togglePanel);if(mobile){$('#panel-body').hidden=true;$('#panel-toggle').setAttribute('aria-expanded','false');$('#panel-toggle-icon').textContent='+'}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null,hover=-1;
function hitAt(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables.filter(hit=>hit.visible),false)[0]?.object.userData.station??-1}
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;const i=hitAt(e);if(i>=0&&dataAgents[i]){if(!panelOpen)togglePanel();selectAgent(i)}down=null});
renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;hover=hitAt(e);const tip=$('#station-tip');if(hover>=0){tip.textContent=dataAgents[hover]?dataAgents[hover].name+' · '+statusLabel(dataAgents[hover].status):'Estação disponível · sem dados';tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px';tip.hidden=false;renderer.domElement.style.cursor=dataAgents[hover]?'pointer':'grab'}else{tip.hidden=true;renderer.domElement.style.cursor='grab'}});renderer.domElement.addEventListener('pointerleave',()=>$('#station-tip').hidden=true);$('#station-tip').addEventListener('click',()=>{if(hover>=0&&dataAgents[hover])selectAgent(hover)});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let started=false;function frame(now){requestAnimationFrame(frame);if(!officeVisible||now-lastFrame<1000/30)return;lastFrame=now;if(selectionAnimation){const a=selectionAnimation,t=Math.min(1,(now-a.start)/1250),smooth=t*t*(3-2*t);camera.position.lerpVectors(a.from,a.to,smooth);controls.target.lerpVectors(a.fromTarget,a.toTarget,smooth);if(t===1)selectionAnimation=null}animateAvatars(now);controls.update();renderer.render(scene,camera);if(!started){started=true;window.__roomReady=true;$('#render-error').hidden=true;$('#loading').style.opacity='0';setTimeout(()=>$('#loading').hidden=true,650)}}renderDemo();requestAnimationFrame(frame);
