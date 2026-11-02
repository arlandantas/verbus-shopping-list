/** Essential-items suggestion shown to the creator of a new group (S-111). */
export const suggest = {
  title: 'Comece com o essencial',
  intro: 'Desmarque o que você não precisa. Os itens entram na lista de hoje.',
  loadError: 'Não foi possível carregar as sugestões.',
  empty: 'Começar vazia',
  add: (n: number) => (n === 1 ? 'Adicionar 1 item' : `Adicionar ${n} itens`),
  count: (marked: number, total: number) => `${marked}/${total}`,
  markAll: (category: string) => `Marcar todos de ${category}`,
} as const
