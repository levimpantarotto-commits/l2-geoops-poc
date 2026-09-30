# GeoOps — estúdio de mapas e cérebro do escritório

POC demonstrativa em português. HTML, CSS e JavaScript, sem backend e sem chaves de API. Marca L2 discreta.

## Abrir e apresentar

1. Abra https://levimpantarotto-commits.github.io/l2-geoops-poc/?v=4 no Chrome/Edge. Para rodar o ZIP, extraia a pasta, abra um terminal nela e execute `python -m http.server 8765` (requer Python); acesse http://localhost:8765. Use um servidor local: abrir por `file://` não suporta os módulos 3D. Fontes usam Google Fonts com alternativa local.
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
