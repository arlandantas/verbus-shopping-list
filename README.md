# verbus-shopping-list

PWA de lista de compras compartilhada para o núcleo familiar. Cadastro mínimo, modo mercado rápido, offline e tempo real.

- Visão e specs: [docs/spec/README.md](docs/spec/README.md)
- Roadmap: [docs/roadmap.md](docs/roadmap.md)
- Estado atual: [docs/STATE.md](docs/STATE.md)
- Desenvolvimento agêntico: veja [AGENTS.md](AGENTS.md)

## Teste manual local

Rode `pnpm dev:local` (precisa de JDK 21): sobe os emuladores Auth/Firestore, carrega contas e dados de exemplo e inicia o Vite.
Na tela de login, o painel "Contas de teste" entra com um toque: Ana e Beto (mesma família, com itens) e Carla (sem família).
Esse painel só existe com o emulador; as credenciais ficam em `scripts/seed/accounts.ts`. Ctrl+C encerra tudo; rodar de novo é seguro.
`pnpm dev` sobe só o Vite, sem emuladores: o login falha (o Vite avisa no terminal). Para testes manuais use sempre `pnpm dev:local`.
