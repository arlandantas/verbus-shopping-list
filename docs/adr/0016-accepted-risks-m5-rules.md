# 0016 — Riscos aceitos nas regras do M5

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** gestor (achados do revisor sobre S-031..S-034)

## Contexto
O revisor de segurança não achou brecha entre famílias nem para não-membros. Restaram três abusos que só um membro da própria família consegue fazer contra a própria família.

## Decisão
Aceitar, sem mudar as regras:
1. **Ids de ciclo sem limite:** um membro pode criar `cycles/<mês futuro ou atual>` antes da hora e impedir a volta dos recorrentes naquele mês (ADR-0013).
2. **`purchaseLines` não conferidas com `purchases`:** `totalCents`, `itemCount` e `market` podem ficar inconsistentes entre si (verificar exigiria um `get()` por linha; ADR-0012).
3. **Linha pré-criada com id de item:** impede o checkout daquele item (negação de serviço interna).

Mitigação no cliente: calcular totais sempre a partir das linhas; o histórico (S-040, S-047) não confia em `totalCents` isolado. O app não deve criar esses documentos fora do fluxo normal.

## Alternativas consideradas
- Restringir o id do ciclo ao mês de `request.time` e ao anterior: viável, mas quebra o uso offline com relógio errado. Reavaliar se o risco virar real.
- `get()` por linha no checkout: estoura o limite de acessos em lotes de 200 itens.

## Consequências
- Famílias são grupos de confiança (casais); o modelo de ameaça cobre outsiders, não membros maliciosos.
- Reabrir esta decisão se houver contas compartilhadas com desconhecidos.
