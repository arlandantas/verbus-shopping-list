# 00 — Visão geral

App web instalável (PWA) para listas de compras compartilhadas em um núcleo familiar, principalmente casais. Ao longo do mês, qualquer pessoa lança itens. No mercado, quem está lá marca o que foi pego e os outros acompanham em tempo real. Itens recorrentes mensais facilitam montar a lista.

**Princípios:** cadastro mínimo (só o nome é obrigatório), modo mercado rápido e usável com uma mão, funcionamento offline, sincronização em tempo real.

## Decisões tomadas
- Plataforma: PWA (Android e iOS).
- Back-end: sem servidor próprio no MVP. Front-end fala direto com Firebase (Authentication e Firestore, persistência offline ativada).
- iOS: aviso claro para instalar pelo Safari (Compartilhar → Adicionar à Tela de Início).
- Offline: marcações feitas sem sinal ficam salvas localmente e sincronizam ao reconectar.
- Nome do app/repositório: `verbus-shopping-list` (provisório). Ícones e identidade visual: depois.

## Fora do MVP
- Leitura de QR Code da NFC-e com vínculo por IA (V0.1/V1) → `90-nfce.md`.
- Comparativo de preços mês a mês e por mercado (V1).
- Sugestão de itens que costumam acabar; notificações push; várias listas por família.

## Riscos
- iOS pode limpar dados locais de PWAs pouco usados → a nuvem é a fonte da verdade.
- Edição simultânea: atualização por campo; a última marcação vence.
- Verificar suporte atual a push/instalação no iOS antes de implementar notificações.
