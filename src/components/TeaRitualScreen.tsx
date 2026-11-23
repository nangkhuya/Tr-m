import React, { useState } from 'react';
import { TEA_OPTIONS } from '../data/teas';
import type { EmotionId, TeaId } from '../types/tea';
import { getTeaById, recommendTeaByEmotion, validateUserName } from '../utils/teaRules';
import { soundscapeEngine } from '../utils/soundscape';
import { EmotionalWheel } from './EmotionalWheel';
import { TeaPourRitualOverlay, TeacupIcon } from './TeaIllustrations';

interface TeaRitualScreenProps {
  initialName: string;
  initialTea: TeaId;
  onCompleteRitual: (name: string, teaId: TeaId) => void;
}

export const TeaRitualScreen: React.FC<TeaRitualScreenProps> = ({
  initialName,
  initialTea,
  onCompleteRitual,
}) => {
  const [name, setName] = useState(initialName);
  const [selectedTea, setSelectedTea] = useState<TeaId>(initialTea);
  const [selectedEmotionId, setSelectedEmotionId] = useState<EmotionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPouring, setIsPouring] = useState(false);

  const activeTea = getTeaById(selectedTea);
  const recommendedTeaId = selectedEmotionId
    ? recommendTeaByEmotion(selectedEmotionId).tea.id
    : null;

  const handleSelectEmotion = (emotionId: EmotionId) => {
    setSelectedEmotionId(emotionId);
    const { tea } = recommendTeaByEmotion(emotionId);
    setSelectedTea(tea.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateUserName(name);
    if (!check.valid) {
      setError(check.error ?? 'Xin kiểm tra lại tên của bạn.');
      return;
    }

    setError(null);
    setIsPouring(true);
    soundscapeEngine.playTeaPour();

    setTimeout(() => {
      setIsPouring(false);
      onCompleteRitual(check.trimmed, selectedTea);
    }, 1500);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-7 sm:py-10">
      {isPouring && (
        <TeaPourRitualOverlay
          teaName={activeTea.name}
          liquorColor={activeTea.liquorColor}
          liquorHighlight={activeTea.liquorHighlight}
        />
      )}

      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs tracking-[0.18em] uppercase text-[#5C554C] dark:text-[#A89F91]">
          Nghi thức khai trà
        </p>
        <h1 className="font-serif-editorial text-3xl sm:text-4xl font-medium text-[#1B1917] dark:text-[#EDE5D5] mt-2.5 leading-tight [text-wrap:balance]">
          Chậm lại một nhịp bên chén trà ấm
        </h1>
        <p className="text-sm sm:text-base text-[#5C554C] dark:text-[#A89F91] mt-3 leading-relaxed">
          Không tiếng ồn, không số đếm vội vã. Chọn một tách trà hợp với tâm trạng lúc này và
          đặt tên mình lên chiếu trà.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-7 sm:mt-8 space-y-7">
        {/* Name Input */}
        <div className="max-w-md mx-auto">
          <label
            htmlFor="guest-name-input"
            className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-1.5"
          >
            Tên hoặc biệt hiệu của bạn
          </label>
          <input
            id="guest-name-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ví dụ: An Nhiên, Minh, Mộc Trà..."
            maxLength={32}
            className="w-full px-4 py-2.5 rounded-xl bg-[#F9F5EB] dark:bg-[#1B1916] text-[#1B1917] dark:text-[#EDE5D5] placeholder:text-[#5C554C]/65 dark:placeholder:text-[#A89F91]/60 border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 focus:outline-none focus:ring-2 focus:ring-[#425546] dark:focus:ring-[#7E9783] transition-colors"
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-[#A63A3A] dark:text-[#E07A7A]">
              {error}
            </p>
          )}
        </div>

        {/* Minimalist Emotional Wheel Tea Guide */}
        <EmotionalWheel
          selectedEmotionId={selectedEmotionId}
          onSelectEmotion={handleSelectEmotion}
          onClearEmotion={() => setSelectedEmotionId(null)}
        />

        {/* 4 Tea Selector Grid */}
        <section aria-labelledby="tea-choice-heading">
          <div className="flex items-baseline justify-between mb-3.5">
            <h2
              id="tea-choice-heading"
              className="font-serif-editorial text-xl text-[#1B1917] dark:text-[#EDE5D5]"
            >
              Chọn vị trà cho tâm trạng hôm nay
            </h2>
            <span className="text-xs text-[#5C554C] dark:text-[#A89F91] hidden sm:inline">
              {activeTea.name} · {activeTea.mood}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TEA_OPTIONS.map((tea) => {
              const isSelected = tea.id === selectedTea;
              return (
                <button
                  key={tea.id}
                  type="button"
                  onClick={() => setSelectedTea(tea.id)}
                  aria-pressed={isSelected}
                  className={`text-left p-4 rounded-xl border transition-all duration-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
                    isSelected
                      ? 'bg-[#F9F5EB] dark:bg-[#211E1A] border-[#425546] dark:border-[#7E9783] shadow-sm'
                      : 'bg-[#E8DFCE]/65 dark:bg-[#181613] border-[#1B1917]/11 dark:border-[#EDE5D5]/12 hover:bg-[#EFE7D7] dark:hover:bg-[#1E1C18] hover:border-[#7D5E43]/45'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 pt-0.5 text-[#7D5E43] dark:text-[#BEA080]">
                      <TeacupIcon
                        liquorColor={tea.liquorColor}
                        liquorHighlight={tea.liquorHighlight}
                        rimColor={tea.cupRimColor}
                        size={52}
                        withSteam={isSelected}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-serif-editorial text-lg font-medium text-[#1B1917] dark:text-[#EDE5D5]">
                          {tea.name}
                        </span>
                        <span
                          aria-hidden="true"
                          className="w-3 h-3 rounded-full shrink-0 border border-[#1B1917]/18 dark:border-[#EDE5D5]/22"
                          style={{ backgroundColor: tea.liquorColor }}
                        />
                      </div>
                      <p className="text-xs font-medium text-[#425546] dark:text-[#7E9783] mt-1">
                        {tea.mood}
                        {recommendedTeaId === tea.id && (
                          <span className="text-[#7D5E43] dark:text-[#BEA080]">
                            {' '}· Gợi ý cho bạn
                          </span>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-[#5C554C] dark:text-[#A89F91] mt-2 leading-relaxed">
                        {tea.description}
                      </p>
                      <p className="text-xs text-[#7D5E43] dark:text-[#BEA080] mt-2">
                        Hương vị · {tea.aromaNote}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Primary CTA */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-[#425546] hover:bg-[#354639] dark:bg-[#728B77] dark:hover:bg-[#829C87] text-[#F9F5EB] dark:text-[#12110F] font-medium text-sm sm:text-base transition-all duration-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#425546]"
          >
            Vào Trà Thất
          </button>
        </div>
      </form>
    </main>
  );
};
