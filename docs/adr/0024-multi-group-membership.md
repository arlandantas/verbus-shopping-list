# 0024 — Vários grupos por usuário (emenda 0003, 0014; substitui S-014)

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** usuário (decisões), arquiteto (modelo e regras)

## Contexto
O usuário quer participar de vários grupos (ex.: casa, pais, viagem). Hoje o perfil guarda um único `familyId` e as regras impõem "uma família por usuário" (S-014). Categorias padrão são semeadas ao criar a família (ADR-0014). Épico E-LISTS (redefinido).

## Decisão
- **Nome:** na UI é **"Grupo"** (strings pt-BR, aba `/grupo`, `/familia` redireciona). No código e no Firestore, `families`/`familyId` continuam (sem renomear coleção nem identificadores).
- **Descoberta:** os grupos do usuário vêm da consulta `families where members array-contains uid`; `families.members` é a fonte da verdade. A regra de leitura atual (`uid in resource.data.members`) já autoriza essa consulta (provar com teste; se falhar, ler os ids do livro-razão abaixo).
- **Perfil `users/{uid}`:** `displayName`, `email`, `createdAt`, `groupIds` (lista, máx. **10**). `groupIds` é só um livro-razão para as regras contarem grupos: cresce apenas por *append* de um id cujo `getAfter(família).members` contém o uid; nunca encolhe. O app não o usa para listar grupos.
- **Legado:** `familyId` vira opcional e imutável (perfis antigos). Base legada = `groupIds` se existir, senão `[familyId]` se não nulo, senão `[]`. Sem migração de dados: a família existente já aparece na consulta e é o primeiro grupo; o primeiro criar/entrar grava `groupIds = base + [novo]`. Perfis novos nascem com `groupIds == []` e sem `familyId`.
- **Criar e entrar:** `profileJoins` passa a exigir `getAfter(user).groupIds == base(get(user)).concat([familyId])` e tamanho ≤10. A comparação exata impede entrar em dois grupos no mesmo lote com um só *append*. Entrar continua negado se o uid já for membro (o cliente apenas troca para esse grupo). Máx. 10 membros por grupo segue valendo.
- **Grupo ativo:** escolhido no topo da Lista; lembrado por aparelho em `localStorage` (`activeGroup:<uid>`). Sem escolha válida: `familyId` legado se ainda membro, senão o grupo mais antigo (`createdAt`). Zero grupos → tela criar/entrar.
- **Por grupo:** itens, Despensa, histórico, ciclos, categorias, catálogo e perfis de membro (subcoleções de `families/{id}`, já isoladas).
- **Categorias (emenda 0014):** criar grupo não semeia nada; grupo novo nasce sem categorias. A tela Categorias mostra **sugestões** não persistidas (os 6 nomes de `DEFAULT_CATEGORIES`, sem os já usados por `nameKey`); um toque cria categoria comum (`isDefault == false`, id aleatório, editável). Regras passam a negar `isDefault == true` em `create`. Padrões já gravados em famílias antigas ficam como estão (cadeado).

## Alternativas consideradas
- Limite só no cliente: simples, mas burlável; o livro-razão custa um `get` já existente.
- Contador inteiro `groupCount`: dois *joins* no mesmo lote passariam com um só incremento.
- Renomear a coleção para `groups`: exige migração; sem ganho funcional.

## Consequências
- Testes de S-014 e partes de S-076/S-078 que assumem uma família por usuário são reescritos em S-087.
- `update` de `users` aceita em `groupIds` só um *append* sem duplicata e com `isMemberAfter`; demais campos como hoje. Sair de grupo (encolher a lista) continua fora do escopo: quem chega a 10 não entra em outro.
- Criar grupo segue exigindo conexão (ADR-0004).
