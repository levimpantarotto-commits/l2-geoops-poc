# GeoOps — estúdio de mapas e cérebro do escritório

## Caso brasileiro público — v15 (atual)

Abra [o aplicativo](https://levimpantarotto-commits.github.io/l2-geoops-poc/?v=15#mapa). Ele já carrega **automaticamente** um estudo ilustrativo de Botucatu/SP, sem clicar em “Criar traçado”. A imagem Sentinel-2 (11/09/2023) e a classificação MapBiomas Brasil (2008 e 2023) são dados públicos; o curso d’água de referência vem do OpenStreetMap. O perímetro é **fictício** e não corresponde a um imóvel ou CAR real. Fontes, coordenadas e checksums: `operational/public-data/fontes_dados.json`.

O processamento reproduzível está em `operational/automatic_case.py`: recorte dos dados, comparação 2008/2023, buffer geométrico do eixo do Rio Pardo, diferença e interseção feitos com PyQGIS. O site público apresenta o resultado **pré-calculado** em `operational/public-data/analise-automatica.json`. Ele não executa QGIS no servidor, não analisa um novo imóvel e não envia arquivos. A prancha `operational/public-data/mapa_analise_automatica.png` reúne todas as camadas candidatas e foi renderizada com `operational/render_automatic_map.py`.

As cinco camadas exibidas são: RIO_ATE_10 (**eixo do rio; largura não verificada**), APP (**faixa geométrica de estudo; não delimitação legal**), AVN-DESC-APP (**vegetação mapeada fora dessa faixa**), ARL (**proposta ilustrativa; não Reserva Legal declarada**) e AREA_CONSOLIDADA (**indício de uso persistente 2008/2023; não prova de ocupação anterior a 22/07/2008**). Cerrado e floresta mapeados aparecem no quadro; AUAS e utilidade pública ficam como “não avaliado”, não como zero. As áreas se sobrepõem e não devem ser somadas. Nenhuma camada é decisão de regularidade ambiental. APP, ARL e área rural consolidada exigem documentos, enquadramento normativo e revisão do engenheiro.

Para apresentar: abra o mapa; use **Imagem** para esconder os vetores e **Imagem + vetores** para revelar o estudo. Clique nas cinco camadas da análise para ligar/desligar e ver fonte, medida e ressalva. Use **Apresentar mapa** para a tela cheia e **Entregáveis** para baixar a prancha PNG e o GeoJSON candidato. **Ajustar traçado** é opcional, para rascunhos do técnico — não é pré-requisito. PDF, projeto QGIS, GeoPackage e SHP disponíveis são **do caso-base de cobertura**, não contêm as cinco camadas candidatas. Importação de imóvel e geração desses formatos com a análise automática exigem integração adicional no aplicativo local.

Para rodar localmente, sirva a pasta com um servidor HTTP simples (`python -m http.server 8765`) e abra `http://127.0.0.1:8765/`. Não abra como `file://` porque módulos 3D e requisições aos dados dependem de HTTP. O caso público é estático; o motor PyQGIS é reproduzível nesta pasta quando o runtime QGIS estiver instalado.

## Histórico — caso público v14 (substituído)

Abra https://levimpantarotto-commits.github.io/l2-geoops-poc/?v=14 . O endereço principal abre Botucatu/SP, com imagem Sentinel-2 de 11/09/2023 e cobertura MapBiomas Coleção 9/2023, sobre perímetro fictício. Preserve a atribuição das fontes; veja `operational/public-data/fontes_dados.json`.

No mapa, **✎ Criar traçado** abre o editor de vetores. Escolha APP, ARL, AVN-DESC-APP, área consolidada ou rio; marque pontos no mapa; selecione a feição e arraste seus vértices; salve para atualizar hectares ou quilômetros. Os traçados podem ser ligados/desligados e baixados em GeoJSON georreferenciado (EPSG:4326), legível no QGIS. Para o caso público, os rascunhos ficam neste navegador. A medida é aproximada e não substitui medição projetada e revisão técnica. O nome AVN-DESC-APP não implica desconto automático da APP: é apenas um rótulo de trabalho. APP, ARL e área consolidada exigem critérios e documentos próprios; a imagem sozinha não as determina.

Para mostrar o mapa em composição semelhante à referência, use **⛶ Apresentar mapa** ou abra diretamente `operational/index.html?demo=public&present=1`. A visualização ocupa a tela, mostra norte, escala, legenda e quadro de áreas, permite abrir camadas e clicar numa feição para revisar. É uma composição do caso fictício de Botucatu, **não** a reprodução georreferenciada do mapa de 2012; APP, ARL e área consolidada continuam pendentes. A POC web não possui catálogo mundial de imagens: localização/data deste exemplo são fixas. O QGIS local também não busca automaticamente imagem por propriedade nesta versão.

A aba **Motor geográfico** explica as duas camadas do produto (aplicação e PyQGIS local), a sequência efetivamente implementada e as etapas que ainda dependem dos arquivos e critérios do engenheiro. No GitHub Pages o motor não roda: as feições e os arquivos técnicos são pré-processados.

O mapa interativo usa limite vermelho contínuo, pontos verdes na vegetação mapeada e hachuras amarelas no uso agropecuário. O editor permite criar **rascunhos separados** de RIO_ATE_10, APP, AVN-DESC-APP, ARL e AREA_CONSOLIDADA; nenhuma dessas camadas é inferida automaticamente no caso de Botucatu. A hachura amarela da cobertura-base representa **uso agropecuário em 2023**, não comprova **área rural consolidada**. O PDF/QGIS/GPKG/SHP existentes continuam sendo os arquivos originais do caso-base e não incorporam os rascunhos do navegador. Para levá-los ao QGIS, use o GeoJSON separado.

1. Comece pela imagem; marque **Cobertura do solo**, clique em **Mostrar cobertura** na etapa 02 ou use o botão superior para revelar os vetores já preparados no QGIS. As quatro etapas numeradas são clicáveis.
2. Ligue/desligue camadas e classes, ajuste o preenchimento e selecione uma feição para revisar sua classificação. Para criar uma camada nova, use **✎ Criar traçado**, escolha o tipo e clique nos vértices sobre o mapa; finalize no primeiro ponto (polígono) ou com duplo clique (rio).
3. A tabela da cobertura reagrupará áreas pré-calculadas. Os traçados manuais têm medidas próprias, atualizadas ao salvar vértices, e não são somados à cobertura-base porque podem se sobrepor. O navegador não executa nova medição QGIS nem valida juridicamente as classes.
4. Abra **Entregáveis** em qualquer momento: PDF, QGIS, GPKG e SHP são do **caso-base pré-gerado**, não incorporam alterações da sessão. O GeoJSON de revisão separado registra as classes alteradas no navegador.
5. Explore o cérebro e a sala 3D demonstrativos, sem conexão a acervo ou agentes privados.

GitHub Pages hospeda somente a demonstração estática. Nele, o editor manual de vetores funciona; upload de arquivo próprio, medição QGIS e nova geração de PDF/GPKG/SHP requerem o aplicativo local. Não há backend público, login, envio de dados, APP/RL automaticamente delimitadas ou declaração de regularidade. Recarregar descarta a revisão de classes da cobertura, mas preserva os rascunhos manuais do exemplo no navegador. A resolução de 30 m não mostra todos os rios/nascentes.

## Cenário ilustrativo anterior — v5

O cenário antigo continua em `index.html?legacy=1#mapa`; as instruções e limites abaixo são **somente desse cenário**, não do caso brasileiro.

POC demonstrativa em português. HTML, CSS e JavaScript, sem backend e sem chaves de API. Marca L2 discreta.

## Abrir e apresentar

1. Abra https://levimpantarotto-commits.github.io/l2-geoops-poc/?v=5 no Chrome/Edge. Para rodar o ZIP, extraia a pasta, abra um terminal nela e execute `python -m http.server 8765` (requer Python); acesse http://localhost:8765. Use um servidor local: abrir por `file://` não suporta os módulos 3D. Fontes usam Google Fonts com alternativa local.
2. O mapa já abre com os vetores do exemplo. Ligue/desligue as seis camadas e ajuste **Preenchimento**. Para encenar a detecção, escolha **Imagem** e clique **Processar imagem**. A animação de aproximadamente 5 segundos é encenada, não um benchmark de análise real.
3. Clique **Revisar uma área**, troque para vegetação nativa e confirme. Observe o mapa, os hectares e os percentuais mudarem juntos. Também é possível selecionar as feições diretamente no mapa.
4. Clique **Gerar mapa final**. O quadro de áreas acompanha a revisão. **Baixar mapa PDF** abre a impressão: escolha “Salvar como PDF”, papel A3, paisagem, sem cabeçalho/rodapé do navegador. SVG, CSV e JSON representam a sessão atual.
5. Abra **Cérebro do escritório**: arraste a rede 3D, use o zoom e selecione documentos fictícios. Em **Sala dos agentes**, explore o escritório 3D, clique nos agentes e execute o fluxo demonstrativo. As duas cenas reutilizam componentes existentes, com dados apenas desta POC.

Para reiniciar, use o botão no rodapé. A classificação fica na memória da página e é reiniciada ao recarregar; o histórico demonstrativo permanece neste navegador até o reset. Não insira dados sensíveis. Para vídeo, prefira desktop e narre o fluxo antes de explorar os documentos.

## Limites claros

- Imagem `assets/aerial-demo-v2.png`: gerada por IA, não é satélite real. A mesma base aparece em todas as datas. Origem e prompt em `assets/ORIGEM-IMAGEM.md`.
- Upload registra nomes localmente; não interpreta KML/SHP/GeoJSON nem envia arquivos. Município, SRC, geometrias e qualidade GIS reais não são validados.
- Feições preparadas em coordenadas gráficas locais. Áreas proporcionais a uma área total fictícia de 1.502,42 ha, não medição geodésica. Revisão permite mudar classe, não editar vértices.
- APP e Reserva Legal são sobreposições de referência; não são reconhecidas legalmente pela imagem. Não entram na soma de cobertura.
- Cérebro usa conteúdo fictício, busca local e respostas de template. Não lê o computador, não acessa o Cérebro Vivo privado, não chama modelos. Agentes são simulações.
- Cérebro: renderizador Neural3D original reutilizado, com grafo fictício. Sala: cena original reutilizada, com móveis e personagens procedurais. Ambos usam WebGL e bibliotecas locais, sem APIs de produção. Hardware/navegadores sem WebGL podem não renderizar 3D.
- Arquivos GIS e o pacote conceitual em `assets/` vêm da demonstração anterior: exemplos fixos, não acompanham as revisões da sessão e não constituem entrega técnica. O QGS é uma estrutura conceitual.
- Relato de 3 horas concentrado e 1–2 dias com interrupções é do cliente, não referência universal. “Minutos + revisão” é a proposta de fluxo, não desempenho comprovado.

Para tornar operacional: dados georreferenciados, pipeline GIS/classificação, QA medido, permissões, persistência, integrações e revisão técnica por profissional habilitado.

## Publicação

Site estático no GitHub Pages, branch `main`, raiz. Sem segredos, informações privadas ou serviços de produção. A versão anterior permanece recuperável no histórico Git.
