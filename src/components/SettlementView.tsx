import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { calculateMemberBalances, simplifyDebts, generateCalculationSteps } from '../engine/debtSimplifier';
import confetti from 'canvas-confetti';
import {
  Scale,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Calculator,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';

export const SettlementView: React.FC = () => {
  const { activeTrip, expenses } = useTrip();
  const [copied, setCopied] = useState(false);
  const [showMathModal, setShowMathModal] = useState(false);
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  if (!activeTrip) return null;

  const balances = calculateMemberBalances(activeTrip, expenses);
  const transfers = simplifyDebts(balances, activeTrip.baseCurrency, activeTrip.currencySymbol);
  const mathSteps = generateCalculationSteps(activeTrip, expenses);
  const memberMap = new Map(activeTrip.members.map((m) => [m.id, m]));

  const totalTripSpend = expenses.reduce((sum, e) => sum + e.baseAmount, 0);

  const toggleSettle = (key: string) => {
    const next = !settledMap[key];
    setSettledMap((prev) => ({ ...prev, [key]: next }));
    if (next) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ff6b6b', '#06d6a0', '#ffd166'],
      });
    }
  };

  const handleCopyWhatsApp = () => {
    let text = `✈️ 【TripTab 结算清单 · ${activeTrip.title}】\n`;
    text += `📍 目的地: ${activeTrip.destination}\n`;
    text += `💰 总支出: ${activeTrip.currencySymbol} ${totalTripSpend.toFixed(2)}\n`;
    text += `--------------------------------\n`;
    text += `📊 【成员净结余情况】\n`;

    balances.forEach((b) => {
      const sign = b.netBalance >= 0 ? '+' : '';
      text += `• ${b.name}: ${sign}${activeTrip.currencySymbol} ${b.netBalance.toFixed(2)} (付了 ${b.totalPaid.toFixed(2)}, 应出 ${b.totalShare.toFixed(2)})\n`;
    });

    text += `--------------------------------\n`;
    text += `⚡ 【最简转账结算 (共 ${transfers.length} 笔)】\n`;

    if (transfers.length === 0) {
      text += `✨ 本行程已完全结清，无人相互欠款！\n`;
    } else {
      transfers.forEach((t, i) => {
        const fromName = memberMap.get(t.fromId)?.name || t.fromId;
        const toName = memberMap.get(t.toId)?.name || t.toId;
        const status = settledMap[`${t.fromId}-${t.toId}`] ? ' [已结清 ✓]' : '';
        text += `${i + 1}. ${fromName} 👉 转给 ${toName}: ${t.currencySymbol} ${t.amount.toFixed(2)}${status}\n`;
      });
    }

    text += `\n🔗 实时查看明细: ${window.location.href}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">结算与还款</h1>
          <p className="text-xs text-slate-400">基于图论贪心算法，将全团债务压缩至最少笔数</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMathModal(true)}
            className="p-2 rounded-xl bg-[#161c28] text-slate-300 border border-[#26334a] hover:text-white"
            title="查看数学推导过程"
          >
            <Calculator className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#06d6a0] to-[#05b386] text-black text-xs font-black shadow-md shadow-[#06d6a0]/30 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制对账文本' : '发到微信/群聊'}</span>
          </button>
        </div>
      </div>

      {/* Simplified Transfers Card */}
      <div className="p-4 rounded-2xl bg-[#161c28] border border-[#28354d] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-[#ff6b6b]" />
            <h3 className="text-sm font-bold text-white">最简还款方案</h3>
          </div>
          <span className="text-[11px] text-[#06d6a0] font-bold">
            只需 {transfers.length} 步清账
          </span>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-[#06d6a0] mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-300">本行程账目已完全平衡，无需任何转账！</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transfers.map((t) => {
              const fromM = memberMap.get(t.fromId);
              const toM = memberMap.get(t.toId);
              const transferKey = `${t.fromId}-${t.toId}`;
              const isSettled = Boolean(settledMap[transferKey]);

              return (
                <div
                  key={transferKey}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSettled
                      ? 'bg-[#06d6a0]/10 border-[#06d6a0]/40 opacity-70'
                      : 'bg-[#0e121b] border-[#26334a]'
                  }`}
                >
                  {/* From -> To */}
                  <div className="flex items-center space-x-2.5 truncate">
                    {/* Debtor */}
                    <div className="flex items-center space-x-1.5 truncate">
                      <span
                        style={{ backgroundColor: fromM?.avatarColor || '#666' }}
                        className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                      >
                        {fromM?.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[70px]">
                        {fromM?.name}
                      </span>
                    </div>

                    <div className="flex items-center text-slate-500">
                      <ArrowRight className="w-3.5 h-3.5 text-[#ff6b6b]" />
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center space-x-1.5 truncate">
                      <span
                        style={{ backgroundColor: toM?.avatarColor || '#666' }}
                        className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                      >
                        {toM?.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[70px]">
                        {toM?.name}
                      </span>
                    </div>
                  </div>

                  {/* Amount & Toggle Button */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-sm font-black text-[#ff6b6b]">
                      {t.currencySymbol} {t.amount.toFixed(2)}
                    </span>

                    <button
                      onClick={() => toggleSettle(transferKey)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        isSettled
                          ? 'bg-[#06d6a0] text-black'
                          : 'bg-[#1f293d] text-slate-300 hover:text-white'
                      }`}
                    >
                      {isSettled ? '已清 ✓' : '标记已转'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Balances Breakdown Cards */}
      <div className="p-4 rounded-2xl bg-[#161c28] border border-[#28354d]">
        <h3 className="text-sm font-bold text-white mb-3">全员收支明细</h3>
        <div className="space-y-3">
          {balances.map((b) => {
            const isCreditor = b.netBalance >= 0;
            return (
              <div key={b.memberId} className="p-3 rounded-xl bg-[#0e121b] border border-[#26334a]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      style={{ backgroundColor: b.avatarColor }}
                      className="w-6 h-6 rounded-full text-xs font-black text-white flex items-center justify-center"
                    >
                      {b.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="font-bold text-xs text-white">{b.name}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {isCreditor ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[#06d6a0]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[#ff6b6b]" />
                    )}
                    <span
                      className={`text-xs font-black ${
                        isCreditor ? 'text-[#06d6a0]' : 'text-[#ff6b6b]'
                      }`}
                    >
                      {isCreditor ? '应收' : '应付'} {activeTrip.currencySymbol}{' '}
                      {Math.abs(b.netBalance).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Sub details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-[#1f293d]">
                  <div>累计垫付: {activeTrip.currencySymbol} {b.totalPaid.toFixed(2)}</div>
                  <div className="text-right">个人应出: {activeTrip.currencySymbol} {b.totalShare.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step-by-Step Math Derivation Modal */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161c28] border border-[#28354d] rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#26334a]">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-[#ff6b6b]" />
                <h3 className="text-sm font-black text-white">债务计算推导明细</h3>
              </div>
              <button
                onClick={() => setShowMathModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-3">
              <p className="text-xs text-slate-400">
                展示两两成员之间「A 为 B 垫付」减去「B 为 A 垫付」的精确计算过程：
              </p>

              {mathSteps.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">暂无复杂的交叉借贷记录</p>
              ) : (
                mathSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0e121b] border border-[#26334a] text-xs">
                    <div className="font-bold text-white mb-1">
                      {step.memberA} ⟷ {step.memberB}
                    </div>
                    <div className="text-slate-400 text-[11px] space-y-0.5">
                      <div>• {step.memberA} 为 {step.memberB} 垫付了: {activeTrip.currencySymbol} {step.aPaidForB.toFixed(2)}</div>
                      <div>• {step.memberB} 为 {step.memberA} 垫付了: {activeTrip.currencySymbol} {step.bPaidForA.toFixed(2)}</div>
                      <div className="text-[#06d6a0] font-bold pt-1 border-t border-[#1f293d] mt-1">
                        ➜ 两相对冲净额: {step.netOwed >= 0 ? `${step.memberB} 欠 ${step.memberA}` : `${step.memberA} 欠 ${step.memberB}`} {activeTrip.currencySymbol} {Math.abs(step.netOwed).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
