# 90 — Leitura da NFC-e por QR Code (V0.1 / V1)

A NFC-e traz um QR Code com URL do portal da SEFAZ do estado emissor. A consulta é pública (sem token/certificado/contrato), mas não há API oficial: os dados saem de uma página HTML.

## Como funciona
1. O app lê o QR Code pela câmera e extrai a URL (chave de acesso de 44 dígitos e parâmetros).
2. Um servidor busca a página da SEFAZ e extrai: estabelecimento, CNPJ, data, itens, quantidades, valores unitários, total.
3. A IA vincula cada item da nota a um item da lista da família; o usuário revisa.
4. O app grava a compra com preços, mercado e data e preenche o histórico.

## Pontos de atenção
- **Back-end mínimo:** a busca passa por função de servidor (ex.: Cloud Function), por causa de CORS. Só para este recurso.
- **Um adaptador por estado:** começar pelo Rio Grande do Norte e expandir depois.
- **Fragilidade:** mudança no site quebra o parser → testes com notas reais e plano B (digitação manual).
- **Disponibilidade:** a nota pode demorar a aparecer; o app tenta de novo depois em vez de falhar.
- **Segurança:** validar que a URL pertence a domínios SEFAZ conhecidos antes de buscar.
- **Alternativas pagas:** serviços por chave de acesso existem, mas geram custo e dependência; parser próprio basta para o MVP.
- **Privacidade:** não armazenar CPF, se informado no caixa.

## Vínculo por IA
Nomes na nota são abreviados (ex.: FEIJ CARIOCA 1KG TIO J). A IA recebe os itens da família e os da nota e devolve vínculos com grau de confiança. Baixa confiança vai para revisão manual; vínculos confirmados são guardados para não perguntar de novo.
