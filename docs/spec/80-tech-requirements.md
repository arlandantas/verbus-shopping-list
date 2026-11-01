# 80 — Requisitos técnicos

- Service worker para cache do app e funcionamento offline.
- Persistência offline do Firestore ativada, com listeners em tempo real.
- Manifest com ícones, nome e modo standalone (ícones definitivos: depois).
- Detecção de iOS com banner de instalação.
- Regras de segurança do Firestore: só membros da família leem e escrevem nos dados dela.
- Interface mobile-first, botões grandes, contraste alto, resposta imediata ao toque (atualização otimista).
- Design system Material 3 com tokens CSS, componentes próprios e ícones Material Symbols em SVG inline; tema claro/escuro pelo sistema; nada carregado de CDN (ADR-0018, spec `05-ui-shell.md`).
- Campo de adicionar fixo embaixo: viewport com `interactive-widget=resizes-content` para ficar acima do teclado no Android.
