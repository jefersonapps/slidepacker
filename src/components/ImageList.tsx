import React from 'react';
import { ProcessedImage } from '../types';
import { X, Grid2X2 } from 'lucide-react';

interface ImageListProps {
  images: ProcessedImage[];
  onRemove: (id: string) => void;
}

const ImageList: React.FC<ImageListProps> = ({ images, onRemove }) => {
  if (images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-700">
          <Grid2X2 className="w-5 h-5" />
          <h2 className="font-semibold">Slides Preview ({images.length})</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div key={img.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="aspect-video relative bg-slate-100 flex items-center justify-center">
              <img 
                src={img.dataUrl} 
                alt={img.file.name} 
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
            
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex justify-between items-start">
                 <div className="truncate pr-2">
                    <p className="text-xs font-medium text-slate-700 truncate">{img.file.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{img.width}x{img.height}</p>
                 </div>
                 <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                   #{index + 1}
                 </span>
              </div>
            </div>

            <button
              onClick={() => onRemove(img.id)}
              className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove slide"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageList;