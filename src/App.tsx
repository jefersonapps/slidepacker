import React, { useState } from 'react';
import { PresentationConfig, ClassData } from './types';
import { processImageFile } from './services/imageUtils';
import { processCsvFile } from './services/csvUtils';
import { generatePresentation } from './services/pptxService';
import DropZone from './components/DropZone';
import SettingsPanel from './components/SettingsPanel';
import ClassDialog from './components/ClassDialog';
import SortableClassItem from './components/SortableClassItem';
import { FileDown, Presentation, Plus, AlertCircle } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setClasses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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

  const updateClassName = (classId: string, newName: string) => {
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, name: newName } : c));
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
                
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={classes.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {classes.map(classData => (
                      <SortableClassItem
                        key={classData.id}
                        classData={classData}
                        isExpanded={expandedClasses.has(classData.id)}
                        onToggleExpand={toggleClassExpanded}
                        onRemoveClass={removeClass}
                        onRemoveFile={removeFile}
                        onUpdateName={updateClassName}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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
