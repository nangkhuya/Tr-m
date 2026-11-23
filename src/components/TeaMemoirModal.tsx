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
    label: 'Giấy Dó Mộc',
    cardClass: 'bg-[#F3EDE0] border-[#7D5E43]/34',
    textClass: 'text-[#1B1917]',
    mutedClass: 'text-[#5C554C]',
  },
  {
    id: 'moss-silk',
    label: 'Lụa Xanh Rêu',
    cardClass: 'bg-[#364539] border-[#EFE7D8]/25',
    textClass: 'text-[#F7F3EA]',
    mutedClass: 'text-[#D6D0C4]',
  },
  {
    id: 'ink-moon',
    label: 'Đêm Trăng Mực Tàu',
    cardClass: 'bg-[#141311] border-[#EDE5D5]/22',
    textClass: 'text-[#EDE5D5]',
    mutedClass: 'text-[#A89F91]',
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#1B1917]/60 dark:bg-black/75 p-4 sm:p-6 flex items-center justify-center"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-[#F3EDE0] dark:bg-[#161512] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 shadow-2xl p-6 sm:p-8 my-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
          <div>
            <h2
              id="memoir-modal-title"
              className="font-serif-editorial text-2xl sm:text-3xl font-medium text-[#1B1917] dark:text-[#EDE5D5]"
            >
              Tàn Trà &amp; Lưu Trà Ký
            </h2>
            <p className="text-xs sm:text-sm text-[#5C554C] dark:text-[#A89F91] mt-1">
              Giữ lại một câu chữ đẹp làm kỷ niệm của buổi trà hôm nay
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại Trà Ký"
            className="p-2 rounded-lg text-[#5C554C] hover:text-[#1B1917] dark:text-[#A89F91] dark:hover:text-[#EDE5D5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <p className="font-serif-editorial italic text-xl text-[#1B1917] dark:text-[#EDE5D5]">
              Trà Chủ đang chắt lọc lại những lời đẹp nhất...
            </p>
            <p className="text-sm text-[#5C554C] dark:text-[#A89F91]">
              Xin chờ một nhịp để mực tàu thơm ráo trên giấy dó.
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#425546] text-[#F9F5EB] text-sm font-medium"
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
                className="px-4 py-2 rounded-lg border border-[#1B1917]/15 dark:border-[#EDE5D5]/18 text-sm text-[#1B1917] dark:text-[#EDE5D5]"
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
                <span className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-2.5">
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
                            ? 'bg-[#425546] text-[#F9F5EB] border-[#425546] dark:bg-[#7E9783] dark:text-[#12110F] dark:border-[#7E9783]'
                            : 'bg-[#E8DFCE] dark:bg-[#23201C] text-[#1B1917] dark:text-[#EDE5D5] border-[#1B1917]/12 dark:border-[#EDE5D5]/12'
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
                  className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-1.5"
                >
                  Chỉnh sửa câu trích dẫn
                </label>
                <textarea
                  id="memoir-quote-edit"
                  rows={3}
                  value={memoir.best_quote}
                  onChange={(e) => onUpdateMemoir({ ...memoir, best_quote: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F9F5EB] dark:bg-[#23201C] text-sm text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/14 dark:border-[#EDE5D5]/14 focus:outline-none focus:ring-2 focus:ring-[#425546]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="memoir-author-edit"
                    className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-1.5"
                  >
                    Tác giả câu nói
                  </label>
                  <input
                    id="memoir-author-edit"
                    type="text"
                    value={memoir.author}
                    onChange={(e) => onUpdateMemoir({ ...memoir, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F9F5EB] dark:bg-[#23201C] text-sm text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/14 dark:border-[#EDE5D5]/14 focus:outline-none focus:ring-2 focus:ring-[#425546]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="memoir-note-edit"
                    className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-1.5"
                  >
                    Lời Trà Chủ
                  </label>
                  <input
                    id="memoir-note-edit"
                    type="text"
                    value={memoir.tea_master_note}
                    onChange={(e) => onUpdateMemoir({ ...memoir, tea_master_note: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F9F5EB] dark:bg-[#23201C] text-sm text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/14 dark:border-[#EDE5D5]/14 focus:outline-none focus:ring-2 focus:ring-[#425546]"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#425546] hover:bg-[#354639] dark:bg-[#728B77] dark:hover:bg-[#829C87] text-[#F9F5EB] dark:text-[#12110F] text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'Đang kết xuất ảnh...' : 'Tải Trà Ký về máy'}</span>
                </button>

                <button
                  type="button"
                  onClick={onReturnToLobby}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5]"
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
