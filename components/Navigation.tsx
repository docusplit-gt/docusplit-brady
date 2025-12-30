
import React from 'react';
import { Module } from '../types';
import { Scissors, FileSearch, RefreshCcw } from 'lucide-react';

interface NavigationProps {
  currentModule: Module;
  setModule: (module: Module) => void;
  onReset: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentModule, setModule, onReset }) => {
  const tabs = [
    { id: Module.SPLIT, label: 'Split & Upload', icon: Scissors },
    { id: Module.RECONCILE, label: 'Reconcile', icon: FileSearch },
  ];

  return (
    <nav className="flex items-center gap-2 md:gap-4">
      <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setModule(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                isActive 
                  ? 'bg-[#f84827] text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block" />

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#f84827]/30 text-[#f84827] hover:bg-[#f84827] hover:text-white transition-all duration-300 text-sm font-bold shadow-lg shadow-[#f84827]/5 group"
      >
        <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        <span className="hidden md:inline">Nuevo Proceso</span>
      </button>
    </nav>
  );
};

export default Navigation;
