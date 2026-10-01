import React from 'react';
import { X, Bell, Send, Zap, Award, ExternalLink, CheckCircle } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onSelectDeal?: (dealId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectDeal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        {/* Drawer Header */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Bildirishnomalar</h3>
              <p className="text-[11px] text-emerald-300">
                Tezkor aksiyalar va Telegram yangiliklari
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telegram Channel Callout Card */}
        <div className="m-4 p-3.5 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-sky-950">@kuponuz_deals</span>
                <CheckCircle className="w-3.5 h-3.5 text-sky-500 fill-sky-100" />
              </div>
              <p className="text-[11px] text-sky-700">Rasmiy Telegram kanalimiz</p>
            </div>
          </div>

          <a
            href="https://t.me/kuponuz_deals"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
          >
            <span>Obuna</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Hozircha yangi bildirishnoma yo'q</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isTelegram = notif.type === 'telegram_post';
              const isFlash = notif.type === 'flash_sale';
              const isEco = notif.type === 'eco_reward';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.linkDealId && onSelectDeal) {
                      onSelectDeal(notif.linkDealId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-white border-slate-200 opacity-80'
                      : 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                  } hover:border-emerald-400`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isTelegram
                          ? 'bg-sky-100 text-sky-700'
                          : isFlash
                          ? 'bg-amber-100 text-amber-700'
                          : isEco
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isTelegram ? (
                        <Send className="w-4 h-4" />
                      ) : isFlash ? (
                        <Zap className="w-4 h-4" />
                      ) : isEco ? (
                        <Award className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-400">
            Kupon.uz barcha xabarlarni real vaqt rejimida taqdim etadi
          </p>
        </div>
      </div>
    </div>
  );
};
