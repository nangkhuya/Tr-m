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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[#2C2C2C]/10 dark:border-[#EAE4D9]/10">
        <div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-[#6E6A63] dark:text-[#A6A095]">
            <TeacupIcon
              liquorColor={tea.liquorColor}
              liquorHighlight={tea.liquorHighlight}
              rimColor={tea.cupRimColor}
              size={30}
            />
            <span>
              Chào tri kỷ <strong className="font-medium text-[#2C2C2C] dark:text-[#EAE4D9]">{userName}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>{tea.name}</span>
          </div>

          <h1 className="font-serif-editorial text-3xl sm:text-4xl font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mt-3">
            Sảnh Trà Thất
          </h1>
          <p className="text-sm sm:text-base text-[#6E6A63] dark:text-[#A6A095] mt-2 max-w-xl leading-relaxed">
            Mỗi bàn trà giới hạn tối đa 5 người để giữ trọn vẹn sự lắng nghe và ấm cúng. Hãy chọn
            một hiên trà hoặc mở một bàn mới.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#4A5D4E] hover:bg-[#3D4E41] dark:bg-[#6E8572] dark:hover:bg-[#7C9481] text-[#FDFBF7] dark:text-[#161513] text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E]"
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
              className="flex flex-col justify-between p-6 rounded-xl bg-[#F4EFE6]/70 dark:bg-[#201E1B] border border-[#2C2C2C]/10 dark:border-[#EAE4D9]/12 transition-all duration-400 hover:border-[#8C6D53]/45"
            >
              <div>
                <h2 className="font-serif-editorial text-xl font-medium text-[#2C2C2C] dark:text-[#EAE4D9]">
                  {room.name}
                </h2>
                <p className="text-xs text-[#6E6A63] dark:text-[#A6A095] mt-2">
                  {room.topic} <span aria-hidden="true">·</span>{' '}
                  <span className="tabular-nums">
                    {room.participantsCount}/{room.maxSeats} chỗ
                  </span>{' '}
                  <span aria-hidden="true">·</span> {getBackdropLabel(room.backdrop)}
                </p>

                <p className="text-sm text-[#2C2C2C]/85 dark:text-[#EAE4D9]/85 mt-4 leading-relaxed">
                  “{room.subtitle}”
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#2C2C2C]/8 dark:border-[#EAE4D9]/10 flex items-center justify-between gap-3">
                <span className="text-xs text-[#8C6D53] dark:text-[#B79373]">
                  {joinable ? 'Còn chỗ ngồi ấm' : 'Bàn đã đủ tri kỷ'}
                </span>
                <button
                  type="button"
                  disabled={!joinable}
                  onClick={() => onJoinRoom(room)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FDFBF7] dark:bg-[#161513] text-[#2C2C2C] dark:text-[#EAE4D9] border border-[#2C2C2C]/15 dark:border-[#EAE4D9]/18 hover:border-[#4A5D4E] hover:text-[#4A5D4E] dark:hover:text-[#7C9481] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E]"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2C2C]/55 dark:bg-black/70"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#FDFBF7] dark:bg-[#1D1B18] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/15 p-6 sm:p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2C2C2C]/10 dark:border-[#EAE4D9]/10">
              <div>
                <h2
                  id="create-room-title"
                  className="font-serif-editorial text-2xl font-medium text-[#2C2C2C] dark:text-[#EAE4D9]"
                >
                  Mở Trà Thất Mới
                </h2>
                <p className="text-xs text-[#6E6A63] dark:text-[#A6A095] mt-1">
                  Tối đa 5 người · Thầy Tuệ Minh và ba trà khách sẽ cùng ngồi tiếp bạn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Đóng hộp thoại tạo trà thất"
                className="p-2 rounded-lg text-[#6E6A63] hover:text-[#2C2C2C] dark:text-[#A6A095] dark:hover:text-[#EAE4D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} noValidate className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="new-room-name"
                  className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-1.5"
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4EFE6] dark:bg-[#26231F] text-[#2C2C2C] dark:text-[#EAE4D9] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/15 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-room-topic"
                  className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-1.5"
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4EFE6] dark:bg-[#26231F] text-[#2C2C2C] dark:text-[#EAE4D9] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/15 focus:outline-none focus:ring-2 focus-visible:ring-[#4A5D4E]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-room-subtitle"
                  className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-1.5"
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
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4EFE6] dark:bg-[#26231F] text-[#2C2C2C] dark:text-[#EAE4D9] border border-[#2C2C2C]/12 dark:border-[#EAE4D9]/15 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E]"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9] mb-2">
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
                        className={`text-left px-4 py-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D4E] ${
                          active
                            ? 'bg-[#F4EFE6] dark:bg-[#2A2621] border-[#4A5D4E] dark:border-[#7C9481]'
                            : 'bg-transparent border-[#2C2C2C]/10 dark:border-[#EAE4D9]/12 hover:border-[#8C6D53]/40'
                        }`}
                      >
                        <span className="block text-sm font-medium text-[#2C2C2C] dark:text-[#EAE4D9]">
                          {item.label}
                        </span>
                        <span className="block text-xs text-[#6E6A63] dark:text-[#A6A095] mt-0.5">
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C2C2C]/10 dark:border-[#EAE4D9]/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#6E6A63] dark:text-[#A6A095] hover:text-[#2C2C2C] dark:hover:text-[#EAE4D9]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#4A5D4E] hover:bg-[#3D4E41] dark:bg-[#6E8572] dark:hover:bg-[#7C9481] text-[#FDFBF7] dark:text-[#161513] text-sm font-medium transition-colors"
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
