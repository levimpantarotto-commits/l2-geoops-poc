import * as THREE from './vendor/three-0.185.1.module.min.js';

export const raioNeural = grau => 2.6 + Math.min(10, Math.pow(Math.max(0, grau || 0), .49) * .85);
const parId = (a,b) => a<b ? `${a}:${b}` : `${b}:${a}`;
export function validarTopologiaNeural(n,links){return Array.isArray(links)&&links.every(p=>Array.isArray(p)&&p.length===2&&p.every(i=>Number.isInteger(i)&&i>=0&&i<n)&&p[0]!==p[1]);}
export function criarOrcamentoRenderNeural({now=()=>performance.now()}={}){
  let ultimo=-Infinity;
  return {deveRender(quality='balanced',agora=now()){
    const fps=quality==='low'?10:quality==='high'?30:20,intervalo=1000/fps;
    if(agora-ultimo<intervalo)return false;
    ultimo=agora;return true;
  }};
}
export function qualidadeNeural(perf={},anterior='balanced'){
  if(perf.maxFrameMs>26||perf.totalFrameMs>26)return 'low';
  return anterior==='low'?'low':'balanced';
}
const media = (total,quantidade) => quantidade?total/quantidade:0;
const percentil95 = valores => {if(!valores.length)return 0;const ordem=[...valores].sort((a,b)=>a-b);return ordem[Math.min(ordem.length-1,Math.ceil(ordem.length*.95)-1)];};
export function criarAcumuladorPerfNeural({now=()=>performance.now(),janelaMs=1000}={}){
  let inicio=now(),amostras=[],buildTotal=0,maxBuildMs=0,rebuilds=0,dpr=null,reportouImediato=false;
  const resumo=()=>{const quentes=amostras.filter(a=>!a.rebuild),draws=amostras.map(a=>a.drawMs),totais=amostras.map(a=>a.totalFrameMs);
    return {buildMs:rebuilds?buildTotal/rebuilds:0,maxBuildMs,drawMs:media(draws.reduce((s,v)=>s+v,0),draws.length),totalFrameMs:media(totais.reduce((s,v)=>s+v,0),totais.length),warmDrawMs:quentes.length?media(quentes.reduce((s,a)=>s+a.drawMs,0),quentes.length):null,sampleCount:amostras.length,rebuild:rebuilds>0,maxFrameMs:Math.max(0,...totais),warmP95Ms:quentes.length?percentil95(quentes.map(a=>a.drawMs)):null,dpr};
  };
  return {registrar({buildMs=0,drawMs=0,totalFrameMs=0,rebuild=false,dpr:amostraDpr}={},agora=now()){
    const amostra={drawMs:Number(drawMs)||0,totalFrameMs:Number(totalFrameMs)||0,rebuild:!!rebuild};amostras.push(amostra);
    if(Number.isFinite(amostraDpr))dpr=amostraDpr;
    if(amostra.rebuild){const build=Math.max(0,Number(buildMs)||0);rebuilds++;buildTotal+=build;maxBuildMs=Math.max(maxBuildMs,build);}
    const caro=amostra.drawMs>14||amostra.totalFrameMs>26;
    if(!reportouImediato&&caro){reportouImediato=true;return {report:resumo(),imediato:true};}
    if(agora-inicio<janelaMs)return null;
    const report=resumo();inicio=agora;amostras=[];buildTotal=0;maxBuildMs=0;rebuilds=0;dpr=null;reportouImediato=false;return {report,imediato:false};
  }};
}
const vet = (x,y,z) => new THREE.Vector3(x,y,z);
export class CurvaFilamento extends THREE.Curve {
 constructor(A,B,dirA,dirB,seed){super();const D=A.distanceTo(B);this.base=new THREE.CubicBezierCurve3(A,A.clone().addScaledVector(dirA,D*.25),B.clone().addScaledVector(dirB,D*.25),B);const eixo=B.clone().sub(A).normalize();this.lado=vet(0,1,0).cross(eixo);if(this.lado.lengthSq()<.05)this.lado=vet(1,0,0).cross(eixo);this.lado.normalize();this.normal=eixo.clone().cross(this.lado).normalize();this.amp=D*(.14+.06*Math.abs(Math.sin(seed*1.17)));this.sinal=Math.sin(seed*2.31)>0?1:-1;this.arcLengthDivisions=100;}
 getPoint(t,out=new THREE.Vector3()){this.base.getPoint(t,out);const env=Math.sin(Math.PI*t)**2;out.addScaledVector(this.lado,this.amp*this.sinal*env*(.75+Math.sin(t*Math.PI*2)*.4));out.addScaledVector(this.normal,this.amp*.55*env*Math.sin(t*Math.PI*2+this.sinal));return out;}
}
const eixos = [vet(1,0,0),vet(-1,0,0),vet(0,1,0),vet(0,-1,0),vet(0,0,1),vet(0,0,-1)];
const corRaiz = raiz => new THREE.Color(raiz==='projeto'?0x8297ec:raiz==='memoria'?0x6ff4da:0x31aed0);

// Anatomia determinada apenas pelos vizinhos verdadeiros. Vizinhos na mesma
// direção compartilham um tronco; cada aresta tem sua bifurcação e destino.
export function construirAnatomia({px,py,pz,links,graus=[]}){
  if(!validarTopologiaNeural(px.length,links))throw new Error('Topologia invalida');
  const centros=Array.from(px,(x,i)=>vet(x,py[i],pz[i]));
  const unicos=[...new Map(links.map(([a,b])=>[parId(a,b),[a,b]])).values()];
  const grupos=centros.map(()=>eixos.map(()=>({direcao:vet(0,0,0),vizinhos:[]})));
  const portas=new Map();
  for(const [a,b] of unicos)for(const [de,para] of [[a,b],[b,a]]){
    const dir=centros[para].clone().sub(centros[de]).normalize();
    let melhor=0;for(let k=1;k<6;k++)if(dir.dot(eixos[k])>dir.dot(eixos[melhor]))melhor=k;
    grupos[de][melhor].direcao.add(dir);grupos[de][melhor].vizinhos.push(para);portas.set(`${de}:${para}`,melhor);
  }
  const troncos=[],ramos=new Map();
  grupos.forEach((gs,i)=>gs.forEach((g,k)=>{
    if(!g.vizinhos.length)return;
    const r=raioNeural(graus[i]),dir=g.direcao.normalize();
    const menor=Math.min(...g.vizinhos.map(j=>centros[i].distanceTo(centros[j])));
    const L=Math.min(r*3.1,menor*.21);
    const inicio=centros[i].clone().addScaledVector(dir,r*.58);
    const meio=centros[i].clone().addScaledVector(dir,L*.57);
    const ponta=centros[i].clone().addScaledVector(dir,L);
    const largura=Math.min(r*.40,.65+Math.sqrt(g.vizinhos.length)*.17);
    const curva=new THREE.CatmullRomCurve3([inicio,meio,ponta],false,'centripetal');
    troncos.push({no:i,grupo:k,curva,largura});ramos.set(`${i}:${k}`,{inicio,meio,ponta,largura,r});
  }));
  const arestas=unicos.map(([a,b])=>{
    const A=centros[a],B=centros[b],ga=ramos.get(`${a}:${portas.get(`${a}:${b}`)}`),gb=ramos.get(`${b}:${portas.get(`${b}:${a}`)}`);
    const dirA=ga.ponta.clone().sub(A).normalize(),dirB=gb.ponta.clone().sub(B).normalize();
    const curva=new CurvaFilamento(ga.ponta,gb.ponta,dirA,dirB,Math.min(a,b)*37+Math.max(a,b)*17);
    return {a,b,id:parId(a,b),curva,larguraA:ga.largura*.55,larguraB:gb.largura*.55,ga,gb};
  });
  return {centros,troncos,arestas,ramos};
}

// Tubo afilado: as posições e normais são reais, a luz muda ao girar.
function tubo(curva,segmentos,raioEm,radiais=6){
  const f=curva.computeFrenetFrames(segmentos,false),p=[],normais=[],indices=[];
  for(let s=0;s<=segmentos;s++){
    const t=s/segmentos,c=curva.getPointAt(t),r=Math.max(.045,raioEm(t));
    for(let k=0;k<=radiais;k++){
      const ang=k/radiais*Math.PI*2,n=f.normals[s].clone().multiplyScalar(Math.cos(ang)).addScaledVector(f.binormals[s],Math.sin(ang));
      p.push(c.x+n.x*r,c.y+n.y*r,c.z+n.z*r);normais.push(n.x,n.y,n.z);
      if(s<segmentos&&k<radiais){const i=s*(radiais+1)+k;indices.push(i,i+1,i+radiais+1,i+1,i+radiais+2,i+radiais+1);}
    }
  }
  return {p,normais,indices};
}
function mesclar(partes){
  const n=partes.reduce((v,p)=>v+p.p.length,0),ni=partes.reduce((v,p)=>v+p.indices.length,0);
  const p=new Float32Array(n),nor=new Float32Array(n),idx=new Uint32Array(ni),na=new Float32Array(n/3),nb=new Float32Array(n/3);let v=0,k=0;
  for(const g of partes){na.fill(g.na??0,v/3,(v+g.p.length)/3);nb.fill(g.nb??g.na??0,v/3,(v+g.p.length)/3);p.set(g.p,v);nor.set(g.normais,v);for(const i of g.indices)idx[k++]=i+v/3;v+=g.p.length;}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(p,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setIndex(new THREE.BufferAttribute(idx,1));out.setAttribute('nodeA',new THREE.BufferAttribute(na,1));out.setAttribute('nodeB',new THREE.BufferAttribute(nb,1));out.computeBoundingSphere();return out;
}
function somaGeometry(ramos=[],raio=1){
  const g=new THREE.SphereGeometry(1,40,28),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    // função contínua da superfície mantém costura fechada e formas suaves.
    let q=.66+.045*Math.sin(x*5+y*2)*Math.cos(z*4)+.055*Math.sin(y*7-z*3);
    for(const ramo of ramos){const d=ramo.direcao,cos=Math.max(0,x*d.x+y*d.y+z*d.z);if(cos<.35)continue;
      const L=Math.max(.85,ramo.extensao/raio),B=.29,radial=B/(Math.sqrt(Math.max(0,1-cos*cos))+(B/L)*cos);
      const h=Math.max(.12-Math.abs(q-radial),0)/.12;q=Math.max(q,radial)+h*h*.03;
    }
    p.setXYZ(i,x*q*raio,y*q*raio,z*q*raio);
  }
  g.computeVertexNormals();return g;
}
export class Neural3D {
  constructor(){
    this.scene=new THREE.Scene();this.world=new THREE.Group();this.scene.add(this.world);
    this.scene.fog=new THREE.Fog(0x040e20,900,2100);this.camera=new THREE.PerspectiveCamera(46,1,1,12000);this.camera.position.z=-1200;this.camera.up.set(0,-1,0);this.camera.lookAt(0,0,0);
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
    this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    const cv=this.renderer.domElement;cv.id='neural3d';Object.assign(cv.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'0'});
    document.body.insertBefore(cv,document.getElementById('cv'));
    this.scene.add(new THREE.HemisphereLight(0xb9eeff,0x07192c,.85));
    for(const [cor,intensidade,pos] of [[0xc9f6ff,2,[-400,-500,-650]],[0x2189d8,1.2,[500,100,-300]],[0x86ddff,2,[0,200,500]]]){
      const l=new THREE.DirectionalLight(cor,intensidade);l.position.set(...pos);this.scene.add(l);
    }
    this.somaMat=new THREE.MeshStandardMaterial({transparent:true,depthWrite:false,opacity:.93,color:0xffffff,vertexColors:true,roughness:.52,metalness:.03,emissive:0x073c5b,emissiveIntensity:.5});
    this.somaMat.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vCellLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCellLocal = position;');
      shader.fragmentShader='varying vec3 vCellLocal;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance *= min(1.0,max(vColor.r,max(vColor.g,vColor.b))*2.0);').replace('#include <color_fragment>','#include <color_fragment>\nif (dot(diffuseColor.rgb,vec3(1.0)) < 0.001) discard;').replace('#include <dithering_fragment>',`#include <dithering_fragment>
        float rim=pow(1.0-max(dot(normal,normalize(vViewPosition)),0.0),2.4);
        float grain=fract(sin(dot(floor(vCellLocal*5.0),vec3(12.9898,78.233,42.37)))*43758.5453);
        gl_FragColor.a*=smoothstep(0.0,.15,max(vColor.r,max(vColor.g,vColor.b)));
        gl_FragColor.rgb+=(vec3(0.02,0.36,0.59)*rim*.7+vec3(0.06,0.31,0.42)*pow(grain,28.0)*.32)*min(1.0,max(vColor.r,max(vColor.g,vColor.b))*2.0);`);
    };
    this.fioMat=new THREE.MeshStandardMaterial({transparent:true,depthWrite:false,opacity:.48,vertexColors:true,color:0x2d8dab,roughness:.4,metalness:.16,emissive:0x0b455e,emissiveIntensity:.28});
    this.fioMat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor.r;').replace('#include <color_fragment>','#include <color_fragment>\nif (dot(diffuseColor.rgb,vec3(1.0)) < 0.001) discard;');};
    this.nucleoMat=new THREE.MeshStandardMaterial({color:0x70bbd2,roughness:.55,metalness:.03,transparent:true,opacity:.25,depthWrite:false});
    this.destaqueMat=new THREE.MeshStandardMaterial({transparent:true,depthWrite:false,opacity:.78,color:0xb7f6ff,emissive:0x31bddb,emissiveIntensity:.35,roughness:.45});
    this.pulsoMat=new THREE.MeshBasicMaterial({color:0xc4f8ff});this.last=0;this.focoAnterior='';
    this.profundidade={centro:{value:1600},largura:{value:500},aproximado:{value:0}};
    for(const mat of [this.somaMat,this.fioMat,this.destaqueMat,this.nucleoMat]){
      const anterior=mat.onBeforeCompile;mat.onBeforeCompile=shader=>{
        anterior?.(shader);shader.uniforms.neuralCentro=this.profundidade.centro;shader.uniforms.neuralLargura=this.profundidade.largura;shader.uniforms.neuralAproximado=this.profundidade.aproximado;
        shader.vertexShader='varying float profundidadeNeural;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nprofundidadeNeural=-mvPosition.z;');
        shader.fragmentShader='varying float profundidadeNeural; uniform float neuralCentro; uniform float neuralLargura; uniform float neuralAproximado;\n'+shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
          float delta=abs(profundidadeNeural-neuralCentro)/neuralLargura;
          float plano=${mat===this.destaqueMat?"0.55+0.45*":""}exp(-delta*delta*1.6);
          gl_FragColor.a*=mix(1.0,plano,neuralAproximado);
          if(gl_FragColor.a<.018)discard;`);
      };
      mat.customProgramCacheKey=()=>mat.uuid+'-profundidade-v2';
    }
    this.pulsos=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),this.pulsoMat,64);this.pulsos.count=0;this.world.add(this.pulsos);
    // A presença Jarvis faz parte da mesma cena, mas é inteiramente opcional:
    // qualquer falha nela não pode derrubar a visualização da memória.
    this.jarvis=null;this.jarvisQuality='';this.jarvisProjection={x:-9999,y:-9999,visible:false};this.jarvisProjectionAt=0;this.perfNeural=criarAcumuladorPerfNeural();this.buildMsPendente=0;this.primeiroDrawAposBuild=false;
  }
  resize(w,h,dpr=1,quality='balanced'){const dprReal=Math.max(.1,Number(dpr)||1),limite=1.5,d=quality==='export'?dprReal:Math.min(dprReal,limite);this.quality=quality;if(this.w===w&&this.h===h&&this.dpr===d)return;this.w=w;this.h=h;this.dpr=d;this.renderer.setPixelRatio(d);this.renderer.setSize(w,h,false);}
  remover(obj){if(!obj)return;this.world.remove(obj);obj.geometry?.dispose();obj.dispose?.();}
  reconstruir(d){
    const inicioBuild=performance.now();
    const {px,py,pz,links,graus=[]}=d;if(!px?.length)return;
    for(const o of [this.somas,this.nucleos,this.fios,this.destaque])this.remover(o);
    this.anatomia=construirAnatomia(d);this.links=links;this.edgeMap=new Map(this.anatomia.arestas.map(e=>[e.id,e]));
    const n=px.length;this.nucleoMatrices=[];this.nucleos=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,9),this.nucleoMat,n);
    const bodies=[],colors=[];this.cores=[];const mat=new THREE.Matrix4();
    this.nodeRanges=[];let offset=0;
    for(let i=0;i<n;i++){
      const r=raioNeural(graus[i]);
      const ramas=this.anatomia.troncos.filter(t=>t.no===i).map(t=>({direcao:t.curva.getPoint(1).sub(this.anatomia.centros[i]).normalize(),extensao:t.curva.getPoint(1).distanceTo(this.anatomia.centros[i])*.93}));
      const geo=somaGeometry(ramas,r);geo.translate(px[i],py[i],pz[i]);
      const cor=corRaiz(d.nos?.[i]?.raiz||d.raizes?.[i]);this.cores.push(cor);
      const count=geo.attributes.position.count;this.nodeRanges.push([offset,count]);offset+=count;
      for(let k=0;k<count;k++)colors.push(cor.r,cor.g,cor.b);
      bodies.push({na:i,nb:i,p:geo.attributes.position.array,normais:geo.attributes.normal.array,indices:geo.index.array});
      mat.compose(vet(px[i]-r*.07,py[i]-r*.10,pz[i]-r*.18),new THREE.Quaternion(),vet(r*.21,r*.25,r*.17));this.nucleos.setMatrixAt(i,mat);this.nucleoMatrices.push(mat.clone());geo.dispose();
    }
    const bodyGeo=mesclar(bodies);bodyGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));this.somas=new THREE.Mesh(bodyGeo,this.somaMat);
    const partes=[];
    for(const t of this.anatomia.troncos)partes.push({...tubo(t.curva,5,u=>t.largura*(1-u*.45),8),na:t.no,nb:t.no});
    for(const e of this.anatomia.arestas)partes.push({...tubo(e.curva,32,u=>.13+e.larguraA*.65*Math.pow(1-u,6)+e.larguraB*.65*Math.pow(u,6),5),na:e.a,nb:e.b});
    const fioGeo=mesclar(partes);fioGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(fioGeo.attributes.position.count*3).fill(1),3));this.fios=new THREE.Mesh(fioGeo,this.fioMat);this.world.add(this.fios,this.somas,this.nucleos);
    this.nucleos.instanceMatrix.needsUpdate=true;
    this.focoAnterior='';this.estiloAnterior='';this.last=performance.now();this.stats={somas:n,ligacoes:this.anatomia.arestas.length,troncos:this.anatomia.troncos.length,drawCalls:0,vertices:this.fios.geometry.attributes.position.count};this.buildMsPendente=performance.now()-inicioBuild;this.primeiroDrawAposBuild=true;
  }
  destacar(d){
    const foco=d.inspecao>=0?d.inspecao:(d.focus??d.foco??d.hover??-1),seq=d.caminho?.seq||[];const key=foco+':'+seq.join(',')+':'+(d.vivos||[]).reduce((v,x)=>v+(x>=1?1:0),0);if(key===this.focoAnterior)return;this.focoAnterior=key;
    this.remover(this.destaque);this.destaque=null;const wanted=new Set();
    for(let i=1;i<seq.length;i++)wanted.add(parId(seq[i-1],seq[i]));
    const edges=this.anatomia.arestas.filter(e=>(e.a===foco||e.b===foco||wanted.has(e.id))&&(d.vivos?.[e.a]??1)>=1&&(d.vivos?.[e.b]??1)>=1);
    const partes=[],troncos=new Set();
    for(const e of edges){partes.push(tubo(e.curva,32,u=>.12+e.larguraA*.70*Math.pow(1-u,6)+e.larguraB*.70*Math.pow(u,6),5));
      for(const i of [e.a,e.b])for(const t of this.anatomia.troncos){if(t.no!==i||troncos.has(t))continue;
        if((i===e.a&&t.curva.getPoint(1).distanceTo(e.ga.ponta)<.01)||(i===e.b&&t.curva.getPoint(1).distanceTo(e.gb.ponta)<.01)){troncos.add(t);partes.push(tubo(t.curva,5,u=>t.largura*(1-u*.45)+.06,8));}
      }
    }
    if(partes.length){this.destaque=new THREE.Mesh(mesclar(partes),this.destaqueMat);this.world.add(this.destaque);}
  }
  visibilidade(d){
    const foco=d.inspecao>=0?d.inspecao:(d.focus??-1),vivos=d.vivos||[];
    const chave=JSON.stringify([foco,d.inspecao,d.busca,d.filtro,d.buscaIds,d.faxina,d.caminho?.seq,vivos.reduce((a,v)=>a+Math.round(v*5),0)]);
    if(chave===this.estiloAnterior)return;this.estiloAnterior=chave;
    const matches=d.buscaIds?new Set(d.buscaIds):null,caminho=d.caminho?.ids?new Set(d.caminho.ids):null,ligados=new Set([d.inspecao]);
    if(d.inspecao>=0)for(const e of this.anatomia.arestas){if(e.a===d.inspecao)ligados.add(e.b);if(e.b===d.inspecao)ligados.add(e.a);}
    const pesos=this.cores.map((_,i)=>{
      const nd=d.nos?.[i]||{};let v=vivos[i]??1;
      if(matches?!matches.has(i):(d.busca&&!String(nd.nome).toLowerCase().includes(d.busca.toLowerCase())))v*=.06;
      if(d.filtro&&(nd.raiz!==d.filtro.raiz||(d.filtro.prefixo&&!String(nd.rel).startsWith(d.filtro.prefixo))))v*=.05;
      if(caminho&&!caminho.has(i))v*=.05;
      if(d.inspecao>=0&&!ligados.has(i))v*=.04;
      if(d.faxina&&nd.grau>0&&Date.now()-(nd.mtime||0)<60*86400000)v*=.08;
      return v;
    });
    const color=this.somas.geometry.attributes.color;
    for(let i=0;i<this.cores.length;i++){const c=i===foco?new THREE.Color(0xa5ecff):this.cores[i],[off,count]=this.nodeRanges[i],v=pesos[i];for(let j=off;j<off+count;j++)color.setXYZ(j,c.r*v,c.g*v,c.b*v);this.nucleos.setColorAt(i,new THREE.Color(v,v,v));}
    for(let i=0;i<this.nucleoMatrices.length;i++)this.nucleos.setMatrixAt(i,pesos[i]<=.001?new THREE.Matrix4().makeScale(0,0,0):this.nucleoMatrices[i]);this.nucleos.instanceMatrix.needsUpdate=true;
    color.needsUpdate=true;if(this.nucleos.instanceColor)this.nucleos.instanceColor.needsUpdate=true;
    const g=this.fios.geometry,fc=g.attributes.color,a=g.attributes.nodeA.array,b=g.attributes.nodeB.array;
    for(let i=0;i<a.length;i++){const v=Math.min(pesos[a[i]],pesos[b[i]]);fc.setXYZ(i,v,v,v);}fc.needsUpdate=true;
  }

  prepararJarvis(quality='medium'){
    if(this.jarvis&&this.jarvisQuality===quality)return;
    if(this.jarvis){this.world.remove(this.jarvis);this.jarvis.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
    this.jarvisQuality=quality;
    const baixo=quality==='low',alto=quality==='high';
    const grupo=new THREE.Group(),cor=0x5ee8e0,gold=0xf2d57e;
    const nucleo=new THREE.Mesh(new THREE.IcosahedronGeometry(18,alto?2:1),new THREE.MeshStandardMaterial({color:0x0f6570,emissive:cor,emissiveIntensity:.72,roughness:.38,metalness:.22,transparent:true,opacity:.22,depthWrite:false}));
    const halo=new THREE.Mesh(new THREE.SphereGeometry(25,baixo?10:14,baixo?7:10),new THREE.MeshBasicMaterial({color:cor,transparent:true,opacity:.045,side:THREE.BackSide,depthWrite:false}));
    grupo.add(nucleo,halo);grupo.userData={nucleo,halo,aneis:[],particulas:null};
    for(let i=0;i<(baixo?1:2);i++){
      const anel=new THREE.Mesh(new THREE.TorusGeometry(34+i*10,baixo?.5:.65,baixo?6:10,baixo?28:48),new THREE.MeshBasicMaterial({color:i?gold:cor,transparent:true,opacity:i?.27:.4,depthWrite:false}));
      anel.rotation.set(i*.62,.25+i*.45,i*.28);grupo.add(anel);grupo.userData.aneis.push(anel);
    }
    if(!baixo){const quantidade=alto?36:18,pos=new Float32Array(quantidade*3);for(let i=0;i<quantidade;i++){const a=i*2.399,r=46+(i%7)*4;pos.set([Math.cos(a)*r,Math.sin(a*1.7)*r*.55,Math.sin(a)*r],i*3);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const pts=new THREE.Points(geo,new THREE.PointsMaterial({color:cor,size:alto?1.7:1.3,transparent:true,opacity:.5,depthWrite:false}));grupo.add(pts);grupo.userData.particulas=pts;}
    grupo.position.set(0,0,0);grupo.renderOrder=3;this.jarvis=grupo;this.world.add(grupo);
  }
  atualizarJarvis(jarvis,tempo=0){
    if(!jarvis||jarvis.failed){if(this.jarvis)this.jarvis.visible=false;return;}
    this.prepararJarvis(jarvis.quality||'medium');const g=this.jarvis;if(!g)return;
    g.visible=true;
    const fase=jarvis.phase||'IDLE',reduced=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const styles={IDLE:[0x5ee8e0,.07,1],LISTENING:[0x68ffd2,.13,1.3],TRANSCRIBING:[0x79bfff,.3,1.3],EVOKING_MEMORY:[0xf2d57e,.24,1.5],THINKING_LOCAL:[0x67efda,.4,1.4],THINKING_SYSTEM2:[0xa69cff,.2,1.6],USING_TOOL:[0x73caff,.32,1.5],ACTING:[0xffd274,.4,1.6],SPEAKING:[0x70eceb,.13,1.5],SUCCESS:[0x84e8a6,.08,1.3],WAITING:[0x8aafbd,.05,.8],BLOCKED:[0xcba563,.03,.65],ERROR:[0xee8d84,.03,.6]};
    const [color,speed,light]=styles[fase]||styles.IDLE,audio=Math.max(0,Math.min(1,Number(jarvis.audioLevel)||0));
    // Speaking motion follows actual playback state; it is an approximate envelope, not an audio analyser.
    const envelope=fase==='SPEAKING'&&!reduced?Math.sin(tempo*7)*.025:0;
    g.scale.setScalar(1+audio*.13+envelope);if(!reduced)g.rotation.y=tempo*speed;
    g.userData.nucleo.material.emissive.setHex(color);g.userData.nucleo.material.emissiveIntensity=light;
    g.userData.aneis.forEach((anel,i)=>{if(!reduced)anel.rotation.z=tempo*speed*(i?-.6:1);anel.material.color.setHex(i?0xf2d57e:color);anel.material.opacity=(i?.32:.62)+audio*.18;});
    if(g.userData.particulas&&!reduced)g.userData.particulas.rotation.y=-tempo*speed;

  }
  projetarJarvis(){
    if(!this.jarvis||!this.w||!this.h)return;
    const p=this.jarvis.getWorldPosition(new THREE.Vector3()).project(this.camera),projecao={x:(p.x+1)*this.w/2,y:(1-p.y)*this.h/2,visible:p.z>=-1&&p.z<=1};
    const anterior=this.jarvisProjection,moveu=Math.abs(projecao.x-anterior.x)>2||Math.abs(projecao.y-anterior.y)>2||projecao.visible!==anterior.visible;
    const agora=performance.now();if(moveu&&agora-this.jarvisProjectionAt>=100){this.jarvisProjection=projecao;this.jarvisProjectionAt=agora;}
  }

  render(d){
    if(!this.anatomia)return;const inicioQuadro=performance.now(),quality=d.export4k?'export':(d.neuralQuality||'balanced');this.resize(d.w||innerWidth,d.h||innerHeight,devicePixelRatio||1,quality);
    const {rotY=0,rotX=0,dist=1200}=d,F=d.fov||d.FOV||900;
    this.camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(this.h/(2*F)));this.camera.aspect=this.w/this.h;this.camera.position.set(0,0,-dist);this.camera.updateProjectionMatrix();
    // Original aplica Y primeiro, X depois; câmera olha +Z com eixo Y para baixo.
    this.profundidade.centro.value=dist;this.profundidade.largura.value=Math.max(65,dist*.30);this.profundidade.aproximado.value=1-Math.min(1,Math.max(0,(dist-400)/700));
    this.world.rotation.set(rotX,rotY,0,'XYZ');
    const alvo=d.cameraTarget;this.world.position.copy(alvo?vet(-alvo.x,-alvo.y,-alvo.z).applyEuler(this.world.rotation):vet(0,0,0));this.scene.fog.near=Math.max(10,dist-150);this.scene.fog.far=dist+850;this.destacar(d);this.visibilidade(d);
    const ps=d.impulsos===false?[]:(d.pulsos?.length?d.pulsos:Array.from({length:32},(_,i)=>({e:(i*137)%this.links.length,t:((d.tempo||0)*(.09+(i%4)*.014)+i*.137)%1}))),matrix=new THREE.Matrix4();let np=0;
    for(const p of ps){if(np>=64)break;const pair=(d.pulsos?.length?(d.linksOriginais||this.links):this.links)[p.e];if(!pair)continue;const e=this.edgeMap.get(parId(...pair));if(!e||(d.vivos?.[e.a]??1)<1||(d.vivos?.[e.b]??1)<1)continue;
      const t=pair[0]===e.a?p.t:1-p.t;
      const pos=t<.12?new THREE.CatmullRomCurve3([this.anatomia.centros[e.a],e.ga.meio,e.ga.ponta]).getPoint(t/.12):t>.88?new THREE.CatmullRomCurve3([e.gb.ponta,e.gb.meio,this.anatomia.centros[e.b]]).getPoint((t-.88)/.12):e.curva.getPointAt((t-.12)/.76);
      matrix.makeScale(.8,.8,.8);matrix.setPosition(pos);this.pulsos.setMatrixAt(np++,matrix);
    }
    this.pulsos.count=np;this.pulsos.instanceMatrix.needsUpdate=true;if(this.jarvis)this.jarvis.visible=false;
    const inicioRender=performance.now();this.renderer.render(this.scene,this.camera);const custoRender=performance.now()-inicioRender;this.stats.drawCalls=this.renderer.info.render.calls;
    const perf=d.export4k?null:this.perfNeural.registrar({buildMs:this.buildMsPendente,drawMs:custoRender,totalFrameMs:this.buildMsPendente+performance.now()-inicioQuadro,rebuild:this.primeiroDrawAposBuild,dpr:this.dpr});this.buildMsPendente=0;this.primeiroDrawAposBuild=false;this.stats.dpr=this.dpr;this.stats.quality=this.quality;if(perf){this.stats.perf=perf.report;}
    if(perf)this.stats.suggestedQuality=qualidadeNeural(perf.report,this.stats.suggestedQuality);
    // Jarvis possui HUD próprio; o grafo não controla sua posição ou seu áudio.
  }
}
if(typeof window!=='undefined'){window.Neural3D=Neural3D;window.raioNeural=raioNeural;}
