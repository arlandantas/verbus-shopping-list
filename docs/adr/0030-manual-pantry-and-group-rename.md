# 0030 — Despensa só manual e renomear grupo (emenda 0013, 0028)

**Status:** aceito · **Data:** 2026-11-02 · **Autor:** usuário (decisões), builder (registro)

## Contexto
Feedback de uso (S-115..S-118): o retorno automático dos itens da Despensa no começo do mês surpreende; o texto do switch confunde; o nome do grupo não pode ser corrigido.

## Decisão
- **Sem retorno automático.** O cliente deixa de chamar `openCycleIfNeeded`, de criar o marcador `cycles/{mês}` e de mostrar o aviso "N itens voltaram". Quem decide é o usuário: Despensa → "Falta" por item, ou o novo botão **"Marcar todos como faltando"** (um batch com todos os itens "Tenho em casa", via `addItems`, mesmo limite de 100).
- **Regras `cycles` ficam como estão** (create-only, sem uso). Marcadores antigos continuam legíveis; remover a regra exigiria migração sem ganho.
- **Renomear grupo:** só o criador (`ownerId`). `families` ganha `validRename`: dono é membro, só `name` muda, 1–60 caracteres. O convite (`invites/{code}.familyName`, ADR-0007) acompanha: `update` passa a ser permitido a membro, só `familyName`, que deve igualar `families/{id}.name` no mesmo batch (`getAfter`). Um único `writeBatch`, otimista.
- **Texto do switch:** "Usar a Despensa" + explicação curta (sem "recorrente", sem "a cada compra fechada").
- **Boas-vindas** vira modal flutuante sobre a navegação (reaproveita o visual de `overlay.css`; a rota `/boas-vindas` e ADR-0029 seguem).

## Alternativas consideradas
- Manter o retorno mensal com opt-out: mais uma opção para explicar; o botão em massa cobre o caso.
- Qualquer membro renomeia (como o switch): o criador escolheu o nome ao convidar; evita disputa.

## Consequências
- Ciclo mensal deixa de ter efeito de dados (`cycleOf` segue valendo para compras e histórico).
- Convites antigos mantêm o nome até o próximo rename (a UI lê o nome do grupo, não do convite).
