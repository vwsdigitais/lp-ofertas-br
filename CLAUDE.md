# CLAUDE.md — OFERTAS BR Landing Page

Documento de referência completo para agentes de IA e desenvolvedores.

---

## 1. Visão Geral do Projeto

**Nome:** OFERTAS BR — Landing Page de Captação de Leads  
**Objetivo:** Converter tráfego pago em membros do grupo VIP de ofertas no WhatsApp com zero desperdício de cliques e 100% de rastreabilidade.  
**Nicho:** Ofertas e cupons em e-commerce brasileiro (Shopee, Mercado Livre, Amazon).  
**Marca associada:** Cozinheira Brasileira (`cozinheirabrasileira.com.br`)

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Astro 6.1.7 |
| Runtime / Package Manager | Bun 1.3.x |
| Output | Static Site (SSG) |
| Hospedagem | Cloudflare Pages |
| Deploy | Contínuo via GitHub (`main` branch) |
| Repositório | `https://github.com/vwsdigitais/lp-ofertas-br.git` |
| Subdomínio | `grupo.cozinheirabrasileira.com.br` |

---

## 3. Estrutura de Arquivos

```
lp-ofertas-br/
├── public/
│   ├── _headers                    # Headers de segurança HTTP (Cloudflare Pages)
│   ├── favicon.ico                 # Fallback favicon (não usado ativamente)
│   ├── favicon.svg
│   └── imagens/
│       ├── Ofertas-BR.webp         # Logo principal (usada no hero — redonda 120px)
│       └── ofertas-br-ico.png      # Favicon PNG (aba do browser + apple-touch-icon)
├── src/
│   ├── layouts/
│   │   └── Layout.astro            # Layout base: head completo, GTM, fontes
│   ├── pages/
│   │   └── index.astro             # Única página — hero + rodapé + script JS
│   └── styles/
│       └── global.css              # Design system: tokens CSS, reset, btn-cta
├── astro.config.mjs                # Config Astro: site URL, compressHTML
├── package.json                    # Dependências (apenas astro)
├── bun.lock                        # Lockfile do Bun
└── tsconfig.json                   # TypeScript strict mode
```

---

## 4. Estrutura da Página (`index.astro`)

A página é de **dobra única** — sem scroll obrigatório para conversão.

### 4.1 Hero Section (`#hero`)

Elementos, de cima para baixo:

1. **Badge de urgência** — pílula marsala com `🔴 VAGAS LIMITADAS`
2. **H1 (título)** — `🚨 Promoções Reais Direto no Seu WhatsApp! Entre no Grupo de Ofertas do OFERTAS BR.`
   - Fonte: Inter 900 — `clamp(1.4rem, 4vw, 2.2rem)`
   - "Entre no Grupo..." em marsala `#7B2D3F`
3. **Logo redonda** — `/imagens/Ofertas-BR.webp`, 120×120px, `border-radius: 50%`, `fetchpriority="high"` (LCP)
4. **Subtítulo** — `Descontos de até 70% em Shopee, Mercado Livre, Amazon e muito mais, direto no seu WhatsApp.`
   - Fonte mínima: 17px (`clamp(1.0625rem, 2.5vw, 1.25rem)`)
5. **Checklist de benefícios** (3 itens, fonte 17px):
   - 🎟️ Cupons Secretos
   - ✅ Apenas Promoções Selecionadas
   - 🚪 Pode Sair Quando Quiser
6. **Botão CTA** — `id="meuBotaoWhatsapp"`, verde WhatsApp `#25D366`, animação pulse 2s, ícone SVG do WhatsApp inline
7. **Texto redutor de ansiedade** — `🔒 Grátis • Sem spam • Shopee · Mercado Livre · Amazon`

### 4.2 Rodapé (`<footer>`)

Discreto, fundo `#fafafa`, borda topo `#e8e2de`:

- Texto de afiliado: *"Compartilhamos avaliações imparciais... podemos receber uma pequena comissão."*
- `© 2026 Cozinheira Brasileira – Todos os direitos reservados.`
- Links externos (`target="_blank" rel="noopener noreferrer"`):
  - [Sobre](https://cozinheirabrasileira.com.br/sobre/)
  - [Políticas](https://cozinheirabrasileira.com.br/politica-cookies/)
  - [Termos](https://cozinheirabrasileira.com.br/termos-condicoes/)
  - [Contato](https://cozinheirabrasileira.com.br/contato/)

---

## 5. Lógica de Redirecionamento WhatsApp (`<script is:inline>`)

Localização: final de `index.astro`, após `</Layout>`.

```js
document.getElementById('meuBotaoWhatsapp').addEventListener('click', function (e) {
  e.preventDefault();

  // 1. Dispara evento para o GTM (acionador: whatsapp_group_join_attempt)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'event': 'whatsapp_group_join_attempt' });

  // 2. Detecta mobile via User-Agent
  var isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile: aguarda 300ms para o Pixel/GTM dispararem, depois abre deep link
    setTimeout(function () {
      window.location.href = 'whatsapp://chat?code=FIDTZSItAHoI0OWPDVeAPm';
    }, 300);
  } else {
    // Desktop: abre WhatsApp Web em nova aba, LP permanece viva para o Pixel
    window.open('https://chat.whatsapp.com/FIDTZSItAHoI0OWPDVeAPm', '_blank');
  }
});
```

**Estratégia anti-race condition:**
- **Mobile:** `setTimeout` de 300ms antes do `window.location.href` — dá tempo ao GTM processar o trigger e ao Facebook Pixel enviar o hit para `facebook.com/tr` antes de navegar para o app. Deep link `whatsapp://` via `window.location.href` é necessário no mobile para compatibilidade total com iOS Safari.
- **Desktop:** `window.open('_blank')` — abre o WhatsApp Web em nova aba, mantendo a LP viva em background indefinidamente para o Pixel completar.

**Links ativos do grupo WhatsApp:**
- Web: `https://chat.whatsapp.com/FIDTZSItAHoI0OWPDVeAPm`
- Deep Link mobile: `whatsapp://chat?code=FIDTZSItAHoI0OWPDVeAPm`

> ⚠️ Se o link do grupo for resetado no WhatsApp, atualizar o código em **duas** linhas do script e na constante `WHATSAPP_GROUP_URL` no frontmatter.

---

## 6. Rastreamento e Analytics

### Google Tag Manager
- **ID:** `GTM-5CJNV5G`
- Inserido em `Layout.astro`: script no `<head>` (async) + iframe `<noscript>` imediatamente após `<body>`
- `window.dataLayer` inicializado antes do GTM

### Evento de Conversão
- **Nome:** `whatsapp_group_join_attempt`
- **Tipo de acionador no GTM:** Evento Personalizado
- **Quando dispara:** ao clicar no botão `#meuBotaoWhatsapp`, antes do redirecionamento
- **Tag Meta:** HTML Personalizado disparada por este evento (configurada no GTM)

---

## 7. Design System (`global.css`)

### Tokens de Cor
| Variável | Valor | Uso |
|---|---|---|
| `--color-marsala` | `#7B2D3F` | Destaque tipográfico, badge, links rodapé |
| `--color-marsala-dark` | `#5E1E2E` | Hover marsala |
| `--color-wa` | `#25D366` | Botão CTA (verde WhatsApp oficial) |
| `--color-wa-dark` | `#1aab52` | Hover botão |
| `--color-bg` | `#ffffff` | Fundo da página |
| `--color-text` | `#1a1a1a` | Texto principal |
| `--color-text-sub` | `#5a5a5a` | Subtítulo |
| `--color-text-muted` | `#9a9a9a` | Rodapé, texto auxiliar |

### Tipografia
- **Família:** Inter (Google Fonts) — pesos 700, 800, 900
- **Carregamento:** não bloqueante via `media="print"` + `onload="this.media='all'"`
- **Fallback:** `system-ui, -apple-system, sans-serif`
- **Tamanho mínimo:** 17px (`1.0625rem`) em textos de conteúdo

### Botão CTA (`.btn-cta`)
- Background: `#25D366` (verde WhatsApp)
- Animação: `btn-pulse` — scale 1→1.04 a cada 2s (GPU-accelerated)
- Border-radius: `24px` (`--radius-lg`)
- Hover: `translateY(-2px)` + intensifica sombra verde

---

## 8. Layout Base (`Layout.astro`)

Props aceitas:
```ts
interface Props {
  title: string;
  description?: string; // default: subtítulo da LP
  ogImage?: string;     // default: '/og-image.jpg'
}
```

Inclui automaticamente:
- Meta charset, viewport, generator
- `theme-color: #ffffff` (mobile browser bar branca)
- SEO: title, description, canonical URL
- Open Graph completo (og:type, url, title, description, image)
- Twitter Card (summary_large_image)
- Favicon PNG + apple-touch-icon
- `dns-prefetch` para GTM, Analytics, Google Fonts
- `preconnect` para Google Fonts
- Fonte Inter (não bloqueante)
- GTM completo (head + noscript body)

---

## 9. Segurança (`public/_headers`)

Aplicado pela Cloudflare Pages em todas as rotas (`/*`):

| Header | Valor | Proteção |
|---|---|---|
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Força HTTPS 1 ano |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Vazamento de URL |
| `Permissions-Policy` | geolocation, microphone, camera, payment bloqueados | Acesso a hardware |
| `Content-Security-Policy` | GTM, Analytics, Fonts, WhatsApp, Meta/Facebook Pixel permitidos | XSS / injeção |

---

## 10. Performance

Otimizações implementadas:

- **Astro SSG** — HTML pré-gerado, zero JS de framework em runtime
- **`compressHTML: true`** no `astro.config.mjs`
- **Fonte não bloqueante** — `media="print"` + `onload` elimina render-blocking resource
- **Pesos de fonte reduzidos** — 700, 800, 900 apenas (sem 400 e 600)
- **`fetchpriority="high"`** na imagem LCP (logo redonda)
- **`loading="eager"`** + **`decoding="async"`** na imagem hero
- **`dns-prefetch`** para todos os domínios externos
- **Animação CSS `transform`** no botão — GPU-accelerated, sem layout thrashing

---

## 11. Comandos de Desenvolvimento

```bash
# Instalar dependências
bun install

# Servidor local (hot reload)
bun run dev          # http://localhost:4321

# Build de produção
bun run build        # output em /dist

# Preview do build
bun run preview
```

---

## 12. Deploy

- **Plataforma:** Cloudflare Pages
- **Branch de produção:** `main`
- **Trigger:** automático a cada `git push origin main`
- **Build command:** `bun run build`
- **Output directory:** `dist`
- **Node.js version:** 22

```bash
# Enviar alterações para produção
git add .
git commit -m "descrição da mudança"
git push origin main
```

---

## 13. Manutenção Frequente

### Trocar link do grupo WhatsApp
Editar `src/pages/index.astro` em **3 lugares**:
1. Linha ~6: constante `WHATSAPP_GROUP_URL`
2. Linha ~242: `whatsapp://chat?code=NOVO_CODIGO`
3. Linha ~245: `https://chat.whatsapp.com/NOVO_CODIGO`

### Trocar logo
Substituir `/public/imagens/Ofertas-BR.webp` mantendo o mesmo nome, ou atualizar o `src` na tag `<img>` do hero.

### Trocar favicon
Substituir `/public/imagens/ofertas-br-ico.png` mantendo o mesmo nome.
