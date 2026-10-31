# 0001 — Fluxo de agentes e organização dos docs

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** gestor (aprovado pelo usuário)

## Contexto
Desenvolvimento agêntico autônomo com o mínimo de intervenção humana e baixo consumo de tokens. Docs longos lidos repetidamente são o principal desperdício.

## Decisão
- Time: gestor (agente orquestrador) + papéis `architect` (alto raciocínio, raro), `builder`, `reviewer` (padrão) e `researcher` (barato, sob demanda). Papéis definidos em Markdown neutro em `docs/agents/`; wrappers finos por ferramenta (ex.: `.claude/agents/`) só apontam para eles.
- Agnóstico de ferramenta: `AGENTS.md` (convenção aberta) é o ponto de entrada único; `CLAUDE.md` apenas importa `@AGENTS.md`.
- Divulgação progressiva: `AGENTS.md` curto (≤80 linhas) só aponta; specs fatiadas por feature; uma história por arquivo; backlog em índice de uma linha por história; `STATE.md` reescrito, nunca acrescentado.
- Regras por tema em `docs/rules/`, com tabela em `AGENTS.md` dizendo quando ler cada uma.
- Decisões em ADRs (um por arquivo), não em um log único crescente.
- Limites de tamanho por tipo de arquivo definidos em `AGENTS.md`.
- Commits atômicos: uma ideia coerente por commit (história ou tema), sem microcommits.
- Gate de qualidade = testes automatizados + revisão independente; máx. 2 voltas builder↔reviewer.
- Histórico vive no git (1 commit por história), não nos docs.

## Alternativas consideradas
- Um `DECISIONS.md`/`STATE.md` único e crescente: simples, mas custo de leitura cresce sem limite.
- Agentes por camada (front/back/design/devops): mais contexto e coordenação sem ganho neste porte.

## Consequências
- Cada agente lê poucos arquivos pequenos; custo por história fica estável ao longo do tempo.
- Exige disciplina: dividir arquivos antes de ultrapassar os limites.
