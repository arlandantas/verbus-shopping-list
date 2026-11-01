# 0023 — Endurecimento de segurança retomado (emenda a 0017)

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** usuário (decisão), arquiteto (registro)

## Contexto
A ADR-0017 adiou revisões adversariais e histórias de endurecimento até a 1ª rodada de testes manuais. O usuário concluiu as rodadas de UX (E-UX, E-UX2) e liberou o `E-SEC`. O app já tem deploy estático no GitHub Pages (base path via `VITE_BASE`).

## Decisão
- Fica suspensa a pausa da ADR-0017. O `E-SEC` entra no backlog como histórias S-075..S-079 (regras) e S-084..S-086 (web), junto com o M6 (S-080..S-083).
- Ordem: regras primeiro (o risco maior está nos dados), depois polimento PWA, depois endurecimento web (a CSP cobre o `index.html` final).
- Cada achado vira teste de regras que nega o abuso; a correção vai na mesma história. Achado sem correção barata é registrado como risco aceito em nova ADR (como a 0016), nunca em silêncio.
- Modelo de ameaça continua o da ADR-0016: outsiders (não membros, contas sem família, quem conhece um código de convite). Abuso interno de membro só é corrigido quando a correção custa pouco (sem `get()` extra por documento).
- Revisões adversariais voltam a valer para histórias que mexem em `firestore.rules`.
- Itens que exigem console do Firebase (App Check, domínios autorizados, proteção contra enumeração de e-mail, cota) ficam com S-013 (input do usuário).

## Alternativas consideradas
- Manter a pausa até o M6: deixa o deploy público sem revisão.
- Uma única história de "auditoria": grande demais para uma sessão e difícil de testar.

## Consequências
- Os pontos 1–2 da ADR-0017 deixam de valer; os pontos sobre S-050 (contas de teste só com emulador) continuam e ganham teste (S-086).
- Liberar o app para usuários reais exige S-075..S-079 e S-084..S-086 `done`, além de S-013.
