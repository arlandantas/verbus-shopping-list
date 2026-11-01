# 0018 — Design system: Material 3 básico, componentes próprios

**Status:** aceito · **Data:** 2026-11-01 · **Autor:** usuário (escolha) + arquiteto (forma)

## Contexto
1ª rodada de testes manuais: o fluxo funciona, mas o visual é textual e sem padrão. O usuário escolheu Material 3 (M3) básico. O app é PWA offline: nada pode depender de CDN e o bundle deve continuar pequeno.

## Decisão
- **Tokens M3 em CSS** (`src/styles/tokens.css`): papéis de cor (`--md-sys-color-primary`, `on-primary`, `primary-container`, `surface`, `surface-container-*`, `on-surface-variant`, `outline`, `error`...), escala tipográfica (display/headline/title/body/label), formas (`--md-sys-shape-corner-*`) e elevação. Esquema gerado uma vez no Material Theme Builder a partir de uma cor semente azul-índigo (`#1816a6`, provisória e aberta a discussão até a identidade visual) e colado como valores fixos.
- **Claro/escuro** por `@media (prefers-color-scheme: dark)` redefinindo as mesmas variáveis; `<meta name="theme-color">` com `media` para cada esquema. Sem alternador manual no MVP.
- **Tailwind v4 continua** (ADR-0002) como camada utilitária: as variáveis são expostas no `@theme` (`bg-surface`, `text-on-surface`, `rounded-m3-lg`...). Proibido usar cores fixas da paleta Tailwind (`gray-200`, `green-800`) em telas.
- **Componentes próprios** em `src/components/m3/` (um por arquivo, sem dados): `Button` (filled/tonal/text), `IconButton`, `TopAppBar`, `NavigationBar`, `ListItem`, `Checkbox`, `Switch`, `TextField`, `MoneyField`, `Select`, `BottomSheet`, `Dialog`, `Snackbar`, `SegmentedButton`, `Chip`. Estados (hover/pressed/focus) via camada de estado M3 (`::before` com opacidade).
- **Ícones:** Material Symbols Outlined (peso 400, 24 px) como **SVG inline**: `Icon` lê um registro curado `src/components/m3/icons.ts` (nome → `d` do path), copiado do pacote `@material-symbols/svg-400` (Apache-2.0, devDependency só para conferir/regenerar). Todo `IconButton` exige `aria-label` (pt-BR, em `strings`).
- **Fonte:** pilha do sistema (`Roboto, system-ui, sans-serif`); nenhuma webfont baixada.
- Alvos de toque ≥48 px e contraste AA continuam valendo (`docs/rules/frontend.md`).

## Alternativas consideradas
- MUI / `@material/web`: peso grande e estilo difícil de casar com Tailwind; `@material/web` está em modo manutenção.
- Fonte Material Symbols: arquivo variável de MB, precisa de subset e causa piscada sem cache.
- Outro sistema (iOS HIG, shadcn): usuário pediu M3; Android é o alvo principal.

## Consequências
- Telas migram aos poucos (épico E-UX); até lá convivem estilos antigos.
- Novo ícone = nova entrada no registro (teste unitário garante que todo nome usado existe).
- Identidade visual final troca só a semente e os valores de `tokens.css`.
