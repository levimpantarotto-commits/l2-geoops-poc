# Componentes 3D reutilizados

- Cérebro: renderizador Neural3D existente, integrado com fixture local de 120 nós. Foram removidos dois hooks opcionais do runtime original e renomeada uma chave de paleta para `projeto`; geometria, materiais e renderização foram preservados.
- Sala v5: implementação atual da MelhorIA, com interior claro, câmera em perspectiva, mobiliário, avatares e controles de câmera originais. Apenas identidade visual textual e dados foram adaptados para exemplos GeoOps; a consulta operacional foi substituída por estados locais demonstrativos. Mapa e cérebro permanecem na versão aprovada.
- Bibliotecas locais: Three.js 0.185.1 para o cérebro e 0.160.0 para a sala, compatível com a implementação de origem. Licenças incluídas nos diretórios vendor.
- As cenas não acessam acervos privados, dados de clientes nem agentes de produção. A sequência da sala é uma simulação local.
