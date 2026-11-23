import { DEFAULT_AI_COMPANIONS, EMOTION_WHEEL_NODES, MAX_SEATS_PER_ROOM, TEA_OPTIONS } from '../data/teas';
import type {
  AiReplyPayload,
  ChatMessage,
  EmotionId,
  EmotionNode,
  MemoirData,
  RoomBackdropId,
  SeatParticipant,
  TeaAction,
  TeaId,
  TeaOption,
  TeaRoom,
} from '../types/tea';

export function getTeaById(teaId: TeaId): TeaOption {
  return TEA_OPTIONS.find((t) => t.id === teaId) ?? TEA_OPTIONS[0];
}

export function validateUserName(rawName: string): { valid: boolean; trimmed: string; error?: string } {
  const trimmed = rawName.trim();
  if (!trimmed) {
    return { valid: false, trimmed, error: 'Xin hãy để lại tên hoặc biệt hiệu trước khi khai trà.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, trimmed, error: 'Biệt hiệu cần ít nhất 2 ký tự.' };
  }
  if (trimmed.length > 32) {
    return { valid: false, trimmed, error: 'Biệt hiệu nên gọn nhẹ trong 32 ký tự.' };
  }
  return { valid: true, trimmed };
}

export function validateNewRoomInput(input: {
  name: string;
  topic: string;
  subtitle?: string;
}): { valid: boolean; error?: string } {
  const name = input.name.trim();
  const topic = input.topic.trim();
  if (!name) {
    return { valid: false, error: 'Xin đặt một tên gọi cho trà thất.' };
  }
  if (name.length < 3) {
    return { valid: false, error: 'Tên trà thất cần tối thiểu 3 ký tự.' };
  }
  if (!topic) {
    return { valid: false, error: 'Xin chọn hoặc nhập chủ đề đàm đạo.' };
  }
  return { valid: true };
}

export function createTeaRoom(input: {
  name: string;
  topic: string;
  subtitle?: string;
  backdrop: RoomBackdropId;
}): TeaRoom {
  const cleanName = input.name.trim();
  const cleanTopic = input.topic.trim();
  const cleanSubtitle =
    input.subtitle?.trim() || `Chậm rãi đàm đạo về ${cleanTopic.toLowerCase()}`;
  const slug = cleanName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    id: `${slug || 'tra-that'}-${Date.now().toString(36)}`,
    name: cleanName,
    subtitle: cleanSubtitle,
    topic: cleanTopic,
    backdrop: input.backdrop,
    maxSeats: MAX_SEATS_PER_ROOM,
    participantsCount: 4,
    initialPrompt: {
      title: cleanTopic,
      question: `Trong chủ đề "${cleanTopic}", có suy tư hay câu chuyện nào bạn muốn đặt xuống bàn trà hôm nay?`,
      hint: 'Mỗi chia sẻ đều được lắng nghe trọn vẹn.',
    },
    openingMessage: {
      speakerName: 'Thầy Tuệ Minh',
      role: 'Trà Chủ',
      content: `Chào mừng bạn đến với ${cleanName}. Ấm trà đã tráng nóng, mời bạn thong thả mở lời đầu tiên cho chủ đề "${cleanTopic}" hôm nay.`,
    },
  };
}

export function buildTableSeats(userName: string, userTea: TeaId): (SeatParticipant | null)[] {
  const userSeat: SeatParticipant = {
    id: 'user-self',
    name: userName.trim() || 'Tri kỷ',
    role: 'Bạn',
    isUser: true,
    teaId: userTea,
    personaNote: getTeaById(userTea).mood,
  };

  const companions: SeatParticipant[] = DEFAULT_AI_COMPANIONS.map((c) => ({
    ...c,
    isUser: false,
  }));

  // 5-seat round tea table: Thầy Tuệ Minh + Sư Giác Không + KTS. Lâm An + Bạn + Nhã Vy
  const seats: (SeatParticipant | null)[] = [
    companions[0], // Top: Thầy Tuệ Minh (Trà Chủ)
    companions[1], // Right: Sư Giác Không
    companions[2], // Bottom-Right: KTS. Lâm An
    userSeat,      // Bottom-Left: Bạn
    companions[3], // Left: Nhã Vy
  ];

  return seats.slice(0, MAX_SEATS_PER_ROOM);
}

export function canJoinRoom(room: TeaRoom): boolean {
  return room.participantsCount < room.maxSeats;
}

export function normalizeTeaAction(rawAction: string | undefined): TeaAction {
  if (rawAction === 'pour_tea' || rawAction === 'raise_cup') {
    return rawAction;
  }
  return 'none';
}

export function getSpeakerIdByName(speakerName: string): string {
  const normalized = speakerName.trim().toLowerCase();
  if (normalized.includes('giác không')) return 'ai-giac-khong';
  if (normalized.includes('lâm an')) return 'ai-lam-an';
  if (normalized.includes('nhã vy')) return 'ai-nha-vy';
  return 'ai-tue-minh';
}

export function normalizeAiReplies(rawReplies: AiReplyPayload[] | undefined): ChatMessage[] {
  if (!Array.isArray(rawReplies)) return [];
  const now = formatCurrentTimeLabel();
  return rawReplies
    .filter((item) => item && typeof item.message === 'string' && item.message.trim().length > 0)
    .slice(0, 2)
    .map((item, idx) => {
      const speakerId = getSpeakerIdByName(item.speaker_name || '');
      const companion = DEFAULT_AI_COMPANIONS.find((c) => c.id === speakerId) ?? DEFAULT_AI_COMPANIONS[0];

      return {
        id: `ai-${Date.now()}-${idx}`,
        speakerId: companion.id,
        speakerName: companion.name,
        role: companion.role,
        content: item.message.trim(),
        timestamp: now,
        action: normalizeTeaAction(item.action),
        raisedCount: 0,
        pouredCount: 0,
      };
    });
}

export function normalizeMemoirPayload(
  raw: Partial<MemoirData> | undefined,
  fallbackAuthor: string
): MemoirData {
  const best_quote =
    raw?.best_quote?.trim() ||
    'Có những buổi chiều không cần nói nhiều, chỉ nghe tiếng nước sôi và nhìn khói trà tan vào tĩnh lặng.';
  const author = raw?.author?.trim() || fallbackAuthor || 'Tri kỷ';
  const tea_master_note =
    raw?.tea_master_note?.trim() ||
    'Một chén trà ấm, vài lời chân thành — đủ làm dịu một quãng đường dài.';

  return { best_quote, author, tea_master_note };
}

export function formatCurrentTimeLabel(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatVietnameseDate(date = new Date()): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `Ngày ${day} tháng ${month}, ${year}`;
}

export const HOURGLASS_PRESET_MINUTES = [15, 20] as const;
export type HourglassPresetMinutes = (typeof HOURGLASS_PRESET_MINUTES)[number];
export const DEFAULT_HOURGLASS_MINUTES: HourglassPresetMinutes = 15;

export function formatHourglassTime(remainingSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(remainingSeconds) ? remainingSeconds : 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function computeHourglassProgress(
  remainingSeconds: number,
  totalSeconds: number
): { remainingRatio: number; elapsedRatio: number } {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return { remainingRatio: 0, elapsedRatio: 1 };
  }
  const safeRemaining = Math.max(0, Math.min(totalSeconds, remainingSeconds));
  const remainingRatio = safeRemaining / totalSeconds;
  const elapsedRatio = 1 - remainingRatio;
  return { remainingRatio, elapsedRatio };
}

export function stepHourglassTick(remainingSeconds: number): {
  nextRemaining: number;
  justFinished: boolean;
} {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
    return { nextRemaining: 0, justFinished: false };
  }
  const next = Math.max(0, Math.floor(remainingSeconds) - 1);
  return {
    nextRemaining: next,
    justFinished: next === 0,
  };
}

export function recommendTeaByEmotion(emotionId: EmotionId): {
  emotion: EmotionNode;
  tea: TeaOption;
  reason: string;
} {
  const emotion =
    EMOTION_WHEEL_NODES.find((node) => node.id === emotionId) ?? EMOTION_WHEEL_NODES[0];
  const tea = getTeaById(emotion.teaId);
  return {
    emotion,
    tea,
    reason: emotion.recommendationNote,
  };
}

export function getEmotionsForTea(teaId: TeaId): EmotionNode[] {
  return EMOTION_WHEEL_NODES.filter((node) => node.teaId === teaId);
}


