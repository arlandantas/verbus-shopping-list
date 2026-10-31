# 0007 — Convite carrega o nome da família

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** gestor

## Contexto
A tela "Entrar em Casa?" (S-012) precisa do nome da família para quem ainda não é membro, mas só membros leem `families/{id}` e o convite (ADR-0003) guarda apenas `familyId`, `createdBy` e `createdAt`. Ainda não há dados em produção.

## Decisão
Emenda a ADR-0003 (sem editá-la): `invites/{code}` ganha `familyName` (string, 1–60).
- Obrigatório na criação e igual a `families/{id}.name` via `getAfter` (mesmo batch da família ou da rotação).
- Convites continuam imutáveis; `get` para autenticados, `list` negado, apagar só por membros.
- `createFamily` grava `familyName` no convite; a tela de convite lê o nome do próprio convite.

## Alternativas consideradas
- Abrir leitura mínima de `families/{id}` a não membros: expõe membros e demais campos.
- Cloud Function de pré-visualização: exige servidor/plano Blaze (ADR-0003).
- Tela sem nome da família: pior confirmação para o usuário.

## Consequências
- Compromisso aceito: quem tem o código vê o nome da família.
- Renomear a família não atualiza convites existentes (renomear está fora do MVP; rotacionar recria o convite).
