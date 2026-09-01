import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { Plus, Users, Calendar, MapPin, ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import type { CurrencyCode } from '../types';

export const TripsView: React.FC = () => {
  const { trips, activeTripId, setActiveTripId, createNewTrip, addMemberToTrip, joinTripByCode, allExpenses } = useTrip();

  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinNicknameInput, setJoinNicknameInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // New trip form state
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('MYR');
  const [budget, setBudget] = useState('');

  // New member state
  const [newMemberName, setNewMemberName] = useState('');

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createNewTrip(title, destination, currency, budget ? parseFloat(budget) : undefined);
    setShowNewTripModal(false);
    setTitle('');
    setDestination('');
    setBudget('');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !activeTripId) return;
    await addMemberToTrip(activeTripId, newMemberName);
    setNewMemberName('');
    setShowAddMemberModal(false);
  };

  const handleJoinTrip = async () => {
    setJoinError('');
    if (!joinCodeInput.trim() || !joinNicknameInput.trim()) {
      setJoinError('请输入完整的行程码和你的昵称');
      return;
    }
    const ok = await joinTripByCode(joinCodeInput, joinNicknameInput);
    if (!ok) {
      setJoinError('未找到对应的行程码，请核对后重试');
    } else {
      setJoinCodeInput('');
      setJoinNicknameInput('');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
            我的行程
          </h1>
          <p className="text-xs text-slate-400">管理你的多日度假、公路自驾与海外旅行</p>
        </div>

        <button
          onClick={() => setShowNewTripModal(true)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white text-xs font-bold shadow-md shadow-[#ff6b6b]/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>创建行程</span>
        </button>
      </div>

      {/* Zero-Auth Join Trip Card */}
      <div className="p-3.5 rounded-2xl bg-[#161c28] dark:bg-[#161c28] light:bg-white border border-[#28354d] dark:border-[#28354d] light:border-slate-200">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#ff6b6b] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>加入朋友的旅行？</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            placeholder="行程码 (如 KANSAI-26)"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            className="px-3 py-2 rounded-xl bg-[#0e121b] dark:bg-[#0e121b] light:bg-slate-100 text-xs text-white dark:text-white light:text-slate-900 border border-[#2a3750] dark:border-[#2a3750] light:border-slate-200 focus:outline-none focus:border-[#ff6b6b]"
          />
          <input
            type="text"
            placeholder="你的昵称"
            value={joinNicknameInput}
            onChange={(e) => setJoinNicknameInput(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e121b] dark:bg-[#0e121b] light:bg-slate-100 text-xs text-white dark:text-white light:text-slate-900 border border-[#2a3750] dark:border-[#2a3750] light:border-slate-200 focus:outline-none focus:border-[#ff6b6b]"
          />
        </div>
        {joinError && <p className="text-[11px] text-[#ff6b6b] mb-2">{joinError}</p>}
        <button
          onClick={handleJoinTrip}
          className="w-full py-2 rounded-xl bg-[#1f293d] dark:bg-[#1f293d] light:bg-slate-200 text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-[#ff6b6b] hover:text-white transition-all active:scale-95 flex items-center justify-center space-x-1"
        >
          <span>立即加入行程</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Trips Cards List */}
      <div className="space-y-3">
        {trips.map((t) => {
          const tripExpenses = allExpenses.filter((e) => e.tripId === t.id);
          const totalSpent = tripExpenses.reduce((sum, e) => sum + e.baseAmount, 0);
          const isActive = t.id === activeTripId;

          return (
            <div
              key={t.id}
              onClick={() => setActiveTripId(t.id)}
              className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-br from-[#1b2334] to-[#161c28] border-[#ff6b6b]/60 shadow-xl shadow-[#ff6b6b]/5 ring-1 ring-[#ff6b6b]/40'
                  : 'bg-[#161c28] dark:bg-[#161c28] light:bg-white border-[#26334a] dark:border-[#26334a] light:border-slate-200 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-white dark:text-white light:text-slate-900">
                      {t.title}
                    </h3>
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b6b] text-white">
                        当前选中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff6b6b]" />
                    <span>{t.destination}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/30 text-slate-300 border border-white/5">
                    {t.tripCode}
                  </span>
                </div>
              </div>

              {/* Dates & Members */}
              <div className="flex items-center justify-between text-xs text-slate-400 py-2 border-y border-[#26334a]/60 dark:border-[#26334a]/60 light:border-slate-100 my-2.5">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                  <span>{t.startDate} ~ {t.endDate}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 opacity-70" />
                  <span>{t.members.length} 人同行</span>
                </div>
              </div>

              {/* Members Avatars & Add Member */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center -space-x-1.5">
                  {t.members.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      style={{ backgroundColor: m.avatarColor }}
                      className="w-6 h-6 rounded-full border-2 border-[#161c28] flex items-center justify-center text-[10px] font-black text-white shadow-xs"
                      title={m.name}
                    >
                      {m.name.slice(0, 1).toUpperCase()}
                    </div>
                  ))}
                  {t.members.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-[#161c28] flex items-center justify-center text-[9px] font-bold text-slate-300">
                      +{t.members.length - 5}
                    </div>
                  )}
                  {isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddMemberModal(true);
                      }}
                      className="w-6 h-6 rounded-full bg-[#26334a] border-2 border-[#161c28] flex items-center justify-center text-slate-300 hover:text-white hover:bg-[#ff6b6b] transition-colors ml-1"
                      title="添加同行好友"
                    >
                      <UserPlus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Total Spend */}
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">已记录支出</span>
                  <span className="text-sm font-black text-[#ff6b6b]">
                    {t.currencySymbol} {totalSpent.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Trip Modal */}
      {showNewTripModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#161c28] dark:bg-[#161c28] light:bg-white border border-[#28354d] dark:border-[#28354d] light:border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h2 className="text-lg font-black text-white dark:text-white light:text-slate-900 mb-3">
              创建新旅行行程
            </h2>

            <form onSubmit={handleCreateTrip} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">行程名称 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：曼谷美食品鉴4日游"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e121b] text-white text-xs border border-[#2a3750] focus:outline-none focus:border-[#ff6b6b]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">目的地城市</label>
                <input
                  type="text"
                  placeholder="例如：泰国曼谷 / 日本东京"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0e121b] text-white text-xs border border-[#2a3750] focus:outline-none focus:border-[#ff6b6b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">基础货币</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e121b] text-white text-xs border border-[#2a3750] focus:outline-none focus:border-[#ff6b6b]"
                  >
                    <option value="MYR">MYR (令吉)</option>
                    <option value="SGD">SGD (新币)</option>
                    <option value="USD">USD (美元)</option>
                    <option value="JPY">JPY (日元)</option>
                    <option value="THB">THB (泰铢)</option>
                    <option value="CNY">CNY (人民币)</option>
                    <option value="EUR">EUR (欧元)</option>
                    <option value="GBP">GBP (英镑)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">预估总预算 (可选)</label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0e121b] text-white text-xs border border-[#2a3750] focus:outline-none focus:border-[#ff6b6b]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTripModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#1f293d] text-slate-300 text-xs font-bold hover:bg-[#28354d]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white text-xs font-bold shadow-md shadow-[#ff6b6b]/30"
                >
                  立即创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#161c28] border border-[#28354d] rounded-2xl max-w-xs w-full p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">添加同行好友</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input
                type="text"
                required
                placeholder="好友姓名或昵称"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0e121b] text-white text-xs border border-[#2a3750] focus:outline-none focus:border-[#ff6b6b]"
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#1f293d] text-slate-300 text-xs font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#ff6b6b] text-white text-xs font-bold"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
