# 0028 — Despensa e compras recorrentes opcionais por grupo (emenda 0010, 0013)

**Status:** aceito · **Data:** 2026-11-02 · **Autor:** usuário (decisões), builder (registro)

## Contexto
Nem todo grupo quer recorrência (ex.: viagem). A Despensa, o "Recorrente mensal" e o retorno de recorrentes ao abrir o mês (ADR-0013) devem poder ser desligados por grupo (S-105).

## Decisão
- **Campo:** `families/{id}.recurringEnabled` (boolean). **Ausente = ligado**: grupos existentes ficam ativos, sem migração. O conversor expõe sempre um boolean (`!== false`).
- **UI:** "Despensa e compras recorrentes", com explicação curta. Switch no formulário de criar grupo (padrão ligado) e na tela do Grupo.
- **Desligado:** some a aba Despensa (`/despensa` redireciona à Lista), o "Recorrente mensal" no "Editar item" e o aviso "N recorrentes voltaram". Ao abrir o mês o marcador `cycles/{mês}` é criado normalmente (`recurringAdded: 0`), mas nenhum recorrente volta. Catálogo e itens não são apagados; religar restaura a aba e o campo (o retorno volta no próximo mês).
- **Regras:** `create` aceita a chave opcional, que deve ser boolean. `update` novo (`validRecurringToggle`): membro, só `recurringEnabled` muda, boolean. Hoje qualquer membro já pode girar o convite e o nome não é editável; logo, qualquer membro alterna.
- **Cliente:** a alteração é otimista (`updateDoc` sem await). `watchMyGroups` passou a esconder um grupo só até a primeira aceitação do servidor; edições locais posteriores não o escondem.

## Alternativas consideradas
- Só o criador alterna (`ownerId`): sem demanda e inconsistente com o convite.
- Apagar dados ao desligar: destrutivo e irreversível.

## Consequências
- Grupos legados sem o campo funcionam sem backfill. Dois aparelhos com valores diferentes convergem pelo último escrito.
