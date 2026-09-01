import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { UserCheck, UserPlus, X, Check } from 'lucide-react';

export const JoinIdentityModal: React.FC = () => {
  const {
    activeTrip,
    currentMemberId,
    setCurrentMemberId,
    addMemberToTrip,
    isIdentityModalOpen,
    setIsIdentityModalOpen,
  } = useTrip();

  const [newNickname, setNewNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isIdentityModalOpen || !activeTrip) return null;

  const handleSelectMember = (memberId: string) => {
    setCurrentMemberId(memberId);
    setIsIdentityModalOpen(false);
  };

  const handleAddNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newNickname.trim();
    if (!trimmed) {
      setErrorMsg('请输入你的名字或昵称');
      return;
    }

    // Check if name already exists
    const existing = activeTrip.members.find(
      (m) => m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      setCurrentMemberId(existing.id);
      setIsIdentityModalOpen(false);
      return;
    }

    await addMemberToTrip(activeTrip.id, trimmed);
    // Note: addMemberToTrip adds to the end of members array
    setIsIdentityModalOpen(false);
    setNewNickname('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#26334a]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#ff6b6b]/15 text-[#ff6b6b] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">请确认你的身份</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                【{activeTrip.title}】的记账成员
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsIdentityModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Members Selector */}
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
            你是哪一位成员？点击选择：
          </label>
          <div className="grid grid-cols-2 gap-2">
            {activeTrip.members.map((m) => {
              const isSelected = currentMemberId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMember(m.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-xs active:scale-95 ${
                    isSelected
                      ? 'bg-[#06d6a0]/15 border-[#06d6a0] text-[#06d6a0] font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-[#0e121b] border-slate-200 dark:border-[#243046] text-slate-700 dark:text-slate-300 hover:border-[#ff6b6b]'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      style={{ backgroundColor: m.avatarColor }}
                      className="w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center shrink-0"
                    >
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate">{m.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#06d6a0] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center space-x-2 pt-1">
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#26334a]" />
          <span className="text-[10px] text-slate-400 font-bold uppercase">或者添加新成员</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#26334a]" />
        </div>

        {/* New Member Input Form */}
        <form onSubmit={handleAddNewMember} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="输入你的名字（例如: Emma）"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
            />
          </div>

          {errorMsg && <p className="text-[11px] text-red-500 font-bold">{errorMsg}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white text-xs font-bold shadow-md shadow-[#ff6b6b]/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>加入同行成员并设为「我」</span>
          </button>
        </form>
      </div>
    </div>
  );
};
