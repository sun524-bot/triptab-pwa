import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import {
  Plane,
  Building,
  Utensils,
  Car,
  Ticket,
  ShoppingBag,
  Compass,
  CreditCard,
  Search,
  Calendar,
  Trash2,
  Users,
  Image as ImageIcon,
  Pencil,
} from 'lucide-react';
import type { Expense, ExpenseCategory } from '../types';

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { name: string; icon: React.FC<{ className?: string }>; color: string; bg: string }
> = {
  flight: { name: '机票/航线', icon: Plane, color: '#4cc9f0', bg: 'bg-[#4cc9f0]/15 text-[#4cc9f0] border-[#4cc9f0]/30' },
  hotel: { name: '住宿/民宿', icon: Building, color: '#9b5de5', bg: 'bg-[#9b5de5]/15 text-[#9b5de5] border-[#9b5de5]/30' },
  food: { name: '餐饮美食', icon: Utensils, color: '#ff6b6b', bg: 'bg-[#ff6b6b]/15 text-[#ff6b6b] border-[#ff6b6b]/30' },
  transport: { name: '当地交通', icon: Car, color: '#ffd166', bg: 'bg-[#ffd166]/15 text-[#ffd166] border-[#ffd166]/30' },
  ticket: { name: '门票娱乐', icon: Ticket, color: '#06d6a0', bg: 'bg-[#06d6a0]/15 text-[#06d6a0] border-[#06d6a0]/30' },
  shopping: { name: '免税购物', icon: ShoppingBag, color: '#f72585', bg: 'bg-[#f72585]/15 text-[#f72585] border-[#f72585]/30' },
  activity: { name: '一日游/体验', icon: Compass, color: '#4895ef', bg: 'bg-[#4895ef]/15 text-[#4895ef] border-[#4895ef]/30' },
  general: { name: '日常杂项', icon: CreditCard, color: '#a0aec0', bg: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30' },
};

export const TimelineView: React.FC = () => {
  const {
    activeTrip,
    expenses,
    piggyDeposits,
    deleteExpense,
    setIsDrawerOpen,
    setEditingExpense,
    setIsDepositModalOpen,
  } = useTrip();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!activeTrip) {
    return (
      <div className="text-center py-16 text-slate-500 dark:text-slate-400">
        <p>暂无选中的行程</p>
      </div>
    );
  }

  const handleStartEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setIsDrawerOpen(true);
  };

  // Filter expenses
  const filtered = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Group expenses by Date descending
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((e) => {
    const d = e.date || '未知日期';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

  const memberMap = new Map(activeTrip.members.map((m) => [m.id, m]));
  const totalSpent = expenses.reduce((sum, e) => sum + e.baseAmount, 0);

  const totalPiggyDeposited = piggyDeposits.reduce((sum, d) => sum + d.baseAmount, 0);
  const totalPiggySpent = expenses
    .filter((e) => e.paidById === 'piggy-bank')
    .reduce((sum, e) => sum + e.baseAmount, 0);
  const piggyRemaining = Math.max(0, totalPiggyDeposited - totalPiggySpent);

  return (
    <div className="space-y-4 pb-20">
      {/* Trip Header Summary Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#1d2638] dark:to-[#141b27] border border-slate-200 dark:border-[#2c3954] shadow-sm dark:shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#ff6b6b] tracking-wider uppercase">
              {activeTrip.destination}
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{activeTrip.title}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{activeTrip.members.length} 人同行</span>
              <span>•</span>
              <span>{expenses.length} 笔支出</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">总花费折合</span>
            <span className="text-xl font-black text-[#06d6a0]">
              {activeTrip.currencySymbol} {totalSpent.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
            {activeTrip.budget && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                预算 {activeTrip.currencySymbol} {activeTrip.budget.toLocaleString()} (
                {Math.round((totalSpent / activeTrip.budget) * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* Piggy Bank Integrated Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🐷</span>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <span>公账基金余额:</span>
                <span className="text-amber-500 font-mono font-black">
                  {activeTrip.currencySymbol} {piggyRemaining.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                累计集资 {activeTrip.currencySymbol}{totalPiggyDeposited.toFixed(2)} • 公账已付 {activeTrip.currencySymbol}{totalPiggySpent.toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30 transition-all flex items-center space-x-1 active:scale-95 shadow-xs"
          >
            <span>+ 集资充值</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Category Filter Chips */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="搜索费用名称 (例如：拉面、特急车票)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#161c28] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#28354d] focus:outline-none focus:border-[#ff6b6b] placeholder:text-slate-400 shadow-xs"
          />
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#ff6b6b] text-white shadow-xs'
                : 'bg-white dark:bg-[#161c28] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#28354d]'
            }`}
          >
            全部
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => {
            const Icon = conf.icon;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#ff6b6b] text-white font-bold shadow-xs'
                    : 'bg-white dark:bg-[#161c28] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#28354d]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{conf.name.split('/')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Stream */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#161c28] rounded-2xl border border-slate-200 dark:border-[#28354d] p-6 shadow-xs">
          <Utensils className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">暂无符合条件的费用记录</p>
          <p className="text-xs text-slate-500 mt-1">点击下方中间的 “➕ 记一笔” 快速添加吧！</p>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#ff6b6b] text-white text-xs font-bold shadow-md shadow-[#ff6b6b]/30"
          >
            立即记第一笔
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateStr, items]) => {
            const dayTotal = items.reduce((sum, item) => sum + item.baseAmount, 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-[#ff6b6b]" />
                    <span>{dateStr}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    当日小计: {activeTrip.currencySymbol} {dayTotal.toFixed(2)}
                  </span>
                </div>

                {/* Expense Cards */}
                <div className="space-y-2">
                  {items.map((exp) => {
                    const cat = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.general;
                    const CatIcon = cat.icon;
                    const payer = memberMap.get(exp.paidById);
                    const splitCount = Object.keys(exp.splitDetails).length;

                    return (
                      <div
                        key={exp.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#26334a] hover:border-[#ff6b6b]/50 transition-all space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between space-x-3">
                          {/* Left: Category Icon + Title + Tags */}
                          <div className="flex items-start space-x-3 truncate">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cat.bg}`}>
                              <CatIcon className="w-5 h-5" />
                            </div>

                            <div className="truncate">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {exp.title}
                              </h4>

                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {/* Payer Avatar Tag / Piggy Bank Badge */}
                                {exp.paidById === 'piggy-bank' ? (
                                  <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/30">
                                    <span>🐷 公账付款</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center space-x-1">
                                    <span
                                      style={{ backgroundColor: payer?.avatarColor || '#666' }}
                                      className="w-2.5 h-2.5 rounded-full inline-block"
                                    />
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {payer?.name || '未知付款人'} 付款
                                    </span>
                                  </span>
                                )}

                                <span>•</span>

                                {/* Split Info */}
                                <span className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                                  <Users className="w-3 h-3" />
                                  <span>{splitCount}人分摊</span>
                                </span>

                                {/* Receipt Thumbnail Tag */}
                                {exp.receiptImage && (
                                  <button
                                    onClick={() => setPreviewImage(exp.receiptImage || null)}
                                    className="flex items-center space-x-0.5 text-[#ff6b6b] hover:underline"
                                    title="查看发票图片"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>小票</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Amounts + Edit + Delete */}
                          <div className="text-right shrink-0 flex items-center space-x-2">
                            <div>
                              {/* Converted Base Currency */}
                              <div className="text-sm font-black text-[#ff6b6b]">
                                {activeTrip.currencySymbol} {exp.baseAmount.toFixed(2)}
                              </div>

                              {/* Original Local Currency */}
                              {exp.currency !== activeTrip.baseCurrency && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  原币: {exp.currency} {exp.amount.toLocaleString()}
                                </div>
                              )}
                            </div>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleStartEdit(exp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                              title="修改该笔支出"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => deleteExpense(exp.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="删除该笔支出"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Individual Split Breakdown Chips */}
                        <div className="pt-2 border-t border-slate-100 dark:border-[#1f293d] flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[10px]">
                          <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0">分摊详情:</span>
                          {Object.entries(exp.splitDetails).map(([mId, share]) => {
                            const member = memberMap.get(mId);
                            return (
                              <span
                                key={mId}
                                className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-[#0e121b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#243046] shrink-0 flex items-center space-x-1 font-mono"
                              >
                                <span
                                  style={{ backgroundColor: member?.avatarColor || '#666' }}
                                  className="w-1.5 h-1.5 rounded-full inline-block"
                                />
                                <span>{member?.name || mId}:</span>
                                <span className="font-bold text-[#ff6b6b]">{activeTrip.currencySymbol}{share.toFixed(2)}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full max-h-[85vh] overflow-hidden rounded-2xl bg-black border border-white/20 p-2">
            <img src={previewImage} alt="Receipt Preview" className="w-full h-auto object-contain rounded-xl" />
            <p className="text-center text-xs text-slate-400 mt-2">点击任意区域关闭预览</p>
          </div>
        </div>
      )}
    </div>
  );
};
