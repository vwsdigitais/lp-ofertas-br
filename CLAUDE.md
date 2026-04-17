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
| Output | Hybrid (SSG + API routes via `@astrojs/cloudflare`) |
| Hospedagem | Cloudflare Pages |
| Deploy | Contínuo via GitHub (`main` branch) |
| Repositório | `https://github.com/vwsdigitais/lp-ofertas-br.git` |
| Subdomínio | `grupo.cozinheirabrasileira.com.br` |

**Adapter obrigatório:** `@astrojs/cloudflare` está explícito em `package.json` e `astro.config.mjs`. Sem ele, qualquer rota com `export const prerender = false` quebra o build com `[NoAdapterInstalled]`. Não remover.

---

## 3. Estrutura de Arquivos

```
lp-ofertas-br/
├── public/
│   ├── _headers                    # Headers de segurança HTTP (Cloudflare Pages)
│   ├── favicon.ico                 # Fallback favicon (não usado ativamente)
│   ├── favicon.svg
│   ├── js/
│   │   └── krobt.js                # Rastreamento client-side: IDs, cookies, Pixel, beacon
│   └── imagens/
│       ├── Ofertas-BR.webp         # Logo principal (usada no hero — redonda 120px)
│       └── ofertas-br-ico.png      # Favicon PNG (aba do browser + apple-touch-icon)
├── src/
│   ├── layouts/
│   │   └── Layout.astro            # Layout base: head completo, GTM, Pixel, krobt.js
│   ├── pages/
│   │   ├── api/
│   │   │   └── capi.ts             # API route: recebe POST e envia para Meta CAPI v19.0
│   │   └── index.astro             # Única página — hero + rodapé + script JS
│   └── styles/
│       └── global.css              # Design system: tokens CSS, reset, btn-cta
├── astro.config.mjs                # Config Astro: site URL, compressHTML, adapter cloudflare
├── package.json                    # Dependências: astro + @astrojs/cloudflare
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

O handler do botão segue a **ordem KROB** — crítica para garantir que todos os pixels e beacons disparem antes do redirect:

```js
document.getElementById('meuBotaoWhatsapp').addEventListener('click', function (e) {
  e.preventDefault();

  // 1. Gera eventID único pro Lead (dedup Pixel ↔ CAPI)
  var leadEventId = window.krobTracker.generateId();

  // 2. Pixel cliente (Meta) — mesmo eventID que CAPI para deduplicação
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Lead', {
      content_name: 'Grupo VIP OFERTAS BR',
      content_category: 'lead_magnet',
      value: 1,
      currency: 'BRL'
    }, { eventID: leadEventId });
  }

  // 3. GTM — leadEventId no dataLayer para Google Ads usar como Order ID
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'whatsapp_group_join_attempt',
    leadEventId: leadEventId
  });

  // 4. CAPI server-side via beacon (fire-and-forget, sobrevive ao redirect)
  window.krobTracker.sendBeacon('Lead', {
    content_name: 'Grupo VIP OFERTAS BR',
    content_category: 'lead_magnet',
    value: 1,
    currency: 'BRL'
  }, leadEventId);

  // 5. Redirect WhatsApp
  var isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  if (isMobile) {
    setTimeout(function () {
      window.location.href = 'whatsapp://chat?code=FIDTZSItAHoI0OWPDVeAPm';
    }, 300);
  } else {
    window.open('https://chat.whatsapp.com/FIDTZSItAHoI0OWPDVeAPm', '_blank');
  }
});
```

**Estratégia anti-race condition:**
- **Mobile:** `setTimeout` de 300ms antes do `window.location.href` — dá tempo ao Pixel e beacon dispararem antes de navegar para o app.
- **Desktop:** `window.open('_blank')` — abre o WhatsApp Web em nova aba, mantendo a LP viva em background.

**Links ativos do grupo WhatsApp:**
- Web: `https://chat.whatsapp.com/FIDTZSItAHoI0OWPDVeAPm`
- Deep Link mobile: `whatsapp://chat?code=FIDTZSItAHoI0OWPDVeAPm`

> ⚠️ Se o link do grupo for resetado no WhatsApp, atualizar o código em **duas** linhas do script e na constante `WHATSAPP_GROUP_URL` no frontmatter.

---

## 6. Rastreamento e Analytics

### Arquitetura KROB

O rastreamento usa dois canais paralelos com deduplicação via `eventID` compartilhado:

| Canal | Arquivo | Responsabilidade |
|---|---|---|
| Cliente (browser) | `public/js/krobt.js` | Gera IDs, seta cookie `_krob_eid`, dispara Pixel JS e beacons |
| Servidor (edge) | `src/pages/api/capi.ts` | Rota Astro com `prerender=false`, recebe POST e envia para Meta CAPI v19.0 |

**Cookie first-party:** `_krob_eid` — UUID gerado no page load, Max-Age 180 dias, SameSite=Lax. Usado como `external_id` (SHA-256) na CAPI e como `external_id` no `fbq('init')`.

### Variáveis de Ambiente (Cloudflare Pages)

| Variável | Visibilidade | Descrição |
|---|---|---|
| `PUBLIC_META_PIXEL_ID` | Pública (embutida no build) | ID do Meta Pixel |
| `META_CAPI_TOKEN` | Secreta (só servidor) | Token de acesso Meta Conversions API |
| `CAPI_SHARED_SECRET` | Secreta | Segredo KROB (reservado para futuro uso) |
| `META_TEST_EVENT_CODE` | Opcional/Secreta | Só configura em staging para debug no Events Manager |

> **Atenção:** `import.meta.env.PUBLIC_*` é resolvido em BUILD TIME (não runtime). Por isso o `pixelId` em `Layout.astro` tem fallback hardcoded: `import.meta.env.PUBLIC_META_PIXEL_ID ?? '1682851872728506'`. O ID do Pixel é público (aparece em qualquer site com Pixel Meta) — não é segredo.

> **Atenção:** `META_CAPI_TOKEN` é acessado via `context.locals.runtime.env` (runtime do Cloudflare Worker), nunca via `import.meta.env`.

### Fluxo no Page Load (ViewContent)

```
1. krobt.js carrega (síncrono, antes do Pixel)
   → gera pageViewEventId = UUID
   → seta cookie _krob_eid

2. Meta Pixel init com external_id = _krob_eid

3. fbq('track', 'ViewContent', {...}, { eventID: pageViewEventId })
   → hit browser → facebook.com/tr

4. krobTracker.sendEvent('ViewContent', {...}, { eventId: pageViewEventId })
   → POST /api/capi → Meta CAPI v19.0
   → Meta deduplica: mesmo eventID = 1 evento contabilizado
```

### Fluxo no Click do Botão (Lead)

```
1. leadEventId = krobTracker.generateId()  ← UUID único por clique

2. fbq('track', 'Lead', { value: 1, currency: 'BRL', ... }, { eventID: leadEventId })
   → hit browser → facebook.com/tr

3. dataLayer.push({ event: 'whatsapp_group_join_attempt', leadEventId })
   → GTM dispara tag Google Ads com leadEventId como Order ID

4. krobTracker.sendBeacon('Lead', { value: 1, currency: 'BRL', ... }, leadEventId)
   → navigator.sendBeacon('/api/capi') — sobrevive ao redirect

5. Redirect WhatsApp (mobile: deep link após 300ms | desktop: nova aba)
```

**Ordem 1→5 é crítica.** Pixel antes do dataLayer, beacon antes do redirect.

### Deduplicação Meta

O Meta Events Manager mostra **dois registros** para cada Lead (um do Pixel cliente, um da CAPI servidor) — isso é **esperado e correto**. O mesmo `eventID` faz com que a Meta contabilize apenas **1 evento** nos relatórios de campanhas. Não tentar "corrigir" removendo um dos dois disparos.

### Google Tag Manager
- **ID:** `GTM-5CJNV5G`
- Inserido em `Layout.astro`: script no `<head>` (async) + iframe `<noscript>` imediatamente após `<body>`
- **Tags Meta no GTM:** pausadas intencionalmente — o Pixel é disparado direto no código (krobt.js + inline script) para controle total sobre `eventID` e timing.
- **Tags ativas no GTM:** Google Ads (acionada por `whatsapp_group_join_attempt`), GA4, Microsoft Clarity, Pinterest e demais integrações não-Meta.

### Evento de Conversão (GTM)
- **Nome:** `whatsapp_group_join_attempt`
- **Tipo de acionador:** Evento Personalizado
- **Quando dispara:** ao clicar em `#meuBotaoWhatsapp`, após Pixel + beacon
- **DLV disponível:** `leadEventId` — usar como Order ID na tag do Google Ads

### API Route CAPI (`src/pages/api/capi.ts`)

- `export const prerender = false` — obrigatório para rota funcionar como Worker
- Acessa env via `context.locals.runtime.env` (Cloudflare Workers runtime)
- Usa `runtime.ctx.waitUntil()` para retornar 204 imediatamente (não bloqueia beacons)
- Fallback para `await` se `ctx` não estiver disponível
- Nunca retorna 500 — qualquer erro resulta em 204 (beacons não têm retry)
- Eventos permitidos: `ViewContent`, `Lead`, `PageView`
- SHA-256 do cookie `_krob_eid` como `external_id` no payload CAPI

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

Inclui automaticamente (nesta ordem):
1. Meta charset, viewport, generator, theme-color
2. SEO: title, description, canonical URL
3. Open Graph + Twitter Card
4. Favicon PNG + apple-touch-icon
5. `dns-prefetch` + `preconnect` para fontes e serviços externos
6. Fonte Inter (não bloqueante via `media="print"`)
7. `krobt.js` (síncrono — deve rodar antes do Pixel para expor `window.krobTracker`)
8. Meta Pixel inline: init com `external_id`, ViewContent cliente + servidor com `pageViewEventId` compartilhado
9. Google Tag Manager (async no head + noscript no body)

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
| `Content-Security-Policy` | ver abaixo | XSS / injeção |

### CSP — Domínios Permitidos

**script-src:**
- `'self' 'unsafe-inline'`
- `https://www.googletagmanager.com` — GTM
- `https://www.google-analytics.com` `https://ssl.google-analytics.com` — GA4
- `https://connect.facebook.net` — Meta Pixel (`fbevents.js`)
- `https://www.clarity.ms` `https://scripts.clarity.ms` — Microsoft Clarity (o script reside em `scripts.clarity.ms`)
- `https://s.pinimg.com` — Pinterest Tag
- `https://static.cloudflareinsights.com` — Cloudflare Web Analytics
- `https://www.google.com` `https://googleads.g.doubleclick.net` — Google Ads

**connect-src:**
- `'self'`
- `https://www.googletagmanager.com` `https://www.google-analytics.com` `https://stats.g.doubleclick.net` — Analytics
- `https://www.facebook.com` `https://connect.facebook.net` — Meta Pixel hits
- `https://www.clarity.ms` `https://c.clarity.ms` — Clarity (coleta de dados)
- `https://s.pinimg.com` `https://ct.pinterest.com` — Pinterest tracking
- `https://www.google.com` `https://googleads.g.doubleclick.net` — Google Ads

**Erros esperados no console (não corrigíveis):**
O Meta Pixel (`fbevents.js`) tenta conectar em endpoints dinâmicos do "Signal Gateway" da Meta (URLs geradas por anunciante em `*.ecs.us-west-2.on.aws` e `*.run.app`). Esses endpoints não têm domínio fixo — impossível whitelistar. Não afetam o rastreamento principal (hit para `www.facebook.com/tr` funciona normalmente).

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
2. No handler do botão: `whatsapp://chat?code=NOVO_CODIGO`
3. No handler do botão: `https://chat.whatsapp.com/NOVO_CODIGO`

### Trocar logo
Substituir `/public/imagens/Ofertas-BR.webp` mantendo o mesmo nome, ou atualizar o `src` na tag `<img>` do hero.

### Trocar favicon
Substituir `/public/imagens/ofertas-br-ico.png` mantendo o mesmo nome.

### Adicionar novo evento KROB
1. Adicionar o nome do evento ao `ALLOWED_EVENTS` em `src/pages/api/capi.ts`
2. Disparar via `window.krobTracker.sendBeacon('NomeEvento', customData, eventId)` no cliente

### Atualizar domínios no CSP
Editar a linha `Content-Security-Policy` em `public/_headers`. Sempre adicionar em `script-src` E `connect-src` conforme necessário.
