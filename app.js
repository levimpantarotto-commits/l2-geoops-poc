(() => {
  const printMode = new URLSearchParams(window.location.search).get('print');
  if (printMode === 'map') document.body.classList.add('print-map');
  const pages = [...document.querySelectorAll('.page')];
  const navItems = [...document.querySelectorAll('.nav-item')];
  const sidebar = document.querySelector('.sidebar');
  let processingTimer = null;
  let toastTimer = null;
  let zoom = 1;

  function showPage(name) {
    pages.forEach(page => page.classList.toggle('active', page.id === `page-${name}`));
    navItems.forEach(item => item.classList.toggle('active', item.dataset.page === name));
    sidebar.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showToast(title, message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
  }

  navItems.forEach(item => item.addEventListener('click', () => showPage(item.dataset.page)));
  document.querySelectorAll('[data-page-link]').forEach(button => button.addEventListener('click', () => showPage(button.dataset.pageLink)));
  document.getElementById('newProjectSide').addEventListener('click', () => showPage('new'));
  document.getElementById('mobileMenu').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.getElementById('toastClose').addEventListener('click', () => document.getElementById('toast').classList.remove('show'));

  function connectUpload(zoneId, inputId, labelId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const setFile = file => { document.getElementById(labelId).textContent = `${file.name} · ${formatBytes(file.size)}`; };
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') input.click(); });
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
    zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('drag'); if (event.dataTransfer.files[0]) setFile(event.dataTransfer.files[0]); });
    input.addEventListener('change', () => { if (input.files[0]) setFile(input.files[0]); });
  }
  connectUpload('uploadZone','fileInput','fileName');
  connectUpload('imageUploadZone','imageFileInput','imageFileName');
  function formatBytes(bytes) { return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }

  document.getElementById('newProjectForm').addEventListener('submit', event => {
    event.preventDefault();
    startProcessing();
  });

  const processingCopy = [
    'Recebendo arquivo da propriedade…','Conferindo integridade das geometrias…','Identificando sistema de referência…','Localizando contexto municipal…','Organizando camadas do projeto…','Processando uso e cobertura demonstrativos…','Calculando hectares e percentuais…','Aplicando simbologia do template…','Executando checklist técnico…','Montando layout cartográfico…','Estruturando relatório técnico…','Organizando PDF e pacote final…'
  ];

  function startProcessing() {
    clearInterval(processingTimer);
    showPage('processing');
    const steps = [...document.querySelectorAll('#processingSteps > div')];
    const scanMap = document.getElementById('scanMap');
    scanMap.setAttribute('class','scan-map');
    steps.forEach(step => step.classList.remove('active','done'));
    let current = 0;
    const started = Date.now();
    const update = () => {
      steps.forEach((step, index) => {
        step.classList.toggle('done', index < current);
        step.classList.toggle('active', index === current);
      });
      const pct = Math.min(100, Math.round((current / 12) * 100));
      document.getElementById('processingBar').style.width = `${pct}%`;
      document.getElementById('processingPercent').textContent = `${pct}%`;
      document.getElementById('processingMessage').textContent = processingCopy[Math.min(current, 11)];
      scanMap.setAttribute('class', `scan-map stage-${current}`);
      const seconds = Math.floor((Date.now() - started) / 1000);
      document.getElementById('processingTime').textContent = `00:${String(seconds).padStart(2,'0')}`;
      if (current >= 12) finishProcessing();
      current += 1;
    };
    update();
    processingTimer = setInterval(update, 660);
  }

  function finishProcessing() {
    clearInterval(processingTimer);
    document.querySelectorAll('#processingSteps > div').forEach(step => { step.classList.add('done'); step.classList.remove('active'); });
    document.getElementById('processingBar').style.width = '100%';
    document.getElementById('processingPercent').textContent = '100%';
    document.getElementById('processingMessage').textContent = 'Projeto demonstrativo pronto para revisão.';
    document.getElementById('scanMap').setAttribute('class','scan-map stage-12');
    setTimeout(() => { showPage('overview'); showToast('Projeto pronto', '12 etapas concluídas. Produtos demonstrativos organizados.'); }, 650);
  }
  document.getElementById('skipProcessing').addEventListener('click', finishProcessing);

  const reviewDrawer = document.getElementById('reviewDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  let selectedFeature = null;
  const areaTotals = { 'Vegetação nativa': 745.10, 'Área aberta': 663.62, 'Reserva Legal': 525.85, 'APP': 85.80 };
  function toggleDrawer(open) {
    reviewDrawer.classList.toggle('open', open);
    drawerBackdrop.classList.toggle('open', open);
    reviewDrawer.setAttribute('aria-hidden', String(!open));
  }
  function openFeature(feature) {
    selectedFeature = feature;
    document.querySelectorAll('.reviewable').forEach(item => item.classList.toggle('selected-feature', item === feature));
    document.getElementById('classSelect').value = feature.dataset.class;
    document.getElementById('featureArea').textContent = `${formatNumber(Number(feature.dataset.area))} ha`;
    document.getElementById('featureConfidence').textContent = feature.dataset.feature === 'open-0147' ? '87%' : '93%';
    toggleDrawer(true);
  }
  document.querySelectorAll('.reviewable').forEach(feature => feature.addEventListener('click', () => openFeature(feature)));
  document.querySelectorAll('[data-action="review"]').forEach(button => button.addEventListener('click', () => openFeature(document.querySelector('[data-feature="open-0147"]'))));
  document.querySelectorAll('[data-close-drawer]').forEach(button => button.addEventListener('click', () => toggleDrawer(false)));
  drawerBackdrop.addEventListener('click', () => toggleDrawer(false));
  document.getElementById('saveReview').addEventListener('click', () => {
    const newClass = document.getElementById('classSelect').value;
    const oldClass = selectedFeature?.dataset.class;
    const area = Number(selectedFeature?.dataset.area || 0);
    if (selectedFeature && oldClass !== newClass && areaTotals[oldClass] !== undefined && areaTotals[newClass] !== undefined) {
      areaTotals[oldClass] -= area;
      areaTotals[newClass] += area;
      selectedFeature.dataset.class = newClass;
      const classNames = {'Área aberta':'open','Vegetação nativa':'native','Reserva Legal':'reserve','APP':'app'};
      selectedFeature.classList.remove(`layer-${classNames[oldClass]}`);
      selectedFeature.classList.add(`layer-${classNames[newClass]}`);
      updateAreaDisplay();
    }
    toggleDrawer(false);
    showToast('Classificação atualizada', 'Quadro de áreas e produtos recalculados na simulação.');
  });
  function formatNumber(value) { return value.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function updateAreaDisplay() {
    const total = 1502.42;
    const nativePct = areaTotals['Vegetação nativa'] / total * 100;
    const openPct = areaTotals['Área aberta'] / total * 100;
    const updates = [
      ['metricNative',formatNumber(areaTotals['Vegetação nativa'])],['percentNative',`${formatNumber(nativePct)}%`],['donutNative',`${formatNumber(nativePct)}%`],['donutOpen',`${formatNumber(openPct)}%`]
    ];
    updates.forEach(([id,value]) => { const el = document.getElementById(id); el.textContent = value; el.classList.remove('recalculated'); void el.offsetWidth; el.classList.add('recalculated'); });
    document.querySelector('.donut').style.background = `conic-gradient(#4d9a69 0 ${nativePct}%,#c09045 ${nativePct}% ${nativePct + openPct}%,#5bbac6 ${nativePct + openPct}% ${nativePct + openPct + 5.71}%,#c8cfcb ${nativePct + openPct + 5.71}%)`;
  }

  const detailsModal = document.getElementById('detailsModal');
  document.querySelectorAll('[data-action="details"]').forEach(button => button.addEventListener('click', () => { detailsModal.classList.add('open'); detailsModal.setAttribute('aria-hidden','false'); }));
  document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', () => { detailsModal.classList.remove('open'); detailsModal.setAttribute('aria-hidden','true'); }));
  detailsModal.addEventListener('click', event => { if (event.target === detailsModal) detailsModal.classList.remove('open'); });

  document.querySelectorAll('[data-layer]').forEach(check => check.addEventListener('change', () => {
    document.querySelectorAll(`.layer-${check.dataset.layer}`).forEach(layer => layer.style.display = check.checked ? '' : 'none');
    const active = document.querySelectorAll('[data-layer]:checked').length;
    document.querySelector('.legend-header span').textContent = `${active + 1} ativas`;
  }));
  const mapWrap = document.getElementById('mapWrap');
  const originalToggle = document.getElementById('originalToggle');
  const vectorToggle = document.getElementById('vectorToggle');
  function showOriginal() {
    mapWrap.className = 'map-wrap original-only';
    originalToggle.classList.add('active'); vectorToggle.classList.remove('active');
  }
  function showVectorized() {
    mapWrap.className = 'map-wrap';
    vectorToggle.classList.add('active'); originalToggle.classList.remove('active');
  }
  function runVectorDemo() {
    const button = document.getElementById('processMap');
    showOriginal();
    mapWrap.className = 'map-wrap vector-demo is-scanning';
    button.disabled = true; button.textContent = 'Processando…';
    mapWrap.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(() => mapWrap.classList.add('stage-river'),700);
    setTimeout(() => mapWrap.classList.add('stage-native'),1400);
    setTimeout(() => mapWrap.classList.add('stage-open'),2100);
    setTimeout(() => mapWrap.classList.add('stage-final'),2800);
    setTimeout(() => { mapWrap.classList.remove('is-scanning'); button.disabled = false; button.textContent = '↻ Reprocessar'; vectorToggle.classList.add('active'); originalToggle.classList.remove('active'); showToast('Vetorização sugerida', 'Rio, vegetação e área aberta estão prontos para revisão humana.'); },3300);
  }
  originalToggle.addEventListener('click', showOriginal);
  vectorToggle.addEventListener('click', showVectorized);
  document.getElementById('processMap').addEventListener('click', runVectorDemo);
  document.getElementById('demoVector').addEventListener('click', runVectorDemo);
  function applyZoom() { document.getElementById('geoMap').style.transform = `scale(${zoom})`; }
  document.getElementById('zoomIn').addEventListener('click', () => { zoom = Math.min(1.6, zoom + .15); applyZoom(); });
  document.getElementById('zoomOut').addEventListener('click', () => { zoom = Math.max(1, zoom - .15); applyZoom(); });
  document.getElementById('fitMap').addEventListener('click', () => { zoom = 1; applyZoom(); });
  document.getElementById('fullMap').addEventListener('click', () => document.getElementById('mapWrap').classList.toggle('fullscreen-map'));

  document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => {
    const kind = button.dataset.download;
    const files = {
      map: ['assets/Mapa_Uso_Cobertura_DEMO.pdf','Mapa PDF aberto','Arquivo demonstrativo pronto para apresentação.'],
      qgis: ['assets/Projeto_QGIS_DEMO.qgs','Projeto QGIS baixado','Arquivo conceitual para demonstrar o fluxo de entrega.'],
      gpkg: ['assets/Vetores_Revisados_DEMO.gpkg','GeoPackage baixado','Camadas vetoriais demonstrativas organizadas.'],
      shp: ['assets/Camadas_SHP_DEMO.zip','Pacote SHP baixado','Arquivos demonstrativos preparados para o QGIS.'],
      full: ['assets/Entrega_Completa_DEMO.zip','Pacote completo baixado','Inclui arquivos demonstrativos e aviso de uso.'],
      report: ['assets/Relatorio_Tecnico_DEMO.pdf','Relatório baixado','PDF demonstrativo pronto para revisão.']
    };
    const [href,title,message] = files[kind];
    const link = document.createElement('a'); link.href = href; link.download = href.split('/').pop(); document.body.appendChild(link); link.click(); link.remove();
    showToast(title,message);
  }));

  document.querySelectorAll('[data-action]').forEach(button => {
    const action = button.dataset.action;
    if (['review','details'].includes(action)) return;
    button.addEventListener('click', () => {
      const responses = {
        share:['Link de apresentação copiado','Nesta POC, o compartilhamento é apenas uma simulação local.'],
        generateMap:['Mapa final gerado','Simbologia, quadro de áreas e layout foram atualizados após a revisão.'],
        rerun:['QA executado novamente','42 regras verificadas em 38 segundos simulados.'],
        approve:['Projeto aprovado','Status atualizado na memória demonstrativa.'],
        resolve:['Item encaminhado','A nomenclatura foi marcada para correção na próxima versão.'],
        editReport:['Modo de edição','A edição colaborativa será conectada em uma futura versão.'],
        uploadDoc:['Documento adicionado','Envio de documentos simulado na memória do projeto.']
      };
      if (responses[action]) showToast(...responses[action]);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { toggleDrawer(false); detailsModal.classList.remove('open'); document.getElementById('mapWrap').classList.remove('fullscreen-map'); }
  });
  if (printMode === 'map') showPage('overview');
})();
