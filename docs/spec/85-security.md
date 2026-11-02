# 85 — Segurança (E-SEC)

Decisão de retomar: ADR-0023. Riscos aceitos: ADR-0016. Modelo: ADR-0003, spec `70-data-model.md`.

## Modelo de ameaça
- Atacantes cobertos: não autenticado; autenticado sem família; membro de outra família; quem conhece (ou tenta adivinhar) um código de convite.
- Membro da própria família é confiável (ADR-0016); só corrigimos abuso interno quando a correção é barata.
- Ativos: dados da família (itens, catálogo, compras, linhas, categorias, perfis), `users/{uid}`, convites.

## Regras: o que precisa ser verdade (cada ponto = testes de negar)
1. **Isolamento:** nenhum caminho em `families/{id}/**` é lido ou escrito por quem não está em `members`, inclusive consultas `list` e `collectionGroup`, família inexistente e usuário sem perfil.
2. **Enumeração:** sem `list` em `invites`, `users` e `families` sem filtro por membro; ler convite exige saber o código; o convite expõe só `familyId`, `familyName`, `createdBy`, `createdAt`.
3. **Convites:** entrar exige convite válido da mesma família, perfil sem família, limite de 10 membros; código vazado pode ser trocado por um membro (rotação, S-077).
4. **Escalada de papel/campo:** ninguém altera `ownerId`, `name`, `inviteCode` (fora da rotação), `members` (fora de entrar), `createdBy`, `createdAt`, `isDefault`, nem o perfil de outro membro; `markedBy` só o próprio uid ou `null`; strings com tamanho máximo.
5. **Preços e compras:** centavos inteiros e limitados; `purchases` só muda `totalCents`; `purchaseLines` só `quantity`, `unit`, `priceCents`; nada é apagado; `cycles` só criado.

## Web (Firebase Hosting em produção, ADR-0031)
- CSP por meta (ADR-0026), embora o Hosting permita cabeçalhos próprios; CSP via `<meta http-equiv="Content-Security-Policy">` injetada no build, com `default-src 'self'`, sem `unsafe-eval`, sem scripts inline.
- Origens Firebase permitidas (produção): `connect-src` para `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com` e `https://<authDomain>`; `frame-src https://<authDomain>` (popup/redirect do Google); `script-src` inclui `https://apis.google.com` só se o login Google exigir. Emulador: `http://127.0.0.1:*`/`localhost` só em build de dev/emulador.
- `frame-ancestors` não funciona em meta: risco de clickjacking aceito (migrar para cabeçalho em `firebase.json` é possível, sem história aberta).
- `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- Config web do Firebase não é segredo, mas vem de variáveis `VITE_*` no build; `.env*.local` fica fora do git.
- Qualidade local (`pnpm ci:local`): varredura de segredos (gitleaks, se instalado) e `pnpm audit` (falha em `high`/`critical` de dependência de produção). Sem CI no GitHub (ADR-0031).
- Build de produção não contém contas de teste, senhas nem painel de login rápido (S-050, ADR-0017).

## Fora do código (console do Firebase; projeto já em produção)
App Check, domínios autorizados no Auth, proteção contra enumeração de e-mail, alertas de cota/faturamento.
