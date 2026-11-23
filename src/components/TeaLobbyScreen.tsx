import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ROOM_BACKDROPS } from '../data/teas';
import type { RoomBackdropId, TeaId, TeaRoom } from '../types/tea';
import { canJoinRoom, createTeaRoom, getTeaById, validateNewRoomInput } from '../utils/teaRules';
import { TeacupIcon } from './TeaIllustrations';

interface TeaLobbyScreenProps {
  userName: string;
  userTea: TeaId;
  rooms: TeaRoom[];
  onJoinRoom: (room: TeaRoom) => void;
  onCreateRoom: (room: TeaRoom) => void;
}

export const TeaLobbyScreen: React.FC<TeaLobbyScreenProps> = ({
  userName,
  userTea,
  rooms,
  onJoinRoom,
  onCreateRoom,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [topic, setTopic] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [backdrop, setBackdrop] = useState<RoomBackdropId>('veranda-rain');
  const [formError, setFormError] = useState<string | null>(null);

  const tea = getTeaById(userTea);

  const getBackdropLabel = (id: RoomBackdropId) =>
    ROOM_BACKDROPS.find((b) => b.id === id)?.label ?? 'Hiên gỗ nghe mưa';

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateNewRoomInput({ name: roomName, topic, subtitle });
    if (!check.valid) {
      setFormError(check.error ?? 'Xin kiểm tra lại thông tin trà thất.');
      return;
    }

    const newRoom = createTeaRoom({
      name: roomName,
      topic,
      subtitle,
      backdrop,
    });

    setFormError(null);
    setRoomName('');
    setTopic('');
    setSubtitle('');
    setShowCreateModal(false);
    onCreateRoom(newRoom);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      {/* Guest greeting bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
        <div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[#5C554C] dark:text-[#A89F91]">
            <TeacupIcon
              liquorColor={tea.liquorColor}
              liquorHighlight={tea.liquorHighlight}
              rimColor={tea.cupRimColor}
              size={30}
            />
            <span>
              Chào tri kỷ <strong className="font-medium text-[#1B1917] dark:text-[#EDE5D5]">{userName}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>{tea.name}</span>
          </div>

          <h1 className="font-serif-editorial text-3xl sm:text-4xl font-medium text-[#1B1917] dark:text-[#EDE5D5] mt-3">
            Sảnh Trà Thất
          </h1>
          <p className="text-sm sm:text-base text-[#5C554C] dark:text-[#A89F91] mt-2 max-w-xl leading-relaxed">
            Mỗi bàn trà giới hạn tối đa 5 người để giữ trọn vẹn sự lắng nghe và ấm cúng. Hãy chọn
            một hiên trà hoặc mở một bàn mới.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#425546] hover:bg-[#354639] dark:bg-[#728B77] dark:hover:bg-[#829C87] text-[#F9F5EB] dark:text-[#12110F] text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Trà Thất Mới</span>
        </button>
      </div>

      {/* Rooms Grid */}
      <section aria-label="Danh sách phòng trà đang mở" className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const joinable = canJoinRoom(room);
          return (
            <article
              key={room.id}
              className="flex flex-col justify-between p-6 rounded-xl bg-[#E8DFCE]/75 dark:bg-[#1B1916] border border-[#1B1917]/12 dark:border-[#EDE5D5]/12 transition-all duration-400 hover:border-[#7D5E43]/45"
            >
              <div>
                <h2 className="font-serif-editorial text-xl font-medium text-[#1B1917] dark:text-[#EDE5D5]">
                  {room.name}
                </h2>
                <p className="text-xs text-[#5C554C] dark:text-[#A89F91] mt-2">
                  {room.topic} <span aria-hidden="true">·</span>{' '}
                  <span className="tabular-nums">
                    {room.participantsCount}/{room.maxSeats} chỗ
                  </span>{' '}
                  <span aria-hidden="true">·</span> {getBackdropLabel(room.backdrop)}
                </p>

                <p className="text-sm text-[#1B1917]/88 dark:text-[#EDE5D5]/88 mt-4 leading-relaxed">
                  “{room.subtitle}”
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#1B1917]/10 dark:border-[#EDE5D5]/10 flex items-center justify-between gap-3">
                <span className="text-xs text-[#7D5E43] dark:text-[#BEA080]">
                  {joinable ? 'Còn chỗ ngồi ấm' : 'Bàn đã đủ tri kỷ'}
                </span>
                <button
                  type="button"
                  disabled={!joinable}
                  onClick={() => onJoinRoom(room)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#F9F5EB] dark:bg-[#12110F] text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/15 dark:border-[#EDE5D5]/18 hover:border-[#425546] hover:text-[#425546] dark:hover:text-[#7E9783] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
                >
                  Vào bàn trà
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-room-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1917]/55 dark:bg-black/75"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#F3EDE0] dark:bg-[#1B1916] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 p-6 sm:p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
              <div>
                <h2
                  id="create-room-title"
                  className="font-serif-editorial text-2xl font-medium text-[#1B1917] dark:text-[#EDE5D5]"
                >
                  Mở Trà Thất Mới
                </h2>
                <p className="text-xs text-[#5C554C] dark:text-[#A89F91] mt-1">
                  Tối đa 5 người · Thầy Tuệ Minh và ba trà khách sẽ cùng ngồi tiếp bạn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Đóng hộp thoại tạo trà thất"
                className="p-2 rounded-lg text-[#5C554C] hover:text-[#1B1917] dark:text-[#A89F91] dark:hover:text-[#EDE5D5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} noValidate className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="new-room-name"
                  className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-1.5"
                >
                  Tên Trà Thất
                </label>
                <input
                  id="new-room-name"
                  type="text"
                  value={roomName}
                  onChange={(e) => {
                    setRoomName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Ví dụ: Góc Sương Mai, Hiên Cũ..."
                  maxLength={48}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F9F5EB] dark:bg-[#23201C] text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 focus:outline-none focus:ring-2 focus:ring-[#425546]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-room-topic"
                  className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-1.5"
                >
                  Chủ đề đàm đạo
                </label>
                <input
                  id="new-room-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Ví dụ: Học cách buông bỏ, Ký ức mùa thu..."
                  maxLength={56}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F9F5EB] dark:bg-[#23201C] text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 focus:outline-none focus:ring-2 focus-visible:ring-[#425546]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-room-subtitle"
                  className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-1.5"
                >
                  Lời đề từ ngắn (tùy chọn)
                </label>
                <input
                  id="new-room-subtitle"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Một câu gợi cảm hứng cho khách bước vào..."
                  maxLength={90}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F9F5EB] dark:bg-[#23201C] text-[#1B1917] dark:text-[#EDE5D5] border border-[#1B1917]/14 dark:border-[#EDE5D5]/15 focus:outline-none focus:ring-2 focus:ring-[#425546]"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5] mb-2">
                  Khung cảnh nền
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {ROOM_BACKDROPS.map((item) => {
                    const active = backdrop === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBackdrop(item.id)}
                        aria-pressed={active}
                        className={`text-left px-4 py-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#425546] ${
                          active
                            ? 'bg-[#F9F5EB] dark:bg-[#24211D] border-[#425546] dark:border-[#7E9783]'
                            : 'bg-transparent border-[#1B1917]/12 dark:border-[#EDE5D5]/12 hover:border-[#7D5E43]/40'
                        }`}
                      >
                        <span className="block text-sm font-medium text-[#1B1917] dark:text-[#EDE5D5]">
                          {item.label}
                        </span>
                        <span className="block text-xs text-[#5C554C] dark:text-[#A89F91] mt-0.5">
                          {item.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <p role="alert" className="text-xs text-[#A63A3A] dark:text-[#E07A7A]">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1B1917]/12 dark:border-[#EDE5D5]/12">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#5C554C] dark:text-[#A89F91] hover:text-[#1B1917] dark:hover:text-[#EDE5D5]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#425546] hover:bg-[#354639] dark:bg-[#728B77] dark:hover:bg-[#829C87] text-[#F9F5EB] dark:text-[#12110F] text-sm font-medium transition-colors"
                >
                  Mở Trà Thất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
