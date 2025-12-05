# SlidePacker

O SlidePacker é uma aplicação React projetada para gerar relatórios escolares em formato PowerPoint (PPTX) a partir de arquivos CSV e imagens. O sistema organiza os dados por turmas e gera uma apresentação única contendo slides para todas as turmas sequencialmente.

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="./public/logo.png"/>
</div>

## Funcionalidades

-   **Suporte a Múltiplas Turmas**: Importe dados de várias turmas e gere um relatório consolidado.
-   **Processamento de Dados CSV**: Detecta e analisa automaticamente vários formatos CSV (Fluência, Matriz, Histórico, Evolução).
-   **Geração Dinâmica de Slides**: Cria slides específicos com base nos dados fornecidos:
    -   Gráficos e Tabelas de Fluência
    -   Distribuição de Níveis
    -   Matriz de Desempenho
    -   Gráficos de Evolução (Barra e Linha)
    -   Tabelas de Histórico com Codificação de Cores
-   **Personalização Visual**: Utiliza uma paleta de cores e layout predefinidos para atender a requisitos de design específicos.

## Tecnologias Utilizadas

-   **React 19**: Framework de UI.
-   **Vite**: Ferramenta de build e servidor de desenvolvimento.
-   **Tailwind CSS v4**: Framework CSS utility-first para estilização.
-   **PptxGenJS**: Biblioteca para gerar apresentações em PowerPoint.
-   **Lucide React**: Biblioteca de ícones.

## Começando

### Pré-requisitos

-   Node.js (v18 ou superior recomendado)
-   npm ou pnpm

### Instalação

1.  Clone o repositório.

2.  Instale as dependências:
    ```bash
    npm install
    # ou
    pnpm install
    ```

### Executando Localmente

Inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000` (ou na próxima porta disponível).

### Build para Produção

Compile a aplicação para produção:

```bash
npm run build
# ou
pnpm build
```

## Como Usar

1.  **Selecionar Arquivos**: Arraste e solte arquivos CSV e imagens na zona de upload.
2.  **Atribuir Turma**: Um diálogo aparecerá pedindo para atribuir os arquivos a uma turma específica (ex: "1º Ano A"). Você pode criar uma nova turma ou selecionar uma existente.
3.  **Gerenciar Turmas**: Visualize os dados organizados por turma. Você pode expandir/colapsar turmas ou remover arquivos se necessário.
4.  **Gerar PPTX**: Clique no botão "Baixar Apresentação" para gerar o arquivo PowerPoint contendo relatórios para todas as turmas.

## Estrutura do Projeto

-   `src/`: Diretório do código-fonte.
    -   `components/`: Componentes React (DropZone, ClassDialog, etc.).
    -   `services/`: Lógica de negócios para geração de PPTX (`pptxService.ts`) e análise de CSV (`csvUtils.ts`).
    -   `App.tsx`: Componente principal da aplicação gerenciando o estado.
    -   `types.ts`: Definições TypeScript.
-   `public/`: Ativos estáticos (ícones, logo).

## Notas de Manutenção

*   Ao adicionar novos tipos de CSV, adicione a lógica de detecção em `processCsvFile` antes do retorno final.
*   As cores do PPTX estão centralizadas no objeto `PALETTE` em `pptxService.ts`.
*   A ordem dos slides é controlada dentro do loop principal de `generatePresentation`.

Para documentação detalhada sobre a lógica do código, consulte [CODE_DOCUMENTATION.md](CODE_DOCUMENTATION.md).
