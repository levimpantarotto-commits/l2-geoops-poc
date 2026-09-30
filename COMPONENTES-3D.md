# Componentes 3D reutilizados

- Cérebro: renderizador Neural3D existente, integrado com fixture local de 120 nós. Foram removidos dois hooks opcionais do runtime original e renomeada uma chave de paleta para `projeto`; geometria, materiais e renderização foram preservados.
- Sala: implementação standalone existente, preservando estações de trabalho, personagens procedurais, plantas, café, sofá, iluminação e controles de câmera. Marca, textos e tarefas foram substituídos por exemplos GeoOps. Integrações remotas e modelos externos foram removidos.
- Biblioteca Three.js 0.185.1 e OrbitControls: cópias locais. Licença em `vendor/LICENSE-three.txt`.
- As cenas não acessam acervos privados, dados de clientes nem agentes de produção. A sequência da sala é uma simulação local.
