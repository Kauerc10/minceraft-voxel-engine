# Minceraft 1.20.1 - Java Edition (Argon Voxel Engine)

Um clone completo e funcional de Minecraft implementado em WebGL / Three.js nativo no navegador, sem dependências de assets externos (todas as texturas, sprites, modelos 3D e áudios são gerados proceduralmente).

## 🎮 Funcionalidades

- **Menu Inicial Fiel ao Java Edition**:
  - Logo 3D clássico `MINCERAFT` com extrusão, rachaduras e Creeper na letra `A`.
  - Subtítulo `JAVA EDITION` e splash text pulsante animada.
  - Panorama 3D em tempo real girando sobre o vale de Cherry Grove ao pôr do sol.
  - Botões clássicos de pedra chanfrada com ícones pixel-art.
- **Geração Procedural de Mundo**:
  - Chunks infinitos com biomas (Cherry Grove, Floresta, Deserto, Snowy Peaks).
  - Cavernas, árvores, flores, cactos e minérios em profundidades reais.
  - Iluminação suave e Ambient Occlusion (AO) por vértice.
  - Simulação de fluidos (Água e Lava com autômatos celulares; contato entre água e lava gera Obsidiana ou Pedregulho).
- **Sobrevivência Real & Progressão**:
  - Modo Survival clássico começando do zero (soco em árvore -> tábuas -> gravetos -> bancada -> picaretas -> fornalha -> minérios -> diamantes).
  - Modo Criativo com voo (dois toques no Espaço) e quebra instantânea.
  - Sistema de Conquistas/Avisos em tempo real ("Getting Wood!", "Benchmarking!", "Time to Mine!", "Diamonds!").
- **Inventário e Interfaces**:
  - Inventário idêntico ao jogo clássico (`#c6c6c6` com slots chanfrados).
  - Preview 3D do personagem interativo que acompanha a posição do mouse em tempo real.
  - Slots de Armaduras equipáveis (Capacete, Peitoral, Calças, Botas) com redução de dano funcional e reflexo no modelo do jogador.
  - Slot da Mão Secundária (Escudo que bloqueia dano, tochas, etc.).
  - Crafting 2x2 no inventário e 3x3 na Bancada de Trabalho.
  - Fornalha funcional com queima de combustível (carvão/madeira) e fundição de ferro, ouro e carnes.
- **Mobs 3D com IA e Texturas 6 Faces**:
  - Vacas, Porcos, Ovelhas (lã 3D), Zumbis, Esqueletos (com arco 3D funcional) e Creepers (que incham, chiam e explodem o mapa).
  - Drops 3D no chão e orbes de XP gravitacionais.
- **Efeitos de Áudio Procedurais**:
  - Motor Web Audio API que sintetiza passos, quebra de blocos, batida, explosões, chiado de lava e tiros de arco.

## 🚀 Como Executar

Basta clonar e servir os arquivos com qualquer servidor web estático:

```bash
# Usando npx http-server
npx http-server -p 8080 -c-1

# Ou com Python
python -m http.server 8080
```

Abra no navegador em `http://localhost:8080`.
