# 0004 — Estratégia offline e sincronização

**Status:** aceito · **Data:** 2026-10-31 · **Autor:** arquiteto

## Contexto
Specs 40 e 80: marcar itens sem sinal, sincronizar ao reconectar, UI otimista, tempo real. A inicialização do Firestore (M0/M1) precisa fixar o cache agora.

## Decisão
- Firestore com `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`. Sem sincronização própria: o SDK enfileira escritas offline e as reenvia.
- Escritas **não são aguardadas** pela UI (`void updateDoc(...)`); a tela reage ao `onSnapshot` local, que dispara imediatamente. Erros de escrita vão para um handler central que mostra aviso em pt-BR.
- Atualização por campo (`updateDoc` com só os campos alterados); a última escrita vence. Nada de transações em fluxos que precisem funcionar offline (transações falham offline).
- Leitura em tempo real via `onSnapshot(..., { includeMetadataChanges: true })`; `hasPendingWrites` alimenta indicador "pendente de sincronização" quando útil.
- Indicador offline: `navigator.onLine` + eventos `online`/`offline`, num hook `useOnlineStatus`.
- Desfazer = escrita inversa (status volta para `pending`), não cache local.
- Auth com persistência `indexedDBLocalPersistence` (padrão web), para abrir offline já logado.
- Service worker (vite-plugin-pwa, `generateSW`): precache do app shell; navegação cai para `index.html`; nenhuma chamada ao Firestore é cacheada pelo SW (o SDK cuida).
- Criar/entrar em família exige online (depende de `get()` em regras); a UI informa isso.

## Alternativas consideradas
- `memoryLocalCache`: perde marcações se o PWA for fechado offline.
- Fila própria em IndexedDB: duplica o que o SDK já faz.

## Consequências
- E2E de offline usa `context.setOffline(true)` do Playwright contra o emulador.
- iOS pode apagar o IndexedDB: nuvem continua a fonte da verdade (spec 00).
