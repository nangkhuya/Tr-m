import React from 'react';
import { RotateCcw } from 'lucide-react';
import { EMOTION_WHEEL_NODES } from '../data/teas';
import type { EmotionId } from '../types/tea';
import { getTeaById, recommendTeaByEmotion } from '../utils/teaRules';
import { TeacupIcon } from './TeaIllustrations';

interface EmotionalWheelProps {
  selectedEmotionId: EmotionId | null;
  onSelectEmotion: (emotionId: EmotionId) => void;
  onClearEmotion: () => void;
}

const CENTER = 160;
const INNER_R = 54;
const OUTER_R = 148;
const LABEL_R = 101;
const DOT_R = 139;
const SECTOR_COUNT = EMOTION_WHEEL_NODES.length;
const STEP_DEG = 360 / SECTOR_COUNT;
const GAP_DEG = 2.6;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Number((cx + radius * Math.cos(rad)).toFixed(2)),
    y: Number((cy + radius * Math.sin(rad)).toFixed(2)),
  };
}

function buildSectorPath(startDeg: number, endDeg: number, innerR: number, outerR: number): string {
  const outerStart = polarToCartesian(CENTER, CENTER, outerR, startDeg);
  const outerEnd = polarToCartesian(CENTER, CENTER, outerR, endDeg);
  const innerEnd = polarToCartesian(CENTER, CENTER, innerR, endDeg);
  const innerStart = polarToCartesian(CENTER, CENTER, innerR, startDeg);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export const EmotionalWheel: React.FC<EmotionalWheelProps> = ({
  selectedEmotionId,
  onSelectEmotion,
  onClearEmotion,
}) => {
  const recommendation = selectedEmotionId
    ? recommendTeaByEmotion(selectedEmotionId)
    : null;

  return (
    <section
      aria-labelledby="emotional-wheel-heading"
      className="rounded-2xl bg-[#E8DFCE]/78 dark:bg-[#1B1916]/90 border border-[#1B1917]/12 dark:border-[#EDE5D5]/12 p-5 sm:p-6 transition-colors duration-500"
    >
      <div className="grid grid-cols-1 md:grid-cols-[288px_1fr] items-center gap-6">
        {/* Minimalist Radial Emotional Wheel SVG */}
        <div className="flex justify-center">
          <svg
            viewBox="0 0 320 320"
            className="w-[264px] sm:w-[288px] h-auto select-none"
            role="group"
            aria-label="Bánh xe cảm xúc tám cung"
          >
            {/* Subtle outer compass ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={OUTER_R + 6}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.16"
              strokeWidth="1"
              className="text-[#7D5E43] dark:text-[#BEA080]"
            />

            {EMOTION_WHEEL_NODES.map((node, idx) => {
              const midDeg = -90 + idx * STEP_DEG;
              const startDeg = midDeg - STEP_DEG / 2 + GAP_DEG / 2;
              const endDeg = midDeg + STEP_DEG / 2 - GAP_DEG / 2;
              const pathD = buildSectorPath(startDeg, endDeg, INNER_R, OUTER_R);
              const labelPos = polarToCartesian(CENTER, CENTER, LABEL_R, midDeg);
              const dotPos = polarToCartesian(CENTER, CENTER, DOT_R, midDeg);
              const tea = getTeaById(node.teaId);
              const isSelected = selectedEmotionId === node.id;

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${node.label} — gợi ý ${tea.name}`}
                  onClick={() => onSelectEmotion(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectEmotion(node.id);
                    }
                  }}
                  className="cursor-pointer group focus:outline-none"
                >
                  <path
                    d={pathD}
                    strokeWidth="1.2"
                    className={`transition-all duration-300 ${
                      isSelected
                        ? 'fill-[#425546] stroke-[#425546] dark:fill-[#728B77] dark:stroke-[#7E9783]'
                        : 'fill-[#F9F5EB] stroke-[#7D5E43]/28 group-hover:fill-[#EFE6D4] group-hover:stroke-[#7D5E43]/55 group-focus-visible:stroke-[#425546] group-focus-visible:stroke-2 dark:fill-[#141311] dark:stroke-[#EDE5D5]/15 dark:group-hover:fill-[#24211D] dark:group-focus-visible:stroke-[#7E9783]'
                    }`}
                  />

                  {/* Subtle tea liquor tone indicator near outer rim */}
                  <circle
                    cx={dotPos.x}
                    cy={dotPos.y}
                    r={isSelected ? 4 : 3}
                    fill={tea.liquorColor}
                    stroke={isSelected ? '#F9F5EB' : '#7D5E43'}
                    strokeOpacity={isSelected ? 0.85 : 0.38}
                    strokeWidth="0.8"
                  />

                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-[11px] font-medium transition-colors duration-300 pointer-events-none ${
                      isSelected
                        ? 'fill-[#F9F5EB] dark:fill-[#12110F]'
                        : 'fill-[#1B1917] dark:fill-[#EDE5D5]'
                    }`}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Center Quiet Medallion */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={INNER_R - 6}
              className="fill-[#F9F5EB] dark:fill-[#12110F] stroke-[#7D5E43]/28 dark:stroke-[#EDE5D5]/16 transition-colors duration-300"
              strokeWidth="1.2"
            />

            {recommendation ? (
              <g aria-hidden="true">
                <circle
                  cx={CENTER}
                  cy={CENTER - 13}
                  r="6"
                  fill={recommendation.tea.liquorColor}
                  stroke="#7D5E43"
                  strokeOpacity="0.4"
                  strokeWidth="0.9"
                />
                <text
                  x={CENTER}
                  y={CENTER + 5}
                  textAnchor="middle"
                  className="fill-[#1B1917] dark:fill-[#EDE5D5] text-[11px] font-medium"
                >
                  {recommendation.emotion.label}
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 20}
                  textAnchor="middle"
                  className="fill-[#5C554C] dark:fill-[#A89F91] text-[9px]"
                >
                  {recommendation.tea.name.split(' ').slice(0, 2).join(' ')}
                </text>
              </g>
            ) : (
              <g aria-hidden="true">
                <text
                  x={CENTER}
                  y={CENTER - 4}
                  textAnchor="middle"
                  className="fill-[#7D5E43] dark:fill-[#BEA080] text-[10px] tracking-[0.14em] uppercase"
                >
                  Nội tâm
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 12}
                  textAnchor="middle"
                  className="fill-[#5C554C] dark:fill-[#A89F91] text-[10px]"
                >
                  Chạm chọn
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right: Contemplative Guidance & Tea Recommendation */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#7D5E43] dark:text-[#BEA080] truncate">
              Bánh xe cảm xúc · Gợi ý vị trà
            </p>
            {recommendation && (
              <button
                type="button"
                onClick={onClearEmotion}
                className="inline-flex items-center gap-1 text-xs text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5] whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] rounded px-1.5 py-0.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Chọn lại</span>
              </button>
            )}
          </div>

          <h2
            id="emotional-wheel-heading"
            className="font-serif-editorial text-xl sm:text-2xl font-medium text-[#1B1917] dark:text-[#EDE5D5] mt-1.5"
          >
            {recommendation
              ? `Lòng đang ${recommendation.emotion.label.toLowerCase()}`
              : 'Lắng nghe lòng mình trước khi pha trà'}
          </h2>

          {recommendation ? (
            <div className="mt-3 space-y-3.5" aria-live="polite">
              <p className="text-xs sm:text-sm text-[#5C554C] dark:text-[#A89F91] leading-relaxed">
                {recommendation.emotion.innerState}
              </p>

              <div className="rounded-xl bg-[#F9F5EB] dark:bg-[#12110F] border border-[#425546]/30 dark:border-[#7E9783]/35 p-4">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 text-[#7D5E43] dark:text-[#BEA080]">
                    <TeacupIcon
                      liquorColor={recommendation.tea.liquorColor}
                      liquorHighlight={recommendation.tea.liquorHighlight}
                      rimColor={recommendation.tea.cupRimColor}
                      size={44}
                      withSteam
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#425546] dark:text-[#7E9783] font-medium">
                      Gợi ý cho bạn · {recommendation.tea.mood}
                    </p>
                    <p className="font-serif-editorial text-lg font-medium text-[#1B1917] dark:text-[#EDE5D5] mt-0.5">
                      {recommendation.tea.name}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#5C554C] dark:text-[#A89F91] mt-1.5 leading-relaxed">
                      {recommendation.reason}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2.5 space-y-3">
              <p className="text-xs sm:text-sm text-[#5C554C] dark:text-[#A89F91] leading-relaxed">
                Chạm vào một trạng thái trên bánh xe bên cạnh để Trà Đàm gợi ý chén trà đồng điệu
                với nhịp lòng bạn lúc này — hoặc tự do chọn trực tiếp loại trà bạn yêu thích ở phía dưới.
              </p>
              <p className="text-xs text-[#7D5E43] dark:text-[#BEA080] leading-relaxed">
                Tám cung cảm xúc tương ứng với bốn sắc trà: Sen Tây Hồ · Ô Long Núi Cao · Phổ Nhĩ Cổ Thụ · Bạch Trà Mẫu Đơn.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
