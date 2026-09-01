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
      } catch (err) {
        alert('导入失败，请确保文件是有效的 TripTab 备份 JSON。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">汇率与设置</h1>
        <p className="text-xs text-slate-400">离线汇率转换矩阵、数据备份与 PWA 配置</p>
      </div>

      {/* Offline Currencies Table */}
      <div className="p-4 rounded-2xl bg-[#161c28] border border-[#28354d] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-[#ffd166]" />
            <h3 className="text-sm font-bold text-white">离线汇率换算比率 (对 USD)</h3>
          </div>
          <span className="text-[10px] text-slate-400">支持飞机/断网使用</span>
        </div>

        <div className="space-y-2">
          {Object.entries(SUPPORTED_CURRENCIES).map(([codeKey, conf]) => {
            const code = codeKey as CurrencyCode;
            const currentRate = customRates[code] ?? conf.defaultRateToUSD;
            const isEditing = editingCurrency === code;

            return (
              <div
                key={code}
                className="p-2.5 rounded-xl bg-[#0e121b] border border-[#26334a] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-white">{code}</span>
                    <span className="text-[11px] text-slate-400">({conf.name})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">符号: {conf.symbol}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="any"
                        value={editRateVal}
                        onChange={(e) => setEditRateVal(e.target.value)}
                        className="w-20 px-2 py-1 rounded bg-[#1f293d] text-white text-xs border border-[#ff6b6b] focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRate(code)}
                        className="p-1 rounded bg-[#ff6b6b] text-white hover:bg-[#ff8e53]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditRate(code)}
                      className="text-right hover:opacity-80 transition-opacity"
                    >
                      <span className="text-xs font-mono font-bold text-[#ffd166]">
                        1 {code} = {currentRate} USD
                      </span>
                      <span className="text-[9px] text-slate-500 block">点击修改</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="p-4 rounded-2xl bg-[#161c28] border border-[#28354d]">
        <div className="flex items-center space-x-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#06d6a0]" />
          <h3 className="text-sm font-bold text-white">本地数据备份与迁移</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            className="p-3 rounded-xl bg-[#0e121b] border border-[#26334a] hover:border-[#06d6a0] flex flex-col items-center justify-center space-y-1.5 transition-all text-slate-300 hover:text-white"
          >
            <Download className="w-5 h-5 text-[#06d6a0]" />
            <span className="text-xs font-bold">
              {backupSuccess ? '导出成功 ✓' : '导出备份 JSON'}
            </span>
          </button>

          <label className="p-3 rounded-xl bg-[#0e121b] border border-[#26334a] hover:border-[#ff6b6b] flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer text-slate-300 hover:text-white">
            <Upload className="w-5 h-5 text-[#ff6b6b]" />
            <span className="text-xs font-bold">恢复 / 导入数据</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
      </div>

      {/* PWA Installation Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1c2436] to-[#141a27] border border-[#2c3850] flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#ff6b6b]/20 text-[#ff6b6b] flex items-center justify-center shrink-0 border border-[#ff6b6b]/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-white">安装到手机主屏幕</h4>
          <p className="text-slate-400 mt-0.5">
            在 Safari 点击「分享 ➔ 添加到主屏幕」，在 Chrome 点击「安装应用」，即可体验原生全屏与无网离线记账！
          </p>
        </div>
      </div>
    </div>
  );
};
