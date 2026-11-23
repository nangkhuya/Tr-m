import React, { useState } from 'react';
import { Download, RotateCcw, X } from 'lucide-react';
import type { MemoirData, PostcardTheme } from '../types/tea';
import { renderMemoirPostcardToPng } from '../utils/memoirCanvas';
import { formatVietnameseDate } from '../utils/teaRules';
import { RedSealStamp, TeaBranchArtwork } from './TeaIllustrations';

interface TeaMemoirModalProps {
  open: boolean;
  isLoading: boolean;
  error: string | null;
  memoir: MemoirData | null;
  teaName: string;
  roomName: string;
  onRetry: () => void;
  onUpdateMemoir: (next: MemoirData) => void;
  onClose: () => void;
  onReturnToLobby: () => void;
}

const THEME_OPTIONS: { id: PostcardTheme; label: string; cardClass: string; textClass: string; mutedClass: string }[] = [
  {
    id: 'ivory-paper',
    label: 'Giấy Dó Sáng',
    cardClass: 'bg-[#FDFBF7] border-[#8C6D53]/30',
    textClass: 'text-[#2C2C2C]',
    mutedClass: 'text-[#6E6A63]',
  },
  {
    id: 'moss-silk',
    label: 'Lụa Xanh Rêu',
    cardClass: 'bg-[#38463B] border-[#F4EFE6]/25',
    textClass: 'text-[#F7F3EA]',
    mutedClass: 'text-[#D6D0C4]',
  },
  {
    id: 'ink-moon',
    label: 'Đêm Trăng Mực Tàu',
    cardClass: 'bg-[#1E1D1B] border-[#EAE4D9]/22',
    textClass: 'text-[#EAE4D9]',
    mutedClass: 'text-[#A8A298]',
  },
];

export const TeaMemoirModal: React.FC<TeaMemoirModalProps> = ({
  open,
  isLoading,
  error,
  memoir,
  teaName,
  roomName,
  onRetry,
  onUpdateMemoir,
  onClose,
  onReturnToLobby,
}) => {
  const [theme, setTheme] = useState<PostcardTheme>('ivory-paper');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!open) return null;

  const activeTheme = THEME_OPTIONS.find((t) => t.id === theme) ?? THEME_OPTIONS[0];
  const dateLabel = formatVietnameseDate();

  const handleDownload = async () => {
    if (!memoir) return;
    try {
      setIsDownloading(true);
      const dataUrl = await renderMemoirPostcardToPng({
        memoir,
        teaName,
        roomName,
        dateLabel,
        theme,
      });
      const link = document.createElement('a');
      link.download = `tra-ky-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="memoir-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#2C2C2C]/60 dark:bg-black/75 p-4 sm:p-6 flex items-center justify-center"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-[#FDFBF7] dark:bg-[#191714] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/15 shadow-2xl p-6 sm:p-8 my-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2C2C2C]/10 dark:border-[#EAE4D9]/10">
          <div>
            <h2
              id="memoir-modal-title"
              className="font-serif-editorial text-2xl sm:text-3xl font-medium text-[#2C2C2C] dark:text-[#EAE4D9]"
            >
              Tàn Trà &amp; Lưu Trà Ký
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6A63] dark:text-[#A6A095] mt-1">
              Giữ lại một câu chữ đẹp làm kỷ niệm của buổi trà hôm nay
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại Trà Ký"
            className="p-2 rounded-lg text-[#6E6A63] hover:text-[#2C2C2C] dark:text-[#A6A095] dark:hover:text-[#EAE4D9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <p className="font-serif-editorial italic text-xl text-[#2C2C2C] dark:text-[#EAE4D9]">
              Trà Chủ đang chắt lọc lại những lời đẹp nhất...
            </p>
            <p className="text-sm text-[#6E6A63] dark:text-[#A6A095]">
              Xin chờ một nhịp để mực thơm ráo trên giấy dó.
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center space-y-5">
            <p role="alert" className="text-sm text-[#A63A3A] dark:text-[#E07A7A] max-w-md mx-auto">
              {error}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4A5D4E] text-[#FDFBF7] text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử chắt lọc lại</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateMemoir({
                    best_quote:
                      'Một chén trà ấm giữa ngày dài, đủ để nghe thấy tiếng lòng mình đang lắng lại.',
                    author: 'Tri kỷ',
                    tea_master_note: 'Cảm ơn bạn đã nán lại cùng hiên trà hôm nay.',
                  })
                }
                className="px-4 py-2 rounded-lg border border-[#2C2C2C]/15 dark:border-[#EAE4D9]/18 text-sm text-[#2C2C2C] dark:text-[#EAE4D9]"
              >
                Tự ghi Trà Ký thủ công
              </button>
            </div>
          </div>
        ) : memoir ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 4:5 Postcard Preview */}
            <div className="lg:col-span-6 flex justify-center">
              <div
                data-testid="memoir-postcard-preview"
                className={`w-full max-w-[360px] aspect-[4/5] rounded-sm border p-5 sm:p-6 flex flex-col justify-between relative shadow-md transition-colors duration-400 ${activeTheme.cardClass}`}
              >
                <div className="border border-current/15 p-5 h-full flex flex-col justify-between relative">
                  <TeaBranchArtwork className={`w-20 sm:w-24 absolute top-2 right-2 opacity-35 pointer-events-none ${activeTheme.mutedClass}`} />

                  <div className="pr-16">
                    <p className={`text-[11px] uppercase tracking-[0.16em] ${activeTheme.mutedClass}`}>
                      Trà Ký · {roomName}
                    </p>
                    <p className={`text-xs mt-1 ${activeTheme.mutedClass}`}>
                      {teaName} · {dateLabel}
                    </p>
                    <div className="w-16 h-px bg-current opacity-20 mt-4" />
                  </div>

                  <div className="my-auto py-4">
                    <span className={`font-serif-editorial text-4xl leading-none opacity-45 block ${activeTheme.mutedClass}`}>
                      “
                    </span>
                    <p className={`font-serif-editorial italic text-lg sm:text-xl leading-relaxed mt-1 ${activeTheme.textClass}`}>
                      {memoir.best_quote}
                    </p>
                    <p className={`text-xs sm:text-sm mt-4 ${activeTheme.mutedClass}`}>
                      — {memoir.author}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-current/15 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <p className={`text-[10px] uppercase tracking-[0.15em] ${activeTheme.mutedClass}`}>
                        Lời Trà Chủ
                      </p>
                      <p className={`text-xs leading-relaxed mt-1 ${activeTheme.textClass}`}>
                        {memoir.tea_master_note}
                      </p>
                    </div>
                    <RedSealStamp size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Customization & Export Controls */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-2.5">
                  Phong cách giấy thiệp
                </span>
                <div className="flex flex-wrap gap-2">
                  {THEME_OPTIONS.map((item) => {
                    const selected = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTheme(item.id)}
                        aria-pressed={selected}
                        className={`px-3.5 py-2 rounded-lg text-xs font-medium border whitespace-nowrap shrink-0 transition-colors ${
                          selected
                            ? 'bg-[#4A5D4E] text-[#FDFBF7] border-[#4A5D4E] dark:bg-[#7C9481] dark:text-[#161513] dark:border-[#7C9481]'
                            : 'bg-[#F4EFE6] dark:bg-[#23201C] text-[#2C2C2C] dark:text-[#EAE4D9] border-[#2C2C2C]/10 dark:border-[#EAE4D9]/12'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="memoir-quote-edit"
                  className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-1.5"
                >
                  Chỉnh sửa câu trích dẫn
                </label>
                <textarea
                  id="memoir-quote-edit"
                  rows={3}
                  value={memoir.best_quote}
                  onChange={(e) => onUpdateMemoir({ ...memoir, best_quote: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4EFE6] dark:bg-[#23201C] text-sm text-[#2C2C2C] dark:text-[#EAE4D9] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/14 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="memoir-author-edit"
                    className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-1.5"
                  >
                    Tác giả câu nói
                  </label>
                  <input
                    id="memoir-author-edit"
                    type="text"
                    value={memoir.author}
                    onChange={(e) => onUpdateMemoir({ ...memoir, author: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F4EFE6] dark:bg-[#23201C] text-sm text-[#2C2C2C] dark:text-[#EAE4D9] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/14 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="memoir-note-edit"
                    className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-1.5"
                  >
                    Lời Trà Chủ
                  </label>
                  <input
                    id="memoir-note-edit"
                    type="text"
                    value={memoir.tea_master_note}
                    onChange={(e) => onUpdateMemoir({ ...memoir, tea_master_note: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#F4EFE6] dark:bg-[#23201C] text-sm text-[#2C2C2C] dark:text-[#EAE4D9] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/14 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#4A5D4E] hover:bg-[#3D4E41] dark:bg-[#6E8572] dark:hover:bg-[#7C9481] text-[#FDFBF7] dark:text-[#161513] text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Đang kết xuất ảnh...' : 'Tải Trà Ký về máy'}</span>
                </button>

                <button
                  type="button"
                  onClick={onReturnToLobby}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-[#6E6A63] dark:text-[#A6A095] hover:text-[#2C2C2C] dark:hover:text-[#EAE4D9]"
                >
                  Quay lại Sảnh Trà
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
