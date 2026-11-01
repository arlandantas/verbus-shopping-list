# 80 — Requisitos técnicos

- Service worker para cache do app e funcionamento offline.
- Persistência offline do Firestore ativada, com listeners em tempo real.
- Manifest com ícones, nome e modo standalone (ícones definitivos: depois).
- Detecção de iOS com banner de instalação.
- Regras de segurança do Firestore: só membros da família leem e escrevem nos dados dela.
- Interface mobile-first, botões grandes, contraste alto, resposta imediata ao toque (atualização otimista).
- Design system Material 3 com tokens CSS, componentes próprios e ícones Material Symbols em SVG inline; tema claro/escuro pelo sistema; nada carregado de CDN (ADR-0018, spec `05-ui-shell.md`).
- Campo de adicionar fixo embaixo: viewport com `interactive-widget=resizes-content` para ficar acima do teclado no Android.

## PWA (M6)
- Deploy estático com base path (`VITE_BASE`, ex.: `/verbus-shopping-list/`); todo URL do app (manifest, ícones, SW, fallback, links) usa `import.meta.env.BASE_URL`, nunca `/` fixo.
- Aviso de instalação iOS: só no Safari do iPhone/iPad (inclui iPadOS com UA de Mac) e só fora do modo standalone. Texto pt-BR com os passos "Compartilhar → Adicionar à Tela de Início". Botão fechar; a escolha fica salva no aparelho (`localStorage`) e o aviso não volta. Não bloqueia o uso.
- Manifest coerente com o tema M3 (cores iguais às `meta theme-color`), `id`, `description`, `orientation: portrait`; `apple-touch-icon` e metas Apple no `index.html`. Ícones continuam provisórios.
- Offline: abrir qualquer rota do app sem rede mostra o app (fallback para `index.html` do escopo); nada de tráfego Firebase passa pelo SW.
- Atualização: nova versão não recarrega sozinha; aparece snackbar "Nova versão disponível" com ação "Atualizar". Sem resposta, a nova versão entra na próxima abertura do app.
- Segurança web e regras: ver `85-security.md`.
