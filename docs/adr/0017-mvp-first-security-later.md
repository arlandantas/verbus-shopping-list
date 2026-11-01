# 0017 — MVP primeiro, endurecimento de segurança depois

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** usuário (decisão), gestor (registro)

## Contexto
O usuário quer fazer a primeira rodada de testes manuais das funcionalidades principais antes de investir em investigação de brechas. As regras de segurança já existem, com testes de permitir/negar por história.

## Decisão
- Pausar revisões de segurança adversariais e novas histórias de endurecimento até depois da primeira rodada de testes do usuário. Fica um épico `E-SEC` no backlog para essa fase.
- Não pausa: os testes de regras que acompanham cada funcionalidade (fazem parte de ela funcionar) nem a revisão normal de qualidade/funcionalidade.
- Prioridade: entregar o MVP testável (M5 + contas de teste locais). S-013 (Firebase real) e histórias do M6 só entram se o usuário pedir ou se bloquearem o teste.
- Achados de segurança conhecidos continuam registrados (ADR-0016) e entram no `E-SEC`.

## Alternativas consideradas
- Manter revisões de segurança por marco: mais seguro, porém atrasa o feedback sobre o produto.

## Consequências
- O MVP não deve ser exposto a usuários reais antes do `E-SEC`.
- Contas de teste e login rápido existem só com emulador (S-050) e nunca no build de produção.
