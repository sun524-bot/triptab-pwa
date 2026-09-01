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
  UserCheck,
} from 'lucide-react';

export const SettlementView: React.FC = () => {
  const { activeTrip, expenses, currentMemberId, setIsIdentityModalOpen } = useTrip();
  const [copied, setCopied] = useState(false);
  const [showMathModal, setShowMathModal] = useState(false);
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  if (!activeTrip) return null;

  const balances = calculateMemberBalances(activeTrip, expenses);
  const transfers = simplifyDebts(balances, activeTrip.baseCurrency, activeTrip.currencySymbol);
  const mathSteps = generateCalculationSteps(activeTrip, expenses);
  const memberMap = new Map(activeTrip.members.map((m) => [m.id, m]));

  const myMember = activeTrip.members.find((m) => m.id === currentMemberId) || activeTrip.members[0];
  const myBalance = balances.find((b) => b.memberId === currentMemberId);
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
    let text = `✈️ 【${activeTrip.title}】旅行结算清单\n`;
    text += `📅 结算时间: ${new Date().toLocaleDateString('zh-CN')}\n`;
    text += `💰 总支出: ${activeTrip.currencySymbol} ${totalTripSpend.toFixed(2)}\n`;
    text += `👥 同行人数: ${activeTrip.members.length} 人\n`;
    text += `--------------------------------\n`;
    text += `📊 【成员净结余情况】\n`;

    balances.forEach((b) => {
      const sign = b.netBalance >= 0 ? '+' : '';
      const isMe = b.memberId === currentMemberId ? ' (我)' : '';
      text += `• ${b.name}${isMe}: ${sign}${activeTrip.currencySymbol} ${b.netBalance.toFixed(2)} (付了 ${b.totalPaid.toFixed(2)}, 应出 ${b.totalShare.toFixed(2)})\n`;
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
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">结算与还款</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">基于图论贪心算法，将全团债务压缩至最少笔数</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMathModal(true)}
            className="p-2 rounded-xl bg-white dark:bg-[#161c28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#26334a] hover:border-[#ff6b6b]"
            title="查看数学推导过程"
          >
            <Calculator className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#06d6a0] to-[#05b386] text-slate-900 text-xs font-black shadow-md shadow-[#06d6a0]/30 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制对账文本' : '发到微信/群聊'}</span>
          </button>
        </div>
      </div>

      {/* Personal Identity & My Balance Hero Banner */}
      {myBalance && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#06d6a0]/15 via-slate-50 to-[#ff6b6b]/15 dark:from-[#06d6a0]/20 dark:via-[#161c28] dark:to-[#ff6b6b]/20 border border-slate-200 dark:border-[#28354d] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                style={{ backgroundColor: myMember?.avatarColor || '#06d6a0' }}
                className="w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center shrink-0"
              >
                {myMember?.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                当前你的身份：<strong className="text-slate-900 dark:text-white">{myMember?.name}</strong> (我)
              </span>
            </div>

            <div className="text-base font-black">
              {myBalance.netBalance > 0 ? (
                <span className="text-[#06d6a0] flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 inline" />
                  <span>你应收回: {activeTrip.currencySymbol} {myBalance.netBalance.toFixed(2)}</span>
                </span>
              ) : myBalance.netBalance < 0 ? (
                <span className="text-[#ff6b6b] flex items-center space-x-1">
                  <TrendingDown className="w-4 h-4 inline" />
                  <span>你需还出: {activeTrip.currencySymbol} {Math.abs(myBalance.netBalance).toFixed(2)}</span>
                </span>
              ) : (
                <span className="text-slate-400">✓ 你的账目已结平，无需收付！</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              已垫付: {activeTrip.currencySymbol}{myBalance.totalPaid.toFixed(2)} • 个人应出: {activeTrip.currencySymbol}{myBalance.totalShare.toFixed(2)}
            </p>
          </div>

          <button
            onClick={() => setIsIdentityModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20293d] border border-slate-200 dark:border-[#2e3b56] text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[#06d6a0] transition-colors shrink-0 shadow-xs flex items-center space-x-1"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#06d6a0]" />
            <span>切换身份</span>
          </button>
        </div>
      )}

      {/* Simplified Transfers Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-[#ff6b6b]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">最简还款方案</h3>
          </div>
          <span className="text-[11px] text-[#06d6a0] font-bold">
            只需 {transfers.length} 步清账
          </span>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-[#06d6a0] mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">本行程账目已完全平衡，无需任何转账！</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transfers.map((t) => {
              const fromM = memberMap.get(t.fromId);
              const toM = memberMap.get(t.toId);
              const transferKey = `${t.fromId}-${t.toId}`;
              const isSettled = Boolean(settledMap[transferKey]);
              const isMeDebtor = t.fromId === currentMemberId;
              const isMeCreditor = t.toId === currentMemberId;

              return (
                <div
                  key={transferKey}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isSettled
                      ? 'bg-slate-50 dark:bg-[#121620] border-slate-200 dark:border-[#1f2838] opacity-50'
                      : isMeDebtor
                      ? 'bg-[#ff6b6b]/10 border-[#ff6b6b]/60'
                      : isMeCreditor
                      ? 'bg-[#06d6a0]/10 border-[#06d6a0]/60'
                      : 'bg-slate-50 dark:bg-[#0e121b] border-slate-200 dark:border-[#243046]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {/* Debtor */}
                    <div className="flex items-center space-x-1.5 truncate">
                      <span
                        style={{ backgroundColor: fromM?.avatarColor || '#666' }}
                        className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                      >
                        {fromM?.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[70px]">
                        {fromM?.name}
                        {isMeDebtor && <span className="text-[#ff6b6b] ml-0.5">(你)</span>}
                      </span>
                    </div>

                    <div className="flex items-center text-slate-400">
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
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[70px]">
                        {toM?.name}
                        {isMeCreditor && <span className="text-[#06d6a0] ml-0.5">(你)</span>}
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
                          ? 'bg-[#06d6a0] text-slate-900'
                          : 'bg-slate-200 dark:bg-[#1f293d] text-slate-700 dark:text-slate-300 hover:text-white'
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
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">全员收支明细</h3>
        <div className="space-y-3">
          {balances.map((b) => {
            const isCreditor = b.netBalance >= 0;
            const isMe = b.memberId === currentMemberId;
            const isHost = b.memberId === activeTrip.members.find((m) => m.isOwner)?.id;

            return (
              <div
                key={b.memberId}
                className={`p-3 rounded-xl border ${
                  isMe
                    ? 'bg-[#06d6a0]/10 border-[#06d6a0]/50'
                    : 'bg-slate-50 dark:bg-[#0e121b] border-slate-200 dark:border-[#26334a]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      style={{ backgroundColor: b.avatarColor }}
                      className="w-6 h-6 rounded-full text-xs font-black text-white flex items-center justify-center"
                    >
                      {b.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{b.name}</span>
                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#06d6a0] text-slate-900">
                        我
                      </span>
                    )}
                    {isHost && !isMe && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ff6b6b]/20 text-[#ff6b6b]">
                        房主
                      </span>
                    )}
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

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-white/5">
                  <span>累计垫付: {activeTrip.currencySymbol} {b.totalPaid.toFixed(2)}</span>
                  <span>个人应出: {activeTrip.currencySymbol} {b.totalShare.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step-by-Step Math Proof Modal */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#28354d]">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-[#ff6b6b]" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">数学对账逻辑推导明细</h3>
              </div>
              <button
                onClick={() => setShowMathModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                本账本采用图论最小流网贪心法（Minimum Cash Flow
                Algorithm），通过以下两两对冲步骤抵消相互垫付：
              </p>

              <div className="space-y-2">
                {mathSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] font-mono text-[11px]"
                  >
                    <div className="text-slate-900 dark:text-white font-bold mb-1">
                      {step.memberA} ↔ {step.memberB} 相对对冲
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {step.memberA} 替 {step.memberB} 付: {activeTrip.currencySymbol}{step.aPaidForB.toFixed(2)} | {step.memberB} 替 {step.memberA} 付: {activeTrip.currencySymbol}{step.bPaidForA.toFixed(2)}
                    </div>
                    <div className="text-[#06d6a0] font-black mt-1">
                      ➔ {step.netOwed >= 0
                        ? `${step.memberB} 需转给 ${step.memberA}: ${activeTrip.currencySymbol}${step.netOwed.toFixed(2)}`
                        : `${step.memberA} 需转给 ${step.memberB}: ${activeTrip.currencySymbol}${Math.abs(step.netOwed).toFixed(2)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowMathModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#ff6b6b] text-white text-xs font-bold"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
