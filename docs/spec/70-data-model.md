# 70 — Modelo de dados sugerido (Firestore)

Sugestão inicial. Refinado pelas ADRs (campos em inglês, chaves exatas nas ADRs): 0003/0007 (`users`, `families`, `invites`), 0008 + 0015 + 0022 (`items`, sem `cycle`; preço em qualquer status, nulo na criação), 0009/0010 (`catalog`), 0011 (`members`), 0012 (`purchases` + `purchaseLines`), 0013 (`cycles` = marcador de abertura do mês), 0014 (`categories`), 0020 (renomear item: `nameKey` novo + catálogo), 0021 (linhas de compra editáveis: `quantity`, `unit`, `priceCents`; compra: `totalCents`), 0024 (vários grupos por usuário, categorias sem semente).

- **users:** id, nome, e-mail, groupIds (livro-razão append-only, máx. 10, só para as regras; `familyId` legado opcional e imutável). ADR-0024.
- **families** (na UI "Grupo"): id, nome, membros (lista de ids; fonte para listar os grupos do usuário via `array-contains`), código de convite.
- **families/{id}/categories:** nome, padrão (bool; só legado, novas sempre `false`), ordem.
- **families/{id}/items:** nome (obrigatório), quantidade (padrão 1), unidade, observação, categoriaId, recorrente (bool), status (pendente|comprado), preço (centavos), marcadoPor, marcadoEm, criadoPor, ciclo (ex.: 2026-11).
- **families/{id}/purchases:** data da compra, mercado (opcional), total (opcional), itens comprados com preço e categoria. Na V1 recebe também chave de acesso da nota e origem dos dados (manual | NFC-e).
- **families/{id}/cycles:** mês, data de fechamento, resumo dos itens comprados.
