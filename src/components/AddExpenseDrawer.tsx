import React, { useState, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { CATEGORY_CONFIG } from './TimelineView';
import { SUPPORTED_CURRENCIES, convertCurrency } from '../engine/currencyConverter';
import { X, Camera, Sparkles, Check } from 'lucide-react';
import type { CurrencyCode, ExpenseCategory, SplitType } from '../types';

export const AddExpenseDrawer: React.FC = () => {
  const {
    activeTrip,
    isDrawerOpen,
    setIsDrawerOpen,
    addExpense,
    updateExpense,
    editingExpense,
    setEditingExpense,
    customRates,
    currentMemberId,
  } = useTrip();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(() => activeTrip?.baseCurrency || 'MYR');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidById, setPaidById] = useState<string>(() => currentMemberId || activeTrip?.members[0]?.id || 'm-me');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [splitType] = useState<SplitType>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() =>
    activeTrip ? activeTrip.members.map((m) => m.id) : []
  );
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);

  // Synchronize state when editing an existing expense
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmountStr(editingExpense.amount.toString());
      setCurrency(editingExpense.currency);
      setCategory(editingExpense.category);
      setPaidById(editingExpense.paidById);
      setDate(editingExpense.date);
      setSelectedMemberIds(Object.keys(editingExpense.splitDetails));
      setReceiptImage(editingExpense.receiptImage);
    } else if (activeTrip) {
      setTitle('');
      setAmountStr('');
      setCurrency(activeTrip.baseCurrency);
      setCategory('food');
      setPaidById(currentMemberId || activeTrip.members[0]?.id || 'm-me');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedMemberIds(activeTrip.members.map((m) => m.id));
      setReceiptImage(undefined);
    }
  }, [editingExpense, activeTrip, currentMemberId]);

  if (!isDrawerOpen || !activeTrip) return null;

  const handleClose = () => {
    setIsDrawerOpen(false);
    setEditingExpense(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const numAmount = parseFloat(amountStr) || 0;
  const convertedBase = convertCurrency(
    numAmount,
    currency,
    activeTrip.baseCurrency,
    customRates
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    if (editingExpense) {
      await updateExpense(editingExpense.id, {
        title: title.trim() || '旅行杂项',
        category,
        amount: numAmount,
        currency,
        paidById,
        date,
        splitType,
        selectedMemberIds,
        receiptImage,
      });
    } else {
      await addExpense({
        title: title.trim() || '旅行杂项',
        category,
        amount: numAmount,
        currency,
        paidById,
        date,
        splitType,
        selectedMemberIds,
        receiptImage,
      });
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-end animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161c28] border-t border-x border-slate-200 dark:border-[#28354d] rounded-t-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#26334a]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b] animate-pulse" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {editingExpense ? '修改旅行花费' : '记一笔旅行花费'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Big Amount Input & Currency Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#2a3750]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">消费金额</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-white dark:bg-[#1f293d] text-slate-900 dark:text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-[#344463] focus:outline-none focus:border-[#ff6b6b]"
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((cCode) => (
                  <option key={cCode} value={cCode}>
                    {cCode} ({SUPPORTED_CURRENCIES[cCode as CurrencyCode].symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-bold text-[#ff6b6b]">
                {SUPPORTED_CURRENCIES[currency]?.symbol || '$'}
              </span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Realtime Conversion Preview */}
            {currency !== activeTrip.baseCurrency && numAmount > 0 && (
              <div className="flex items-center space-x-1.5 text-xs text-[#06d6a0] font-bold mt-2 pt-2 border-t border-slate-200 dark:border-[#1f293d]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  折合 {activeTrip.baseCurrency}: {activeTrip.currencySymbol} {convertedBase.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Expense Title */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">费用名称 / 备注</label>
            <input
              type="text"
              placeholder="例如：机场免税店、居酒屋晚餐、包车接送"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#2a3750] focus:outline-none focus:border-[#ff6b6b] placeholder:text-slate-400"
            />
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">支出类别</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => {
                const Icon = conf.icon;
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey as ExpenseCategory)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#ff6b6b]/15 border-[#ff6b6b] text-[#ff6b6b] font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-[#0e121b] border-slate-200 dark:border-[#2a3750] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">{conf.name.split('/')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Who Paid? (Payer Avatars) */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">谁付的钱？</label>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
              {activeTrip.members.map((m) => {
                const isSelected = paidById === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidById(m.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs shrink-0 transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold border-slate-900 dark:border-white shadow-sm'
                        : 'bg-slate-50 dark:bg-[#0e121b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2a3750] hover:border-slate-400'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: m.avatarColor }}
                      className="w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                    >
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Mode (Who benefits?) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">谁参与平分？</label>
              <button
                type="button"
                onClick={() => setSelectedMemberIds(activeTrip.members.map((m) => m.id))}
                className="text-[11px] text-[#ff6b6b] font-semibold hover:underline"
              >
                全选平分
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {activeTrip.members.map((m) => {
                const isChecked = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMemberSelection(m.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isChecked
                        ? 'bg-[#ff6b6b]/15 border-[#ff6b6b] text-slate-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-[#0e121b] border-slate-200 dark:border-[#2a3750] text-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span
                        style={{ backgroundColor: m.avatarColor }}
                        className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                      >
                        {m.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span>{m.name}</span>
                    </div>
                    {isChecked && <Check className="w-3.5 h-3.5 text-[#ff6b6b]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Receipt Snapshot */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">消费日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#2a3750] focus:outline-none focus:border-[#ff6b6b]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">发票 / 小票照片</label>
              <label className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#0e121b] text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-[#2a3750] hover:border-[#ff6b6b] flex items-center justify-center space-x-1 cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-[#ff6b6b]" />
                <span className="truncate">{receiptImage ? '已附照片 ✓' : '拍照上传'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white text-sm font-black shadow-lg shadow-[#ff6b6b]/40 active:scale-95 transition-transform"
          >
            {editingExpense ? '保存修改并更新账本' : '保存并记入账本'}
          </button>
        </form>
      </div>
    </div>
  );
};
