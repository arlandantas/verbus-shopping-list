# 70 — Modelo de dados sugerido (Firestore)

Sugestão inicial; o Arquiteto pode refinar via ADR.

- **users:** id, nome, e-mail, familyId.
- **families:** id, nome, membros (lista de ids), código de convite.
- **families/{id}/categories:** nome, padrão (bool), ordem.
- **families/{id}/items:** nome (obrigatório), quantidade (padrão 1), unidade, observação, categoriaId, recorrente (bool), status (pendente|comprado), preço (centavos), marcadoPor, marcadoEm, criadoPor, ciclo (ex.: 2026-11).
- **families/{id}/purchases:** data da compra, mercado (opcional), total (opcional), itens comprados com preço e categoria. Na V1 recebe também chave de acesso da nota e origem dos dados (manual | NFC-e).
- **families/{id}/cycles:** mês, data de fechamento, resumo dos itens comprados.
