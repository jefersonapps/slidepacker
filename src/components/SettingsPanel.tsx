import React from 'react';
import { PresentationConfig } from '../types';
import { SlidersHorizontal, Monitor, Square } from 'lucide-react';

interface SettingsPanelProps {
  config: PresentationConfig;
  setConfig: React.Dispatch<React.SetStateAction<PresentationConfig>>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
        <SlidersHorizontal className="w-5 h-5 text-slate-500" />
        <h2 className="font-semibold text-slate-800">Slide Settings</h2>
      </div>

      {/* Margin Control */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-slate-700">Margin (Inches)</label>
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{config.margin}"</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={config.margin}
          onChange={(e) => setConfig({ ...config, margin: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>0" (Full Bleed)</span>
          <span>2" (Small)</span>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700 block">Slide Size</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setConfig({ ...config, slideLayout: '16x9' })}
            className={`flex items-center justify-center space-x-2 p-3 rounded-lg border text-sm font-medium transition-all ${
              config.slideLayout === '16x9'
                ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>16:9</span>
          </button>
          <button
            onClick={() => setConfig({ ...config, slideLayout: '4x3' })}
            className={`flex items-center justify-center space-x-2 p-3 rounded-lg border text-sm font-medium transition-all ${
              config.slideLayout === '4x3'
                ? 'border-teal-500 bg-teal-50 text-teal-700 ring-1 ring-teal-500'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Square className="w-4 h-4" />
            <span>4:3</span>
          </button>
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700 block">Background Color</label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
            className="w-10 h-10 rounded border-none cursor-pointer"
          />
          <span className="text-sm text-slate-500 uppercase">{config.backgroundColor}</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;