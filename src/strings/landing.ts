/** Short presentation shared by the landing and the first-access create/join screen (S-109). */
export const intro = [
  'Uma lista de compras compartilhada pelo grupo.',
  'Todo mundo vê e edita junto, em tempo real.',
  'Funciona também sem internet.',
].join(' ')

export const landing = {
  brand: 'Nosso Carrinho',
  signIn: 'Entrar',
  heroTitle: 'A lista de compras que a casa toda enxerga',
  heroSubtitle: intro,
  createAccount: 'Criar minha conta grátis',
  haveInvite: 'Recebi um convite',
  inviteTitle: 'Tem um convite?',
  inviteHint: 'Cole o link ou digite o código de 8 caracteres que você recebeu.',
  inviteLabel: 'Link ou código do convite',
  inviteInvalid: 'Convite inválido. Confira o link ou o código.',
  inviteContinue: 'Continuar',
  heroNote: 'Sem cartão, sem anúncios. Funciona até sem internet.',
  mockTitle: 'Mercado do mês',
  mockItems: ['Arroz 5 kg', 'Leite integral', 'Café', 'Sabão em pó'],
  mockWho: 'Marcado por Ana',
  featuresTitle: 'Tudo o que a lista do grupo precisa',
  features: [
    {
      icon: 'group',
      title: 'Uma lista, vários celulares',
      text: 'Convide quem mora com você por link. Todo mundo vê e edita a mesma lista.',
    },
    {
      icon: 'shopping_cart',
      title: 'Modo mercado',
      text: 'Marque no carrinho com um toque, com uma mão, e veja quem pegou cada item.',
    },
    {
      icon: 'kitchen',
      title: 'Despensa do que não pode faltar',
      text: 'Guarde o que você sempre compra. Quando acabar, marque como falta, um a um ou todos de uma vez.',
    },
    {
      icon: 'checklist',
      title: 'Cole sua lista',
      text: 'Copie do WhatsApp ou das Notas e adicione vários itens de uma vez, já com quantidade e categoria.',
    },
    {
      icon: 'category',
      title: 'Vários grupos e categorias',
      text: 'Casa, viagem, churrasco: cada grupo tem a sua lista, as suas categorias e uma sugestão de itens para começar.',
    },
    {
      icon: 'history',
      title: 'Histórico e preços',
      text: 'Veja o que foi comprado, em qual mercado e quanto custou cada compra.',
    },
  ],
  stepsTitle: 'Como funciona',
  steps: [
    { title: 'Crie sua conta', text: 'Com e-mail e senha ou com o Google, em segundos.' },
    { title: 'Convide seu grupo', text: 'Crie um grupo e compartilhe o link do convite.' },
    { title: 'Compre sem esquecer nada', text: 'Todos acompanham a lista, mesmo offline.' },
  ],
  offlineTitle: 'Instale no celular, use como app',
  offlineText:
    'Funciona no navegador e pode ser adicionada à tela inicial. Os itens sincronizam sozinhos quando a conexão volta.',
  finalTitle: 'Pronto para organizar as compras de casa?',
  footer: 'Feito para quem divide o mercado.',
  developedBy: 'Desenvolvido por',
  developerName: 'Arlan Dantas',
  developerUrl: 'https://arlandantas.github.io',
}
