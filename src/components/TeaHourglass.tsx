import React, { useEffect, useId, useRef, useState } from 'react';
import { Bell, Pause, Play, RotateCcw } from 'lucide-react';
import {
  computeHourglassProgress,
  DEFAULT_HOURGLASS_MINUTES,
  formatHourglassTime,
  HOURGLASS_PRESET_MINUTES,
  stepHourglassTick,
  type HourglassPresetMinutes,
} from '../utils/teaRules';
import { soundscapeEngine } from '../utils/soundscape';

interface TeaHourglassProps {
  onOpenMemoir?: () => void;
}

export const TeaHourglass: React.FC<TeaHourglassProps> = ({ onOpenMemoir }) => {
  const [durationMinutes, setDurationMinutes] = useState<HourglassPresetMinutes>(
    DEFAULT_HOURGLASS_MINUTES
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    DEFAULT_HOURGLASS_MINUTES * 60
  );
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [isScrolledPast, setIsScrolledPast] = useState<boolean>(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const hasRungRef = useRef<boolean>(false);

  const rawId = useId().replace(/:/g, '');
  const topClipId = `hg-top-${rawId}`;
  const bottomClipId = `hg-bottom-${rawId}`;

  const totalSeconds = durationMinutes * 60;
  const isFinished = remainingSeconds === 0;
  const { remainingRatio, elapsedRatio } = computeHourglassProgress(
    remainingSeconds,
    totalSeconds
  );

  // Clean 1-second tick without side effects inside state updater
  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => stepHourglassTick(prev).nextRemaining);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, remainingSeconds]);

  // Strike single resonant bell exactly once upon reaching 00:00
  useEffect(() => {
    if (remainingSeconds > 0) {
      hasRungRef.current = false;
      return;
    }
    if (!hasRungRef.current) {
      hasRungRef.current = true;
      setIsRunning(false);
      soundscapeEngine.playHourglassComplete();
    }
  }, [remainingSeconds]);

  // Observe whether main hourglass card has scrolled out of view to toggle bottom-left popup
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof window === 'undefined') return;

    const checkScrollVisibility = () => {
      const rect = el.getBoundingClientRect();
      setIsScrolledPast(rect.bottom < 72);
    };

    checkScrollVisibility();

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          const rect = entry.boundingClientRect;
          setIsScrolledPast(!entry.isIntersecting && rect.bottom < 72);
        },
        { threshold: 0, rootMargin: '-72px 0px 0px 0px' }
      );
      observer.observe(el);
    }

    window.addEventListener('scroll', checkScrollVisibility, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', checkScrollVisibility);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const triggerFlipMotion = () => {
    if (flipTimerRef.current !== null) {
      window.clearTimeout(flipTimerRef.current);
    }
    setIsFlipping(true);
    flipTimerRef.current = window.setTimeout(() => {
      setIsFlipping(false);
    }, 520);
  };

  const handleSelectDuration = (minutes: HourglassPresetMinutes) => {
    setDurationMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsRunning(true);
    triggerFlipMotion();
  };

  const handleToggleRun = () => {
    if (isFinished) {
      setRemainingSeconds(totalSeconds);
      setIsRunning(true);
      triggerFlipMotion();
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(true);
    triggerFlipMotion();
  };

  const scrollToMainHourglass = () => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // SVG sand geometry inside viewBox 0 0 64 84
  const topSandY = 10 + (1 - remainingRatio) * 31;
  const bottomMoundPeakY = 74 - Math.pow(elapsedRatio, 0.72) * 23;
  const bottomShoulderY = 74 - elapsedRatio * 13;

  const statusCopy = isFinished
    ? 'Tiếng chuông đã ngân — mời bạn giữ lại một nét Trà Ký cho phút giây này.'
    : isRunning
    ? 'Cát chảy từng hạt, nhắc lòng trân trọng khoảnh khắc đang có mặt.'
    : 'Nhịp cát tạm dừng — thời gian vẫn an nhiên chờ bạn quay lại.';

  const timeFormatted = formatHourglassTime(remainingSeconds);

  return (
    <>
      <section
        ref={sectionRef}
        aria-label="Đồng hồ cát phiên trà"
        className="mt-6 rounded-2xl bg-[#E8DFCE]/78 dark:bg-[#1B1916]/90 border border-[#1B1917]/12 dark:border-[#EDE5D5]/12 px-5 py-4 sm:px-6 sm:py-4 transition-colors duration-500"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Minimalist SVG Hourglass + Countdown + Contemplation */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div
              className={`shrink-0 transition-transform duration-500 ease-in-out ${
                isFlipping ? 'rotate-180 scale-95' : 'rotate-0 scale-100'
              }`}
            >
              <svg
                width="48"
                height="64"
                viewBox="0 0 64 84"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="text-[#7D5E43] dark:text-[#BEA080]"
              >
                <defs>
                  <clipPath id={topClipId}>
                    <path d="M18.5 10 H45.5 C45.5 23 36.5 34 33 41 H31 C27.5 34 18.5 23 18.5 10 Z" />
                  </clipPath>
                  <clipPath id={bottomClipId}>
                    <path d="M31 43 H33 C36.5 50 45.5 61 45.5 74 H18.5 C18.5 61 27.5 50 31 43 Z" />
                  </clipPath>
                </defs>

                <line
                  x1="14"
                  y1="9"
                  x2="14"
                  y2="75"
                  stroke="currentColor"
                  strokeOpacity="0.28"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <line
                  x1="50"
                  y1="9"
                  x2="50"
                  y2="75"
                  stroke="currentColor"
                  strokeOpacity="0.28"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />

                <rect x="11" y="5" width="42" height="4" rx="2" fill="currentColor" fillOpacity="0.82" />
                <rect x="11" y="75" width="42" height="4" rx="2" fill="currentColor" fillOpacity="0.82" />

                {remainingRatio > 0.005 && (
                  <g clipPath={`url(#${topClipId})`}>
                    <rect
                      x="17"
                      y={topSandY}
                      width="30"
                      height={42 - topSandY}
                      fill="#C4A27A"
                      fillOpacity="0.84"
                    />
                  </g>
                )}

                {isRunning && !isFinished && (
                  <line
                    x1="32"
                    y1="42"
                    x2="32"
                    y2="73"
                    stroke="#C4A27A"
                    strokeWidth="1.35"
                    strokeLinecap="round"
                    className="animate-sand-stream"
                  />
                )}

                {elapsedRatio > 0.005 && (
                  <g clipPath={`url(#${bottomClipId})`}>
                    <path
                      d={`M 17 75 L 17 ${bottomShoulderY} Q 32 ${bottomMoundPeakY} 47 ${bottomShoulderY} L 47 75 Z`}
                      fill="#C4A27A"
                      fillOpacity="0.9"
                    />
                  </g>
                )}

                <path
                  d="M18 9 H46 C46 23 36.5 34.5 33 41.5 C32.6 42 32.6 42 33 42.5 C36.5 49.5 46 61 46 75 H18 C18 61 27.5 49.5 31 42.5 C31.4 42 31.4 42 31 41.5 C27.5 34.5 18 23 18 9 Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="text-[11px] uppercase tracking-[0.16em] text-[#7D5E43] dark:text-[#BEA080]">
                  Đồng hồ cát phiên trà
                </span>
                <span
                  aria-label={`Thời gian còn lại ${timeFormatted}`}
                  className="font-serif-editorial text-2xl sm:text-[26px] font-medium text-[#1B1917] dark:text-[#EDE5D5] tabular-nums leading-none"
                >
                  {timeFormatted}
                </span>
              </div>
              <p
                aria-live={isFinished ? 'polite' : 'off'}
                className="text-xs sm:text-[13px] text-[#5C554C] dark:text-[#A89F91] mt-1 leading-relaxed"
              >
                {statusCopy}
              </p>
            </div>
          </div>

          {/* Right: Minimalist Preset & Ritual Controls */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <div
              role="group"
              aria-label="Thời lượng đồng hồ cát"
              className="inline-flex items-center rounded-xl bg-[#F9F5EB]/90 dark:bg-[#12110F]/85 border border-[#1B1917]/12 dark:border-[#EDE5D5]/12 p-0.5"
            >
              {HOURGLASS_PRESET_MINUTES.map((mins) => {
                const selected = durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleSelectDuration(mins)}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
                      selected
                        ? 'bg-[#425546] text-[#F9F5EB] dark:bg-[#728B77] dark:text-[#12110F]'
                        : 'text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5]'
                    }`}
                  >
                    {mins} phút
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleToggleRun}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#F9F5EB] dark:bg-[#12110F] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 text-[#1B1917] dark:text-[#EDE5D5] hover:border-[#425546] dark:hover:border-[#7E9783] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
            >
              {isRunning && !isFinished ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-[#7D5E43] dark:text-[#BEA080]" />
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#425546] dark:text-[#7E9783]" />
                  <span>{isFinished ? 'Bắt đầu lại' : 'Tiếp tục'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#F9F5EB] dark:bg-[#12110F] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5] hover:border-[#7D5E43] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Lật lại</span>
            </button>

            {isFinished && onOpenMemoir && (
              <button
                type="button"
                onClick={onOpenMemoir}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#A63A3A] hover:bg-[#8E3030] text-[#F9F5EB] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A63A3A]"
              >
                <span>Lưu Trà Ký</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Bottom-Left Floating Countdown Popup when scrolled down */}
      {isScrolledPast && (
        <aside
          aria-label="Đồng hồ phiên trà thu gọn"
          className="fixed bottom-4 left-4 z-30 flex items-center gap-2.5 sm:gap-3 rounded-xl bg-[#F9F5EB] dark:bg-[#1B1916] border border-[#1B1917]/15 dark:border-[#EDE5D5]/16 shadow-md px-3 py-2 sm:px-3.5 sm:py-2.5 transition-all duration-300"
        >
          <button
            type="button"
            onClick={scrollToMainHourglass}
            aria-label={`Cuộn lên đồng hồ cát chính (${timeFormatted})`}
            className="flex items-center gap-2 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
          >
            {/* Compact Mini Hourglass SVG */}
            {isFinished ? (
              <Bell className="w-4 h-4 text-[#A63A3A] dark:text-[#E07A7A] shrink-0" />
            ) : (
              <svg
                width="16"
                height="22"
                viewBox="0 0 24 32"
                fill="none"
                aria-hidden="true"
                className="text-[#7D5E43] dark:text-[#BEA080] shrink-0"
              >
                <rect x="4" y="2" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="4" y="28" width="16" height="2" rx="1" fill="currentColor" />
                <path
                  d="M6 4 H18 C18 10 14 14 12.5 16 C14 18 18 22 18 28 H6 C6 22 10 18 11.5 16 C10 14 6 10 6 4 Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                {isRunning && (
                  <line
                    x1="12"
                    y1="16"
                    x2="12"
                    y2="26"
                    stroke="#C4A27A"
                    strokeWidth="1.2"
                    className="animate-sand-stream"
                  />
                )}
              </svg>
            )}

            <div className="leading-tight">
              <span className="block font-serif-editorial text-sm sm:text-base font-medium text-[#1B1917] dark:text-[#EDE5D5] tabular-nums">
                {timeFormatted}
              </span>
              <span className="hidden sm:block text-[11px] text-[#5C554C] dark:text-[#A89F91] whitespace-nowrap">
                {isFinished ? 'Chuông đã ngân' : isRunning ? 'Đang chảy cát' : 'Tạm dừng'}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1 pl-1.5 border-l border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
            <button
              type="button"
              onClick={handleToggleRun}
              aria-label={isFinished ? 'Bắt đầu lại đồng hồ' : isRunning ? 'Tạm dừng đồng hồ' : 'Tiếp tục đồng hồ'}
              className="p-1.5 rounded-lg text-[#425546] dark:text-[#7E9783] hover:bg-[#E8DFCE] dark:hover:bg-[#23201C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
            >
              {isRunning && !isFinished ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Lật lại đồng hồ"
              className="p-1.5 rounded-lg text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5] hover:bg-[#E8DFCE] dark:hover:bg-[#23201C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
