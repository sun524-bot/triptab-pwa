import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { Plane, Moon, Sun, QrCode, Wifi, WifiOff, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    activeTrip,
    trips,
    setActiveTripId,
    isOnline,
    setIsShareModalOpen,
    currentMemberId,
    setIsIdentityModalOpen,
  } = useTrip();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e121b]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1f293d] px-4 py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Logo & Trip Selector */}
        <div className="relative flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff6b6b] to-[#ff9e7d] flex items-center justify-center text-white shadow-md shadow-[#ff6b6b]/20 shrink-0">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                TripTab
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/30">
                PWA v2
              </span>
            </div>

            {/* Trip Dropdown Trigger */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span className="font-semibold truncate max-w-[130px]">
                {activeTrip?.title || '选择行程'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-12 left-0 w-64 bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                你的行程列表
              </div>
              <div className="space-y-1">
                {trips.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTripId(t.id);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                      t.id === activeTrip?.id
                        ? 'bg-[#ff6b6b]/15 text-[#ff6b6b] font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f2738]'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold truncate">{t.title}</div>
                      <div className="text-[10px] opacity-70 truncate">{t.destination}</div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-black/20 text-slate-700 dark:text-slate-300">
                      {t.tripCode}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Controls: Identity + Trip Code + Online Pill + Theme Switcher */}
        <div className="flex items-center space-x-1.5">
          {/* My Identity Pill */}
          {activeTrip && (
            <button
              onClick={() => setIsIdentityModalOpen(true)}
              title="点击切换当前我是哪位成员"
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#161c28] text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-[#26334a] hover:border-[#06d6a0] transition-all active:scale-95 shadow-xs"
            >
              <span
                style={{ backgroundColor: activeTrip.members.find((m) => m.id === currentMemberId)?.avatarColor || '#06d6a0' }}
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              />
              <span className="font-bold truncate max-w-[75px] text-[11px]">
                {activeTrip.members.find((m) => m.id === currentMemberId)?.name || '我是谁'}
              </span>
              <span className="text-[9px] text-[#06d6a0] font-bold">(我)</span>
            </button>
          )}

          {/* Trip Code Pill (Opens QR Code Share Modal) */}
          {activeTrip && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              title="点击查看二维码与分享行程"
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#161c28] text-slate-800 dark:text-slate-200 text-[11px] font-mono border border-slate-200 dark:border-[#26334a] hover:border-[#ff6b6b]/50 transition-all active:scale-95 shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5 text-[#ff6b6b]" />
              <span className="text-[#ff6b6b] font-bold">{activeTrip.tripCode}</span>
            </button>
          )}

          {/* Network Status Pill */}
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${
              isOnline
                ? 'bg-[#06d6a0]/15 text-[#06d6a0] border-[#06d6a0]/30'
                : 'bg-[#ffd166]/15 text-[#ffd166] border-[#ffd166]/30'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? '实时' : '离线'}</span>
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c28] text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-[#26334a] hover:text-black dark:hover:text-white transition-all active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#ffd166]" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
