
import PptxGenJS from 'pptxgenjs';
import { PresentationConfig, EvolutionRow, LevelsSummaryRow, HistoryStudent, FluencyDetailRow, ClassData } from '../types';

// Colors extracted from screenshots
const PALETTE = {
  bgGreen: 'F0F5E5', 
  headerText: '2E4053', 
  
  // Matrix
  correct: 'D5E8D4', // Light Green
  correctText: '006100',
  wrong: 'F4CCCC', // Light Red/Pink
  wrongText: '9C0006',
  
  // Levels / Charts
  // From "Nível de Leitura - Distribuição" screenshot
  colorFluente: '154C38', // Very dark green
  colorNaoFluente: '1F6E53', // Dark teal
  colorFrases: '00C590', // Bright teal/green
  colorPalavras: '2E5C8F', // Blue (darkened for better contrast with white text)
  colorSilabas: '5A9BD5', // Light Blue (darkened for better contrast with white text)
  colorNaoLeitor: '707070', // Grey
  colorNaoAvaliado: 'FFC000', // Yellow/Orange
  colorNaoInformado: 'FF7C80', // Pink/Salmon
  
  // Evolution Chart
  evoPart: '4472C4', // Blue
  evoRes: 'ED7D31',  // Orange
  evoResGreen: '00B050', // Green used in some bars
  evoResRed: 'C00000',   // Red used in some bars
};



// --- Generators ---



const generateLevelsSlide = (pres: PptxGenJS, data: LevelsSummaryRow[], className: string) => {
  const slide = pres.addSlide();
  slide.addText("Nível de Leitura - Distribuição", { x: 0.5, y: 0.3, fontSize: 18, color: PALETTE.headerText, bold: true });

  // Reverse data for chart so that the first item (Diagnóstica) appears at the top
  const chartDataSrc = [...data].reverse();
  const labels = chartDataSrc.map(d => d.edicao);
  
  // Calculate Percentages for Chart (Decimal 0-1 for proper formatting)
  const calcPct = (val: number, total: number) => total > 0 ? (val / total) : 0;

  // Helper to create chart data series, hiding 0 values from labels if possible
  // Note: pptxgenjs doesn't have a direct "hide if 0" for data labels in the simple syntax,
  // but we can try to use `displayBlanksAs` or just rely on the fact that 0 bars are invisible.
  // However, the user says "0% appearing". 
  // A workaround is to not include 0 values in the data? No, that breaks the stack.
  // We can try to use a custom format code or just accept that 0% might show if the bar is tiny.
  // BUT, if the value is exactly 0, the bar shouldn't exist.
  // The issue might be small non-zero values or just the label being forced.
  // Let's try to ensure exact 0s are passed.
  
  const chartData = [
    { name: 'Fluente', labels, values: chartDataSrc.map(d => calcPct(d.fluente, d.total_alunos)) },
    { name: 'Não Fluente', labels, values: chartDataSrc.map(d => calcPct(d.nao_fluente, d.total_alunos)) },
    { name: 'Frases', labels, values: chartDataSrc.map(d => calcPct(d.frases, d.total_alunos)) },
    { name: 'Palavras', labels, values: chartDataSrc.map(d => calcPct(d.palavras, d.total_alunos)) },
    { name: 'Sílabas', labels, values: chartDataSrc.map(d => calcPct(d.silabas, d.total_alunos)) },
    { name: 'Não Leitor', labels, values: chartDataSrc.map(d => calcPct(d.nao_leitor, d.total_alunos)) },
    { name: 'Não Informado', labels, values: chartDataSrc.map(d => calcPct(d.nao_informado, d.total_alunos)) },
  ];

  // Note: dataLabelColorArray doesn't seem to work for stacked bar charts
  // Using dark gray as compromise - visible on light bars, acceptable on dark bars
  slide.addChart('bar', chartData, {
    x: 0.5, y: 0.6, w: 9, h: 2.5,
    barDir: 'bar',
    barGrouping: 'stacked',
    chartColors: [
        PALETTE.colorFluente, 
        PALETTE.colorNaoFluente, 
        PALETTE.colorFrases, 
        PALETTE.colorPalavras, 
        PALETTE.colorSilabas, 
        PALETTE.colorNaoLeitor, 
        PALETTE.colorNaoInformado
    ],
    dataLabelFormatCode: '0%;;', // This format code '0%;;' hides zero values! (Positive;Negative;Zero)
    dataLabelFontSize: 9,
    showValue: true,
    dataLabelColor: 'FFFFFF', // White text (blue bars darkened for better contrast)
    dataLabelPosition: 'ctr',
    showLegend: true,
    legendPos: 'b', // Legend at bottom
    legendFontSize: 9,
    valAxisMaxVal: 1.0,
    valAxisLabelFormatCode: '0%',
    catAxisLabelFontSize: 9, // Reduced font size for category axis (vertical)
    valAxisLabelFontSize: 9  // Reduced font size for value axis (horizontal)
  });

  // Table below with Counts and Percentages
  const headers = ['Edições', 'Total', 'Fluente', 'Não Fluente', 'Frases', 'Palavras', 'Sílabas', 'Não Leitor', 'Não Inf.'];
  
  const headerRow = headers.map(h => ({
    text: h,
    options: { fill: { color: 'F2F2F2' }, bold: true, color: '333333', border: { pt: 1, color: 'DDDDDD' }, fontSize: 7 }
  }));

  const rows = data.map(d => {
    const fmt = (val: number) => {
        const pct = d.total_alunos > 0 ? ((val / d.total_alunos) * 100).toFixed(1) : '0';
        return `${val}\n(${pct}%)`;
    };
    return [
        { text: d.edicao, options: { bold: true, align: 'left' as const } },
        { text: String(d.total_alunos || '-') },
        { text: fmt(d.fluente) },
        { text: fmt(d.nao_fluente) },
        { text: fmt(d.frases) },
        { text: fmt(d.palavras) },
        { text: fmt(d.silabas) },
        { text: fmt(d.nao_leitor) },
        { text: fmt(d.nao_informado) }
    ];
  });

  // Adjust Column Widths: 1st col wider (2.0), others narrower (0.875)
  // Total width = 9.0
  // 9.0 - 2.0 = 7.0
  // 7.0 / 8 columns = 0.875
  slide.addTable([headerRow, ...rows], {
    x: 0.5, y: 3.2, w: 9, // Moved up from 3.4
    colW: [2.0, 0.875, 0.875, 0.875, 0.875, 0.875, 0.875, 0.875, 0.875],
    fontSize: 7,
    align: 'center' as const,
    border: { pt: 1, color: 'DDDDDD' },
    rowH: 0.25 // Reduced from 0.3 to save space
  });
};

const generateFluencyChartSlide = (pres: PptxGenJS, data: FluencyDetailRow[], className: string) => {
  const slide = pres.addSlide();
  
  // Title: "1º ANO" (Hardcoded as requested)
  // Using a large, bold font, centered at the top.
  // The image shows a red arrow/banner on the left, but I'll focus on the text first.
  // If the user wants the exact banner, I might need to add a shape.
  // For now, just the text "1º ANO" as requested.
  slide.addText(className, { 
    x: 0.5, y: 0.3, w: '90%', fontSize: 44, color: '000000', bold: true, align: 'center', fontFace: 'Arial'
  });

  // Count students in each fluency category
  const counts = {
    fluente: 0,
    nao_fluente: 0,
    frases: 0,
    palavras: 0,
    silabas: 0,
    nao_leitor: 0,
    nao_avaliado: 0,
    nao_informado: 0
  };

  data.forEach(row => {
    const nivel = row.nivel.toLowerCase().replace(/\s+/g, '_');
    if (nivel.includes('fluente') && !nivel.includes('nao')) counts.fluente++;
    else if (nivel.includes('nao') && nivel.includes('fluente')) counts.nao_fluente++;
    else if (nivel.includes('frases')) counts.frases++;
    else if (nivel.includes('palavras')) counts.palavras++;
    else if (nivel.includes('silabas')) counts.silabas++;
    else if (nivel.includes('nao') && nivel.includes('leitor')) counts.nao_leitor++;
    else if (nivel.includes('nao') && nivel.includes('avaliado')) counts.nao_avaliado++;
    else if (nivel.includes('nao') && nivel.includes('informado')) counts.nao_informado++;
  });

  const labels = ['Fluente', 'Não Fluente', 'Frases', 'Palavras', 'Sílabas', 'Não Leitor', 'Não Avaliado', 'Não informado'];
  const values = [
    counts.fluente,
    counts.nao_fluente,
    counts.frases,
    counts.palavras,
    counts.silabas,
    counts.nao_leitor,
    counts.nao_avaliado,
    counts.nao_informado
  ];

  // Bar chart with counts
  // Positioned "logo abaixo" (right below)
  slide.addChart('bar', [
    { name: 'Qtd Estudantes', labels, values }
  ], {
    x: 0.5, y: 1.5, w: 9, h: 3.5,
    barDir: 'col',
    barGrouping: 'standard',
    chartColors: [
      PALETTE.colorFluente,
      PALETTE.colorNaoFluente,
      PALETTE.colorFrases,
      PALETTE.colorPalavras,
      PALETTE.colorSilabas,
      PALETTE.colorNaoLeitor,
      PALETTE.colorNaoAvaliado,
      PALETTE.colorNaoInformado
    ],
    showValue: true,
    showLegend: false,
    valAxisMinVal: 0,
    catAxisLabelFontSize: 10,
    // Attempt to match the clean look
    valAxisLineShow: false,
    catAxisLineShow: true
  });
};

const generateFluencyTableSlide = async (pres: PptxGenJS, data: FluencyDetailRow[], className: string) => {
  const MAX_ROWS = 15; // Reduced from 22 to prevent overflow
  const chunks = [];
  // Sort by name if not already
  const sortedData = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
  
  for (let i = 0; i < sortedData.length; i += MAX_ROWS) {
    chunks.push(sortedData.slice(i, i + MAX_ROWS));
  }

  for (const chunk of chunks) {
    const slide = pres.addSlide();
    
    // Use the same title style or similar? The image shows a table without a big title, 
    // but usually slides have titles. The user said "o segundo uma tabela igual à da imagem".
    // The image has a red arrow on the left.
    // I will add a minimal title or just the table if it takes up space.
    // The image shows "Alunos (22) ^" as the header of the table.
    
    // Let's add a small title to indicate context if needed, or just the table.
    // Given "design deve ser exatamente igual", I'll try to mimic the table look.
    
    const headerRow = [
      { text: `Alunos (${data.length}) ↑`, options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'left' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Fluente', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Não Fluente', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Frases', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Palavras', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Sílabas', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Não Leitor', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Não Avaliado', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } },
      { text: 'Não Informado', options: { bold: true, fill: { color: 'F2F2F2' }, color: '333333', fontSize: 9, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } } }
    ];

    const bodyRows = chunk.map(student => {
      const nivel = student.nivel.toLowerCase().replace(/\s+/g, '_');
      
      // Determine which column gets the checkmark
      const isFluente = nivel.includes('fluente') && !nivel.includes('nao');
      const isNaoFluente = nivel.includes('nao') && nivel.includes('fluente');
      const isFrases = nivel.includes('frases');
      const isPalavras = nivel.includes('palavras');
      const isSilabas = nivel.includes('silabas');
      const isNaoLeitor = nivel.includes('nao') && nivel.includes('leitor');
      const isNaoAvaliado = nivel.includes('nao') && nivel.includes('avaliado');
      const isNaoInformado = nivel.includes('nao') && nivel.includes('informado');

      // Styles with vertical alignment
      const styleGreen = { fill: { color: PALETTE.correct }, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } };
      const styleRed = { fill: { color: PALETTE.wrong }, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } };
      const styleEmpty = { fill: { color: 'FFFFFF' }, align: 'center' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } };
      const styleName = { fill: { color: 'F9F9F9' }, fontSize: 9, align: 'left' as const, valign: 'middle' as const, border: { pt: 1, color: 'DDDDDD' } };

      return [
        { text: student.nome.toUpperCase(), options: styleName },
        { text: '', options: isFluente ? styleGreen : styleEmpty },
        { text: '', options: isNaoFluente ? styleGreen : styleEmpty },
        { text: '', options: isFrases ? styleGreen : styleEmpty },
        { text: '', options: isPalavras ? styleGreen : styleEmpty },
        { text: '', options: isSilabas ? styleGreen : styleEmpty },
        { text: '', options: isNaoLeitor ? styleRed : styleEmpty },
        { text: '', options: isNaoAvaliado ? styleRed : styleEmpty },
        { text: '', options: isNaoInformado ? styleRed : styleEmpty }
      ];
    });

    // Add table first
    slide.addTable([headerRow, ...bodyRows], {
      x: 0.5, y: 0.5, w: 9.0,
      colW: [2.5, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
      border: { pt: 1, color: 'DDDDDD' },
      rowH: 0.28
    });

    // Overlay SVG icons on cells
    // Table starts at y=0.5, first row (header) is 0.28 tall, so data starts at y=0.78
    const tableX = 0.5;
    const tableY = 0.5 + 0.28; // After header
    const rowH = 0.28;
    const colWidths = [2.5, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8];
    
    // Load SVG files using fetch
    const checkedResponse = await fetch('/icons/checked.svg');
    const checkedSvgData = await checkedResponse.text();
    const errorResponse = await fetch('/icons/error.svg');
    const errorSvgData = await errorResponse.text();
    
    // Convert SVG to data URL
    const checkedDataUrl = `data:image/svg+xml;base64,${btoa(checkedSvgData)}`;
    const errorDataUrl = `data:image/svg+xml;base64,${btoa(errorSvgData)}`;

    chunk.forEach((student, rowIdx) => {
      const nivel = student.nivel.toLowerCase().replace(/\s+/g, '_');
      // Try positioning at the top of each row and adjust downward
      const cellY = tableY + (rowIdx * rowH) + 0.18; // Position icons lower in cells
      
      const icons = [
        nivel.includes('fluente') && !nivel.includes('nao') ? 'check' : null,  // Fluente
        nivel.includes('nao') && nivel.includes('fluente') ? 'check' : null,    // Não Fluente
        nivel.includes('frases') ? 'check' : null,                               // Frases
        nivel.includes('palavras') ? 'check' : null,                             // Palavras
        nivel.includes('silabas') ? 'check' : null,                              // Sílabas
        nivel.includes('nao') && nivel.includes('leitor') ? 'error' : null,      // Não Leitor
        nivel.includes('nao') && nivel.includes('avaliado') ? 'error' : null,    // Não Avaliado
        nivel.includes('nao') && nivel.includes('informado') ? 'error' : null    // Não Informado
      ];

      icons.forEach((icon, colIdx) => {
        if (icon) {
          const cellX = tableX + colWidths.slice(0, colIdx + 1).reduce((a, b) => a + b, 0) + (colWidths[colIdx + 1] / 2) - 0.075;
          slide.addImage({
            data: icon === 'check' ? checkedDataUrl : errorDataUrl,
            x: cellX,
            y: cellY,
            w: 0.15,
            h: 0.15
          });
        }
      });
    });
  }
};


const generateHistorySlide = (pres: PptxGenJS, data: HistoryStudent[]) => {
  if (!data || data.length === 0) return;

  // Helper function to map fluency level to color
  const getLevelColor = (level: string): string => {
    // Normalize: lowercase, trim, and replace multiple spaces with single space
    const l = level.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Check if it's a percentage value
    if (l.includes('%')) {
      const percentMatch = l.match(/(\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1]);
        
        // Color scale based on percentage
        if (percent === 0) return 'E91E63'; // Pink for 0%
        if (percent >= 1 && percent < 30) return 'FF4081'; // Light pink for very low
        if (percent >= 30 && percent < 50) return 'FF9800'; // Orange for low
        if (percent >= 50 && percent < 70) return '26A69A'; // Medium teal for medium
        if (percent >= 70) return '00897B'; // Dark teal for high
      }
    }
    
    // Text-based fluency levels
    if (l === 'fluente') return '00695C'; // Dark teal
    if (l === 'não fluente' || l === 'nao fluente') return '509C83'; // Teal green
    if (l === 'frases') return '4DB6AC'; // Light teal/cyan
    if (l === 'palavras') return 'F57C00'; // Light orange/tan
    if (l === 'sílabas' || l === 'silabas') return 'FF9800'; // Orange
    if (l === 'não leitor' || l === 'nao leitor') return 'D32F2F'; // Red
    if (l === 'não avaliado' || l === 'nao avaliado') return '9E9E9E'; // Gray
    if (l === 'não informado' || l === 'nao informado') return 'BDBDBD'; // Light gray
    
    // For unknown values, return white
    return 'FFFFFF';
  };

  // 1. Extract all unique column keys and organize by subject
  const allKeys = Object.keys(data[0].results);
  
  // Group columns by subject: [Leitura], [Matemática], [Língua Portuguesa]
  const subjectGroups = new Map<string, string[]>();
  
  allKeys.forEach(key => {
    const match = key.match(/\[(.*?)\]/);
    if (match) {
      const subject = match[1].trim();
      if (!subjectGroups.has(subject)) {
        subjectGroups.set(subject, []);
      }
      subjectGroups.get(subject)!.push(key);
    }
  });

  // 2. Process all subjects (Leitura, Língua Portuguesa, Matemática)
  subjectGroups.forEach((columns, subject) => {
    // Sort columns by edition order (chronologically)
    // Extract edition names for sorting
    const columnData = columns.map(col => {
      const editionMatch = col.match(/\[(.*?)\]\s*(.*)/);
      const edition = editionMatch ? editionMatch[2].trim() : col;
      return { col, edition };
    });

    // Sort by edition name
    columnData.sort((a, b) => a.edition.localeCompare(b.edition));
    const sortedColumns = columnData.map(cd => cd.col);

    // Sort students alphabetically
    const sortedStudents = [...data].sort((a, b) => a.nome.localeCompare(b.nome));

    // 3. Build table rows
    const MAX_ROWS_PER_SLIDE = 15;
    const chunks: typeof sortedStudents[] = [];
    
    for (let i = 0; i < sortedStudents.length; i += MAX_ROWS_PER_SLIDE) {
      chunks.push(sortedStudents.slice(i, i + MAX_ROWS_PER_SLIDE));
    }

    // 4. Create slides
    chunks.forEach((chunk, chunkIndex) => {
      const slide = pres.addSlide();

      // Add title
      const titleText = chunkIndex === 0 ? `Histórico de Desempenho - ${subject}` : `Histórico de Desempenho - ${subject} (Cont.)`;
      slide.addText(titleText, {
        x: 0.5, y: 0.3, w: 9, fontSize: 16, bold: true, color: PALETTE.headerText
      });

      // Build header row with edition names (shortened)
      const headerCells = [
        { text: 'Alunos', options: { bold: true, fill: { color: 'FFFFFF' }, fontSize: 8, align: 'left' as const } }
      ];

      sortedColumns.forEach(col => {
        // Extract just the edition part (after the subject)
        const editionMatch = col.match(/\[(.*?)\]\s*(.*)/);
        const edition = editionMatch ? editionMatch[2].trim() : col;
        headerCells.push({
          text: edition,
          options: { bold: true, fill: { color: 'FFFFFF' }, fontSize: 7, align: 'left' as const }
        });
      });

      // Build data rows
      const bodyRows = chunk.map(student => {
        const row = [
          { text: student.nome, options: { fontSize: 8, align: 'left' as const, fill: { color: 'FFFFFF' } } }
        ];

        sortedColumns.forEach(col => {
          const value = student.results[col] || '';
          const color = getLevelColor(value);
          
          row.push({
            text: value,
            options: {
              fontSize: 8,
              fill: { color },
              align: 'left' as const
            }
          });
        });

        return row;
      });

      // Calculate column widths dynamically
      const nameColWidth = 2.0;
      const remainingWidth = 9.0 - nameColWidth;
      const dataColWidth = remainingWidth / sortedColumns.length;
      const colWidths = [nameColWidth, ...Array(sortedColumns.length).fill(dataColWidth)];

      // Add table
      slide.addTable([headerCells, ...bodyRows], {
        x: 0.5,
        y: 0.7,
        w: 9.0,
        colW: colWidths,
        border: { pt: 1, color: 'CCCCCC' }, // Gray borders
        rowH: 0.25,
        fontSize: 8,
        align: 'center',
        valign: 'middle'
      });

      // Add legend below table (bottom right)
      const legendY = 5.2; // Moved down
      const legendStartX = 3.5 // Moved left to prevent overflow
      const squareSize = 0.12;
      const spacing = 1; // Reduced spacing between items

      // Legend items
      const legendItems = [
        { color: '00897B', label: 'Maior\nDesempenho' },
        { color: '26A69A', label: 'Desempenho\nMediano' },
        { color: 'FF9800', label: 'Abaixo da\nMédia' },
        { color: 'E91E63', label: 'Menor\nDesempenho' },
        { color: '9E9E9E', label: 'Não\nAvaliado' },
        { color: 'BDBDBD', label: 'Não\nInformado' }
      ];

      legendItems.forEach((item, index) => {
        const xPos = legendStartX + (index * spacing);
        
        // Colored square
        slide.addShape('rect', {
          x: xPos,
          y: legendY,
          w: squareSize,
          h: squareSize,
          fill: { color: item.color }
        });

        // Label text - aligned with square (same Y position)
        slide.addText(item.label, {
          x: xPos + squareSize + 0.02, // Start just after the square
          y: legendY - 0.01, // Align vertically with square
          w: spacing - squareSize - 0.05,
          fontSize: 5.5,
          color: '666666',
          align: 'left',
          valign: 'top'
        });
      });
    });
  });
};

const generateEvolutionLineSlides = (pres: PptxGenJS, data: EvolutionRow[], className: string) => {
  if (!data || data.length === 0) return;

  const editions = Array.from(new Set(data.map(d => d.edicao)));
  
  // Prepare Series Data
  const series = {
    partMat: [] as number[], resMat: [] as number[],
    partPort: [] as number[], resPort: [] as number[],
    partLeit: [] as number[], resLeit: [] as number[]
  };

  editions.forEach(ed => {
    const rows = data.filter(d => d.edicao === ed);
    
    const getVal = (mat: string, type: 'part' | 'res') => {
      const row = rows.find(r => r.materia.toLowerCase().includes(mat.toLowerCase()));
      const val = row ? (type === 'part' ? row.participacao : row.acertos) : 0;
      
      // Debug logging
      if (ed === editions[0] && mat.toLowerCase().includes('leitura')) {
        console.log(`LINE CHART - ${ed} - ${mat} - ${type}:`, {
          row: row,
          requestedType: type,
          participacaoValue: row?.participacao,
          acertosValue: row?.acertos,
          returnedValue: val
        });
      }
      
      return val === 0 ? null : val;
    };

    series.partMat.push(getVal('Matemática', 'part') as number);
    series.resMat.push(getVal('Matemática', 'res') as number);
    series.partPort.push(getVal('Língua Portuguesa', 'part') as number);
    series.resPort.push(getVal('Língua Portuguesa', 'res') as number);
    series.partLeit.push(getVal('Leitura', 'part') as number);
    series.resLeit.push(getVal('Leitura', 'res') as number);
  });

  // Define the build-up sequence
  // Each slide shows ONLY one subject (2 lines: Participação + Resultado)
  const steps = [
    { 
      title: 'Evolução - Leitura',
      series: [
        { name: 'Participação Leitura', labels: editions, values: series.partLeit, color: 'FF0000' },  // Bright Red
        { name: 'Resultado Leitura', labels: editions, values: series.resLeit, color: '800000' }       // Dark Red
      ]
    },
    { 
      title: 'Evolução - Língua Portuguesa',
      series: [
        { name: 'Participação Língua Portuguesa', labels: editions, values: series.partPort, color: '70AD47' }, // Bright Green
        { name: 'Resultado Língua Portuguesa', labels: editions, values: series.resPort, color: '2E5C1F' }      // Dark Green
      ]
    },
    { 
      title: 'Evolução - Matemática',
      series: [
        { name: 'Participação Matemática', labels: editions, values: series.partMat, color: '4472C4' },    // Bright Blue
        { name: 'Resultado Matemática', labels: editions, values: series.resMat, color: '1F4E78' }         // Dark Blue
      ]
    }
  ];

  steps.forEach(step => {
    const slide = pres.addSlide();
    slide.addText(step.title, { 
      x: 0.5, y: 0.3, w: 9, fontSize: 18, color: PALETTE.headerText, bold: true, align: 'left' 
    });

    const chartData = step.series.map(s => ({
      name: s.name,
      labels: s.labels,
      values: s.values
    }));
    
    const chartColors = step.series.map(s => s.color);

    slide.addChart(pres.ChartType.line, chartData, {
      x: 0.5, y: 1.0, w: 9.0, h: 4.0,
      chartColors: chartColors,
      showLegend: true,
      legendPos: 'b',
      legendFontSize: 9,
      showValue: false, // Disable auto labels to avoid overlap - users can hover in PowerPoint
      lineDataSymbol: 'circle',
      lineDataSymbolSize: 8,
      lineSize: 2,
      valAxisMaxVal: 100,
      valAxisMinVal: 0,
      displayBlanksAs: 'span',
      catAxisLabelFontSize: 10,
      catAxisLabelColor: '404040',
      valAxisLabelFontSize: 10,
      valAxisLabelColor: '404040'
    });
  });
};

const generateEvolutionSlide = (pres: PptxGenJS, data: EvolutionRow[], className: string) => {
  if (!data || data.length === 0) return;

  const slide = pres.addSlide();
  
  // Title
  slide.addText("Visão Geral Linha Evolutiva", { 
    x: 0.5, y: 0.3, w: 9, fontSize: 18, color: PALETTE.headerText, bold: true, align: 'left' 
  });

  // 1. Process Data
  // Group by Edition
  const editions = Array.from(new Set(data.map(d => d.edicao)));
  
  // Prepare Series Data
  const series = {
    partMat: [] as number[], resMat: [] as number[],
    partPort: [] as number[], resPort: [] as number[],
    partLeit: [] as number[], resLeit: [] as number[]
  };

  editions.forEach(ed => {
    const rows = data.filter(d => d.edicao === ed);
    
    const getVal = (mat: string, type: 'part' | 'res') => {
      const row = rows.find(r => r.materia.toLowerCase().includes(mat.toLowerCase()));
      return row ? (type === 'part' ? row.participacao : row.acertos) : 0;
    };

    series.partMat.push(getVal('Matemática', 'part'));
    series.resMat.push(getVal('Matemática', 'res'));
    series.partPort.push(getVal('Língua Portuguesa', 'part'));
    series.resPort.push(getVal('Língua Portuguesa', 'res'));
    series.partLeit.push(getVal('Leitura', 'part'));
    series.resLeit.push(getVal('Leitura', 'res'));
  });

  // 2. Chart
  const chartData = [
    { name: 'Participação Matemática', labels: editions, values: series.partMat },
    { name: 'Resultado Matemática', labels: editions, values: series.resMat },
    { name: 'Participação Língua Portuguesa', labels: editions, values: series.partPort },
    { name: 'Resultado Língua Portuguesa', labels: editions, values: series.resPort },
    { name: 'Participação Leitura', labels: editions, values: series.partLeit },
    { name: 'Resultado Leitura', labels: editions, values: series.resLeit }
  ];

  // Colors: Blue, Dark Blue, Green, Dark Green, Red, Dark Red
  const chartColors = ['4472C4', '255E91', '70AD47', '548235', 'FF0000', 'C00000'];

  slide.addChart(pres.ChartType.bar, chartData, {
    x: 0.25, y: 0.5, w: 9.5, h: 2.1,
    barGrouping: 'clustered',
    chartColors: chartColors,
    showLegend: true,
    legendPos: 'b',
    legendFontSize: 8,
    showValue: false,
    barGapWidthPct: 50,
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
    catAxisLabelColor: '666666',
    valAxisLabelColor: '666666'
  });

  // 3. Table
  // Header
  const tableRows: any[] = [
    [
      { text: '', options: { fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' } } }, // Empty corner
      { text: '', options: { fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' } } },
      { text: 'Matemática', options: { bold: true, align: 'center', fill: { color: 'FFFFFF' }, color: '666666', fontSize: 9 } },
      { text: 'Língua Portuguesa', options: { bold: true, align: 'center', fill: { color: 'FFFFFF' }, color: '666666', fontSize: 9 } },
      { text: 'Leitura', options: { bold: true, align: 'center', fill: { color: 'FFFFFF' }, color: '666666', fontSize: 9 } }
    ]
  ];

  editions.forEach((ed, idx) => {
    const bg = idx % 2 === 0 ? 'F2F2F2' : 'FFFFFF';
    const rows = data.filter(d => d.edicao === ed);
    
    const getVal = (mat: string, type: 'part' | 'res') => {
      const row = rows.find(r => r.materia.toLowerCase().includes(mat.toLowerCase()));
      return row ? (type === 'part' ? row.participacao : row.acertos) + '%' : '-';
    };

    // Row 1: Participação
    tableRows.push([
      { text: ed, options: { rowspan: 2, valign: 'middle', bold: true, fill: { color: bg }, fontSize: 8, align: 'left' } },
      { text: 'Participação', options: { align: 'right', fontSize: 8, fill: { color: bg }, color: '666666' } },
      { text: getVal('Matemática', 'part'), options: { align: 'center', fontSize: 8, fill: { color: bg } } },
      { text: getVal('Língua Portuguesa', 'part'), options: { align: 'center', fontSize: 8, fill: { color: bg } } },
      { text: getVal('Leitura', 'part'), options: { align: 'center', fontSize: 8, fill: { color: bg } } }
    ]);

    // Row 2: Resultado
    tableRows.push([
      // Merged cell above
      { text: 'Resultado', options: { align: 'right', fontSize: 8, fill: { color: bg }, color: '666666' } },
      { text: getVal('Matemática', 'res'), options: { align: 'center', fontSize: 8, fill: { color: bg } } },
      { text: getVal('Língua Portuguesa', 'res'), options: { align: 'center', fontSize: 8, fill: { color: bg } } },
      { text: getVal('Leitura', 'res'), options: { align: 'center', fontSize: 8, fill: { color: bg } } }
    ]);
  });

  slide.addTable(tableRows, {
    x: 0.25, y: 2.75, w: 9.5,
    colW: [2.5, 1.5, 1.83, 1.83, 1.83],
    border: { pt: 0, color: 'FFFFFF' },
    rowH: 0.2
  });
  
  // Add horizontal lines for table separation manually if needed, or rely on table borders.
  // The image shows green dotted lines separating editions. 
  // pptxgenjs table borders are grid-like. We can try to style specific borders.
  // For now, simple table is a good start.
};

const generateMatrixSlide = async (pres: PptxGenJS, data: FluencyDetailRow[], className: string) => {
  if (!data || data.length === 0) return;

  // Determine max number of questions

  // Determine max number of questions
  let maxQ = 0;
  data.forEach(d => {
    if (d.questions) {
        d.questions.forEach((_, qNum) => {
            if (qNum > maxQ) maxQ = qNum;
        });
    }
  });
  // Default to 20 if no data found, or use max found
  const numQuestions = maxQ > 0 ? maxQ : 20;
  const questionNums = Array.from({ length: numQuestions }, (_, i) => i + 1);

  // Helper to format level text
  const formatLevelText = (text: string) => {
    const t = text.toLowerCase().trim();
    if (t === 'fluente') return 'Fluente';
    if (t === 'nao fluente' || t === 'não fluente') return 'Não Fluente';
    if (t === 'frases') return 'Frases';
    if (t === 'palavras') return 'Palavras';
    if (t === 'silabas' || t === 'sílabas') return 'Sílabas';
    if (t === 'nao leitor' || t === 'não leitor') return 'Não Leitor';
    if (t === 'nao avaliado' || t === 'não avaliado') return 'Não Avaliado';
    if (t === 'nao informado' || t === 'não informado') return 'Não Informado';
    // Default: Capitalize first letter of each word
    return t.replace(/\b\w/g, c => c.toUpperCase());
  };

  // Table Headers
  // Added margin to Alunos header to align with names (which have default margin)
  // Reduced margin from 5 (too large) to 0.1 to prevent text wrapping/squashing
  const headers = [
    { text: `Alunos (${data.length})`, options: { bold: true, align: 'left' as const, w: 2.3, fill: { color: 'F2F2F2' }, fontSize: 7, margin: [0, 0, 0, 0.1] } },
    ...questionNums.map(q => ({ text: String(q), options: { bold: true, align: 'center' as const, w: 0.26, fill: { color: 'F2F2F2' }, fontSize: 7, margin: 0 } })),
    { text: 'MEDIA', options: { bold: true, align: 'center' as const, w: 0.5, fill: { color: 'F2F2F2' }, fontSize: 7, margin: 0 } },
    { text: 'NÍVEL', options: { bold: true, align: 'center' as const, w: 0.5, fill: { color: 'F2F2F2' }, fontSize: 7, margin: 0 } },
    { text: 'LEITURA', options: { bold: true, align: 'center' as const, w: 0.9, fill: { color: 'F2F2F2' }, fontSize: 7, margin: 0 } }
  ];

  // Table Rows
  // Sort by name
  const sortedData = [...data].sort((a, b) => a.nome.localeCompare(b.nome));

  const rows = sortedData.map((d, index) => {
    const rowBg = index % 2 === 0 ? 'F9F9F9' : 'FFFFFF'; // Alternating row colors
    
    // Question Cells
    const qCells = questionNums.map(q => {
        const qData = d.questions?.get(q);
        let fill = rowBg;
        let text = '-';
        
        if (qData) {
            text = qData.answer || '-';
            if (qData.correct) {
                fill = PALETTE.correct;
            } else {
                fill = PALETTE.wrong;
            }
        }
        
        return { text, options: { align: 'center' as const, fill: { color: fill }, fontSize: 8 } };
    });

    // Calculate Media if not present (simple percentage of correct answers)
    let media = d.media || '';
    if (!media && d.questions && d.questions.size > 0) {
        let correctCount = 0;
        d.questions.forEach(q => { if (q.correct) correctCount++; });
        media = String(Math.round((correctCount / numQuestions) * 100));
    }
    // Append % if it's a number/string without it
    if (media && !media.includes('%')) {
        media += '%';
    }

    // Map Nivel to Number (1-4) if possible, or just use text
    // Use pre-calculated numeric level (from score) if available, otherwise fallback to text parsing
    let nivelNum = d.nivelNum || '';
    
    // Fallback for legacy/other files if nivelNum wasn't calculated
    if (!nivelNum) {
        const n = (d.nivel || '').toLowerCase();
        if (n.includes('fluente') && !n.includes('nao')) nivelNum = '4';
        else if (n.includes('frases')) nivelNum = '3';
        else if (n.includes('palavras')) nivelNum = '2';
        else if (n.includes('silabas') || n.includes('nao leitor')) nivelNum = '1';
    }
    
    // Dynamic font size for long names
    const nameFontSize = d.nome.length > 28 ? 8 : 9;
    
    return [
        { text: d.nome, options: { align: 'left' as const, fill: { color: rowBg }, fontSize: nameFontSize } },
        ...qCells,
        { text: media, options: { align: 'center' as const, fill: { color: rowBg }, fontSize: 9 } },
        { text: nivelNum || '-', options: { align: 'center' as const, fill: { color: rowBg }, fontSize: 9 } },
        { text: formatLevelText(d.nivel), options: { align: 'center' as const, fill: { color: rowBg }, fontSize: 9 } }
    ];
  });

  // Pagination logic
  const MAX_ROWS = 13;
  const chunks = [];
  for (let i = 0; i < rows.length; i += MAX_ROWS) {
    chunks.push(rows.slice(i, i + MAX_ROWS));
  }

  chunks.forEach((chunkRows, chunkIndex) => {
    if (chunkRows.length === 0) return;

    const s = pres.addSlide();
    
    // Get subject name from first student (all should be same subject due to grouping)
    const subjectName = data.length > 0 && data[0]?.materia ? data[0].materia : 'Língua Portuguesa';
    
    // Title
    s.addText(`${subjectName}${chunkIndex > 0 ? ' (Cont.)' : ''}`, {
      x: 0.5, y: 0.3, w: '90%', fontSize: 18, bold: true, color: PALETTE.headerText, align: 'center'
    });

    // Legend
    // Center the legend horizontally as well? Or keep it somewhat centered?
    // The table will be centered, so let's center the legend relative to the slide width (10).
    // "Resposta Certa" and "Resposta Errada" with squares.
    // Let's group them in the center.
    
    const legendY = 0.8;
    const squareSize = 0.2;
    
    // Calculate positions to center the whole legend block
    // Block 1: [Square] Resposta Certa
    // Block 2: [Square] Resposta Errada
    // Approx width: 0.2 + 0.1 + 1.5 = 1.8 per block?
    // Let's just tweak the existing positions to be more centered and aligned.
    
    // Align text vertically with the square (middle)
    s.addShape('rect', { x: 3.5, y: legendY, w: squareSize, h: squareSize, fill: { color: PALETTE.correct } });
    s.addText("Resposta Certa", { x: 3.8, y: legendY, h: squareSize, fontSize: 9, valign: 'middle' });
    
    s.addShape('rect', { x: 5.5, y: legendY, w: squareSize, h: squareSize, fill: { color: PALETTE.wrong } });
    s.addText("Resposta Errada", { x: 5.8, y: legendY, h: squareSize, fontSize: 9, valign: 'middle' });

    // Calculate dynamic widths
    // Alunos: 2.3 (reduced from 2.75), Questions: 0.26, Media: 0.5, Nivel: 0.5, Leitura: 0.9
    const qW = 0.26;
    const colWidths = [2.3, ...Array(numQuestions).fill(qW), 0.5, 0.5, 0.9];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableX = (10 - totalWidth) / 2;
    
    s.addTable([headers, ...chunkRows], {
      x: tableX, y: 1.2, w: totalWidth,
      colW: colWidths,
      fontSize: 8,
      border: { pt: 0, color: 'FFFFFF' },
      autoPage: false,
      align: 'center'
    });
  });
};



export const generatePresentation = async (
  classes: ClassData[],
  config: PresentationConfig
): Promise<void> => {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';
  pres.title = config.title;

  // Generate slides for each class in sequence
  for (const classData of classes) {
    const { images, csvData, name: className } = classData;

    // 1. Images for this class
    if (images.length > 0) {
      images.forEach((img) => {
        const slide = pres.addSlide();
        slide.background = { color: config.backgroundColor };
        const margin = config.margin;
        
        slide.addImage({
          data: img.dataUrl,
          x: margin, y: margin, 
          w: 10 - (margin*2), 
          h: 5.625 - (margin*2),
          sizing: { type: 'contain', w: 10 - (margin*2), h: 5.625 - (margin*2) }
        });
      });
    }

    // 2. Data Slides for this class - Generate in specific order
    // Order: 1) Fluency chart/table, 2) Levels Distribution, 3) Matrix slides, 
    //        4) Evolution bar chart, 5) History table, 6) Evolution line charts
    
    // Find data items by type
    const fluencyDetail = csvData.find(d => d.type === 'FLUENCY_DETAIL');
    const levelsSummary = csvData.find(d => d.type === 'LEVELS_SUMMARY');
    const evolution = csvData.find(d => d.type === 'EVOLUTION');
    const history = csvData.find(d => d.type === 'HISTORY');

    // 1. Fluency Chart and Table (for Leitura/Português only)
    if (fluencyDetail) {
      try {
        const fluencyData = fluencyDetail.data as FluencyDetailRow[];
        
        // Group students by subject
        const bySubject = new Map<string, FluencyDetailRow[]>();
        fluencyData.forEach(student => {
          const subject = student.materia || 'Leitura';
          if (!bySubject.has(subject)) {
            bySubject.set(subject, []);
          }
          bySubject.get(subject)!.push(student);
        });
        
        // Generate fluency chart and table for reading subjects only
        for (const [subject, students] of bySubject) {
          const isReadingSubject = subject.toLowerCase().includes('leitura') || 
                                   subject.toLowerCase().includes('portugu');
          
          if (isReadingSubject) {
            generateFluencyChartSlide(pres, students, className);
            await generateFluencyTableSlide(pres, students, className);
          }
        }
      } catch (error) {
        console.error('Error generating FLUENCY chart/table slides:', error);
      }
    }

    // 2. Levels Distribution (Nível de Leitura - Distribuição)
    if (levelsSummary) {
      generateLevelsSlide(pres, levelsSummary.data as LevelsSummaryRow[], className);
    }

    // 3. Matrix Slides (Acertos e Erros - Portuguese and Math)
    if (fluencyDetail) {
      try {
        const fluencyData = fluencyDetail.data as FluencyDetailRow[];
        
        // Group students by subject
        const bySubject = new Map<string, FluencyDetailRow[]>();
        fluencyData.forEach(student => {
          const subject = student.materia || 'Leitura';
          if (!bySubject.has(subject)) {
            bySubject.set(subject, []);
          }
          bySubject.get(subject)!.push(student);
        });
        
        // Generate matrix slides for all subjects
        for (const [subject, students] of bySubject) {
          await generateMatrixSlide(pres, students, className);
        }
      } catch (error) {
        console.error('Error generating Matrix slides:', error);
      }
    }

    // 4. Evolution Bar Chart (Visão Geral Linha Evolutiva)
    if (evolution) {
      generateEvolutionSlide(pres, evolution.data as EvolutionRow[], className);
    }

    // 5. History Table (Histórico de Fluência)
    if (history) {
      try {
        generateHistorySlide(pres, history.data as HistoryStudent[]);
      } catch (e) { 
        console.error("Error generating History slides", e); 
      }
    }

    // 6. Evolution Line Charts (Gráficos de Linha)
    if (evolution) {
      generateEvolutionLineSlides(pres, evolution.data as EvolutionRow[], className);
    }
  }

  // Generate blob and trigger download
  const blob = await pres.write({ outputType: 'blob' });
  const url = URL.createObjectURL(blob as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.title}.pptx`;
  a.click();
  URL.revokeObjectURL(url);
};
