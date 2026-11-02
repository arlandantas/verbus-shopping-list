# 50 — Fechamento da compra e histórico

> Modelo: compras e linhas (ADR-0012); edição de linhas passadas (ADR-0021); ciclo = mês civil local, retorno automático dos recorrentes removido (ADR-0030, emenda 0013). Histórias S-039…S-049, E-UX S-063, S-065…S-068.

## Fechamento
1. Usuário toca em "Finalizar compra" (na Lista, com ≥1 item no carrinho).
2. Itens comprados são arquivados no histórico do mês. Itens não comprados permanecem pendentes.
3. Itens da Despensa não voltam sozinhos: o usuário os marca como "falta" (ADR-0030).
4. Pergunta opcional: em qual mercado foi feita (lista dos já usados); registra a data (ver `60-`).

## Histórico
- Listas anteriores por mês, com opção de readicionar um item à lista atual.
- Soma do gasto do mês por categoria, com base nos preços informados.
- **Agrupar** (botão segmentado no mês): "Por categoria" (padrão atual) ou "Por compra". Por compra: um cartão por compra finalizada, do mais recente ao mais antigo, com data (ex.: "sáb, 14 de nov"), mercado (ou "Mercado não informado"), total da compra e os itens com quantidade e valor pago naquele dia. A escolha é lembrada no aparelho.
- **Editar item comprado** (ADR-0021, depois do redesign): na visão por compra, editar abre um sheet com quantidade, unidade e valor (R$); o nome fica somente leitura. Total da compra e somas por categoria se atualizam. Não há apagar linha.

## Tela
- Histórico (aba): meses; mês com as duas visões.

## Dados
- `purchases`, `purchaseLines` e `cycles` em `70-data-model.md` (ADR-0012/0013/0021).
