# 0027 — Colar lista de itens no campo de adicionar

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** arquiteto

## Contexto
Usuários recebem listas prontas (WhatsApp, Notas, Keep) e querem colá-las de uma vez no campo de adicionar (spec 20). Texto colado vem com marcadores, linhas vazias, cabeçalhos e repetidos; vírgula é decimal em pt-BR ("1,5 kg").

## Decisão
- Só a colagem (`paste`) muda; digitar continua igual. Vira lista quando o texto colado tem ≥2 linhas não vazias, ou, numa linha só, ≥2 partes separadas por `;` ou por vírgula que não esteja entre dígitos. Linha única sem separador cai no campo como hoje.
- Em listas de várias linhas, só a quebra de linha separa (vírgula dentro da linha fica no nome).
- Remove no início da linha: `-`, `*`, `+`, `•`, `·`, `–`, `—`, `[ ]`, `[x]`, `☐`, `☑`, `✅`, `✔` e numeração `1.`/`1)` seguida de espaço ("1.5 kg" não é numeração). Linhas vazias ou só com marcador somem.
- Cada linha passa por `parseItemText` (mesmo limite de 80 caracteres das regras/S-078). Casamento com o catálogo por `nameKey` igual ao `onPick`: nome, categoria e recorrente do catálogo; quantidade/unidade digitadas vencem, senão as do catálogo.
- Repetidos na colagem (mesmo `nameKey`): fica o primeiro. Máximo 100 itens; o excesso é descartado com aviso.
- Pré-visualização em BottomSheet com checkbox por linha (tudo marcado, exceto o que já está pendente na lista: desmarcado com "Já está na lista"). Confirmar grava num único `writeBatch` (item + catálogo = 2 escritas/item, ≤200 < 500), sem `await`, otimista e offline como `addItem`.

## Alternativas consideradas
- Adicionar direto com Snackbar "Desfazer": rápido, mas desfazer 40 itens e ver cabeçalhos/repetidos errados é pior; descartado.
- Vírgula sempre separa: quebra "1,5 kg arroz". Nunca separar: perde listas "arroz, feijão, leite" do WhatsApp.
- Somar quantidades de repetidos: surpreende; o usuário ajusta no sheet "Editar item".

## Consequências
- Regras não mudam; o lote só repete `get()` do mesmo doc da família (cacheado no limite de acessos).
- Item já no carrinho (`bought`) com o mesmo nome não conta como repetido.
