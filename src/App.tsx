import React, { useState } from 'react';
import { PresentationConfig, ClassData } from './types';
import { processImageFile } from './services/imageUtils';
import { processCsvFile } from './services/csvUtils';
import { generatePresentation } from './services/pptxService';
import DropZone from './components/DropZone';
import SettingsPanel from './components/SettingsPanel';
import ClassDialog from './components/ClassDialog';
import { FileDown, Presentation, Plus, AlertCircle, FileSpreadsheet, Trash2, Table, BarChart3, History, ChevronDown, ChevronRight, ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [config, setConfig] = useState<PresentationConfig>({
    margin: 0.2,
    backgroundColor: '#FFFFFF',
    slideLayout: '16x9',
    title: 'Relatório de Avaliação'
  });

  const handleFilesSelected = async (files: File[]) => {
    setPendingFiles(files);
    setShowClassDialog(true);
  };

  const handleClassSelected = async (className: string) => {
    setShowClassDialog(false);
    setIsProcessing(true);
    setError(null);
    
    try {
      const imageFiles = pendingFiles.filter(f => f.type.startsWith('image/'));
      const csvFiles = pendingFiles.filter(f => f.type === 'text/csv' || f.name.endsWith('.csv') || f.type === 'text/plain');

      const processedImgs = imageFiles.length > 0 ? await Promise.all(imageFiles.map(processImageFile)) : [];
      const processedCsvs = csvFiles.length > 0 ? await Promise.all(csvFiles.map(processCsvFile)) : [];

      setClasses(prev => {
        const existingClass = prev.find(c => c.name === className);
        if (existingClass) {
          return prev.map(c => 
            c.name === className
              ? { ...c, images: [...c.images, ...processedImgs], csvData: [...c.csvData, ...processedCsvs] }
              : c
          );
        } else {
          const newClass = {
            id: Date.now().toString(),
            name: className,
            images: processedImgs,
            csvData: processedCsvs
          };
          setExpandedClasses(prev => new Set(prev).add(newClass.id));
          return [...prev, newClass];
        }
      });
      
    } catch (err) {
      setError("Erro ao processar arquivos. Verifique se os CSVs estão no formato correto.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setPendingFiles([]);
    }
  };

  const handleDownload = async () => {
    if (classes.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      // Pass all classes to generate a single PPTX
      await generatePresentation(classes, config);
    } catch (err) {
      setError("Erro ao gerar o arquivo PowerPoint.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeFile = (classId: string, type: 'image' | 'csv', fileId: string) => {
    setClasses(prev => prev.map(c => {
      if (c.id !== classId) return c;
      if (type === 'image') {
        return { ...c, images: c.images.filter(img => img.id !== fileId) };
      } else {
        return { ...c, csvData: c.csvData.filter(d => d.id !== fileId) };
      }
    }));
  };

  const removeClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  };

  const toggleClassExpanded = (classId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'MATRIX': return <Table size={16} />;
      case 'EVOLUTION': return <BarChart3 size={16} />;
      case 'HISTORY': return <History size={16} />;
      default: return <FileSpreadsheet size={16} />;
    }
  };

  const totalItems = classes.reduce((sum, c) => sum + c.images.length + c.csvData.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Class Selection Dialog */}
      {showClassDialog && (
        <ClassDialog
          existingClasses={classes.map(c => c.name)}
          onConfirm={handleClassSelected}
          onCancel={() => {
            setShowClassDialog(false);
            setPendingFiles([]);
          }}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-2 rounded-lg text-white shadow-lg shadow-teal-500/20">
              <Presentation size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">SlidePacker</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Gerador de Relatórios Escolares</p>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            disabled={classes.length === 0 || isGenerating}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md
              ${classes.length === 0 || isGenerating
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/20 active:scale-95'
              }`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FileDown size={20} />
            )}
            <span>{isGenerating ? 'Gerando...' : 'Baixar PPTX'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600 animate-fade-in">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input & Preview */}
          <div className="lg:col-span-2 space-y-8">
            <DropZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
            
            {/* Class-based file list */}
            {classes.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Presentation className="w-5 h-5" />
                  Turmas ({classes.length}) • {totalItems} arquivos
                </h2>
                
                {classes.map(classData => {
                  const isExpanded = expandedClasses.has(classData.id);
                  const itemCount = classData.images.length + classData.csvData.length;
                  
                  return (
                    <div key={classData.id} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                      {/* Class Header */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleClassExpanded(classData.id)}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                          <div>
                            <p className="font-semibold text-slate-800">{classData.name}</p>
                            <p className="text-xs text-slate-500">
                              {classData.csvData.length} dados • {classData.images.length} imagens
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClass(classData.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Class Files (Collapsible) */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 space-y-2 bg-slate-50/50">
                          {/* CSV Files */}
                          {classData.csvData.map(data => (
                            <div key={data.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  data.type === 'UNKNOWN' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                                }`}>
                                  {getIconForType(data.type)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{data.filename}</p>
                                  <p className="text-xs text-slate-500">
                                    <span className="font-mono bg-slate-100 px-1 rounded uppercase">{data.type}</span> • {data.data.length} linhas
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(classData.id, 'csv', data.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}

                          {/* Image Files */}
                          {classData.images.map(img => (
                            <div key={img.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                                  <ImageIcon size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{img.file.name}</p>
                                  <p className="text-xs text-slate-500">
                                    {img.width} × {img.height}px
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(classData.id, 'image', img.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {classes.length === 0 && (
              <div className="text-center py-10 text-slate-300">
                <p>Nenhum arquivo selecionado</p>
              </div>
            )}
          </div>

          {/* Right Column: Settings */}
          <div className="lg:col-span-1">
             <div className="sticky top-24 space-y-6">
                
                {/* Title Config */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
                   <label className="text-sm font-medium text-slate-700 block">Título do Relatório</label>
                   <input 
                      type="text" 
                      value={config.title}
                      onChange={(e) => setConfig({...config, title: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                   />
                </div>

                <SettingsPanel config={config} setConfig={setConfig} />
                
                {classes.length > 0 && (
                  <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl">
                    <h3 className="text-sm font-semibold text-teal-800 mb-1">Pronto para Gerar</h3>
                    <p className="text-xs text-teal-600 mb-3">
                      {classes.length} turmas com {totalItems} arquivos.
                    </p>
                    <button 
                      onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
                      className="text-sm font-medium text-teal-700 hover:text-teal-800 flex items-center space-x-1"
                    >
                      <Plus size={16} />
                      <span>Adicionar mais arquivos</span>
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
