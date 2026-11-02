/** Welcome steps shown after creating or joining a group (S-110). */
export const welcome = {
  skip: 'Pular',
  next: 'Próximo',
  back: 'Voltar',
  done: 'Começar',
  stepOf: (n: number, total: number) => `Passo ${n} de ${total}`,
  steps: [
    {
      title: 'Adicione os itens',
      text: 'Digite o que precisa no campo da lista. Você também pode colar uma lista inteira de uma vez, vinda do WhatsApp ou das Notas.',
    },
    {
      title: 'Risque no mercado',
      text: 'Na loja, toque no item para riscá-lo. Todo mundo do grupo vê na hora o que já foi pego.',
    },
    {
      title: 'Despensa',
      text: 'Guarde na Despensa o que você sempre compra, como arroz e café. Quando acabar, é só marcar como "Falta" e o item entra na lista.',
    },
  ],
  activate: 'Usar a Despensa',
  activated: 'Despensa ativada.',
  activateHint: 'Está desligado neste grupo. Você pode ativar agora.',
}
