import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { SUPPORTED_CURRENCIES } from '../engine/currencyConverter';
import { db } from '../db/dexie';
import {
  Coins,
  Download,
  Upload,
  Check,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { CurrencyCode } from '../types';

export const SettingsView: React.FC = () => {
  const { customRates, updateCustomRate, trips, allExpenses } = useTrip();
  const [editingCurrency, setEditingCurrency] = useState<CurrencyCode | null>(null);
  const [editRateVal, setEditRateVal] = useState<string>('');
  const [backupSuccess, setBackupSuccess] = useState(false);

  const handleEditRate = (code: CurrencyCode) => {
    setEditingCurrency(code);
    const cur = customRates[code] ?? SUPPORTED_CURRENCIES[code].defaultRateToUSD;
    setEditRateVal(cur.toString());
  };

  const handleSaveRate = (code: CurrencyCode) => {
    const val = parseFloat(editRateVal);
    if (!isNaN(val) && val > 0) {
      updateCustomRate(code, val);
    }
    setEditingCurrency(null);
  };

  const handleExportBackup = () => {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      trips,
      expenses: allExpenses,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triptab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 2500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result as string);
        if (json.trips && Array.isArray(json.trips)) {
          await db.trips.bulkPut(json.trips);
        }
        if (json.expenses && Array.isArray(json.expenses)) {
          await db.expenses.bulkPut(json.expenses);
        }
        alert('数据恢复成功！正在重新加载...');
        window.location.reload();
      } catch {
        alert('导入失败，请确保文件是有效的 TripTab 备份 JSON。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">汇率与设置</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">管理离线换算汇率基准及本地数据安全备份</p>
      </div>

      {/* Currency Exchange Rates Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Coins className="w-4 h-4 text-[#ffd166]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">离线汇率转换矩阵 (对 USD)</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          点击任意货币汇率可手动自定义调整（例如你实际兑换现金时的真实汇率）：
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.entries(SUPPORTED_CURRENCIES).map(([cCode, config]) => {
            const code = cCode as CurrencyCode;
            const currentRate = customRates[code] ?? config.defaultRateToUSD;
            const isEditing = editingCurrency === code;

            return (
              <div
                key={code}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] flex items-center justify-between transition-all"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{code}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">({config.symbol})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[80px]">
                    {config.name}
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="any"
                      autoFocus
                      value={editRateVal}
                      onChange={(e) => setEditRateVal(e.target.value)}
                      className="w-16 px-1.5 py-1 text-xs bg-white dark:bg-[#1f293d] border border-[#ff6b6b] rounded text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      onClick={() => handleSaveRate(code)}
                      className="p-1 rounded bg-[#06d6a0] text-slate-900 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditRate(code)}
                    className="text-right hover:opacity-80 transition-opacity"
                    title="点击修改汇率"
                  >
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {currentRate.toFixed(4)}
                    </div>
                    <div className="text-[9px] text-[#ff6b6b] font-medium">点击调整</div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-[#06d6a0]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">数据安全与离线导出</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          所有旅行账本、小票照片均优先存储在手机本地数据库中。你可以随时将全量数据导出为 JSON
          进行永久归档或换手机迁移：
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] hover:border-[#06d6a0] text-slate-800 dark:text-slate-200 text-xs font-bold flex flex-col items-center justify-center space-y-1.5 transition-colors"
          >
            <Download className="w-5 h-5 text-[#06d6a0]" />
            <span>{backupSuccess ? '已成功导出 JSON ✓' : '导出备份文件'}</span>
          </button>

          <label className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] hover:border-[#ff6b6b] text-slate-800 dark:text-slate-200 text-xs font-bold flex flex-col items-center justify-center space-y-1.5 cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-[#ff6b6b]" />
            <span>恢复备份数据</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* PWA Info */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] shadow-sm flex items-start space-x-3">
        <Smartphone className="w-5 h-5 text-[#4cc9f0] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white">离线 PWA 支持状态</h3>
          <p>
            本应用支持离线运行与安装到手机主屏幕。无网络时所有改动会自动记录在 Dexie
            数据库，联网时自动广播同步。
          </p>
        </div>
      </div>
    </div>
  );
};
