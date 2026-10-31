# 0013 — Ciclo mensal e volta dos recorrentes (fecha o ponto aberto da 0010)

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 50/30: recorrentes voltam como pendentes no início do mês. ADR-0009/0010 deixaram o item sem `cycle` e o "como voltar" para o E-M5. Não há servidor (sem Cloud Functions), vários aparelhos abrem o app e não pode haver duplicatas.

## Decisão
- **Ciclo = mês civil local** (`YYYY-MM`, `domain/cycle.ts`). Finalizar compra **não** abre ciclo; só grava `cycle` nas compras (ADR-0012). "Iniciar novo ciclo" manual fica fora do MVP.
- **Marcador `families/{F}/cycles/{YYYY-MM}`**, chaves exatas: `openedBy` == uid, `openedAt` == `request.time`, `recurringAdded` int 0–400. Id casa com o regex de ciclo. Regras: membro lê e cria; `update`/`delete` negados (create-only).
- **`openCycleIfNeeded(familyId, cycle)`** (`src/data/cycles.ts`), chamado pelo `FamilyProvider` ao ficar `ready` e ao voltar `online`:
  1. Escuta `cycles/{cycle}`; age só em snapshot com `metadata.fromCache === false` e doc inexistente (precisa de rede: evita decidir com cache vazio).
  2. Lê do servidor o catálogo `where('recurring','==',true)` e `items`; `pantryState` (ADR-0010) escolhe as entradas `atHome`. `missing` (já pendente) e `inCart` (comprado não finalizado) são puladas.
  3. Um `writeBatch`: cria o marcador + um item `pending` por entrada (forma de `addItem`, `recurring: true`, quantidade/unidade/categoria do catálogo; sem reescrever o catálogo). Máx. 400 itens (+1 = 401 escritas).
- **Corrida entre aparelhos:** o segundo batch falha no `create` do marcador e é negado inteiro (sem itens duplicados). Esse `permission-denied` é engolido em silêncio (não vai ao handler central).
- Primeiro acesso de uma família cria o marcador do mês com o que houver (em geral 0).

## Alternativas consideradas
- Readicionar ao finalizar a compra: recorrente recém-comprado voltaria no mesmo dia.
- Só levar o usuário à Despensa: contraria a spec 50 ("voltam como pendentes").
- Ids determinísticos por item sem marcador: dedup sem marcador exige regra de create-only em `items`, o que quebra o fluxo normal.

## Consequências
- Offline na virada do mês: recorrentes voltam quando houver rede. A UI avisa "N recorrentes voltaram para a lista" (S-049).
- Leitura extra uma vez por mês por aparelho; desprezível.
- Teste de regras cobre marcador duplicado negado e batch com marcador + itens; teste de dados cobre dois aparelhos sem duplicatas.
