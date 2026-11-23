import React, { useEffect, useState } from 'react';
import { Bird, CloudRain, Flame, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { SoundGroupKey, SoundMix } from '../types/tea';
import { soundscapeEngine } from '../utils/soundscape';
import { countActiveSoundGroups } from '../utils/soundscapeMath';

interface SoundscapeMixerProps {
  mix: SoundMix;
  onChangeMix: (next: SoundMix) => void;
}

const SOUND_GROUPS: {
  key: SoundGroupKey;
  label: string;
  subtitle: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    key: 'rainWind',
    label: 'Mưa & Gió hiên nhà',
    subtitle: 'Mưa rơi, gió trúc & cửa sổ kẽo kẹt',
    Icon: CloudRain,
  },
  {
    key: 'hearth',
    label: 'Bếp than & Người cùng bàn',
    subtitle: 'Nước sôi, than nổ & tiếng ho khẽ',
    Icon: Flame,
  },
  {
    key: 'birds',
    label: 'Chim hót ngoài hiên',
    subtitle: 'Tiếng chim ngẫu nhiên dịu nhẹ',
    Icon: Bird,
  },
];

export const SoundscapeMixer: React.FC<SoundscapeMixerProps> = ({ mix, onChangeMix }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return () => {
      soundscapeEngine.stopAll();
    };
  }, []);

  const activeCount = countActiveSoundGroups(mix);

  const toggleGroup = (key: SoundGroupKey) => {
    onChangeMix({
      ...mix,
      [key]: { ...mix[key], enabled: !mix[key].enabled },
    });
  };

  const changeVolume = (key: SoundGroupKey, volume: number) => {
    onChangeMix({
      ...mix,
      [key]: { ...mix[key], volume, enabled: volume > 0 ? true : mix[key].enabled },
    });
  };

  const toggleNaturalRandomness = () => {
    onChangeMix({
      ...mix,
      naturalRandomness: !mix.naturalRandomness,
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end">
      {open && (
        <div
          role="region"
          aria-label="Bộ trộn âm thanh hiên trà"
          className="mb-3 w-80 sm:w-[344px] rounded-xl bg-[#F9F5EB] dark:bg-[#1B1916] border border-[#1B1917]/14 dark:border-[#EDE5D5]/14 shadow-lg p-5 transition-all duration-400"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
            <div>
              <h3 className="font-serif-editorial text-base font-medium text-[#1B1917] dark:text-[#EDE5D5]">
                Âm Thanh Hiên Trà
              </h3>
              <p className="text-xs text-[#5C554C] dark:text-[#A89F91] mt-0.5">
                Không gian tự nhiên thuần Web Audio
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5] px-2 py-1 rounded whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
            >
              Thu gọn
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {SOUND_GROUPS.map(({ key, label, subtitle, Icon }) => {
              const channel = mix[key];
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup(key)}
                      aria-pressed={channel.enabled}
                      className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] rounded py-0.5 min-w-0"
                    >
                      <span
                        className={`w-7 h-7 rounded-md inline-flex items-center justify-center shrink-0 transition-colors ${
                          channel.enabled
                            ? 'bg-[#425546] text-[#F9F5EB] dark:bg-[#7E9783] dark:text-[#12110F]'
                            : 'bg-[#E8DFCE] text-[#5C554C] dark:bg-[#23201C] dark:text-[#A89F91]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5]">
                          {label}
                        </span>
                        <span className="block text-xs text-[#5C554C] dark:text-[#A89F91] truncate">
                          {subtitle}
                        </span>
                      </span>
                    </button>

                    <span className="text-xs tabular-nums text-[#5C554C] dark:text-[#A89F91] shrink-0">
                      {channel.enabled ? `${Math.round(channel.volume * 100)}%` : 'Tắt'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    aria-label={`Âm lượng ${label}`}
                    value={channel.volume}
                    onChange={(e) => changeVolume(key, parseFloat(e.target.value))}
                    className="w-full accent-[#425546] dark:accent-[#7E9783] h-1.5 bg-[#E8DFCE] dark:bg-[#23201C] rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
            <button
              type="button"
              onClick={toggleNaturalRandomness}
              aria-pressed={mix.naturalRandomness}
              className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-[#E8DFCE]/75 dark:bg-[#23201C]/80 hover:bg-[#E8DFCE] dark:hover:bg-[#23201C] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles
                  className={`w-3.5 h-3.5 shrink-0 ${
                    mix.naturalRandomness
                      ? 'text-[#425546] dark:text-[#7E9783]'
                      : 'text-[#5C554C] dark:text-[#A89F91]'
                  }`}
                />
                <div className="min-w-0">
                  <span className="block text-xs font-medium text-[#1B1917] dark:text-[#EDE5D5]">
                    Nhịp ngẫu nhiên tự nhiên
                  </span>
                  <span className="block text-[11px] text-[#5C554C] dark:text-[#A89F91]">
                    Biến thiên thưa thớt tự nhiên
                  </span>
                </div>
              </div>

              <span
                className={`text-[11px] font-medium whitespace-nowrap shrink-0 ${
                  mix.naturalRandomness
                    ? 'text-[#425546] dark:text-[#7E9783]'
                    : 'text-[#5C554C] dark:text-[#A89F91]'
                }`}
              >
                {mix.naturalRandomness ? 'Đang bật' : 'Đều nhịp'}
              </span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Mở bộ điều chỉnh âm thanh hiên trà"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8DFCE] dark:bg-[#1B1916] text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 shadow-sm hover:border-[#425546]/50 transition-all duration-300 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
      >
        {activeCount > 0 ? (
          <Volume2 className="w-4 h-4 text-[#425546] dark:text-[#7E9783]" />
        ) : (
          <VolumeX className="w-4 h-4 text-[#5C554C] dark:text-[#A89F91]" />
        )}
        <span>Âm thanh nền</span>
        {activeCount > 0 && (
          <span className="text-xs text-[#425546] dark:text-[#7E9783] tabular-nums">
            · {activeCount}
          </span>
        )}
      </button>
    </div>
  );
};
