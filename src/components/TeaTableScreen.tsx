import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Coffee, RefreshCw, Send, Sparkles } from 'lucide-react';
import { ROOM_BACKDROPS } from '../data/teas';
import type { ChatMessage, PromptCard, SeatParticipant, TeaId, TeaRoom } from '../types/tea';
import { buildTableSeats, getTeaById } from '../utils/teaRules';
import { TeacupIcon } from './TeaIllustrations';
import { TeaHourglass } from './TeaHourglass';

interface TeaTableScreenProps {
  room: TeaRoom;
  userName: string;
  userTea: TeaId;
  promptCard: PromptCard;
  isLoadingPrompt: boolean;
  messages: ChatMessage[];
  isAiThinking: boolean;
  errorMessage: string | null;
  activePulseIds: Record<string, 'raise_cup' | 'pour_tea'>;
  onRefreshPrompt: () => void;
  onSendMessage: (content: string) => void;
  onRaiseCupOnMessage: (messageId: string, speakerId: string) => void;
  onPourTeaOnMessage: (messageId: string, speakerId: string) => void;
  onTableGesture: (gesture: 'raise_cup' | 'pour_tea') => void;
  onLeaveRoom: () => void;
  onEndSessionMemoir: () => void;
}

const SEAT_COORDINATES = [
  'md:top-0 md:left-1/2 md:-translate-x-1/2', // Top center (Trà Chủ)
  'md:top-1/2 md:right-2 md:-translate-y-1/2', // Right (Minh Triết)
  'md:bottom-1 md:right-14', // Bottom Right (Empty cozy seat)
  'md:bottom-1 md:left-14', // Bottom Left (Bạn)
  'md:top-1/2 md:left-2 md:-translate-y-1/2', // Left (An Nhiên)
];

export const TeaTableScreen: React.FC<TeaTableScreenProps> = ({
  room,
  userName,
  userTea,
  promptCard,
  isLoadingPrompt,
  messages,
  isAiThinking,
  errorMessage,
  activePulseIds,
  onRefreshPrompt,
  onSendMessage,
  onRaiseCupOnMessage,
  onPourTeaOnMessage,
  onTableGesture,
  onLeaveRoom,
  onEndSessionMemoir,
}) => {
  const [draft, setDraft] = useState('');
  const streamEndRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(messages.length);

  const seats = buildTableSeats(userName, userTea);
  const backdropInfo = ROOM_BACKDROPS.find((b) => b.id === room.backdrop);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [room.id]);

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current || isAiThinking) {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isAiThinking]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || isAiThinking) return;
    onSendMessage(cleaned);
    setDraft('');
  };

  const renderSeatNode = (seat: SeatParticipant | null, idx: number) => {
    if (!seat) {
      return (
        <div
          key={`empty-seat-${idx}`}
          className="flex flex-col items-center justify-center text-center p-2 opacity-60"
        >
          <div className="w-11 h-11 rounded-full border border-dashed border-[#7D5E43]/45 flex items-center justify-center text-xs text-[#5C554C] dark:text-[#A89F91]">
            Trống
          </div>
          <span className="text-[11px] text-[#5C554C] dark:text-[#A89F91] mt-1">
            Chỗ hữu duyên
          </span>
        </div>
      );
    }

    const tea = getTeaById(seat.teaId);
    const pulse = activePulseIds[seat.id];

    return (
      <div
        key={seat.id}
        className="flex flex-col items-center text-center p-1.5 transition-transform duration-500"
      >
        <div className="text-[#7D5E43] dark:text-[#BEA080]">
          <TeacupIcon
            liquorColor={tea.liquorColor}
            liquorHighlight={tea.liquorHighlight}
            rimColor={tea.cupRimColor}
            size={48}
            withSteam={seat.isUser || seat.role === 'Trà Chủ'}
            rippleActive={Boolean(pulse)}
          />
        </div>
        <span className="text-xs font-medium text-[#1B1917] dark:text-[#EDE5D5] mt-0.5 whitespace-nowrap">
          {seat.name}
        </span>
        <span className="text-[11px] text-[#5C554C] dark:text-[#A89F91] whitespace-nowrap">
          {seat.role} · {tea.name.split(' ').slice(0, 2).join(' ')}
        </span>
        {pulse && (
          <span className="text-[11px] text-[#425546] dark:text-[#7E9783] mt-0.5">
            {pulse === 'raise_cup' ? 'Đang nâng chén' : 'Đang châm trà'}
          </span>
        )}
      </div>
    );
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10 pb-24">
      {/* Room Top Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
        <div>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex items-center gap-1.5 text-xs text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5] transition-colors mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Sảnh Trà Thất</span>
          </button>
          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-medium text-[#1B1917] dark:text-[#EDE5D5]">
            {room.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C554C] dark:text-[#A89F91] mt-1">
            {room.topic} <span aria-hidden="true">·</span> {backdropInfo?.label}
          </p>
        </div>

        <button
          type="button"
          onClick={onEndSessionMemoir}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A63A3A] hover:bg-[#8E3030] text-[#F9F5EB] text-sm font-medium transition-colors whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A63A3A]"
        >
          <span>Tàn trà &amp; Lưu Trà Ký</span>
        </button>
      </div>

      {/* Mindful Tea Session Hourglass */}
      <TeaHourglass key={room.id} onOpenMemoir={onEndSessionMemoir} />

      {/* Round Tea Table & Prompt Card Sanctuary */}
      <section aria-label="Bàn trà tròn và thẻ đàm đạo" className="mt-6">
        <div className="relative rounded-2xl bg-[#E8DFCE]/78 dark:bg-[#1B1916] border border-[#1B1917]/12 dark:border-[#EDE5D5]/12 p-5 sm:p-8">
          {/* Desktop Circular Arrangement */}
          <div className="hidden md:block relative mx-auto max-w-3xl h-[495px]">
            {/* Wooden Round Table Surface */}
            <div
              aria-hidden="true"
              className="absolute inset-x-36 inset-y-24 rounded-full border border-[#7D5E43]/28 bg-[#F9F5EB]/78 dark:bg-[#141311]/88 shadow-inner"
            />

            {/* 5 Seats around the circle */}
            {seats.map((seat, idx) => (
              <div key={seat?.id ?? `empty-${idx}`} className={`absolute ${SEAT_COORDINATES[idx]}`}>
                {renderSeatNode(seat, idx)}
              </div>
            ))}

            {/* Centerpiece Discussion Card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto w-[276px] rounded-xl bg-[#F9F5EB] dark:bg-[#12110F] border border-[#7D5E43]/32 px-4 py-4 text-center shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#7D5E43] dark:text-[#BEA080]">
                  Thẻ Đàm Đạo · {promptCard.title}
                </p>
                <p className="font-serif-editorial text-[15px] leading-relaxed text-[#1B1917] dark:text-[#EDE5D5] mt-1.5">
                  “{promptCard.question}”
                </p>
                <p className="text-xs text-[#5C554C] dark:text-[#A89F91] mt-1.5">
                  {promptCard.hint}
                </p>
                <button
                  type="button"
                  onClick={onRefreshPrompt}
                  disabled={isLoadingPrompt}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#425546] dark:text-[#7E9783] hover:bg-[#E8DFCE] dark:hover:bg-[#23201C] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrompt ? 'animate-spin' : ''}`} />
                  <span>{isLoadingPrompt ? 'Đang rút thẻ...' : 'Đổi thẻ mới'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Compact Table & Prompt Card */}
          <div className="md:hidden space-y-5">
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
              {seats.slice(0, 3).map((seat, idx) => renderSeatNode(seat, idx))}
            </div>
            <div className="grid grid-cols-2 gap-2 pb-4 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
              {seats.slice(3, 5).map((seat, idx) => renderSeatNode(seat, idx + 3))}
            </div>

            <div className="rounded-xl bg-[#F9F5EB] dark:bg-[#12110F] border border-[#7D5E43]/32 p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.15em] text-[#7D5E43] dark:text-[#BEA080]">
                Thẻ Đàm Đạo · {promptCard.title}
              </p>
              <p className="font-serif-editorial text-base leading-relaxed text-[#1B1917] dark:text-[#EDE5D5] mt-2">
                “{promptCard.question}”
              </p>
              <button
                type="button"
                onClick={onRefreshPrompt}
                disabled={isLoadingPrompt}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#425546] dark:text-[#7E9783] hover:bg-[#E8DFCE] dark:hover:bg-[#23201C]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrompt ? 'animate-spin' : ''}`} />
                <span>{isLoadingPrompt ? 'Đang rút thẻ...' : 'Đổi thẻ mới'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Airy Conversation Stream */}
      <section aria-label="Dòng đàm đạo bên bàn trà" className="mt-10 max-w-2xl mx-auto">
        <div className="space-y-6">
          {messages.map((msg) => {
            const isSelf = msg.role === 'Bạn';
            return (
              <article
                key={msg.id}
                className="pb-6 border-b border-[#1B1917]/10 dark:border-[#EDE5D5]/10 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2 text-sm">
                    <span
                      className={`font-serif-editorial text-base font-medium ${
                        isSelf
                          ? 'text-[#425546] dark:text-[#7E9783]'
                          : 'text-[#1B1917] dark:text-[#EDE5D5]'
                      }`}
                    >
                      {msg.speakerName}
                    </span>
                    <span className="text-xs text-[#5C554C] dark:text-[#A89F91]">
                      {msg.role} · <span className="tabular-nums">{msg.timestamp}</span>
                    </span>
                  </div>

                  {msg.action !== 'none' && (
                    <span className="text-xs italic text-[#7D5E43] dark:text-[#BEA080]">
                      {msg.action === 'raise_cup'
                        ? 'Khẽ nâng chén đồng cảm'
                        : 'Nhẹ nhàng châm thêm trà ấm'}
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-[15px] sm:text-base leading-[1.75] text-[#1B1917] dark:text-[#EDE5D5]">
                  {msg.content}
                </p>

                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onRaiseCupOnMessage(msg.id, msg.speakerId)}
                    aria-pressed={Boolean(msg.userRaised)}
                    className={`inline-flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
                      msg.userRaised
                        ? 'bg-[#E8DFCE] dark:bg-[#23201C] border-[#425546]/45 text-[#425546] dark:text-[#7E9783]'
                        : 'border-transparent text-[#5C554C] dark:text-[#A89F91] hover:bg-[#E8DFCE]/70 dark:hover:bg-[#1B1916]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nâng chén</span>
                    {msg.raisedCount > 0 && (
                      <span className="tabular-nums">· {msg.raisedCount}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onPourTeaOnMessage(msg.id, msg.speakerId)}
                    aria-pressed={Boolean(msg.userPoured)}
                    className={`inline-flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
                      msg.userPoured
                        ? 'bg-[#E8DFCE] dark:bg-[#23201C] border-[#7D5E43]/45 text-[#7D5E43] dark:text-[#BEA080]'
                        : 'border-transparent text-[#5C554C] dark:text-[#A89F91] hover:bg-[#E8DFCE]/70 dark:hover:bg-[#1B1916]'
                    }`}
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Châm trà</span>
                    {msg.pouredCount > 0 && (
                      <span className="tabular-nums">· {msg.pouredCount}</span>
                    )}
                  </button>
                </div>
              </article>
            );
          })}

          {isAiThinking && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 py-4 text-sm italic font-serif-editorial text-[#5C554C] dark:text-[#A89F91]"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="animate-steam-slow text-[#7D5E43]"
                aria-hidden="true"
              >
                <path
                  d="M9 19C7 15 11 12 9 7M15 18C17 14 13 11 15 6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              <span>Thầy Tuệ Minh đang châm thêm nước...</span>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-[#A63A3A]/8 border border-[#A63A3A]/25 text-sm text-[#A63A3A] dark:text-[#E07A7A]"
            >
              {errorMessage}
            </div>
          )}

          <div ref={streamEndRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleFormSubmit}
          className="mt-8 rounded-2xl bg-[#E8DFCE]/85 dark:bg-[#1B1916] border border-[#1B1917]/14 dark:border-[#EDE5D5]/14 p-4 sm:p-5"
        >
          <label htmlFor="tea-message-input" className="sr-only">
            Chia sẻ suy tư của bạn bên bàn trà
          </label>
          <textarea
            id="tea-message-input"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Chia sẻ một suy tư chậm rãi bên chén trà..."
            className="w-full resize-none bg-transparent text-sm sm:text-base text-[#1B1917] dark:text-[#EDE5D5] placeholder:text-[#5C554C]/70 dark:placeholder:text-[#A89F91]/65 focus:outline-none leading-relaxed"
          />

          <div className="mt-3 pt-3 border-t border-[#1B1917]/12 dark:border-[#EDE5D5]/12 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isAiThinking}
                onClick={() => onTableGesture('raise_cup')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#1B1917] dark:text-[#EDE5D5] bg-[#F9F5EB] dark:bg-[#12110F] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 hover:border-[#425546] disabled:opacity-50 transition-colors"
              >
                Nâng chén với cả bàn
              </button>
              <button
                type="button"
                disabled={isAiThinking}
                onClick={() => onTableGesture('pour_tea')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#1B1917] dark:text-[#EDE5D5] bg-[#F9F5EB] dark:bg-[#12110F] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 hover:border-[#7D5E43] disabled:opacity-50 transition-colors"
              >
                Châm trà
              </button>
            </div>

            <button
              type="submit"
              disabled={!draft.trim() || isAiThinking}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#425546] hover:bg-[#354639] dark:bg-[#728B77] dark:hover:bg-[#829C87] text-[#F9F5EB] dark:text-[#12110F] text-sm font-medium disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi lời trà</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
