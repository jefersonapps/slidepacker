import React, { useCallback } from 'react';
import { Upload, FileImage, FileSpreadsheet } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isProcessing }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isProcessing) return;
      
      const files = Array.from(e.dataTransfer.files).filter(file => 
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
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out text-center cursor-pointer overflow-hidden
        ${isProcessing 
          ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' 
          : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 bg-white'
        }`}
    >
      <input
        type="file"
        multiple
        accept="image/*,.csv"
        onChange={handleInputChange}
        disabled={isProcessing}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
        <div className={`p-4 rounded-full ${isProcessing ? 'bg-gray-100' : 'bg-blue-100 group-hover:scale-110 transition-transform duration-300'}`}>
          {isProcessing ? (
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          ) : (
            <div className="flex -space-x-2">
               <Upload className="w-8 h-8 text-blue-600 z-10" />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-700">
            {isProcessing ? 'Processing...' : 'Drop Images or CSV Files'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            or click to browse from your computer
          </p>
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