import React from 'react';
import { useTrip } from '../context/TripContext';
import { Map, ReceiptText, Plus, Scale, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsDrawerOpen } = useTrip();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#1f293d] transition-colors">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-around relative">
        {/* Tab 1: Trips */}
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all active:scale-95 ${
            activeTab === 'trips'
              ? 'text-[#ff6b6b] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Map className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">行程</span>
        </button>

        {/* Tab 2: Timeline */}
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all active:scale-95 ${
            activeTab === 'timeline'
              ? 'text-[#ff6b6b] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">流水</span>
        </button>

        {/* Center Floating Action Button: Quick Add Expense */}
        <div className="-mt-6 flex flex-col items-center">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#ff6b6b] to-[#ff9e7d] flex items-center justify-center text-white shadow-lg shadow-[#ff6b6b]/40 transition-transform active:scale-90 hover:scale-105"
            title="记一笔"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-[#ff6b6b] mt-0.5">记一笔</span>
        </div>

        {/* Tab 4: Settlement */}
        <button
          onClick={() => setActiveTab('settle')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all active:scale-95 ${
            activeTab === 'settle'
              ? 'text-[#ff6b6b] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">结算</span>
        </button>

        {/* Tab 5: Settings / Currencies */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-all active:scale-95 ${
            activeTab === 'settings'
              ? 'text-[#ff6b6b] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">汇率</span>
        </button>
      </div>
    </nav>
  );
};
