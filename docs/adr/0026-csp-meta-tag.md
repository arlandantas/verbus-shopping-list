# 0026 — CSP por meta tag no GitHub Pages

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** construtor (S-084)

## Contexto
GitHub Pages não permite cabeçalhos. O build injeta `<meta http-equiv="Content-Security-Policy">` e `<meta name="referrer" content="strict-origin-when-cross-origin">` (`vite/csp.ts`, só em `vite build`; `pnpm dev` fica sem CSP por causa do HMR).

## Decisão
`default-src 'self'`; `script-src 'self' https://apis.google.com`; `style-src 'self' 'unsafe-inline'`; `connect-src 'self'` + `firestore|identitytoolkit|securetoken.googleapis.com` + `https://<authDomain>`; `frame-src https://<authDomain>` (`'none'` sem authDomain); `img-src 'self' data:`; `worker-src 'self'`; `manifest-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`. Build de emulador soma `http://127.0.0.1:*` e `http://localhost:*` em `connect-src`. Sem `unsafe-eval` nem `unsafe-inline` em scripts.

## Verificado x assumido
- Verificado (E2E, emulador): e-mail/senha, Firestore, SW, nenhum `securitypolicyviolation`.
- Assumido (Firebase real indisponível; S-013 pendente): `apis.google.com` em `script-src` (o SDK carrega o gapi para `signInWithPopup`); `https://<authDomain>` em `frame-src`/`connect-src` (iframe/handler `/__/auth`); a janela popup não sofre `frame-src`. Sem Analytics/Installations/Messaging, então `firebaseinstallations` não é liberado. Revalidar no S-013; se algo violar, o console mostra a diretiva.

## Riscos aceitos
- `frame-ancestors` não funciona em meta: clickjacking não é mitigado no Pages.
- `style-src 'unsafe-inline'` (estilos inline de React/Tailwind).
