# Portfólio Geovanna Farias (Clone 100% Fiel)

Clone idêntico e completo do site [Geovanna Farias - Portfólio](https://geovanna-farias-portfolio.vercel.app/).

---

## 🚀 Como Executar Localmente

### Opção 1: Via Node.js / NPM (Recomendado)

O projeto já inclui um servidor nativo ultrarrápido sem dependências externas:

```bash
npm start
```
ou
```bash
npm run dev
```
ou diretamente:
```bash
node server.js
```

O site estará acessível em:
- **Portfólio**: [http://localhost:3000](http://localhost:3000)
- **Painel Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📦 Estrutura dos Arquivos

- `index.html`: Código HTML exato da página principal com os dados, fontes, scripts e estilização originais.
- `admin/index.html`: Página administrativa original.
- `_next/static/immutable/chunks/`: Todos os scripts JavaScript e folhas de estilo CSS originais (GSAP, Lenis Smooth Scroll, Turbopack, Framer Motion, cursores dinâmicos, etc.).
- `_next/static/immutable/media/`: Todas as fontes tipográficas WOFF2 originais (Anybody, Instrument Sans, JetBrains Mono).
- `media/`: Todos os vídeos em alta definição (`reel.mp4`, `social.mp4`, `edicao.mp4`, `captacao.mp4`) e seus respectivos pôsteres (`.jpg`).
- `cached_images/`: Todas as imagens originais de alta resolução (Unsplash) armazenadas localmente para funcionamento 100% offline.
- `server.js`: Servidor HTTP leve em Node.js com suporte a streaming de vídeo (HTTP 206 Partial Content Range), roteamento de rotas e processamento local de imagens do Next.js (`/_next/image`).
- `icon.svg` & `opengraph-image`: Ícone SVG e imagem para compartilhamento em redes sociais.
- `robots.txt`: Arquivo de diretrizes de rastreamento original.

---

## 🎨 Recursos Clonavéis Preservados

- **Tipografia e Cores Exatas**: Anybody, Instrument Sans e JetBrains Mono nas variáveis CSS originais (`--brand-bg: #0D0D0F`, etc.).
- **Animações e Efeitos**: Lenis smooth scroll, GSAP, reveal animations e microinterações.
- **Player de Vídeo e Showreel**: Botão interativo *"dar play no reel"* com modal e controles de vídeo.
- **Deck Interativo**: Cards inclinados com animação e gravação no cabeçalho.
- **Filtros de Projetos**: Abas interativas de filtragem (*todos*, *social media*, *edição de vídeo*, *filmmaker & foto*).
- **Accordions de Serviços**: Toggles interativos *"o que tá incluso"* para cada um dos serviços.
- **Cursor Personalizado**: Estados dinâmicos de cursor (`ir`, `play`, `bora`).
- **Links Sociais e WhatsApp**: Links diretos com mensagens personalizadas.
