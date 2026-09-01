import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import {
  Plus,
  Users,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  UserPlus,
  Archive,
  ArchiveRestore,
  Trash2,
  QrCode,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { CurrencyCode, Trip } from '../types';

export const TripsView: React.FC = () => {
  const {
    trips,
    activeTripId,
    setActiveTripId,
    createNewTrip,
    archiveTrip,
    unarchiveTrip,
    deleteTrip,
    addMemberToTrip,
    joinTripByCode,
    allExpenses,
    setIsShareModalOpen,
  } = useTrip();

  const [activeSegment, setActiveSegment] = useState<'active' | 'archived'>('active');
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

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

  const activeTrips = trips.filter((t) => !t.isArchived);
  const archivedTrips = trips.filter((t) => t.isArchived);
  const displayTrips = activeSegment === 'active' ? activeTrips : archivedTrips;

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

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;
    await deleteTrip(tripToDelete.id);
    setTripToDelete(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">行程管理</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            管理你的多日度假、公路自驾与海外旅行
          </p>
        </div>

        <button
          onClick={() => setShowNewTripModal(true)}
          className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white text-xs font-bold shadow-md shadow-[#ff6b6b]/30 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>创建新行程</span>
        </button>
      </div>

      {/* Zero-Auth Companion Join Box */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] shadow-sm space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-[#ff6b6b]" />
          <span>加入朋友的旅行？</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          免注册免密码 · 输入行程码与你的昵称即可加入账本
        </p>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="行程码 (如 KANSAI-26)"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
          />
          <input
            type="text"
            placeholder="你的昵称"
            value={joinNicknameInput}
            onChange={(e) => setJoinNicknameInput(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
          />
        </div>

        {joinError && <p className="text-[11px] font-bold text-red-500">{joinError}</p>}

        <button
          onClick={handleJoinTrip}
          className="w-full py-2 rounded-xl bg-slate-800 dark:bg-[#1f293d] hover:bg-[#ff6b6b] text-xs font-bold text-white transition-all active:scale-95 flex items-center justify-center space-x-1"
        >
          <span>立即加入行程</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Segment Switcher: Active vs Archived */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-[#28354d] pb-2">
        <button
          onClick={() => setActiveSegment('active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSegment === 'active'
              ? 'bg-[#ff6b6b] text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          进行中的行程 ({activeTrips.length})
        </button>
        <button
          onClick={() => setActiveSegment('archived')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSegment === 'archived'
              ? 'bg-[#ff6b6b] text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          已归档行程 ({archivedTrips.length})
        </button>
      </div>

      {/* Trips Cards List */}
      <div className="space-y-3">
        {displayTrips.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#161c28] rounded-2xl border border-slate-200 dark:border-[#28354d] p-6">
            <Archive className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {activeSegment === 'active' ? '暂无进行中的行程' : '暂无已归档的行程'}
            </p>
          </div>
        ) : (
          displayTrips.map((t) => {
            const tripExpenses = allExpenses.filter((e) => e.tripId === t.id);
            const totalSpent = tripExpenses.reduce((sum, e) => sum + e.baseAmount, 0);
            const isActive = t.id === activeTripId;

            return (
              <div
                key={t.id}
                onClick={() => setActiveTripId(t.id)}
                className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-50 dark:bg-gradient-to-br dark:from-[#1b2334] dark:to-[#161c28] border-[#ff6b6b] shadow-md ring-1 ring-[#ff6b6b]/30'
                    : 'bg-white dark:bg-[#161c28] border-slate-200 dark:border-[#26334a] hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {t.title}
                      </h3>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b6b] text-white">
                          当前选中
                        </span>
                      )}
                      {t.isArchived && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500 text-white">
                          已归档
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#ff6b6b]" />
                      <span>{t.destination}</span>
                    </div>
                  </div>

                  {/* Top Right Actions */}
                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Share QR Button */}
                    <button
                      onClick={() => {
                        setActiveTripId(t.id);
                        setIsShareModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-black/30 hover:bg-[#ff6b6b]/20 hover:text-[#ff6b6b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 transition-colors"
                      title="查看行程二维码"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    {/* Archive / Unarchive Button */}
                    <button
                      onClick={() => (t.isArchived ? unarchiveTrip(t.id) : archiveTrip(t.id))}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-black/30 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 transition-colors"
                      title={t.isArchived ? '恢复到活跃行程' : '归档该行程'}
                    >
                      {t.isArchived ? (
                        <ArchiveRestore className="w-3.5 h-3.5 text-[#06d6a0]" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Trip Button */}
                    <button
                      onClick={() => setTripToDelete(t)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-black/30 hover:bg-red-500/20 text-slate-500 hover:text-red-500 border border-slate-200 dark:border-white/5 transition-colors"
                      title="彻底删除行程"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dates & Members */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-2 border-y border-slate-100 dark:border-[#26334a]/60 my-2.5">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    <span>
                      {t.startDate} ~ {t.endDate}
                    </span>
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
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-[#161c28] flex items-center justify-center text-[10px] font-black text-white shadow-xs"
                        title={m.name}
                      >
                        {m.name.slice(0, 1).toUpperCase()}
                      </div>
                    ))}
                    {t.members.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-slate-400 dark:bg-slate-700 border-2 border-white dark:border-[#161c28] flex items-center justify-center text-[9px] font-bold text-white">
                        +{t.members.length - 5}
                      </div>
                    )}
                    {isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddMemberModal(true);
                        }}
                        className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#26334a] border-2 border-white dark:border-[#161c28] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-white hover:bg-[#ff6b6b] transition-colors ml-1"
                        title="添加同行好友"
                      >
                        <UserPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Total Spend */}
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">已记录支出</span>
                    <span className="text-sm font-black text-[#ff6b6b]">
                      {t.currencySymbol}{' '}
                      {totalSpent.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Safety Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center space-x-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-black text-sm">彻底删除行程？</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              确定要彻底删除行程【<strong className="text-red-500">{tripToDelete.title}</strong>】吗？该行程下的所有消费记录与结算数据将被清空，此操作<strong>无法撤销</strong>。
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setTripToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-[#20293d] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors shadow-md shadow-red-500/30"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Trip Modal */}
      {showNewTripModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white">创建新旅行行程</h2>
              <button onClick={() => setShowNewTripModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  行程名称 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：日本关西7日游、沙巴潜水之旅"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  目的地城市
                </label>
                <input
                  type="text"
                  placeholder="例如：大阪 · 京都 · 奈良"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    账本主币种
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
                  >
                    <option value="MYR">MYR (令吉)</option>
                    <option value="SGD">SGD (新币)</option>
                    <option value="JPY">JPY (日元)</option>
                    <option value="THB">THB (泰铢)</option>
                    <option value="USD">USD (美元)</option>
                    <option value="CNY">CNY (人民币)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    预算上限 (选填)
                  </label>
                  <input
                    type="number"
                    placeholder="如: 15000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTripModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-[#20293d] text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#ff6b6b] text-white text-xs font-bold shadow-md shadow-[#ff6b6b]/30"
                >
                  创建并启用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-2xl max-w-xs w-full p-5 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">添加同行成员</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                placeholder="成员昵称 (例如: Emma)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b]"
              />
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-[#20293d] text-slate-700 dark:text-slate-300 text-xs font-bold"
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
