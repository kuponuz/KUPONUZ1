import React, { useState } from 'react';
import { X, Heart, Bell, Trash2, Ticket, ArrowRight } from 'lucide-react';
import { Deal } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistDeals: Deal[];
  onRemoveFromWishlist: (dealId: string) => void;
  onClaimCoupon: (deal: Deal) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistDeals,
  onRemoveFromWishlist,
  onClaimCoupon,
}) => {
  const [alertsEnabled, setAlertsEnabled] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleAlert = (dealId: string) => {
    setAlertsEnabled((prev) => ({
      ...prev,
      [dealId]: !prev[dealId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[85vh] shadow-2xl border border-emerald-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 border border-emerald-700 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Sevimlilar (Wishlist)
              </h3>
              <p className="text-[11px] text-emerald-300">
                Saqlab qo'yilgan chegirmali tovarlar ({wishlistDeals.length})
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {wishlistDeals.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                Sevimlilar ro'yxati hozircha bo'sh
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Yoqqan mahsulotlarning yurakcha belgisini bosib saqlab qo'ying!
              </p>
            </div>
          ) : (
            wishlistDeals.map((deal) => {
              const isAlertOn = alertsEnabled[deal.id] ?? true;
              return (
                <div
                  key={deal.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center gap-3 hover:border-emerald-300 transition-all"
                >
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {deal.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{deal.storeName}</p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-extrabold text-xs text-emerald-700">
                        {deal.discountPrice.toLocaleString()} so'm
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        {deal.originalPrice.toLocaleString()} so'm
                      </span>
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                        -{deal.discountPercent}%
                      </span>
                    </div>

                    {/* Price drop notification switch */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => toggleAlert(deal.id)}
                        className={`text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                          isAlertOn
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                        title="Narx yanada arzonlashsa xabar berish"
                      >
                        <Bell className="w-3 h-3 text-amber-600" />
                        <span>{isAlertOn ? 'Xabardorlik faol' : 'Xabar kutish'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => onRemoveFromWishlist(deal.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onClaimCoupon(deal);
                        onClose();
                      }}
                      className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-300" />
                      <span>Band qilish</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
