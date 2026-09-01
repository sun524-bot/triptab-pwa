import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { SUPPORTED_CURRENCIES } from '../engine/currencyConverter';
import { X, PiggyBank, Users, User, Trash2, CheckCircle2, PlusCircle } from 'lucide-react';
import type { CurrencyCode } from '../types';

export const PiggyDepositModal: React.FC = () => {
  const {
    activeTrip,
    piggyDeposits,
    isDepositModalOpen,
    setIsDepositModalOpen,
    addBatchPiggyDeposit,
    addPiggyDeposit,
    deletePiggyDeposit,
  } = useTrip();

  const [mode, setMode] = useState<'batch' | 'single'>('batch');
  const [batchAmount, setBatchAmount] = useState('');
  const [batchCurrency, setBatchCurrency] = useState<CurrencyCode>(() => activeTrip?.baseCurrency || 'MYR');

  const [singleMemberId, setSingleMemberId] = useState('');
  const [singleAmount, setSingleAmount] = useState('');
  const [singleCurrency, setSingleCurrency] = useState<CurrencyCode>(() => activeTrip?.baseCurrency || 'MYR');
  const [singleNote, setSingleNote] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isDepositModalOpen || !activeTrip) return null;

  const totalPiggyDeposited = piggyDeposits.reduce((sum, d) => sum + d.baseAmount, 0);
  const memberMap = new Map(activeTrip.members.map((m) => [m.id, m]));

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(batchAmount);
    if (!isNaN(val) && val > 0) {
      await addBatchPiggyDeposit(val, batchCurrency);
      setBatchAmount('');
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 2000);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(singleAmount);
    const targetMember = singleMemberId || activeTrip.members[0]?.id;
    if (!isNaN(val) && val > 0 && targetMember) {
      await addPiggyDeposit(targetMember, val, singleCurrency, undefined, singleNote.trim() || undefined);
      setSingleAmount('');
      setSingleNote('');
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#26334a]">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">公账基金集资充值</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                当前累计集资: {activeTrip.currencySymbol} {totalPiggyDeposited.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDepositModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle: Batch vs. Single */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-[#0e121b] rounded-xl border border-slate-200 dark:border-[#26334a]">
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'batch'
                ? 'bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#ff6b6b]" />
            <span>全员平摊集资</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('single')}
            className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              mode === 'single'
                ? 'bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#06d6a0]" />
            <span>单人出资充值</span>
          </button>
        </div>

        {/* Tab 1: Batch Equal Deposit */}
        {mode === 'batch' && (
          <form onSubmit={handleBatchSubmit} className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                每位成员各自出资额度：
              </label>

              <div className="flex items-center space-x-2">
                <select
                  value={batchCurrency}
                  onChange={(e) => setBatchCurrency(e.target.value as CurrencyCode)}
                  className="bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white text-xs font-bold px-2 py-2 rounded-xl border border-slate-300 dark:border-[#344463]"
                >
                  {Object.keys(SUPPORTED_CURRENCIES).map((cCode) => (
                    <option key={cCode} value={cCode}>
                      {cCode} ({SUPPORTED_CURRENCIES[cCode as CurrencyCode].symbol})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="any"
                  required
                  placeholder="例如: 500"
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white text-sm font-black rounded-xl border border-slate-300 dark:border-[#344463] focus:outline-none focus:border-[#ff6b6b]"
                />
              </div>

              {parseFloat(batchAmount) > 0 && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold pt-1">
                  💡 全团共 {activeTrip.members.length} 人，将各出资 {batchCurrency} {parseFloat(batchAmount).toFixed(2)}，公账资金池将瞬间增加 {(parseFloat(batchAmount) * activeTrip.members.length).toFixed(2)}！
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md shadow-amber-500/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
            >
              <PlusCircle className="w-4 h-4" />
              <span>一键全员集资入账</span>
            </button>
          </form>
        )}

        {/* Tab 2: Single Member Top-up */}
        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  出资成员：
                </label>
                <select
                  value={singleMemberId || activeTrip.members[0]?.id}
                  onChange={(e) => setSingleMemberId(e.target.value)}
                  className="w-full bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-[#344463]"
                >
                  {activeTrip.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  出资金额与币种：
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={singleCurrency}
                    onChange={(e) => setSingleCurrency(e.target.value as CurrencyCode)}
                    className="bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white text-xs font-bold px-2 py-2 rounded-xl border border-slate-300 dark:border-[#344463]"
                  >
                    {Object.keys(SUPPORTED_CURRENCIES).map((cCode) => (
                      <option key={cCode} value={cCode}>
                        {cCode} ({SUPPORTED_CURRENCIES[cCode as CurrencyCode].symbol})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={singleAmount}
                    onChange={(e) => setSingleAmount(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white text-sm font-black rounded-xl border border-slate-300 dark:border-[#344463] focus:outline-none focus:border-[#ff6b6b]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  备注说明 (选填)：
                </label>
                <input
                  type="text"
                  placeholder="例如：补充现金、打车费基金"
                  value={singleNote}
                  onChange={(e) => setSingleNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white text-xs rounded-xl border border-slate-300 dark:border-[#344463] focus:outline-none focus:border-[#ff6b6b]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#06d6a0] to-[#05b386] text-slate-900 text-xs font-black shadow-md shadow-[#06d6a0]/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
            >
              <PlusCircle className="w-4 h-4" />
              <span>记入公账</span>
            </button>
          </form>
        )}

        {successNotice && (
          <div className="p-2 rounded-xl bg-[#06d6a0]/15 text-[#06d6a0] text-xs font-bold text-center flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>集资款项已成功录入公账资金池！</span>
          </div>
        )}

        {/* Deposit Records History */}
        <div className="flex-1 overflow-y-auto pt-2 border-t border-slate-100 dark:border-[#26334a] space-y-1.5 pr-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            公账入账流水记录 ({piggyDeposits.length} 笔)
          </span>

          {piggyDeposits.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">暂无集资记录</p>
          ) : (
            <div className="space-y-1.5">
              {piggyDeposits.map((dep) => {
                const depositor = memberMap.get(dep.memberId);
                return (
                  <div
                    key={dep.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        style={{ backgroundColor: depositor?.avatarColor || '#666' }}
                        className="w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center shrink-0"
                      >
                        {depositor?.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {depositor?.name || '未知成员'}
                          <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                            {dep.date}
                          </span>
                        </div>
                        {dep.note && (
                          <div className="text-[10px] text-slate-500 truncate">{dep.note}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        +{activeTrip.currencySymbol} {dep.baseAmount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => deletePiggyDeposit(dep.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                        title="删除该笔集资"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
