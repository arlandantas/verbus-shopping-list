# Roteiro de teste manual (1ª rodada)

Rode `pnpm dev:local` (JDK 21) e abra o endereço do Vite. Na tela de login, use o painel **Contas de teste**:
**Ana** e **Beto** (casal, "Casa Teste", com itens) e **Carla** (sem família). Dica: abra Ana e Beto em duas janelas (uma anônima) para ver o tempo real.

1. **Lista:** adicionar "3 kg feijão" e "leite"; tocar num item para ver o detalhe (quantidade, unidade, observação, categoria, recorrente). Itens agrupam por categoria.
2. **Autocompletar:** digitar "fei" e escolher a sugestão (traz unidade e categoria usadas antes).
3. **Despensa:** marcar o que falta, tornar item recorrente, remover dos recorrentes.
4. **Modo mercado:** "Ir ao mercado", tocar nos itens (riscam e mostram quem marcou); ver a mudança na outra janela; desmarcar; desligar a rede do navegador e marcar (sincroniza ao voltar).
5. **Preço:** no detalhe de um item comprado, informar o preço (ex.: 11,90).
6. **Finalizar compra:** informar mercado (opcional) e finalizar; itens comprados vão ao histórico, pendentes ficam.
7. **Histórico:** ver o mês, gasto por categoria, readicionar um item à lista.
8. **Categorias:** Família → Categorias; criar, renomear, excluir uma própria.
9. **Carla:** criar uma família nova, copiar o convite; entrar com o código/link de convite em outra conta.
10. **Virada do mês:** aviso "recorrentes voltaram para a lista" aparece na 1ª abertura do mês.

Anote o que estranhar (comportamento, textos, layout no celular). Reiniciar o `dev:local` apaga os dados e recarrega a semente.
