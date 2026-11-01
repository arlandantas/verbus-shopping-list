# Estado atual

**Fase:** MVP (M0–M5) implementado e verificado; aguardando a 1ª rodada de testes manuais do usuário (ADR-0017).
**Verificação (2026-10-31):** `pnpm check` verde (258 unit, 289 regras, 52 dados) e `pnpm test:e2e` 78/78.

## Como testar
`pnpm dev:local` + roteiro em `docs/manual-test.md` (contas Ana, Beto, Carla no login; só com emulador).

## Próximo passo
Receber o feedback do usuário e corrigir/ajustar. Depois: épico `E-SEC` (segurança, ADR-0016/0017), M6 (aviso iOS, polimento PWA) e S-013 (Firebase real).

## Pendências do usuário (nada bloqueia o teste local)
- S-013: projeto Firebase (ID, região sugerida `southamerica-east1`), Google + e-mail/senha ativos, config web, `firebase login`.
- Remoto no GitHub para o CI (S-006) rodar de fato.
- Ícones finais do PWA (hoje provisórios) e nome de marca.
- Teste em iPhone real (instalação pelo Safari).

## Decisões vigentes
Stack ADR-0002; modelo ADR-0003 e 0007..0015; offline ADR-0004; riscos aceitos ADR-0016; segurança adiada ADR-0017.
Categorias padrão: 6 (mercearia, hortifruti, carnes, laticínios, limpeza, higiene pessoal), não editáveis.

## Dívidas conhecidas (baixa prioridade)
- Cabeçalho da lista quebra linha em telas estreitas (nome da família + 4 links).
- AC3 do histórico readiciona do mês atual (sem semente de ciclo passado nos testes).
- Famílias criadas antes do S-037 não têm categorias padrão (não há dados reais).

## Ambiente
Node 22, pnpm 11, JDK 21. Repo git local em `main`, sem remoto.
