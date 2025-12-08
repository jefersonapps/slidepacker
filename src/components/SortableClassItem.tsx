import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Trash2, GripVertical, Check, ImageIcon, FileSpreadsheet, Table, BarChart3, History } from 'lucide-react';
import { ClassData } from '../types';

interface SortableClassItemProps {
  classData: ClassData;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onRemoveClass: (id: string) => void;
  onRemoveFile: (classId: string, type: 'image' | 'csv', fileId: string) => void;
  onUpdateName: (id: string, newName: string) => void;
}

const SortableClassItem: React.FC<SortableClassItemProps> = ({
  classData,
  isExpanded,
  onToggleExpand,
  onRemoveClass,
  onRemoveFile,
  onUpdateName
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: classData.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(classData.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateName(classData.id, editName.trim());
    } else {
      setEditName(classData.name);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(classData.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'MATRIX': return <Table size={16} />;
      case 'EVOLUTION': return <BarChart3 size={16} />;
      case 'HISTORY': return <History size={16} />;
      default: return <FileSpreadsheet size={16} />;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-4">
      {/* Class Header */}
      <div className="flex items-center justify-between p-4 bg-white">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="mr-2 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
          <GripVertical size={20} />
        </div>

        <div className="flex items-center space-x-3 flex-1">
          <button onClick={() => onToggleExpand(classData.id)} className="text-slate-400 hover:text-slate-600">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveName}
                  className="px-2 py-1 border border-blue-300 rounded text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <button onClick={handleSaveName} className="text-green-600 hover:text-green-700"><Check size={18} /></button>
              </div>
            ) : (
              <div onClick={() => { setIsEditing(true); setEditName(classData.name); }} className="cursor-pointer hover:bg-slate-50 rounded px-2 py-1 -ml-2 group">
                <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{classData.name}</p>
                <p className="text-xs text-slate-500">
                  {classData.csvData.length} dados • {classData.images.length} imagens
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onRemoveClass(classData.id)}
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
                onClick={() => onRemoveFile(classData.id, 'csv', data.id)}
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
                onClick={() => onRemoveFile(classData.id, 'image', img.id)}
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
};

export default SortableClassItem;
