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

  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') fileInput.click(); });
  uploadZone.addEventListener('dragover', event => { event.preventDefault(); uploadZone.classList.add('drag'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'));
  uploadZone.addEventListener('drop', event => {
    event.preventDefault(); uploadZone.classList.remove('drag');
    if (event.dataTransfer.files[0]) setFile(event.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });
  function setFile(file) { document.getElementById('fileName').textContent = `${file.name} · ${formatBytes(file.size)}`; }
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
    setTimeout(() => { showPage('overview'); showToast('Projeto pronto', '12 etapas concluídas. Produtos demonstrativos organizados.'); }, 650);
  }
  document.getElementById('skipProcessing').addEventListener('click', finishProcessing);

  const reviewDrawer = document.getElementById('reviewDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  function toggleDrawer(open) {
    reviewDrawer.classList.toggle('open', open);
    drawerBackdrop.classList.toggle('open', open);
    reviewDrawer.setAttribute('aria-hidden', String(!open));
  }
  document.querySelectorAll('[data-action="review"]').forEach(button => button.addEventListener('click', () => toggleDrawer(true)));
  document.querySelectorAll('[data-close-drawer]').forEach(button => button.addEventListener('click', () => toggleDrawer(false)));
  drawerBackdrop.addEventListener('click', () => toggleDrawer(false));
  document.getElementById('saveReview').addEventListener('click', () => {
    toggleDrawer(false);
    showToast('Classificação atualizada', 'Quadro de áreas e produtos recalculados na simulação.');
  });

  const detailsModal = document.getElementById('detailsModal');
  document.querySelectorAll('[data-action="details"]').forEach(button => button.addEventListener('click', () => { detailsModal.classList.add('open'); detailsModal.setAttribute('aria-hidden','false'); }));
  document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', () => { detailsModal.classList.remove('open'); detailsModal.setAttribute('aria-hidden','true'); }));
  detailsModal.addEventListener('click', event => { if (event.target === detailsModal) detailsModal.classList.remove('open'); });

  document.querySelectorAll('[data-layer]').forEach(check => check.addEventListener('change', () => {
    document.querySelectorAll(`.layer-${check.dataset.layer}`).forEach(layer => layer.style.display = check.checked ? '' : 'none');
    const active = document.querySelectorAll('[data-layer]:checked').length;
    document.querySelector('.legend-header span').textContent = `${active + 1} ativas`;
  }));
  document.getElementById('satelliteToggle').addEventListener('click', event => {
    document.getElementById('mapWrap').classList.toggle('muted-base');
    event.currentTarget.classList.toggle('active');
  });
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
