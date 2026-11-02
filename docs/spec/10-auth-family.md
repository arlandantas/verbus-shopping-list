# 10 — Login, grupos e instalação

> Na UI o espaço compartilhado se chama **Grupo**; no código e no Firestore continua `families` (ADR-0024). Um usuário pode estar em até 10 grupos.

## Fluxo (primeiro acesso)
1. Usuário abre o app e faz login (Google ou e-mail).
2. Se for iOS e o app não estiver instalado, aparece o aviso de instalação pelo Safari.
3. Cria um grupo ou entra em um existente por código ou link de convite.
4. A lista do grupo passa a ser compartilhada entre todos os membros.

## Landing (S-095)
1. Visitante sem login em `/` vê a landing: proposta de valor, benefícios, passos e aviso de uso offline.
2. CTA principal "Criar minha conta grátis" leva a `/entrar`. CTA secundário "Recebi um convite" aceita link ou código e leva a `/convite/:code`; inválido mostra erro inline.
3. Só tokens de cor M3: a troca da paleta vale sem mexer na landing.

## Vários grupos (E-LISTS, ADR-0024)
1. O usuário pode criar outros grupos ou entrar em outros por convite a qualquer momento (seletor da Lista ou aba Grupo).
2. Grupo ativo: escolhido no topo da Lista, lembrado por aparelho. Sem escolha, o mais antigo.
3. Lista, Despensa, Histórico, Categorias e catálogo são de cada grupo.
4. Convite de grupo em que já está: só troca para ele. Limite: 10 grupos por usuário, 10 membros por grupo.
5. Contas antigas: a família existente vira o primeiro grupo, sem migração.
6. Fora do escopo: sair, excluir ou renomear grupo.

## Telas
- Login
- Criar ou entrar em grupo
- Aviso de instalação no iOS
- Aba Grupo (`/grupo`): nome do grupo ativo, convite (código, copiar e compartilhar com ícones), criar novo grupo, entrar em outro grupo, acesso a Categorias e sair (ícone `logout` na barra superior). Ver `05-ui-shell.md`.

## Notas
- Detecção de iOS com banner de instalação (ver `80-tech-requirements.md`).
- Dados: `users` e `families` em `70-data-model.md`.
