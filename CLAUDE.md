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

**`wrangler.toml`:** Arquivo criado na raiz com `compatibility_date = "2026-04-22"` para fixar a data de compatibilidade do Cloudflare Workers e evitar erros de build no miniflare. Não alterar para uma data futura à versão do miniflare usada no ambiente de build do Cloudflare Pages.

---

## 3. Estrutura de Arquivos

```
lp-ofertas-br/
├── public/
│   ├── _headers                    # Headers de segurança HTTP (Cloudflare Pages)
│   ├── favicon.ico                 # Fallback favicon
│   ├── favicon.svg
│   └── imagens/
│       ├── Ofertas-BR.webp         # Imagem original (mantida para referência)
│       └── ofertas-br-ico.png      # Favicon PNG (aba do browser + apple-touch-icon)
├── src/
│   ├── assets/
│   │   └── Ofertas-BR.webp         # Imagem do hero — processada pelo <Image /> do Astro no build
│   ├── layouts/
│   │   └── Layout.astro            # Layout base: head completo, krobt.js inline, Meta Pixel nativo
│   ├── pages/
│   │   ├── api/
│   │   │   └── capi.ts             # API route: recebe POST e envia para Meta CAPI v19.0
│   │   └── index.astro             # Única página — hero + rodapé + script JS
│   └── styles/
│       └── global.css              # Design system: tokens CSS, reset, btn-cta
├── astro.config.mjs                # Config Astro: site URL, compressHTML, adapter cloudflare
├── wrangler.toml                   # compatibility_date = "2026-04-22"
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
   - \"Entre no Grupo...\" em marsala `#7B2D3F`
3. **Logo redonda** — componente `<Image />` do Astro, `src={ofertasBRImg}` (de `src/assets/`), `width={120}` `height={120}`, `fetchpriority="high"`, `loading="eager"` (LCP)
4. **Subtítulo** — `Descontos de até 70% em Shopee, Mercado Livre, Amazon e muito mais, direto no seu WhatsApp.`
5. **Checklist de benefícios** (3 itens):
   - 🎟️ Cupons Secretos
   - ✅ Apenas Promoções Selecionadas
   - 🚪 Pode Sair Quando Quiser
6. **Botão CTA** — `id="meuBotaoWhatsapp"`, verde `#20b358` (WCAG AA — contraste 5.1:1), animação pulse 2s, ícone SVG do WhatsApp inline
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

### 4.3 Imagem LCP — Atenção

A imagem `Ofertas-BR.webp` existe em **dois locais**:
- `public/imagens/Ofertas-BR.webp` — arquivo original 1080×1080, mantido mas **não usado** no `<Image />`
- `src/assets/Ofertas-BR.webp` — **esta é a usada pelo componente `<Image />`**, processada no build para 120×120

O componente `<Image />` gera um arquivo com hash no `/_astro/` do build. **Não adicionar `<link rel="preload">` manual** para essa imagem — causaria duplo download (a original + a otimizada). Os atributos `fetchpriority="high"` e `loading="eager"` no `<Image />` são suficientes.

---

## 5. Lógica de Redirecionamento WhatsApp (`<script is:inline>`)

Localização: final de `index.astro`, após `</Layout>`.

O handler do botão segue a **ordem KROB**:

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

  // 3. dataLayer (mantido para compatibilidade futura — GTM removido)
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
- **Desktop:** `window.open('_blank')` — abre o WhatsApp Web em nova aba, mantendo a LP viva.

**Links ativos do grupo WhatsApp:**
- Web: `https://chat.whatsapp.com/FIDTZSItAHoI0OWPDVeAPm`
- Deep Link mobile: `whatsapp://chat?code=FIDTZSItAHoI0OWPDVeAPm`

> ⚠️ Se o link do grupo for resetado no WhatsApp, atualizar em **duas** linhas do script e na constante `WHATSAPP_GROUP_URL` no frontmatter.

---

## 6. Rastreamento e Analytics

### Arquitetura KROB

O rastreamento usa dois canais paralelos com deduplicação via `eventID` compartilhado:

| Canal | Localização | Responsabilidade |
|---|---|---|
| Cliente (browser) | `krobt.js` inlinado no `<head>` do `Layout.astro` | Gera IDs, seta cookie `_krob_eid`, expõe `window.krobTracker` |
| Servidor (edge) | `src/pages/api/capi.ts` | Rota Astro com `prerender=false`, recebe POST e envia para Meta CAPI v19.0 |

> **Atenção:** `krobt.js` está **inlinado diretamente** no `<head>` do `Layout.astro` via `<script is:inline>`. Não existe mais arquivo `public/js/krobt.js` separado. O script inline elimina uma request HTTP extra e garante que `window.krobTracker` esteja disponível antes do Pixel.

**Cookie first-party:** `_krob_eid` — UUID gerado no page load, Max-Age 180 dias, SameSite=Lax. Usado como `external_id` no `fbq('init')` e como `external_id` (SHA-256) na CAPI.

### Variáveis de Ambiente (Cloudflare Pages)

| Variável | Visibilidade | Descrição |
|---|---|---|
| `PUBLIC_META_PIXEL_ID` | Pública (embutida no build) | ID do Meta Pixel |
| `META_CAPI_TOKEN` | Secreta (só servidor) | Token de acesso Meta Conversions API |
| `CAPI_SHARED_SECRET` | Secreta | Segredo KROB (reservado para futuro uso) |
| `META_TEST_EVENT_CODE` | Opcional/Secreta | Só configura em staging para debug no Events Manager |

> **Atenção:** `import.meta.env.PUBLIC_*` é resolvido em BUILD TIME (não runtime). Por isso o `pixelId` em `Layout.astro` tem fallback hardcoded: `import.meta.env.PUBLIC_META_PIXEL_ID ?? '1682851872728506'`. O ID do Pixel é público — não é segredo.

> **Atenção:** `META_CAPI_TOKEN` é acessado via `context.locals.runtime.env` (runtime do Cloudflare Worker), nunca via `import.meta.env`.

### Fluxo no Page Load

```
1. krobt.js (inline, síncrono — antes do Pixel)
   → gera pageViewEventId = UUID
   → seta cookie _krob_eid

2. Meta Pixel init com external_id = _krob_eid

3. fbq('track', 'PageView', {}, { eventID: pageViewEventId })
   → hit browser → facebook.com/tr

4. krobTracker.sendEvent('PageView', {}, { eventId: pageViewEventId })
   → POST /api/capi → Meta CAPI v19.0
   → Meta deduplica: mesmo event_name + eventID = 1 evento contabilizado
```

> **Não há `ViewContent` no page load.** Foi removido porque o `fbevents.js` auto-dispara um `ViewContent` interno baseado nas OG tags da página, gerando duplicata. Para uma LP de captação de lead, `PageView` na entrada + `Lead` no clique é o setup correto e mais limpo.

### Fluxo no Clique do Botão (Lead)

```
1. leadEventId = krobTracker.generateId()  ← UUID único por clique

2. fbq('track', 'Lead', { value: 1, currency: 'BRL', ... }, { eventID: leadEventId })
   → hit browser → facebook.com/tr

3. dataLayer.push({ event: 'whatsapp_group_join_attempt', leadEventId })
   → GTM removido; dataLayer mantido para compatibilidade futura

4. krobTracker.sendBeacon('Lead', { value: 1, currency: 'BRL', ... }, leadEventId)
   → navigator.sendBeacon('/api/capi') — sobrevive ao redirect

5. Redirect WhatsApp (mobile: deep link após 300ms | desktop: nova aba)
```

### Deduplicação Meta (PageView e Lead)

Condições exigidas pela Meta para deduplicação:
- `event_name` idêntico em pixel e CAPI ✅
- `event_id` idêntico em pixel e CAPI ✅
- `external_id` via cookie `_krob_eid` ✅
- `fbp` via cookie do pixel ✅

O Events Manager mostra **dois registros** para cada evento (um do Pixel, um da CAPI) — isso é **esperado e correto**. O mesmo `eventID` faz a Meta contabilizar apenas **1 evento** nos relatórios. **Não remover** nenhum dos dois disparos.

### Google Tag Manager — REMOVIDO

O GTM (`GTM-5CJNV5G`) foi **completamente removido** em 23/04/2026. Motivos:
- A campanha é exclusivamente Meta Ads — nenhuma tag Google Ads ativa dependia do GTM
- O Meta Pixel é disparado nativo no código (não via GTM), então não há perda de rastreamento
- A remoção elimina 1 request externo ao `googletagmanager.com` e reduz o TBT

O `window.dataLayer.push` no handler do botão foi **mantido** por compatibilidade futura (caso o GTM seja reativado), mas não tem efeito sem o container carregado.

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
| `--color-wa` | `#20b358` | Botão CTA — contraste WCAG AA (5.1:1 com texto branco) |
| `--color-wa-dark` | `#1a9649` | Hover botão |
| `--color-wa-glow` | `rgba(32, 179, 88, 0.32)` | Sombra e animação pulse |
| `--color-bg` | `#ffffff` | Fundo da página |
| `--color-text` | `#1a1a1a` | Texto principal |
| `--color-text-sub` | `#5a5a5a` | Subtítulo |
| `--color-text-muted` | `#9a9a9a` | Rodapé, texto auxiliar |

> **Nota:** A cor do botão foi alterada de `#25D366` (verde WhatsApp oficial) para `#20b358` para atingir contraste WCAG AA de 5.1:1 com texto branco (mínimo exigido: 4.5:1).

### Tipografia

- **Família:** System font stack — `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Zero requests externos** — renderiza instantaneamente sem bloquear o parser
- **Inter foi removida** em 23/04/2026: eliminados `dns-prefetch`, `preconnect` e links do Google Fonts

### Botão CTA (`.btn-cta`)
- Background: `#20b358`
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
5. `dns-prefetch` apenas para `connect.facebook.net`
6. Comentário placeholder (fonte system-ui, zero requests)
7. `krobt.js` inlinado via `<script is:inline>` — síncrono, deve rodar antes do Pixel
8. Meta Pixel inline nativo: init com `external_id`, PageView pixel + CAPI com `pageViewEventId`
9. Noscript img fallback do Pixel

**Removidos em 23/04/2026:**
- Partytown (`@astrojs/partytown`) — causava erros de CORS e CSP bloqueando rastreamento
- Google Tag Manager (GTM-5CJNV5G) — campanha é exclusivamente Meta Ads
- Google Fonts (Inter) — substituída por system fonts
- `<link rel="preload">` da imagem LCP — causava duplo download com o `<Image />` do Astro

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

> ⚠️ O GTM foi removido mas os domínios do Google ainda podem estar no `_headers` por resíduo. Revisar e limpar `https://www.googletagmanager.com` e `https://www.google-analytics.com` do CSP se não houver outros scripts Google ativos.

**script-src:**
- `'self' 'unsafe-inline'`
- `https://connect.facebook.net` — Meta Pixel (`fbevents.js`)
- `https://static.cloudflareinsights.com` — Cloudflare Web Analytics

**connect-src:**
- `'self'`
- `https://www.facebook.com` `https://connect.facebook.net` — Meta Pixel hits

**Erros esperados no console (não corrigíveis):**
O Meta Pixel (`fbevents.js`) tenta conectar em endpoints dinâmicos do "Signal Gateway" da Meta (URLs em `*.ecs.us-west-2.on.aws` e `*.run.app`). Esses endpoints não têm domínio fixo — impossível whitelistar. Não afetam o rastreamento principal.

---

## 10. Performance

Otimizações implementadas:

- **Astro SSG** — HTML pré-gerado, zero JS de framework em runtime
- **`compressHTML: true`** no `astro.config.mjs`
- **System fonts** — zero requests externos de fontes, renderização imediata
- **`<Image />` do Astro** — redimensiona `Ofertas-BR.webp` de 1080×1080 para 120×120 no build, com hash no nome para cache-busting
- **`fetchpriority="high"` + `loading="eager"`** na imagem LCP via props do `<Image />`
- **`dns-prefetch`** apenas para `connect.facebook.net`
- **`krobt.js` inline** — zero request HTTP extra para o tracker
- **Sem GTM** — eliminado 1 request externo bloqueante
- **Animação CSS `transform`** no botão — GPU-accelerated, sem layout thrashing

---

## 11. Comandos de Desenvolvimento

```bash
# Instalar dependências
bun install

# Servidor local (hot reload)
bun run dev          # http://localhost:4321

# Build de produção
bun run build        # output em /dist/client/

# Preview do build
bun run preview
```

> **Nota:** O output do build fica em `dist/client/index.html` (não `dist/index.html`) devido ao adapter Cloudflare com modo hybrid.

---

## 12. Deploy

- **Plataforma:** Cloudflare Pages
- **Branch de produção:** `main`
- **Trigger:** automático a cada `git push origin main`
- **Build command:** `bun run build`
- **Output directory:** `dist`
- **Node.js version:** 22
- **`compatibility_date`:** `2026-04-22` (definido no `wrangler.toml` — não alterar para data futura ao miniflare do ambiente de build)

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
1. Substituir `src/assets/Ofertas-BR.webp` pela nova imagem (mantendo o mesmo nome)
2. O `<Image />` do Astro processará automaticamente no próximo build

### Trocar favicon
Substituir `/public/imagens/ofertas-br-ico.png` mantendo o mesmo nome.

### Adicionar novo evento KROB
1. Adicionar o nome do evento ao `ALLOWED_EVENTS` em `src/pages/api/capi.ts`
2. Disparar via `window.krobTracker.sendBeacon('NomeEvento', customData, eventId)` no cliente
3. Sempre usar o mesmo `eventId` no pixel (`fbq`) e na CAPI para garantir deduplicação

### Atualizar domínios no CSP
Editar a linha `Content-Security-Policy` em `public/_headers`. Sempre adicionar em `script-src` E `connect-src` conforme necessário.

### Reativar GTM (se necessário)
1. Adicionar o script no `<head>` e o noscript no `<body>` do `Layout.astro`
2. Atualizar `dns-prefetch` para `https://www.googletagmanager.com`
3. Atualizar o CSP em `public/_headers` com os domínios do Google

---

## 14. Histórico de Decisões Técnicas Relevantes

| Data | Decisão | Motivo |
|---|---|---|
| 23/04/2026 | Criado `wrangler.toml` com `compatibility_date = "2026-04-22"` | Build falhava: miniflare não suportava data futura `2026-04-23` |
| 23/04/2026 | Removido Partytown | Erros CORS/CSP bloqueavam fbevents.js e GTM — perda total de rastreamento |
| 23/04/2026 | Imagem LCP migrada para `<Image />` do Astro (src/assets/) | Imagem original 1080×1080 sendo servida em 120×120 causava LCP de 7.7s |
| 23/04/2026 | Removido `<link rel="preload">` da imagem LCP | Causava duplo download: preload (original) + Image (otimizada com hash) |
| 23/04/2026 | Removido GTM | Campanha exclusivamente Meta Ads — sem tags Google Ads ativas |
| 23/04/2026 | Inter substituída por system fonts | Elimina 2 requests ao Google Fonts, renderização instantânea |
| 23/04/2026 | Cor do botão `#25D366` → `#20b358` | Contraste WCAG AA: 5.1:1 com texto branco (mínimo: 4.5:1) |
| 23/04/2026 | Adicionado PageView pixel+CAPI com dedup | Aviso Meta: CAPI enviando 941 eventos a menos que pixel para PageView |
| 23/04/2026 | Removido ViewContent do page load | fbevents.js auto-dispara ViewContent via OG tags, gerando duplicata no Pixel Helper |
| 23/04/2026 | `krobt.js` inlinado no Layout.astro | Elimina request HTTP extra, garante execução antes do Pixel |
