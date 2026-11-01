# 0025 — Riscos da 0016 confirmados sob a 0023

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** construtor (S-079)

## Contexto
A ADR-0023 retomou o endurecimento. A S-079 atacou preços, compras, linhas e ciclos (`tests/rules/money-adversarial.test.ts`) e reavaliou os três riscos da ADR-0016.

## Decisão
Confirmar os riscos 1–3 da ADR-0016 sem mudar as regras. Cada um tem teste `accepted risk ADR-0016 #n`. Nenhuma correção barata (sem `get()` por documento) existe:
1. Ciclo futuro: restringir ao relógio quebra o uso offline.
2. Linha x compra: exigiria `get()` por linha (limite de 200 itens por lote).
3. Linha com id de item: só afeta a própria família.

Os campos de dinheiro (negativo, double, string, NaN, acima do teto) e a imutabilidade de `purchases`, `purchaseLines` e `cycles` não apresentaram brecha.

## Consequências
Modelo de ameaça inalterado (outsiders). Reabrir se houver contas compartilhadas com desconhecidos.
