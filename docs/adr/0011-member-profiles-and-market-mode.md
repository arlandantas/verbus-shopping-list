# 0011 — Perfis de membro ("quem marcou") e modo mercado

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 40: cada item mostra quem marcou. `items.markedBy` guarda o uid, mas `users/{uid}` só é legível pelo dono (ADR-0003). O modo mercado precisa reaproveitar a marcação da lista (S-019) sem duplicá-la.

## Decisão
- **`families/{F}/members/{uid}`**, chaves exatas: `displayName` string 1–60 (aparada). Regras: membro lê; cria/atualiza só o próprio doc (`uid == request.auth.uid`, `isMember(F)`); `delete` negado. Não muda as regras de criar/entrar (ADR-0003/0007).
- Gravação preguiçosa: ao ficar `ready`, o `FamilyProvider` chama `ensureMemberProfile` se o doc próprio falta ou o nome difere (`set` completo, `void`, sem `await`); vale também para famílias já existentes.
- `watchMembers` + `useMemberNames` → mapa uid→nome. Exibição: próprio uid = "você"; uid sem doc = "alguém".
- **Modo mercado = outra tela sobre os mesmos dados**: rota `/mercado`, mesmos `useItems`/`sortItems`/`setItemStatus`. A troca de status vai para uma função única `toggleItemStatus(familyId, item)` em `src/data/items.ts`, usada pela lista e pelo mercado. Desfazer = tocar de novo (escrita inversa, ADR-0004). Última marcação vence (por campo).
- Diferença só de apresentação: `MarketRow` (linha inteira tocável, ≥64px, sem link para detalhe nem formulário); `ItemRow` segue com caixa + link. Ambos usam o componente `MarkedBy`.
- Agrupar por categoria fica para o E-M5 (ADR-0009); no M4 a ordem é a de `sortItems` (pendentes, depois comprados no fim).

## Alternativas consideradas
- `markedByName` no item: muda a ADR-0008, nome fica velho se o membro renomear.
- Liberar `users/{uid}` para a família: expõe e-mail e exige `get()` extra por leitura.

## Consequências
- Membro que saiu da família (fora do MVP) continua com nome no doc; sem limpeza.
- Teste de regras cobre doc alheio, outra família e chaves extras.
