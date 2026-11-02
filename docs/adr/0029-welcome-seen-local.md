# 0029 — Onde guardar "já viu as boas-vindas" (S-110)

**Status:** aceito · **Data:** 2026-11-02 · **Autor:** builder

## Contexto
As boas-vindas (3 passos) aparecem uma vez por usuário e grupo, depois de criar ou entrar. Precisamos lembrar que já foram vistas.

## Decisão
- **Local por aparelho:** `localStorage` na chave `welcomeSeen:{uid}:{groupId}`, em `try/catch` (modo privado ou cota cheia: falha em silêncio e a tela só pode reaparecer).
- **Marca ao exibir** (não ao terminar): recarregar no meio do tutorial não o repete.
- **Entrada:** só `/boas-vindas`, aberta após criar ou entrar (formulário, código ou convite). Quem já está em um grupo não é redirecionado; se a chave existe, a rota volta à Lista.
- **Passo 3** sempre aparece. Com `recurringEnabled === false` oferece "Ativar", que reutiliza `setRecurringEnabled` (ADR-0028); ligado, só explica.
- **Ao terminar ou pular:** navega para `WELCOME_NEXT` (hoje `/`); ponto único de extensão para a sugestão de itens (S-111).
- **Regras:** nenhuma mudança.

## Alternativas consideradas
- Campo no documento do usuário: exigiria mudar `firestore.rules` e dar migração, para pouco ganho.

## Consequências
- Quem entra pelo mesmo grupo em outro aparelho (ou limpa os dados) vê as boas-vindas de novo; aceito por ser leve e dispensável (Pular).
