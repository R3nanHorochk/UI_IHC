# tramporapido

Frontend React com as 51 telas do projeto Figma e uma API simulada em JavaScript. Nenhum servidor de backend é necessário.

## Executar

```sh
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite. A tela inicial é a área do representante. O rodapé permite alternar entre **Candidato** (Ana Souza) e **Representante** (Carlos Almeida). **Demonstração** permite abrir qualquer estado do protótipo ou restaurar os dados iniciais.

```sh
npm run build
npm test
```

## Fluxos

- Vagas: cadastro, preenchimento de exemplo, validação por campo, revisão, publicação, edição com controle de versão, encerramento e exclusão lógica.
- Candidato: busca por texto, distância e data, detalhes da vaga, candidatura com currículo, prevenção de duplicidade, acompanhamento e cancelamento.
- Currículo: múltiplas escolaridades e experiências, situação de conclusão/emprego atual, inclusão de habilidades com Enter, remoção e persistência.
- Representante: candidaturas paginadas, currículo enviado, aprovação/reprovação, mensagens, dúvidas e respostas, indicadores e preferências.
- Falhas de envio/publicação podem ser simuladas nos botões previstos no Figma. A nova tentativa preserva o preenchimento.

## Dados

`src/data/seed.json` contém os dados iniciais. `src/services/mock-api.js` simula latência, validações, permissões, idempotência e persistência no `localStorage`, na chave `tramporapido.db.v1`. As duas áreas usam a mesma base: publicar, aprovar, responder ou cancelar atualiza a outra visão. A seleção atual é mantida no `sessionStorage`.

Os dados são locais ao navegador. Não há autenticação real, envio externo de mensagens ou compartilhamento entre computadores. Mensagens são exibidas dentro da aplicação. Exclusão de vaga oculta a oportunidade e preserva o histórico; encerramento impede novas candidaturas.

## Design

A fonte do layout é `tramporapido.fig`, fornecida pelo grupo, combinada com as 14 leituras completas obtidas pelo plugin Figma. O arquivo local foi decodificado, incluindo componentes, propriedades, estilos de texto e destinos de navegação. A página de implementação não usa imagens estáticas: o logotipo é composto de texto e formas, como no original. As imagens existentes na página de referências não fazem parte das 51 telas.

- `src/design/screens.json`: árvore normalizada das 51 telas, preservando IDs, medidas, cores, textos e componentes.
- `src/App.jsx`: componentes React semânticos, composição do layout em flexbox e vinculação dos dados.
- `src/useAppModel.js`: navegação e operações dos fluxos.
- `src/styles.css`: controles, tipografia Inter local, estados e adaptação responsiva.
- `design-reference/`: respostas do plugin, inventário e evidências de revisão.

As medidas originais são de desktop, com largura de 1200 px. A versão mobile adapta o mesmo conteúdo; não há uma referência mobile separada no arquivo. Contagens, mensagens e estados passam a refletir os dados reais da simulação.

Para extrair novamente o `.fig` após uma atualização:

```sh
node scripts/extract-fig.mjs
node scripts/prepare-design.mjs
```

## Verificação visual e funcional

`scripts/check-browser.mjs` usa Playwright com Edge, captura as 51 telas e testa os percursos entre as duas áreas. `scripts/compare-layout.mjs` compara posições e larguras com as medidas extraídas do `.fig`. Os scripts usam `http://127.0.0.1:5174/` por padrão; a variável `APP_URL` permite usar outra porta. O modo `?reference=1` serve apenas para auditoria do layout estático.

```sh
node scripts/check-browser.mjs
node scripts/compare-layout.mjs
```

Os relatórios ficam em `design-reference/review/`. O inventário completo está em `design-reference/screens.md`.
