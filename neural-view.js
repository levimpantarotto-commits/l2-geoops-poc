import { Neural3D } from './renderer-neural3d.js';
import * as THREE from './vendor/three-0.185.1.module.min.js';

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

// Fixture local e determinística: simula relações de trabalho GeoOps, sem acervo
// ou metadados do Cerebro Vivo. A topologia é propositalmente conectada e densa.
export function criarFixtureGeoOps(){
  const grupos=[
    ['Documentos',-210,-100,'memoria'],['Projeto',-70,-130,'projeto'],['Imagem',80,-125,'geoops'],
    ['Classificação',205,-65,'memoria'],['Revisão',155,90,'projeto'],['Produtos',-65,115,'geoops']
  ];
  const nos=[],px=[],py=[],pz=[],links=[];
  grupos.forEach(([grupo,cx,cy,raiz],g)=>{
    for(let k=0;k<20;k++){
      const a=k/20*Math.PI*2+(g%2)*.18,r=32+(k%5)*13;
      nos.push({nome:`${grupo} · evidência ${String(k+1).padStart(2,'0')}`,raiz,rel:grupo});
      px.push(cx+Math.cos(a)*r+(k%3-1)*8);py.push(cy+Math.sin(a)*r*.7);pz.push((k%5-2)*22+g*6);
      const i=g*20+k,proximo=g*20+(k+1)%20;
      links.push([i,proximo],[i,g*20+(k+3)%20],[i,g*20+(k+7)%20]);
      if(k%2===0)links.push([i,g*20+(k+10)%20]);
      if(g&&k<9)links.push([i,(g-1)*20+((k*3+g)%20)]);
    }
  });
  const graus=px.map((_,i)=>links.reduce((n,[a,b])=>n+(a===i||b===i),0));
  return {px,py,pz,links,graus,nos};
}

export class NeuralView {
  constructor(stage,{onSelect}={}){
    this.stage=stage;this.onSelect=onSelect;this.data=criarFixtureGeoOps();this.state={rotX:.15,rotY:-.5,dist:610,focus:-1};
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.enabled=false;this.running=false;this.frame=0;this.lastFrame=0;this.drag=null;
    this.neural=new Neural3D();this.canvas=this.neural.renderer.domElement;
    this.canvas.className='brain-neural-canvas';this.canvas.style.position='absolute';this.canvas.style.inset='0';this.canvas.style.width='100%';this.canvas.style.height='100%';this.canvas.style.zIndex='0';this.canvas.style.pointerEvents='auto';
    stage.prepend(this.canvas);this.neural.reconstruir(this.data);this.bind();this.resize();
  }
  bind(){
    this.canvas.addEventListener('pointerdown',e=>{if(!this.enabled)return;this.drag={x:e.clientX,y:e.clientY,moved:false};this.canvas.setPointerCapture(e.pointerId);this.start();});
    this.canvas.addEventListener('pointermove',e=>{if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>3)this.drag.moved=true;this.state.rotY+=dx*.006;this.state.rotX=clamp(this.state.rotX+dy*.005,-1.15,1.15);this.drag.x=e.clientX;this.drag.y=e.clientY;this.render();});
    this.canvas.addEventListener('pointerup',e=>{const click=this.drag&&!this.drag.moved;this.drag=null;if(click)this.pick(e);});
    this.canvas.addEventListener('wheel',e=>{if(!this.enabled)return;e.preventDefault();this.state.dist=clamp(this.state.dist+e.deltaY*.65,360,1300);this.start();this.render();},{passive:false});
    this.stage.querySelector('[data-neural-reset]')?.addEventListener('click',()=>{if(!this.enabled)return;this.state.rotX=.15;this.state.rotY=-.5;this.state.dist=610;this.start();this.render();});
    this.stage.querySelectorAll('[data-neural-zoom]').forEach(btn=>btn.addEventListener('click',()=>{if(!this.enabled)return;this.state.dist=clamp(this.state.dist+Number(btn.dataset.neuralZoom),360,1300);this.start();this.render();}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();else if(this.enabled)this.setActive(true);});
    this.resizeObserver=new ResizeObserver(()=>{this.resize();if(this.enabled&&!document.hidden)this.render(true);});this.resizeObserver.observe(this.stage);
  }
  resize(){const r=this.stage.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);}
  setActive(enabled){this.enabled=!!enabled;if(!this.enabled){this.stop();return;}this.resize();if(!document.hidden){this.render(true);this.start();}}
  select(i){if(!this.enabled)return;this.state.focus=i;this.render(true);this.onSelect?.(i,this.data.nos[i]);}
  pick(event){const r=this.canvas.getBoundingClientRect(),mouse=new THREE.Vector2(((event.clientX-r.left)/r.width)*2-1,-((event.clientY-r.top)/r.height)*2+1),ray=new THREE.Raycaster();ray.setFromCamera(mouse,this.neural.camera);const hits=ray.intersectObject(this.neural.nucleos);if(hits[0]?.instanceId!==undefined)this.select(hits[0].instanceId);}
  render(force=false){if(!this.enabled||document.hidden)return;this.neural.render({...this.data,w:this.w,h:this.h,rotX:this.state.rotX,rotY:this.state.rotY,dist:this.state.dist,fov:720,inspecao:this.state.focus,vivos:this.data.px.map(()=>1),tempo:performance.now()/1000,impulsos:!this.reduced});}
  start(){if(this.reduced||this.running||document.hidden||!this.enabled)return;this.running=true;const tick=now=>{if(!this.running||!this.enabled||document.hidden)return;if(now-this.lastFrame>=1000/30){this.lastFrame=now;this.state.rotY+=.00055;this.render();}this.frame=requestAnimationFrame(tick)};this.frame=requestAnimationFrame(tick);}
  stop(){this.running=false;cancelAnimationFrame(this.frame);}
}
