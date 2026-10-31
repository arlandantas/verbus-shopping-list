# 40 — Modo mercado

## Fluxo
1. Usuário toca em "Ir ao mercado" e entra na tela simplificada: itens grandes, lista rolável, sem formulários.
2. Ao pegar um item, toca nele e ele vai para o carrinho (riscado e movido para o fim).
3. Os outros membros veem a mudança em tempo real. Cada item mostra quem marcou.
4. Sem sinal: a marcação é salva localmente, o app mostra indicador discreto de offline e sincroniza ao reconectar.
5. Desfazer: tocar de novo em um item marcado devolve para pendente.

## Notas
- Itens agrupados por categoria.
- Preço é opcional e fora do fluxo rápido (ver `60-categories-price.md`).
- Conflitos: atualização por campo, a última marcação vence.
- Atualização otimista, resposta imediata ao toque.
- Agrupamento por categoria chega no E-M5; no M4 a ordem é pendentes, depois comprados (ADR-0011).
- "Quem marcou" usa `families/{F}/members/{uid}`; a marcação é a mesma da Lista (ADR-0011).
