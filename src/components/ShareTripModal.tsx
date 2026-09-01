import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, MessageSquare, QrCode } from 'lucide-react';

export const ShareTripModal: React.FC = () => {
  const { activeTrip, isShareModalOpen, setIsShareModalOpen } = useTrip();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isShareModalOpen || !activeTrip) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}?trip=${activeTrip.tripCode}`;
  const inviteText = `🛫 邀请你加入【${activeTrip.title}】旅行记账本！无需注册或输入密码，点击链接直接加入：\n${shareUrl}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyInviteText = () => {
    navigator.clipboard.writeText(inviteText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161c28] border border-slate-200 dark:border-[#28354d] rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#26334a]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#ff6b6b]/15 text-[#ff6b6b] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">邀请旅行好友加入</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">免注册 · 手机扫码或点开即用</p>
            </div>
          </div>

          <button
            onClick={() => setIsShareModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center py-3 bg-slate-50 dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#243046]">
          <div className="p-3 bg-white rounded-xl shadow-md border border-slate-100">
            <QRCodeSVG
              value={shareUrl}
              size={180}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0e121b"
            />
          </div>
          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mt-2.5">
            手机原生相机 / 微信扫码即刻入团
          </p>
        </div>

        {/* Trip Code Display & Quick Copy */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0e121b] border border-slate-200 dark:border-[#243046] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">行程专属邀请码</span>
            <span className="text-sm font-mono font-black text-[#ff6b6b] tracking-wider">
              {activeTrip.tripCode}
            </span>
          </div>
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1.5 rounded-lg bg-[#ff6b6b] text-white text-xs font-bold shadow-md shadow-[#ff6b6b]/30 flex items-center space-x-1 active:scale-95 transition-transform"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已复制链接</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制链接</span>
              </>
            )}
          </button>
        </div>

        {/* 1-Click WhatsApp / WeChat Text Share */}
        <button
          onClick={handleCopyInviteText}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#20293d] hover:bg-slate-200 dark:hover:bg-[#28354f] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors active:scale-98"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#06d6a0]" />
          <span>{copiedText ? '已复制群邀请文案 ✓' : '复制微信 / WhatsApp 邀请语'}</span>
        </button>
      </div>
    </div>
  );
};
