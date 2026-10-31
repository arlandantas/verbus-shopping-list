# 50 — Fechamento da compra e histórico

> Modelo: compras e linhas create-only (ADR-0012); ciclo = mês civil local, recorrentes voltam na 1ª abertura do mês via marcador `cycles` (ADR-0013). Histórias S-039…S-049.

## Fechamento
1. Usuário toca em "Finalizar compra".
2. Itens comprados são arquivados no histórico do mês. Itens não comprados permanecem pendentes.
3. Itens recorrentes voltam como pendentes no início do próximo mês (ou ao iniciar novo ciclo).
4. Pergunta opcional: em qual mercado foi feita (lista dos já usados); registra a data (ver `60-`).

## Histórico
- Listas anteriores por mês, somente leitura, com opção de readicionar um item à lista atual.
- Soma do gasto do mês por categoria, com base nos preços informados.

## Tela
- Histórico

## Dados
- `purchases`, `purchaseLines` e `cycles` em `70-data-model.md` (ADR-0012/0013).
