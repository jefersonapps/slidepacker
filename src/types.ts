
export interface ProcessedImage {
  id: string;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface PresentationConfig {
  margin: number;
  backgroundColor: string;
  slideLayout: '16x9' | '4x3';
  title: string;
}

// --- CSV Data Types ---

export type CsvType = 'EVOLUTION' | 'LEVELS_SUMMARY' | 'MATRIX' | 'HISTORY' | 'FLUENCY_DETAIL' | 'UNKNOWN';

export interface EvolutionRow {
  edicao: string;
  materia: string;
  participacao: number;
  acertos: number;
}

export interface LevelsSummaryRow {
  edicao: string;
  fluente: number;
  nao_fluente: number;
  frases: number;
  palavras: number;
  silabas: number;
  nao_leitor: number;
  nao_avaliado: number;
  nao_informado: number;
  total_alunos: number;
}

// For the "Matrix" view (Student vs Questions)
export interface MatrixStudent {
  nome: string;
  materia: string;
  media: number;
  nivel: string;
  leitura: string;
  answers: { [question: string]: { status: 'certo' | 'errado' | 'unknown', value: string } }; // Key is question number
}

// For the "History" view (Student vs Editions)
export interface HistoryStudent {
  nome: string;
  escola: string;
  results: { [editionColumn: string]: string }; // Key is "2025 - Av. Diagnóstica", Value is "Fluente", etc.
}

// For the "Fluency Detail" view (Student fluency levels from Síntese Geral)
export interface FluencyDetailRow {
  nome: string;
  materia: string;
  nivel: string; // "fluente", "nao_fluente", "frases", "palavras", "silabas", "nao_leitor", etc.
  questions?: Map<number, { answer: string; correct: boolean }>;
  media?: string;
  leitura?: string;
  nivelNum?: string; // Numeric level (1-4) derived from score or CSV
}

export interface ParsedData {
  id: string;
  filename: string;
  type: CsvType;
  data: any[];
  headers?: string[]; // useful for dynamic columns
}

// Multi-class support
export interface ClassData {
  id: string;
  name: string;
  images: ProcessedImage[];
  csvData: ParsedData[];
}
