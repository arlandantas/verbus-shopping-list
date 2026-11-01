# ADRs

Uma decisão por arquivo (`docs/templates/adr.md`). Nunca editar o conteúdo de uma decisão aceita: crie uma nova que a substitua.

| ID | Título | Status |
|---|---|---|
| [0001](0001-agent-workflow-and-docs-layout.md) | Fluxo de agentes e organização dos docs | aceito |
| [0002](0002-default-stack.md) | Stack padrão | aceito |
| [0003](0003-firestore-model-and-rules.md) | Modelo Firestore (usuários, famílias, convites) e regras | aceito |
| [0004](0004-offline-and-sync.md) | Estratégia offline e sincronização | aceito |
| [0005](0005-source-layout.md) | Organização de `src/` e `tests/` | aceito |
| [0006](0006-emulator-and-ci.md) | Emuladores, scripts de teste e CI | aceito |
| [0007](0007-invite-carries-family-name.md) | Convite carrega o nome da família (emenda a 0003) | aceito |
| [0008](0008-items-model-and-rules.md) | Modelo e regras de `items` (emenda spec 70 / 0003) | aceito |
| [0009](0009-catalog-autocomplete-and-cycles.md) | Catálogo para autocompletar, ciclos e categorias no M2 | aceito |
| [0010](0010-pantry-recurring-in-catalog.md) | Despensa: recorrência no catálogo (emenda a 0009) | aceito |
| [0011](0011-member-profiles-and-market-mode.md) | Perfis de membro ("quem marcou") e modo mercado | aceito |
| [0012](0012-checkout-purchases-and-lines.md) | Finalizar compra: `purchases` + `purchaseLines` (emenda spec 70 / 0009) | aceito |
| [0013](0013-cycles-and-recurring-return.md) | Ciclo mensal e volta dos recorrentes (fecha ponto da 0010) | aceito |
| [0014](0014-categories-defaults-and-grouping.md) | Categorias: padrões, CRUD e agrupamento (emenda spec 70 / 0009) | aceito |
| [0017](0017-mvp-first-security-later.md) | MVP primeiro, endurecimento de segurança depois | aceito; pausa suspensa pela 0023 |
| [0016](0016-accepted-risks-m5-rules.md) | Riscos aceitos nas regras do M5 | aceito |
| [0015](0015-price-only-when-bought.md) | Preço só em item comprado; mercado opcional (emenda a 0008) | aceito; preço/desmarcar substituídos por 0022 |
| [0018](0018-material3-design-system.md) | Design system: Material 3 básico, componentes próprios | aceito |
| [0019](0019-bottom-tabs-and-single-list.md) | Abas inferiores e lista única (Home + Modo mercado fundidos) | aceito |
| [0020](0020-edit-item-sheet-and-rename.md) | Sheet "Editar item", renomear e valor na compra (emenda 0009/0010/0015) | aceito |
| [0021](0021-edit-past-purchase-lines.md) | Editar linhas de compras passadas (emenda 0012) | aceito |
| [0022](0022-price-independent-of-cart.md) | Valor independente do carrinho (emenda 0015 e 0020) | aceito |
| [0023](0023-security-hardening-resumed.md) | Endurecimento de segurança retomado (emenda a 0017) | aceito |
