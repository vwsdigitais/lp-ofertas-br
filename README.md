# OFERTAS BR — Landing Page

Landing page de captação de leads para o grupo VIP de ofertas no WhatsApp da **Cozinheira Brasileira**.

**URL:** [grupo.cozinheirabrasileira.com.br](https://grupo.cozinheirabrasileira.com.br)

---

## Stack

- **Framework:** Astro 6 (SSG — zero JS em runtime)
- **Package Manager:** Bun
- **Hospedagem:** Cloudflare Pages
- **Deploy:** Contínuo via `git push origin main`

---

## Estrutura

```
src/
├── layouts/Layout.astro   # Head, GTM, Open Graph, fontes
├── pages/index.astro      # Única página (hero + CTA + rodapé)
└── styles/global.css      # Design system (tokens CSS, btn-cta)
public/
├── _headers               # Headers de segurança (Cloudflare Pages)
└── imagens/
    ├── Ofertas-BR.webp    # Logo hero (120×120px, redonda)
    └── ofertas-br-ico.png # Favicon
```

---

## Comandos

```bash
bun install       # instalar dependências
bun run dev       # servidor local → http://localhost:4321
bun run build     # build de produção → /dist
bun run preview   # preview do build
```

---

## Rastreamento

- **GTM:** `GTM-5CJNV5G`
- **Evento de conversão:** `whatsapp_group_join_attempt` (disparo no clique do CTA)
- **Estratégia anti-race condition:**
  - Mobile: `setTimeout` 300ms antes do deep link — garante que o Facebook Pixel complete o hit antes da navegação
  - Desktop: `window.open('_blank')` — LP permanece viva enquanto o WhatsApp Web abre em nova aba

---

## Manutenção

**Trocar link do grupo WhatsApp** — editar `src/pages/index.astro` em 3 lugares:
1. Linha ~6: constante `WHATSAPP_GROUP_URL`
2. Linha ~243: `whatsapp://chat?code=NOVO_CODIGO`
3. Linha ~247: `https://chat.whatsapp.com/NOVO_CODIGO`

**Trocar logo** — substituir `public/imagens/Ofertas-BR.webp` mantendo o mesmo nome.

---

## Deploy

```bash
git add .
git commit -m "descrição"
git push origin main
```

O Cloudflare Pages detecta o push e publica automaticamente em ~1 min.
