import { useEffect, useState } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { SoundscapeMixer } from './components/SoundscapeMixer';
import { TeaLobbyScreen } from './components/TeaLobbyScreen';
import { TeaMemoirModal } from './components/TeaMemoirModal';
import { TeaRitualScreen } from './components/TeaRitualScreen';
import { TeaTableScreen } from './components/TeaTableScreen';
import { INITIAL_TEA_ROOMS } from './data/teas';
import type {
  AiReplyPayload,
  AppScreen,
  ChatMessage,
  MemoirData,
  PromptCard,
  SoundMix,
  TeaId,
  TeaRoom,
} from './types/tea';
import { soundscapeEngine } from './utils/soundscape';
import { countActiveSoundGroups, createDefaultSoundMix, disableAllSoundGroups } from './utils/soundscapeMath';
import {
  formatCurrentTimeLabel,
  getSpeakerIdByName,
  getTeaById,
  normalizeAiReplies,
  normalizeMemoirPayload,
} from './utils/teaRules';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('ritual');
  const [userName, setUserName] = useState('');
  const [userTea, setUserTea] = useState<TeaId>('sen-tay-ho');
  const [hasProfile, setHasProfile] = useState(false);

  const [rooms, setRooms] = useState<TeaRoom[]>(INITIAL_TEA_ROOMS);
  const [activeRoom, setActiveRoom] = useState<TeaRoom | null>(null);
  const [promptCard, setPromptCard] = useState<PromptCard>(INITIAL_TEA_ROOMS[0].initialPrompt);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [activePulseIds, setActivePulseIds] = useState<Record<string, 'raise_cup' | 'pour_tea'>>({});

  const [memoirOpen, setMemoirOpen] = useState(false);
  const [isLoadingMemoir, setIsLoadingMemoir] = useState(false);
  const [memoirError, setMemoirError] = useState<string | null>(null);
  const [memoir, setMemoir] = useState<MemoirData | null>(null);

  const [soundMix, setSoundMix] = useState<SoundMix>(createDefaultSoundMix);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (screen !== 'table') {
      soundscapeEngine.stopAll();
      setSoundMix((prev) => (countActiveSoundGroups(prev) > 0 ? disableAllSoundGroups(prev) : prev));
    }
  }, [screen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setUserName('Minh An');
      setUserTea('sen-tay-ho');
      setHasProfile(true);
      setScreen('lobby');
    }
    return () => {
      soundscapeEngine.stopAll();
    };
  }, []);

  const triggerSeatPulse = (speakerId: string, kind: 'raise_cup' | 'pour_tea') => {
    setActivePulseIds((prev) => ({ ...prev, [speakerId]: kind }));
    setTimeout(() => {
      setActivePulseIds((prev) => {
        const next = { ...prev };
        delete next[speakerId];
        return next;
      });
    }, 1500);
  };

  const handleSoundMixChange = (next: SoundMix) => {
    setSoundMix(next);
    soundscapeEngine.applyMix(next);
  };

  const enterRoom = (room: TeaRoom) => {
    setActiveRoom(room);
    setPromptCard(room.initialPrompt);
    setTableError(null);
    setMessages([
      {
        id: `opening-${room.id}`,
        speakerId: getSpeakerIdByName(room.openingMessage.speakerName),
        speakerName: room.openingMessage.speakerName,
        role: room.openingMessage.role,
        content: room.openingMessage.content,
        timestamp: formatCurrentTimeLabel(),
        action: 'pour_tea',
        raisedCount: 0,
        pouredCount: 0,
      },
    ]);
    setScreen('table');
  };

  const handleCompleteRitual = (name: string, teaId: TeaId) => {
    setUserName(name);
    setUserTea(teaId);
    setHasProfile(true);
    setScreen('lobby');
  };

  const handleCreateRoom = (newRoom: TeaRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    enterRoom(newRoom);
  };

  const handleRefreshPrompt = async () => {
    if (!activeRoom || isLoadingPrompt) return;
    setIsLoadingPrompt(true);
    setTableError(null);
    try {
      const res = await fetch('/api/tea/prompt-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: activeRoom.name,
          topic: activeRoom.topic,
          userTea: getTeaById(userTea).name,
          previousQuestion: promptCard.question,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể rút thẻ đàm đạo mới.');
      }
      if (data.title && data.question) {
        setPromptCard({
          title: data.title,
          question: data.question,
          hint: data.hint || 'Hãy chia sẻ điều chạm tới lòng bạn.',
        });
      }
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Chưa thể rút thẻ mới.');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const requestAiReplies = async (params: {
    userMessage?: string;
    interactionType?: 'raise_cup' | 'pour_tea';
    currentMessages: ChatMessage[];
  }) => {
    if (!activeRoom) return;
    setIsAiThinking(true);
    setTableError(null);

    try {
      const res = await fetch('/api/tea/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: activeRoom.name,
          topic: activeRoom.topic,
          userName,
          userTea: getTeaById(userTea).name,
          promptQuestion: promptCard.question,
          messages: params.currentMessages,
          userMessage: params.userMessage,
          interactionType: params.interactionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trà thất đang tạm gián đoạn.');
      }

      const aiMessages = normalizeAiReplies(data.replies as AiReplyPayload[]);
      if (aiMessages.length > 0) {
        setMessages((prev) => [...prev, ...aiMessages]);
        aiMessages.forEach((m) => {
          if (m.action === 'raise_cup') {
            soundscapeEngine.playPorcelainChime();
            triggerSeatPulse(m.speakerId, 'raise_cup');
          } else if (m.action === 'pour_tea') {
            triggerSeatPulse(m.speakerId, 'pour_tea');
          }
        });
      }
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Không thể kết nối tới bàn trà.');
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      speakerId: 'user-self',
      speakerName: userName,
      role: 'Bạn',
      content,
      timestamp: formatCurrentTimeLabel(),
      action: 'none',
      raisedCount: 0,
      pouredCount: 0,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    await requestAiReplies({ userMessage: content, currentMessages: updated });
  };

  const handleRaiseCupOnMessage = (messageId: string, speakerId: string) => {
    soundscapeEngine.playPorcelainChime();
    triggerSeatPulse('user-self', 'raise_cup');
    triggerSeatPulse(speakerId, 'raise_cup');
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              userRaised: !m.userRaised,
              raisedCount: m.userRaised ? Math.max(0, m.raisedCount - 1) : m.raisedCount + 1,
            }
          : m
      )
    );
  };

  const handlePourTeaOnMessage = (messageId: string, speakerId: string) => {
    soundscapeEngine.playTeaPour();
    triggerSeatPulse('user-self', 'pour_tea');
    triggerSeatPulse(speakerId, 'pour_tea');
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              userPoured: !m.userPoured,
              pouredCount: m.userPoured ? Math.max(0, m.pouredCount - 1) : m.pouredCount + 1,
            }
          : m
      )
    );
  };

  const handleTableGesture = async (gesture: 'raise_cup' | 'pour_tea') => {
    if (gesture === 'raise_cup') {
      soundscapeEngine.playPorcelainChime();
    } else {
      soundscapeEngine.playTeaPour();
    }
    triggerSeatPulse('user-self', gesture);

    const gestureMsg: ChatMessage = {
      id: `gesture-${Date.now()}`,
      speakerId: 'user-self',
      speakerName: userName,
      role: 'Bạn',
      content:
        gesture === 'raise_cup'
          ? 'Khẽ nâng chén trà kính mời mọi người đồng cảm.'
          : 'Nhẹ tay châm thêm nước ấm cho ấm trà giữa bàn.',
      timestamp: formatCurrentTimeLabel(),
      action: gesture,
      raisedCount: 0,
      pouredCount: 0,
    };

    const updated = [...messages, gestureMsg];
    setMessages(updated);
    await requestAiReplies({ interactionType: gesture, currentMessages: updated });
  };

  const fetchMemoir = async () => {
    if (!activeRoom) return;
    setMemoirOpen(true);
    setIsLoadingMemoir(true);
    setMemoirError(null);

    try {
      const res = await fetch('/api/tea/memoir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: activeRoom.name,
          topic: activeRoom.topic,
          userName,
          userTea: getTeaById(userTea).name,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chưa thể chắt lọc Trà Ký lúc này.');
      }
      setMemoir(normalizeMemoirPayload(data, userName));
    } catch (err) {
      setMemoirError(err instanceof Error ? err.message : 'Lỗi kết nối khi lưu Trà Ký.');
    } finally {
      setIsLoadingMemoir(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1B1917] dark:text-[#EDE5D5] transition-colors duration-500">
      <HeaderBar
        currentScreen={screen}
        hasUserProfile={hasProfile}
        hasActiveRoom={Boolean(activeRoom)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onNavigate={(target) => {
          if (target === 'lobby' && !hasProfile) return;
          if (target === 'table' && !activeRoom) return;
          setScreen(target);
        }}
      />

      {screen === 'ritual' && (
        <TeaRitualScreen
          initialName={userName}
          initialTea={userTea}
          onCompleteRitual={handleCompleteRitual}
        />
      )}

      {screen === 'lobby' && (
        <TeaLobbyScreen
          userName={userName}
          userTea={userTea}
          rooms={rooms}
          onJoinRoom={enterRoom}
          onCreateRoom={handleCreateRoom}
        />
      )}

      {screen === 'table' && activeRoom && (
        <TeaTableScreen
          room={activeRoom}
          userName={userName}
          userTea={userTea}
          promptCard={promptCard}
          isLoadingPrompt={isLoadingPrompt}
          messages={messages}
          isAiThinking={isAiThinking}
          errorMessage={tableError}
          activePulseIds={activePulseIds}
          onRefreshPrompt={handleRefreshPrompt}
          onSendMessage={handleSendMessage}
          onRaiseCupOnMessage={handleRaiseCupOnMessage}
          onPourTeaOnMessage={handlePourTeaOnMessage}
          onTableGesture={handleTableGesture}
          onLeaveRoom={() => setScreen('lobby')}
          onEndSessionMemoir={fetchMemoir}
        />
      )}

      {screen === 'table' && <SoundscapeMixer mix={soundMix} onChangeMix={handleSoundMixChange} />}

      <TeaMemoirModal
        open={memoirOpen}
        isLoading={isLoadingMemoir}
        error={memoirError}
        memoir={memoir}
        teaName={getTeaById(userTea).name}
        roomName={activeRoom?.name ?? 'Trà Đàm'}
        onRetry={fetchMemoir}
        onUpdateMemoir={(next) => {
          setMemoirError(null);
          setMemoir(next);
        }}
        onClose={() => setMemoirOpen(false)}
        onReturnToLobby={() => {
          setMemoirOpen(false);
          setScreen('lobby');
        }}
      />
    </div>
  );
}
