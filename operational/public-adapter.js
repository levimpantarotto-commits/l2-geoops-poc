/* Static public demonstration: never calls the local GeoOps API. */
(() => {
  'use strict';
  const enabled = new URLSearchParams(location.search).get('demo') === 'public' || location.hostname.endsWith('.github.io');
  const clone = value => structuredClone(value);
  let baseResult;

  async function source() {
    if (!baseResult) {
      const response = await fetch('public-data/result.json', {cache: 'no-store'});
      if (!response.ok) throw Error('Não foi possível carregar o caso público pré-processado.');
      baseResult = await response.json();
      // Cada visita começa sem uma revisão feita pelo visitante.
      (baseResult.features?.features || []).forEach(feature => { feature.properties.reviewed = false; });
      baseResult.downloads ||= {};
      ['base.png', 'mapa.png', 'mapa.pdf', 'projeto.gpkg', 'shapefile.zip', 'GeoOps_Projeto_Completo.zip', 'vetores.geojson', 'fontes_dados.json'].forEach(name => {
        baseResult.downloads[name] ||= `public-data/${name}`;
      });
    }
    return baseResult;
  }

  function recalculate(original, payload) {
    const data = clone(original);
    const submitted = new Map((payload?.features || []).map(feature => [String(feature.id ?? feature.properties?.id), feature.properties || {}]));
    const features = data.features?.features || [];
    const totalHa = Number(data.summary?.totalHa) || features.reduce((sum, feature) => sum + Number(feature.properties.area_ha || 0), 0);
    features.forEach(feature => {
      const values = submitted.get(String(feature.id ?? feature.properties?.id));
      if (values) {
        feature.properties.class = String(values.class ?? feature.properties.class);
        feature.properties.reviewed = values.reviewed === true;
      }
      feature.properties.pct = totalHa ? Number(feature.properties.area_ha || 0) / totalHa * 100 : 0;
    });
    data.summary = {...data.summary, totalHa};
    data.qa = [...(data.qa || []).filter(item => item.name !== 'Revisão pública'), {
      name: 'Revisão pública', status: 'review',
      detail: 'Classes e marcações foram alteradas somente neste navegador. Contornos e áreas originais do caso-base foram preservados.'
    }];
    return data;
  }

  function downloadRevisedGeoJSON(data) {
    const blob = new Blob([JSON.stringify(data.features, null, 2)], {type: 'application/geo+json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'GeoOps_classes_revisadas_navegador.geojson'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.GeoOpsPublic = {
    enabled,
    async execute(operation, payload = {}) {
      const original = await source();
      if (operation === 'prepare') {
        const prepared = clone(original);
        prepared.features = {type: 'FeatureCollection', features: []};
        prepared.summary = {...prepared.summary, count: 0, valid: 0};
        prepared.qa = [];
        return prepared;
      }
      if (operation === 'classify') return clone(original);
      if (operation === 'revise') return recalculate(original, payload.features);
      if (operation === 'export') return clone(original);
      throw Error('Esta operação não está disponível na demonstração pública.');
    },
    setup() {
      if (!enabled) return;
      document.body.classList.add('public-demo');
      document.getElementById('uploadInput').closest('label').hidden = true;
      document.getElementById('retryConnection').hidden = true;
      document.getElementById('connectionError').hidden = true;
      document.getElementById('engineBadge').textContent = 'DEMONSTRAÇÃO PÚBLICA · dados estáticos';
      document.getElementById('runClassify').textContent = '✧ Mostrar cobertura no mapa';
      document.getElementById('fillOpacity').title = 'Disponível depois de mostrar a cobertura no mapa';
      document.getElementById('exportAll').textContent = 'Ver arquivos do caso-base ↗';
      document.querySelector('#featureForm button[type="submit"]').textContent = 'Salvar revisão de classe';
      document.getElementById('datasetNotice').textContent = 'Caso público já processado. Não envia arquivos, não conecta ao ambiente local e não mede novamente a área.';
      document.getElementById('sourceDetail').textContent = 'Imagem e resultado pré-processados para demonstração pública';
      document.querySelector('#selectionEmpty p').textContent = 'Confira a classe e marque a revisão. Nesta demonstração, contornos e áreas originais não podem ser editados.';
      document.querySelector('.review > .subtle:last-child').textContent = 'Os entregáveis são arquivos pré-gerados do caso-base; revisões não os alteram.';
      document.querySelector('#tab-qa .qa-grid article:nth-child(2) .subtle').textContent = 'A demonstração usa dados estáticos no navegador; não há sessão local, envio de arquivo ou execução remota.';
      document.querySelector('footer span:last-child').textContent = 'Caso público pré-processado · revisão ilustrativa · sem conexão local';
      document.querySelector('[data-tab="qa"]').textContent = 'QA e limites';
      document.querySelector('#stepVectors small').textContent = 'Resultado pré-processado · MapBiomas 30 m';
      document.querySelector('#stepVectors span').firstChild.textContent = 'Mostrar cobertura';
      document.querySelector('#stepReview small').textContent = 'Classe e marcação · contorno preservado';
      document.querySelector('#stepExport small').textContent = 'Arquivos pré-gerados do caso-base';
      document.querySelector('#tab-qa .qa-grid article:nth-child(2) h2').textContent = 'Leitura desta demonstração.';
      document.querySelector('#tab-exports .preview .eyebrow').textContent = 'ARQUIVO PRÉ-GERADO DO CASO-BASE';
      document.querySelector('#tab-exports .preview h2').textContent = 'Prévia do caso-base.';
      document.querySelector('#previewEmpty').innerHTML = '<p>Abra os arquivos pré-gerados do caso-base.</p><p>Revisões feitas aqui não alteram esta prévia nem os arquivos técnicos.</p>';
      document.querySelector('#tab-exports aside h2').textContent = 'Arquivos do caso-base.';
      document.querySelector('#tab-exports aside h2 + p').textContent = 'Arquivos pré-gerados da cobertura 2023 no limite fictício de Botucatu. Ainda não incluem APP, AVN-DESC-APP, ARL ou área consolidada do mapa enviado, nem revisões feitas no navegador.';
      const method = document.querySelector('#methodDialog p:nth-of-type(5)');
      method.textContent = 'Nesta demonstração pública, o resultado já foi processado. Você pode reclassificar feições e marcar a revisão no navegador; os contornos, áreas e arquivos do caso-base não mudam. APP/RL e regularidade ambiental não são avaliadas.';
      const actions = {
        stepData: () => { document.querySelector('[data-tab="map"]').click(); document.getElementById('fitMap').click(); },
        stepVectors: () => document.getElementById('runClassify').click(),
        stepReview: async () => {
          const classify = document.getElementById('runClassify');
          if (document.getElementById('featureCount').textContent === '0') await classify.onclick();
          document.querySelector('[data-tab="map"]').click();
          document.getElementById('selectFirst').click();
        },
        stepExport: () => document.getElementById('exportAll').click()
      };
      Object.entries(actions).forEach(([id, action]) => {
        const step = document.getElementById(id);
        step.setAttribute('role', 'button');
        step.tabIndex = 0;
        step.addEventListener('click', action);
        step.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          action();
        });
      });
    },
    renderLabels(data) {
      if (!enabled) return;
      const changed = (data.features?.features || []).some(feature => feature.properties.reviewed);
      const exportButton = document.getElementById('exportAll');
      exportButton.textContent = 'Ver arquivos do caso-base ↗';
      document.getElementById('regenerate').hidden = true;
      if (!changed) return;
      const list = document.getElementById('downloadList');
      if (!list.querySelector('[data-public-geojson]')) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'button full'; button.dataset.publicGeojson = 'true';
        button.textContent = 'Baixar classes revisadas (GeoJSON)';
        button.onclick = () => downloadRevisedGeoJSON(data);
        list.append(button);
      }
    }
  };
})();
