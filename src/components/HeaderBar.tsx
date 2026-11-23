import React from 'react';
import { Moon, Sun } from 'lucide-react';
import type { AppScreen } from '../types/tea';

interface HeaderBarProps {
  currentScreen: AppScreen;
  hasUserProfile: boolean;
  hasActiveRoom: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentScreen,
  hasUserProfile,
  hasActiveRoom,
  darkMode,
  onToggleDarkMode,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#2C2C2C]/10 dark:border-[#EAE4D9]/10 bg-[#FDFBF7]/92 dark:bg-[#161513]/92 backdrop-blur-md transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate(hasUserProfile ? 'lobby' : 'ritual')}
          className="font-serif-editorial text-xl sm:text-2xl font-semibold tracking-tight text-[#2C2C2C] dark:text-[#EAE4D9] whitespace-nowrap shrink-0 hover:text-[#4A5D4E] dark:hover:text-[#7C9481] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E] rounded"
        >
          Trà Đàm
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Điều hướng chính" className="hidden sm:flex items-center gap-7 text-sm">
          <button
            type="button"
            onClick={() => onNavigate('ritual')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E] ${
              currentScreen === 'ritual'
                ? 'border-[#4A5D4E] text-[#2C2C2C] dark:border-[#7C9481] dark:text-[#EAE4D9] font-medium'
                : 'border-transparent text-[#6E6A63] dark:text-[#A6A095] hover:text-[#2C2C2C] dark:hover:text-[#EAE4D9]'
            }`}
          >
            Khai Trà
          </button>

          <button
            type="button"
            disabled={!hasUserProfile}
            onClick={() => onNavigate('lobby')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E] ${
              !hasUserProfile
                ? 'border-transparent text-[#6E6A63]/40 dark:text-[#A6A095]/35 cursor-not-allowed'
                : currentScreen === 'lobby'
                  ? 'border-[#4A5D4E] text-[#2C2C2C] dark:border-[#7C9481] dark:text-[#EAE4D9] font-medium'
                  : 'border-transparent text-[#6E6A63] dark:text-[#A6A095] hover:text-[#2C2C2C] dark:hover:text-[#EAE4D9]'
            }`}
          >
            Sảnh Trà Thất
          </button>

          {hasActiveRoom && (
            <button
              type="button"
              onClick={() => onNavigate('table')}
              className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E] ${
                currentScreen === 'table'
                  ? 'border-[#4A5D4E] text-[#2C2C2C] dark:border-[#7C9481] dark:text-[#EAE4D9] font-medium'
                  : 'border-transparent text-[#6E6A63] dark:text-[#A6A095] hover:text-[#2C2C2C] dark:hover:text-[#EAE4D9]'
              }`}
            >
              Bàn Đàm Đạo
            </button>
          )}
        </nav>

        {/* Zone 3: Single primary/utility action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Chuyển sang ánh sáng ban ngày' : 'Chuyển sang chế độ đêm dịu mắt'}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] bg-[#F4EFE6] dark:bg-[#201E1B] border border-[#2C2C2C]/10 dark:border-[#EAE4D9]/12 hover:border-[#4A5D4E]/40 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E]"
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#B79373]" /> : <Moon className="w-4 h-4 text-[#4A5D4E]" />}
            <span>{darkMode ? 'Ban ngày' : 'Đêm tĩnh'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
