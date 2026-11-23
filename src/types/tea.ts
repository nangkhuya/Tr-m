export type TeaId = 'sen-tay-ho' | 'pho-nhi' | 'o-long' | 'bach-tra';

export type EmotionId =
  | 'binh-yen'
  | 'biet-on'
  | 'hoai-niem'
  | 'tram-tu'
  | 'minh-man'
  | 'tim-huong'
  | 'met-nhoai'
  | 'chenh-venh';

export interface EmotionNode {
  id: EmotionId;
  label: string;
  innerState: string;
  teaId: TeaId;
  recommendationNote: string;
}

export interface TeaOption {
  id: TeaId;
  name: string;
  mood: string;
  description: string;
  liquorColor: string;
  liquorHighlight: string;
  cupRimColor: string;
  aromaNote: string;
}

export type RoomBackdropId = 'veranda-rain' | 'quiet-study' | 'moonlit-bamboo';

export interface RoomBackdrop {
  id: RoomBackdropId;
  label: string;
  subtitle: string;
}

export type TeaAction = 'none' | 'pour_tea' | 'raise_cup';

export interface PromptCard {
  title: string;
  question: string;
  hint: string;
}

export interface SeatParticipant {
  id: string;
  name: string;
  role: 'Bạn' | 'Trà Chủ' | 'Trà Khách';
  isUser: boolean;
  teaId: TeaId;
  personaNote: string;
}

export interface ChatMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  role: 'Bạn' | 'Trà Chủ' | 'Trà Khách';
  content: string;
  timestamp: string;
  action: TeaAction;
  raisedCount: number;
  pouredCount: number;
  userRaised?: boolean;
  userPoured?: boolean;
}

export interface TeaRoom {
  id: string;
  name: string;
  subtitle: string;
  topic: string;
  backdrop: RoomBackdropId;
  maxSeats: number;
  participantsCount: number;
  initialPrompt: PromptCard;
  openingMessage: {
    speakerName: string;
    role: 'Trà Chủ' | 'Trà Khách';
    content: string;
  };
}

export interface AiReplyPayload {
  speaker_name: string;
  role: string;
  message: string;
  action: string;
}

export interface MemoirData {
  best_quote: string;
  author: string;
  tea_master_note: string;
}

export type PostcardTheme = 'ivory-paper' | 'moss-silk' | 'ink-moon';

export type SoundGroupKey = 'rainWind' | 'hearth' | 'birds';

export interface SoundChannelConfig {
  enabled: boolean;
  volume: number;
}

export interface SoundMix {
  rainWind: SoundChannelConfig;
  hearth: SoundChannelConfig;
  birds: SoundChannelConfig;
  naturalRandomness: boolean;
}

export type AppScreen = 'ritual' | 'lobby' | 'table';
