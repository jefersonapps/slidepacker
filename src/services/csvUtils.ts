
import { ParsedData, CsvType, EvolutionRow, LevelsSummaryRow, MatrixStudent, HistoryStudent, FluencyDetailRow } from '../types';

const cleanString = (str: string) => str?.replace(/^"|"$/g, '').trim() || '';

const parseNumber = (str: string) => {
  if (!str) return 0;
  // Handle "94%" or "94,5" or "94"
  const clean = cleanString(str).replace('%', '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

export const processCsvFile = async (file: File): Promise<ParsedData> => {
  const rawText = await file.text();
  // Remove Byte Order Mark (BOM) if present, which breaks header detection on line 0
  const text = rawText.replace(/^\uFEFF/, '');
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Determine separator
  const sample = lines.slice(0, 5).join('\n');
  const semicolonCount = (sample.match(/;/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  const separator = semicolonCount > commaCount ? ';' : ',';

  const parseLine = (line: string): string[] => {
    if (separator === ';') return line.split(';').map(cleanString);
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (matches) return matches.map(cleanString);
    return line.split(',').map(cleanString);
  };

  let type: CsvType = 'UNKNOWN';
  let parsedData: any[] = [];
  let headers: string[] = [];

  const findHeaderLineIndex = (keywords: string[]): number => {
    for (let i = 0; i < Math.min(lines.length, 1000); i++) {
      const rowUpper = parseLine(lines[i]).map(c => c.toUpperCase());
      // Check if ALL keywords are present in this row
      if (keywords.every(k => rowUpper.some(cell => cell.includes(k)))) return i;
    }
    return -1;
  };

  // 1. DETECT FLUENCY DETAIL (Síntese Geral with multiple subject sections)
  // Structure: 
  //   Section 1: NOME, MATÉRIA, NÍVEL (Português only)
  //   Section 2+: NOME, MATÉRIA, QUESTÃO, RESPOSTA, ACERTO (Português, Matemática, etc.)
  if (type === 'UNKNOWN') {
    const fluencyHeaderIdx = findHeaderLineIndex(['NOME', 'NIVEL']);
    if (fluencyHeaderIdx !== -1) {
      type = 'FLUENCY_DETAIL';
      
      const allStudents = new Map<string, FluencyDetailRow>();
      const studentLevels = new Map<string, string>(); // Map to store reading level by student name
      
      // --- PASS 1: Read Nivel/Fluency data (first section, Português only) ---
      headers = parseLine(lines[fluencyHeaderIdx]).map(h => h.toUpperCase().trim());
      const idxName = headers.findIndex(h => h === 'NOME' || h === 'NOME_ALUNO');
      const idxMateria = headers.findIndex(h => h.includes('MATÉRIA') || h.includes('MATERIA'));
      const idxNivel = headers.findIndex(h => h.includes('NIVEL') || h.includes('NÍVEL'));
      
      if (idxName !== -1 && idxNivel !== -1) {
        for (let i = fluencyHeaderIdx + 1; i < lines.length; i++) {
          const row = parseLine(lines[i]);
          if (row.length < 2) continue;
          
          // Stop if we hit a section with QUESTÃO column (next section)
          const hasQuestao = row.some(c => c.toUpperCase().includes('QUESTÃO') || c.toUpperCase() === 'QUESTAO');
          if (hasQuestao) break;
          
          const nome = row[idxName]?.trim();
          const nivelRaw = row[idxNivel]?.trim();
          
          // Skip header rows
          if (nome && (nome.toUpperCase().includes('NOME') || nome.toUpperCase().includes('MATÉRIA'))) continue;
          
          if (nome && nivelRaw) {
            let materia = idxMateria !== -1 ? row[idxMateria]?.trim() : 'Língua Portuguesa';
            // Normalize 'Leitura' to 'Língua Portuguesa' to match the question section
            if (materia.toLowerCase() === 'leitura') {
                materia = 'Língua Portuguesa';
            }

            const nivel = nivelRaw.toLowerCase()
              .replace(/ê/g, 'e')
              .replace(/í/g, 'i')
              .replace(/ã/g, 'a')
              .replace(/_/g, ' ')
              .trim();
            
            // Store level for this student to be used in other subjects
            studentLevels.set(nome.toUpperCase(), nivel);
            
            const key = `${nome}|||${materia}`;
            allStudents.set(key, {
              nome,
              materia,
              nivel,
              questions: new Map()
            });
          }
        }
      }
      
      // --- PASS 2: Read Question data (all subject sections) ---
      // Find ALL sections with question data
      const questionSections: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        const rowUpper = row.map(c => c.toUpperCase());
        if (rowUpper.some(c => c.includes('NOME')) && 
            rowUpper.some(c => c.includes('QUESTÃO') || c.includes('QUESTAO')) && 
            rowUpper.some(c => c.includes('ACERTO'))) {
          questionSections.push(i);
        }
      }
      
      // Process each question section
      for (const sectionStart of questionSections) {
        const sectionHeaders = parseLine(lines[sectionStart]).map(h => h.toUpperCase().trim());
        
        const idxQName = sectionHeaders.findIndex(h => h === 'NOME' || h === 'NOME_ALUNO');
        const idxQMateria = sectionHeaders.findIndex(h => h.includes('MATÉRIA') || h.includes('MATERIA'));
        const idxQuestao = sectionHeaders.findIndex(h => h.includes('QUESTÃO') || h === 'QUESTAO');
        const idxResposta = sectionHeaders.findIndex(h => h.includes('RESPOSTA'));
        const idxAcerto = sectionHeaders.findIndex(h => h.includes('ACERTO'));
        
        // Find where this section ends
        const nextSectionIdx = questionSections.find(s => s > sectionStart) || lines.length;
        
        for (let i = sectionStart + 1; i < nextSectionIdx; i++) {
          const row = parseLine(lines[i]);
          if (row.length < 3) continue;
          
          const nome = row[idxQName]?.trim();
          if (!nome) continue;
          
          // Skip header rows
          if (nome.toUpperCase().includes('NOME') || nome.toUpperCase().includes('MATÉRIA')) continue;
          
          let materia = idxQMateria !== -1 ? row[idxQMateria]?.trim() : 'Língua Portuguesa';
          // Normalize 'Leitura' to 'Língua Portuguesa'
          if (materia.toLowerCase() === 'leitura') {
              materia = 'Língua Portuguesa';
          }

          const key = `${nome}|||${materia}`;
          
          // Create student if doesn't exist (e.g., for Matemática which has no nivel section)
          if (!allStudents.has(key)) {
            // Try to find reading level from Pass 1 (using normalized name)
            const nivel = studentLevels.get(nome.toUpperCase()) || '-';
            
            allStudents.set(key, {
              nome,
              materia,
              nivel,
              questions: new Map()
            });
          }
          
          const student = allStudents.get(key)!;
          
          // Parse question data
          if (idxQuestao !== -1 && idxAcerto !== -1) {
            // Parse question number and shift by +1 (0-based in CSV -> 1-based for slides)
            // e.g., "0A" -> 0 -> 1, "1C" -> 1 -> 2
            const rawQ = row[idxQuestao]?.trim() || '0';
            const qNum = parseInt(rawQ) + 1;
            
            const answer = idxResposta !== -1 ? row[idxResposta]?.trim() : '';
            const acertoVal = row[idxAcerto]?.trim().toLowerCase();
            const correct = acertoVal === 'certo' || acertoVal === 'sim' || acertoVal === '1';
            
            if (qNum > 0 && student.questions) {
              student.questions.set(qNum, { answer, correct });
            }
          }
        }
      }
      
      // Calculate averages for all students
      allStudents.forEach(student => {
        if (student.questions && student.questions.size > 0) {
          let correctCount = 0;
          student.questions.forEach(q => {
            if (q.correct) correctCount++;
          });
          const percentage = Math.round((correctCount / student.questions.size) * 100);
          student.media = `${percentage}`;
        }
      });
      
      // --- PASS 3: Calculate Reading Level Number and Propagate to Math ---
      // Logic: 
      // Level 4: >= 80%
      // Level 3: 50% - 79%
      // Level 2: 25% - 49%
      // Level 1: < 25%
      
      const portugueseLevels = new Map<string, string>();
      
      // First, calculate for Portuguese students
      allStudents.forEach(student => {
        if (student.materia === 'Língua Portuguesa' && student.media) {
          const mediaVal = parseInt(student.media);
          let nNum = '1';
          if (mediaVal >= 80) nNum = '4';
          else if (mediaVal >= 50) nNum = '3';
          else if (mediaVal >= 25) nNum = '2';
          else nNum = '1';
          
          student.nivelNum = nNum;
          portugueseLevels.set(student.nome.toUpperCase(), nNum);
        }
      });
      
      // Then, propagate to Math students
      allStudents.forEach(student => {
        if (student.materia !== 'Língua Portuguesa') {
          const pLevel = portugueseLevels.get(student.nome.toUpperCase());
          if (pLevel) {
            student.nivelNum = pLevel;
          } else {
             // Fallback if no Portuguese record found (shouldn't happen if names match)
             student.nivelNum = '-';
          }
        }
      });
      
      parsedData = Array.from(allStudents.values());
    }
  }

  // 2. DETECT MATRIX
  // Keywords: "NOME_ALUNO", "QUESTÃO", "ACERTO" (or RESPOSTA)
  if (type === 'UNKNOWN') {
    const matrixHeaderIdx = findHeaderLineIndex(['NOME', 'QUESTÃO', 'ACERTO']);
    
    if (matrixHeaderIdx !== -1) {
      type = 'MATRIX';
      headers = parseLine(lines[matrixHeaderIdx]);
      const normalizedHeaders = headers.map(h => h.toUpperCase());
      
      const idxName = normalizedHeaders.findIndex(h => h.includes('NOME'));
      const idxSubject = normalizedHeaders.findIndex(h => h.includes('MATÉRIA') || h.includes('MATERIA'));
      const idxAvg = normalizedHeaders.findIndex(h => h.includes('MÉDIA') || h.includes('MEDIA'));
      const idxNivel = normalizedHeaders.findIndex(h => h.includes('NIVEL') || h.includes('NÍVEL'));
      const idxQ = normalizedHeaders.findIndex(h => h.includes('QUESTÃO') || h.includes('QUESTAO'));
      const idxRes = normalizedHeaders.indexOf('ACERTO'); 
      const idxVal = normalizedHeaders.indexOf('RESPOSTA');

      const studentsMap = new Map<string, MatrixStudent>();

      for (let i = matrixHeaderIdx + 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length < headers.length) continue;

        const name = row[idxName];
        const subject = row[idxSubject];
        const qNum = row[idxQ];

        // Skip empty or invalid rows
        if (!name || !qNum || isNaN(parseInt(qNum))) continue;

        // Create unique key for map to separate students by subject if they appear twice
        const key = `${name}-${subject}`;

        if (!studentsMap.has(key)) {
          const nivelRaw = idxNivel > -1 ? row[idxNivel] : '';
          const nivel = nivelRaw.toLowerCase()
            .replace(/ê/g, 'e')
            .replace(/í/g, 'i')
            .replace(/ã/g, 'a')
            .replace(/_/g, ' ')
            .trim();

          studentsMap.set(key, {
            nome: name,
            materia: subject,
            media: parseNumber(row[idxAvg]),
            nivel: nivel,
            leitura: '',
            answers: {}
          });
        }

        const student = studentsMap.get(key)!;
        const statusRaw = row[idxRes]?.toLowerCase();
        const valueRaw = row[idxVal] || '';
        
        let status: 'certo' | 'errado' | 'unknown' = 'unknown';
        if (statusRaw === 'certo') status = 'certo';
        if (statusRaw === 'errado') status = 'errado';

        student.answers[qNum] = { status, value: valueRaw };
      }
      parsedData = Array.from(studentsMap.values());
    }
  }

  // 2. DETECT LEVELS SUMMARY
  // Keywords: "FLUENTE", "FRASES", "SILABAS"
  if (type === 'UNKNOWN') {
    const levelHeaderIdx = findHeaderLineIndex(['FLUENTE', 'FRASES', 'SILABAS']);
    if (levelHeaderIdx !== -1) {
      type = 'LEVELS_SUMMARY';
      headers = parseLine(lines[levelHeaderIdx]);
      const normHeaders = headers.map(h => h.toUpperCase());
      
      // Helper to find index safely
      const idx = (name: string) => normHeaders.findIndex(h => h.includes(name));
      const idxEd = normHeaders.findIndex(h => h.includes('EDIÇÃO') || h.includes('EDICAO'));

      // Start reading data
      for (let i = levelHeaderIdx + 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        // Basic validation: needs enough columns
        if (row.length < 5) continue;

        const edition = idxEd > -1 ? row[idxEd] : `Edição ${i}`;
        
        parsedData.push({
          edicao: edition,
          fluente: parseNumber(row[idx('FLUENTE')]),
          nao_fluente: parseNumber(row[idx('NAO_FLUENTE')]),
          frases: parseNumber(row[idx('FRASES')]),
          palavras: parseNumber(row[idx('PALAVRAS')]),
          silabas: parseNumber(row[idx('SILABAS')]),
          nao_leitor: parseNumber(row[normHeaders.findIndex(h => h.includes('NAO_LEITOR') || h.includes('NÃO_LEITOR'))]),
          nao_avaliado: parseNumber(row[idx('NAO_AVALIADO')]),
          nao_informado: parseNumber(row[idx('NAO_INFORMADO')]),
          total_alunos: parseNumber(row[idx('TOTAL')])
        } as LevelsSummaryRow);
      }
    }
  }

  // 3. DETECT EVOLUTION
  // Keywords: "PARTICIPAÇÃO", "ACERTOS", "TOTAL_ALUNOS"
  if (type === 'UNKNOWN') {
    const evolutionHeaderIdx = findHeaderLineIndex(['PARTICIPAÇÃO', 'ACERTOS', 'TOTAL_ALUNOS']);
    if (evolutionHeaderIdx !== -1) {
      type = 'EVOLUTION';
      headers = parseLine(lines[evolutionHeaderIdx]);
      // CRITICAL: Trim all headers to remove extra whitespace
      const normHeaders = headers.map(h => h.toUpperCase().trim());
      
      console.log('EVOLUTION CSV Headers:', headers);
      console.log('Normalized Headers:', normHeaders);
      
      const idxEd = normHeaders.findIndex(h => h.includes('EDIÇÃO') || h.includes('EDICAO'));
      const idxMat = normHeaders.findIndex(h => h.includes('MATÉRIA') || h.includes('MATERIA'));
      
      // Try exact match first, then startsWith
      let idxPart = normHeaders.findIndex(h => h === 'PARTICIPAÇÃO' || h === 'PARTICIPACAO');
      if (idxPart === -1) idxPart = normHeaders.findIndex(h => h.startsWith('PARTICIPAÇÃO') || h.startsWith('PARTICIPACAO'));
      
      let idxAcerto = normHeaders.findIndex(h => h === 'ACERTOS');
      if (idxAcerto === -1) idxAcerto = normHeaders.findIndex(h => h.startsWith('ACERTO'));
      
      // Fallback based on position if headers are ambiguous
      if (idxPart === -1 && idxAcerto === -1 && normHeaders.length >= 4) {
          idxPart = 2;
          idxAcerto = 3;
      }
      
      console.log('Column Indices:', { idxEd, idxMat, idxPart, idxAcerto });
      console.log('Expected: idxEd=0, idxMat=1, idxPart=2, idxAcerto=3');

      for (let i = evolutionHeaderIdx + 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length < 3) continue;

        const edicao = row[idxEd];
        const materia = row[idxMat];
        
        if (!edicao || !materia) continue;

        const evolutionRow = {
          edicao: edicao.trim(),
          materia: materia.trim(),
          participacao: parseNumber(row[idxPart]),
          acertos: parseNumber(row[idxAcerto])
        } as EvolutionRow;
        
        // Debug logging for first row
        if (parsedData.length === 0) {
          console.log('First EVOLUTION row:', {
            raw: row,
            parsed: evolutionRow,
            participacaoValue: row[idxPart],
            acertosValue: row[idxAcerto]
          });
        }
        
        parsedData.push(evolutionRow);
      }
    }
  }

  // 4. DETECT FLUENCY DETAIL (Sintese Geral)ywords: "NOME_ALUNO" (or NOME) and "NIVEL" with fluency categories
  // Moved above HISTORY because HISTORY detection is too loose ("ALUNOS") and captures this file type.
  if (type === 'UNKNOWN') {
    const fluencyHeaderIdx = findHeaderLineIndex(['NOME', 'NIVEL']);
    if (fluencyHeaderIdx !== -1) {
      type = 'FLUENCY_DETAIL';
      // Use parseLine to handle quoted CSV fields correctly
      headers = parseLine(lines[fluencyHeaderIdx]).map(h => h.toUpperCase().trim());
      
      const idxName = headers.findIndex(h => h === 'NOME' || h === 'NOME_ALUNO');
      const idxNivel = headers.findIndex(h => h.includes('NIVEL') || h.includes('NÍVEL'));
      
      // New columns for Matrix
      const idxQuestao = headers.findIndex(h => h.includes('QUESTÃO') || h === 'QUESTAO');
      const idxResposta = headers.findIndex(h => h.includes('RESPOSTA'));
      const idxAcerto = headers.findIndex(h => h.includes('ACERTO'));
      const idxMedia = headers.findIndex(h => h.includes('MEDIA') || h.includes('MÉDIA'));

      if (idxName !== -1 && idxNivel !== -1) {
        const uniqueStudents = new Map<string, FluencyDetailRow>();

        for (let i = fluencyHeaderIdx + 1; i < lines.length; i++) {
          const row = parseLine(lines[i]);
          if (row.length < 2) continue;
          
          const nome = row[idxName]?.trim();
          const nivelRaw = row[idxNivel]?.trim();
          
          if (nome && nivelRaw) {
            if (!uniqueStudents.has(nome)) {
               // Normalize nivel values
               const nivel = nivelRaw.toLowerCase()
                .replace(/ê/g, 'e')
                .replace(/í/g, 'i')
                .replace(/ã/g, 'a')
                .replace(/_/g, ' ')
                .trim();

              uniqueStudents.set(nome, { 
                nome, 
                materia: 'Leitura', // Default value
                nivel,
                questions: new Map()
              });
            }
            
            const student = uniqueStudents.get(nome)!;

            // Parse Question Data
            if (idxQuestao !== -1 && idxResposta !== -1 && idxAcerto !== -1) {
                const qNum = parseInt(row[idxQuestao]?.trim() || '0');
                const answer = row[idxResposta]?.trim();
                const acertoVal = row[idxAcerto]?.trim().toLowerCase();
                const correct = acertoVal === 'certo' || acertoVal === 'sim' || acertoVal === '1';
                
                if (qNum > 0 && student.questions) {
                    student.questions.set(qNum, { answer, correct });
                }
            }

            // Capture Media
            if (idxMedia !== -1) {
                student.media = row[idxMedia]?.trim();
            }
          }
        }
        parsedData = Array.from(uniqueStudents.values());
      }
    }
  }

  // 4. DETECT HISTORY
  // Keywords: "ALUNOS" and at least one column with brackets like "[Matematica]" or a year "202"
  if (type === 'UNKNOWN') {
    const historyHeaderIdx = findHeaderLineIndex(['ALUNOS']);
    if (historyHeaderIdx !== -1) {
      const headerRow = parseLine(lines[historyHeaderIdx]);
      // Check if it looks like a pivoted history file
      // Relaxed check: Look for year "202", brackets "[", or specific keywords like "ANO", "EDICAO"
      const isHistory = headerRow.some(h => 
        h.includes('[') || 
        h.includes('202') || 
        h.toUpperCase().includes('ANO') ||
        h.toUpperCase().includes('EDIÇÃO') ||
        h.toUpperCase().includes('EDICAO')
      );

      if (isHistory || file.name.toLowerCase().includes('historico')) {
        type = 'HISTORY';
        
        // Deduplicate headers to ensure all columns are captured in the results map
        const headerCounts: { [key: string]: number } = {};
        headers = headerRow.map(h => {
          const count = headerCounts[h] || 0;
          headerCounts[h] = count + 1;
          return count === 0 ? h : `${h}_${count}`;
        });

        const idxName = headers.findIndex(h => h.toUpperCase().includes('ALUNOS') || h.toUpperCase().includes('NOME'));
        
        // Identify data columns - anything that looks like an edition/year
        // If we can't find specific patterns, assume all columns except Name are data
        let editionIndices = headers.map((h, i) => {
          if (i === idxName) return -1;
          // Check original header name (remove suffix if present) for detection
          const originalH = h.replace(/_\d+$/, '');
          return (originalH.includes('202') || originalH.includes('[') || originalH.toUpperCase().includes('ANO') || originalH.toUpperCase().includes('ED') || originalH.toUpperCase().includes('DIAG') || originalH.match(/^\d+$/)) ? i : -1;
        }).filter(i => i !== -1);

        // Fallback: if no specific columns found but it IS a history file, take all other columns
        if (editionIndices.length === 0 && idxName !== -1) {
             editionIndices = headers.map((_, i) => i).filter(i => i !== idxName);
        }

        for (let i = historyHeaderIdx + 1; i < lines.length; i++) {
          const row = parseLine(lines[i]);
          if (row.length < 2) continue;

          const student: HistoryStudent = {
            nome: row[idxName],
            escola: '',
            results: {}
          };

          editionIndices.forEach(idx => {
            student.results[headers[idx]] = row[idx];
          });
          parsedData.push(student);
        }
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    filename: file.name,
    type,
    data: parsedData,
    headers
  };
};
