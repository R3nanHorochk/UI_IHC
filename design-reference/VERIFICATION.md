# Verificação — 27/10/2026

- 51 telas carregadas em navegador Edge/Playwright a 1200 × 840, sem erros JavaScript.
- Capturas de todas as telas em `review/`; inspeção visual das telas inicial do representante, inicial do candidato, cadastro de vaga, currículo e adaptação mobile.
- Comparação independente com as coordenadas extraídas do `.fig`: 1.397 posições/larguras verificadas, nenhuma diferença acima da tolerância de 2 px. Não é uma comparação pixel a pixel de rasterização de fontes.
- Testes de navegador aprovados: publicação com validação, falha e nova tentativa; candidatura; edição e persistência de currículo; aprovação; mensagem entre áreas; dúvida e resposta; cancelamento; filtros; edição, encerramento e exclusão de vaga; recarregamento; viewport de 390 px sem rolagem horizontal na tela inicial.
- 7 testes da API simulada aprovados: validação/idempotência, conflito de versão, duplicidade/cancelamento, decisões/mensagens, permissões e histórico, falhas sem persistência, dúvida/resposta.
- Build de produção aprovado. O Vite informa um aviso de tamanho do bundle porque contém as 51 árvores de layout; tamanho comprimido aproximado de 119 kB para JavaScript.

O layout estático é auditado com `?reference=1`. Na aplicação funcional, dados editados, contagens, estados, formulários adicionais e mensagens alteram o conteúdo e podem aumentar a altura dos blocos. O rodapé de alternância entre contas e o seletor de demonstração são recursos adicionais, fora da área original da tela. Mobile é uma adaptação, pois o arquivo fornecido contém apenas as referências desktop.
