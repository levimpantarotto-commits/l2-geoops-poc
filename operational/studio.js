/* Same approved navigation and 3D components; real GIS remains in an isolated frame. */
(() => {'use strict';
 const $=id=>document.getElementById(id), frame=$('workspaceFrame');
 const publicMode=new URLSearchParams(location.search).get('demo')==='public'||location.hostname.endsWith('.github.io');
 frame.src=frame.dataset.src+(publicMode?'&demo=public&v=14':'');
 if(publicMode){
  $('studioInfo').querySelector('h2').textContent='Caso brasileiro · demonstração pública';
  const paragraphs=$('studioInfo').querySelectorAll('p');
  paragraphs[0].textContent='Botucatu/SP: imagem Sentinel-2 e cobertura MapBiomas de 2023, com limite fictício. O caso foi processado previamente no QGIS. Este link mostra os resultados e permite revisar classes no navegador; não executa o motor QGIS online.';
  paragraphs[1].textContent='As classes vêm de uma base pública de 30 m, não de uma nova detecção pela imagem exibida. APP, Reserva Legal e regularidade não são avaliadas. PDF e projeto QGIS são arquivos pré-gerados do caso-base, não das alterações feitas neste navegador.';
 }
 let current='mapa', ready=false, changing=false;
 function send(tab){if(ready)frame.contentWindow.postMessage({type:'geoops:workspace-tab',tab},location.origin);}
 function officeVisibility(){const office=$('officeFrame');if(office.getAttribute('src'))office.contentWindow.postMessage({type:'geoops:office-visibility',visible:current==='agents'&&!document.hidden},location.origin);}
 function navigate(name,fromWorkspace=false){
  if(!['mapa','brain','agents','deliver'].includes(name))name='mapa';
  current=name; changing=true;
  document.querySelectorAll('main>.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+(name==='deliver'?'mapa':name)));
  document.querySelectorAll('[data-studio-page]').forEach(b=>{const active=b.dataset.studioPage===name;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(name==='agents'&&!$('officeFrame').getAttribute('src'))$('officeFrame').src=$('officeFrame').dataset.src;
  if(!fromWorkspace&&(name==='mapa'||name==='deliver'))send(name==='deliver'?'exports':'map');
  history.replaceState(null,'','#'+name);
  $('studioBadge').textContent=['brain','agents'].includes(name)?'AMBIENTE DEMO':publicMode?'CASO BRASILEIRO · DEMO WEB':'QGIS LOCAL · TESTE PÚBLICO';
  $('studioFooter').textContent=['brain','agents'].includes(name)?'Documentos e agentes fictícios. Componentes 3D demonstrativos.':publicMode?'Resultados pré-processados · limite fictício · revisão de classes no navegador':'Dados públicos de teste. Revisão técnica obrigatória.';
  officeVisibility();window.dispatchEvent(new CustomEvent('geoops:page',{detail:{name}}));window.GeoBrain?.refresh(name);changing=false;
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||!event.data)return;
  const data=event.data;
  if(data.type==='geoops:workspace-size'&&Number.isFinite(data.height)&&data.height>0)frame.style.height=Math.max(450,Math.min(3500,data.height))+'px';
  if(data.type==='geoops:workspace-ready'){ready=true;if(current==='mapa'||current==='deliver')send(current==='deliver'?'exports':'map');}
  if(data.type==='geoops:workspace-tab-changed'&&ready&&!changing&&['mapa','deliver'].includes(current))navigate(data.tab==='exports'?'deliver':'mapa',true);
 });
 document.querySelectorAll('[data-studio-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.studioPage)));
 window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
 document.addEventListener('visibilitychange',officeVisibility);
 $('studioAbout').onclick=()=>$('studioInfo').showModal();$('closeStudioInfo').onclick=()=>$('studioInfo').close();
 navigate(location.hash.slice(1)||'mapa');
})();
