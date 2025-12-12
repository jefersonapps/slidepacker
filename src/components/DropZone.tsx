import React, { useCallback } from 'react';
import { Upload, FileImage, FileSpreadsheet, Folder, Files } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onFolderSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, onFolderSelected, isProcessing }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;
      
      const files = Array.from(e.dataTransfer.files).filter((file: File) => 
        file.type.startsWith('image/') || 
        file.type === 'text/csv' || 
        file.name.endsWith('.csv') ||
        file.type === 'text/plain'
      );
      
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, isProcessing]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isProcessing) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = '';
    }
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !isProcessing) {
      const files = Array.from(e.target.files);
      onFolderSelected(files);
      e.target.value = '';
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out text-center overflow-hidden
        ${isProcessing 
          ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' 
          : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 bg-white'
        }`}
    >
      {/* Hidden file input */}
      <input
        type="file"
        multiple
        accept="image/*,.csv"
        onChange={handleInputChange}
        disabled={isProcessing}
        className="hidden"
        id="file-input"
      />
      
      {/* Hidden folder input */}
      <input
        type="file"
        multiple
        // @ts-ignore - webkitdirectory is not in the type definitions but works in browsers
        webkitdirectory=""
        directory=""
        onChange={handleFolderInputChange}
        disabled={isProcessing}
        className="hidden"
        id="folder-input"
      />
      
      <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none">
        <div className={`p-4 rounded-full ${isProcessing ? 'bg-gray-100' : 'bg-blue-100 group-hover:scale-110 transition-transform duration-300'}`}>
          {isProcessing ? (
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          ) : (
            <Upload className="w-8 h-8 text-blue-600" />
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-slate-700">
            {isProcessing ? 'Processing...' : 'Arraste arquivos ou pastas aqui'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            ou use os botões abaixo
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Files size={18} />
            <span className="font-medium">Selecionar Arquivos</span>
          </button>

          <button
            onClick={() => document.getElementById('folder-input')?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Folder size={18} />
            <span className="font-medium">Selecionar Pasta</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          <div className="flex items-center space-x-1">
            <FileImage size={14} />
            <span>Images</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1">
             <FileSpreadsheet size={14} />
             <span>CSV Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropZone;