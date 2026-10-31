# 0003 — Modelo Firestore (usuários, famílias, convites) e abordagem das regras

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Spec 70 sugere o modelo em pt-BR; AGENTS.md exige identificadores em inglês. Entrar numa família por código precisa funcionar sem Cloud Functions (sem servidor no MVP) e sem permitir que não membros leiam famílias.

## Decisão
- **Campos em inglês, camelCase.** Mapa da spec 70: nome→`name`, membros→`members`, marcadoPor→`markedBy`, marcadoEm→`markedAt`, criadoPor→`createdBy`, ciclo→`cycle`, preço→`priceCents`. Timestamps via `serverTimestamp()`.
- `users/{uid}`: `displayName`, `email`, `familyId` (string | null), `createdAt`. Só o próprio uid lê/escreve.
- `families/{familyId}`: `name`, `members` (array de uids, máx. 10), `ownerId`, `inviteCode`, `joinCode?`, `createdAt`. Uma família por usuário no MVP.
- `invites/{code}` (coleção raiz): `familyId`, `createdBy`, `createdAt`. Código = 8 caracteres do alfabeto `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (sem 0/O/1/I/L). Qualquer usuário autenticado pode `get` (nunca `list`); só membros criam/apagam.
- **Entrar:** cliente lê `invites/{code}` → `familyId`; um `writeBatch` atualiza `families/{id}` (`members` = antigo + [uid], `joinCode` = code) e `users/{uid}.familyId`. A regra aceita se: `affectedKeys().hasOnly(['members','joinCode'])`, o uid não era membro, `members` cresce exatamente com `request.auth.uid`, e `get(/invites/$(joinCode)).data.familyId == familyId`.
- **Criar:** batch cria `families/{id}` com `members == [uid]`, `ownerId == uid`, o `invites/{code}` correspondente e `users/{uid}.familyId`. Regras de `users` só aceitam `familyId` cujo `getAfter(família).members` contenha o uid.
- **Subcoleções** `families/{id}/**`: helper `isMember(familyId)` = uid em `get(families/{id}).data.members`. Nega tudo o mais (`match /{document=**} { allow read, write: if false; }`).
- **Validação de forma** nas regras (`keys().hasOnly`, tipos, tamanhos de string) para cada coleção que for criada; cada história que adiciona coleção adiciona as regras + testes.
- **Login:** Google e e-mail/senha (Firebase Auth). Ambos rodam no emulador.

## Alternativas consideradas
- Cloud Function `joinFamily`: mais simples nas regras, mas exige servidor/plano Blaze.
- Código de convite só no doc da família + `list` com filtro: exporia consultas a não membros.
- Campos em pt-BR (espelhando a spec): conflita com a convenção de código em inglês.

## Consequências
- Rotacionar convite = apagar o `invites/{code}` antigo e criar outro (membro). Sair da família: fora do MVP.
- `get()` nas regras custa uma leitura por avaliação; aceitável no porte familiar.
- Testes de regras cobrem: criar, entrar com código certo/errado, não membro negado, entre famílias negado.
