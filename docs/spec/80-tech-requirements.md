# 80 — Requisitos técnicos

- Service worker para cache do app e funcionamento offline.
- Persistência offline do Firestore ativada, com listeners em tempo real.
- Manifest com ícones, nome e modo standalone (ícones definitivos: depois).
- Aviso de instalação por plataforma (abaixo).
- Regras de segurança do Firestore: só membros da família leem e escrevem nos dados dela.
- Interface mobile-first, botões grandes, contraste alto, resposta imediata ao toque (atualização otimista).
- Design system Material 3 com tokens CSS, componentes próprios e ícones Material Symbols em SVG inline; tema claro/escuro pelo sistema; nada carregado de CDN (ADR-0018, spec `05-ui-shell.md`).
- Campo de adicionar fixo embaixo: viewport com `interactive-widget=resizes-content` para ficar acima do teclado no Android.

## PWA (M6)
- **Produção:** Firebase Hosting em https://nossocarrinho.web.app (projeto `prod`, base `/`); deploy manual com `pnpm deploy` e regras com `firebase deploy --only firestore:rules` (ADR-0031). Sem CI no GitHub: `pnpm ci:local` antes de cada entrega.
- Deploy estático com base path (`VITE_BASE`, padrão `/` em produção; subcaminho suportado); todo URL do app (manifest, ícones, SW, fallback, links) usa `import.meta.env.BASE_URL`, nunca `/` fixo.
- Aviso de instalação (S-080, S-101): card no fluxo, fechável, lembrado no aparelho (`localStorage`), nunca em modo standalone, não bloqueia o uso. Aparece na landing, no login, na criação de grupo e no shell. Por navegador (`detectInstallPlatform`):
  - Chrome/Edge/Samsung/Opera (Android e desktop): só depois do `beforeinstallprompt`; botão "Instalar" abre o diálogo do navegador; `appinstalled` esconde.
  - Safari iPhone/iPad (inclui iPadOS com UA de Mac): "Compartilhar → Adicionar à Tela de Início".
  - Outros navegadores no iOS: orienta abrir no Safari.
  - Safari no Mac: "Compartilhar → Adicionar ao Dock".
  - Firefox Android: menu ⋮ → Instalar. Firefox desktop e demais: sem aviso (sem instalação de PWA).
- Manifest coerente com o tema M3 (cores iguais às `meta theme-color`), `id`, `description`, `orientation: portrait`; `apple-touch-icon` e metas Apple no `index.html`. Ícones continuam provisórios.
- Offline: abrir qualquer rota do app sem rede mostra o app (fallback para `index.html` do escopo); nada de tráfego Firebase passa pelo SW.
- Atualização: nova versão não recarrega sozinha; aparece snackbar "Nova versão disponível" com ação "Atualizar". Sem resposta, a nova versão entra na próxima abertura do app.
- Segurança web e regras: ver `85-security.md`.
