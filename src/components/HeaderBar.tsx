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
    <header className="sticky top-0 z-30 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12 bg-[#F3EDE0]/92 dark:bg-[#12110F]/92 backdrop-blur-md transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate(hasUserProfile ? 'lobby' : 'ritual')}
          className="font-serif-editorial text-xl sm:text-2xl font-semibold tracking-tight text-[#1B1917] dark:text-[#EDE5D5] whitespace-nowrap shrink-0 hover:text-[#425546] dark:hover:text-[#7E9783] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] rounded"
        >
          Trà Đàm
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Điều hướng chính" className="hidden sm:flex items-center gap-7 text-sm">
          <button
            type="button"
            onClick={() => onNavigate('ritual')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
              currentScreen === 'ritual'
                ? 'border-[#425546] text-[#1B1917] dark:border-[#7E9783] dark:text-[#EDE5D5] font-medium'
                : 'border-transparent text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5]'
            }`}
          >
            Khai Trà
          </button>

          <button
            type="button"
            disabled={!hasUserProfile}
            onClick={() => onNavigate('lobby')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
              !hasUserProfile
                ? 'border-transparent text-[#5C554C]/40 dark:text-[#A89F91]/35 cursor-not-allowed'
                : currentScreen === 'lobby'
                  ? 'border-[#425546] text-[#1B1917] dark:border-[#7E9783] dark:text-[#EDE5D5] font-medium'
                  : 'border-transparent text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5]'
            }`}
          >
            Sảnh Trà Thất
          </button>

          {hasActiveRoom && (
            <button
              type="button"
              onClick={() => onNavigate('table')}
              className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
                currentScreen === 'table'
                  ? 'border-[#425546] text-[#1B1917] dark:border-[#7E9783] dark:text-[#EDE5D5] font-medium'
                  : 'border-transparent text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5]'
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
            aria-label={darkMode ? 'Chuyển sang giấy dó ban ngày' : 'Chuyển sang mực tàu đêm tĩnh'}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] bg-[#E8DFCE] dark:bg-[#1B1916] border border-[#1B1917]/12 dark:border-[#EDE5D5]/14 hover:border-[#425546]/45 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
          >
            {darkMode ? <Sun className="w-4 h-4 text-[#BEA080]" /> : <Moon className="w-4 h-4 text-[#425546]" />}
            <span>{darkMode ? 'Giấy dó' : 'Mực tàu'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
