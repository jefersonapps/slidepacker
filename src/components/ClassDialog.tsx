import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ClassDialogProps {
  existingClasses: string[];
  onConfirm: (className: string) => void;
  onCancel: () => void;
}

const ClassDialog: React.FC<ClassDialogProps> = ({ existingClasses, onConfirm, onCancel }) => {
  const [newClassName, setNewClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const handleConfirm = () => {
    const className = newClassName.trim() || selectedClass;
    if (className) {
      onConfirm(className);
    }
  };

  const isValid = newClassName.trim() || selectedClass;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Selecionar Turma</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* New Class Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 block">
            Nova Turma
          </label>
          <input
            type="text"
            value={newClassName}
            onChange={(e) => {
              setNewClassName(e.target.value);
              setSelectedClass('');
            }}
            placeholder="Ex: 1º Ano, 2º Ano..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
          />
        </div>

        {/* Divider */}
        {existingClasses.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        )}

        {/* Existing Class Selector */}
        {existingClasses.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 block">
              Turma Existente
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setNewClassName('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
            >
              <option value="">Selecionar...</option>
              {existingClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
              isValid
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassDialog;
