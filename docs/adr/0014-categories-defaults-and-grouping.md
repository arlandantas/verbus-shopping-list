# 0014 — Categorias: padrões, CRUD e agrupamento (emenda spec 70 / 0009)

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 60: categorias padrão + as do usuário (criar, renomear, excluir as próprias); lista e mercado agrupam; histórico soma por categoria. A semente precisa ser idempotente e não pode sobrescrever nada se dois aparelhos (ou offline) tentarem.

## Decisão
- **`families/{F}/categories/{id}`**, chaves exatas: `name` string 1–40 (aparada), `isDefault` bool, `order` int 0–999.
- **Padrões (6), ids fixos:** `mercearia` "Mercearia" (0), `hortifruti` "Hortifrúti" (1), `carnes` "Carnes" (2), `laticinios` "Laticínios" (3), `limpeza` "Limpeza" (4), `higiene` "Higiene pessoal" (5). Lista em `src/domain/categories.ts` (`DEFAULT_CATEGORIES`).
- **Semente no batch de criar família** (`createFamily`, que já exige online, ADR-0004): 6 `set` nos ids fixos. Roda uma vez por família, sem corrida. Regra de `create`: `isMemberAfter(F)` (vale dentro do batch de criação, como `members`, ADR-0011); `isDefault == true` só quando `!exists(families/F)` (a família nasce no mesmo batch). Entrar em família não semeia. Famílias antigas do emulador ficam sem padrões (nada em produção; sem migração).
- **Padrões são fixos:** regras negam `update`/`delete` quando `resource.data.isDefault == true`. Categorias do usuário: `create` com `isDefault == false`; `update` com forma válida e `isDefault` inalterado; `delete` livre (membro).
- **Excluir não propaga:** itens/catálogo com `categoryId` órfão aparecem em "Sem categoria" (o cliente trata id desconhecido como null). Sem reescrita em massa.
- **Agrupamento** (`groupByCategory(items, categories)` em `domain/categories.ts`): seções na ordem de `order` e depois `name`; "Sem categoria" por último; dentro da seção, ordem de `sortItems`. Seção vazia não aparece. Mesma função na Lista e no Mercado.
- Nova categoria recebe `order` = maior + 1 (cliente). Nomes repetidos permitidos (sem checagem nas regras).
- Histórico soma pela cópia `categoryName` da linha (ADR-0012): renomear/excluir não muda o passado.

## Alternativas consideradas
- Semente preguiçosa ao abrir o app: precisa de marcador e poderia reverter renomeações com `set`.
- Padrões editáveis: a spec fala em renomear/excluir "as próprias".
- Categoria fixa no código sem coleção: impede o CRUD da spec.

## Consequências
- Teste de regras: semente dentro do batch de criação aceita; não membro negado; renomear/excluir padrão negado; `isDefault` forjado negado.
- Teste E2E de família nova vê os 6 padrões.
