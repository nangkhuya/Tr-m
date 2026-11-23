import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTableSeats,
  canJoinRoom,
  computeHourglassProgress,
  createTeaRoom,
  DEFAULT_HOURGLASS_MINUTES,
  formatCurrentTimeLabel,
  formatHourglassTime,
  formatVietnameseDate,
  getEmotionsForTea,
  HOURGLASS_PRESET_MINUTES,
  normalizeAiReplies,
  normalizeMemoirPayload,
  normalizeTeaAction,
  recommendTeaByEmotion,
  stepHourglassTick,
  validateNewRoomInput,
  validateUserName,
} from './teaRules';
import { EMOTION_WHEEL_NODES, INITIAL_TEA_ROOMS, MAX_SEATS_PER_ROOM, TEA_OPTIONS } from '../data/teas';

test('validateUserName rejects empty and overly short names', () => {
  assert.equal(validateUserName('   ').valid, false);
  assert.equal(validateUserName('A').valid, false);
  assert.equal(validateUserName('Minh An').valid, true);
  assert.equal(validateUserName('  Minh An  ').trimmed, 'Minh An');
});

test('validateNewRoomInput validates required room name and topic', () => {
  assert.equal(validateNewRoomInput({ name: '', topic: 'Thiền' }).valid, false);
  assert.equal(validateNewRoomInput({ name: 'Hiên Mưa', topic: '' }).valid, false);
  assert.equal(validateNewRoomInput({ name: 'Hiên Mưa', topic: 'Tĩnh tâm' }).valid, true);
});

test('createTeaRoom respects max 5 seats and fills defaults', () => {
  const room = createTeaRoom({
    name: 'Góc Sương Mai',
    topic: 'Học cách buông',
    backdrop: 'veranda-rain',
  });
  assert.equal(room.maxSeats, MAX_SEATS_PER_ROOM);
  assert.equal(room.participantsCount, 4);
  assert.equal(canJoinRoom(room), true);
  assert.equal(room.openingMessage.speakerName, 'Thầy Tuệ Minh');
  assert.ok(room.initialPrompt.question.includes('Học cách buông'));
});

test('buildTableSeats creates 5 seats with user and 4 AI personas', () => {
  const seats = buildTableSeats('Linh', 'bach-tra');
  assert.equal(seats.length, 5);
  const occupied = seats.filter(Boolean);
  assert.equal(occupied.length, 5);
  const user = occupied.find((s) => s?.isUser);
  assert.equal(user?.name, 'Linh');
  assert.equal(user?.teaId, 'bach-tra');
  assert.ok(occupied.some((s) => s?.name === 'Thầy Tuệ Minh'));
  assert.ok(occupied.some((s) => s?.name === 'Sư Giác Không'));
  assert.ok(occupied.some((s) => s?.name === 'KTS. Lâm An'));
  assert.ok(occupied.some((s) => s?.name === 'Nhã Vy'));
});

test('canJoinRoom returns false when room reaches max 5 capacity', () => {
  const fullRoom = { ...INITIAL_TEA_ROOMS[0], participantsCount: 5, maxSeats: 5 };
  assert.equal(canJoinRoom(fullRoom), false);
});

test('normalizeAiReplies caps at 2 messages and normalizes persona IDs and actions', () => {
  assert.equal(normalizeTeaAction('pour_tea'), 'pour_tea');
  assert.equal(normalizeTeaAction('raise_cup'), 'raise_cup');
  assert.equal(normalizeTeaAction('unknown'), 'none');

  const replies = normalizeAiReplies([
    { speaker_name: 'Thầy Tuệ Minh', role: 'Trà Chủ', message: 'Mời bạn dùng trà.', action: 'pour_tea' },
    { speaker_name: 'KTS. Lâm An', role: 'Trà Khách', message: 'Khoảng trống giúp ta thở.', action: 'raise_cup' },
    { speaker_name: 'Nhã Vy', role: 'Trà Khách', message: 'Extra item.', action: 'none' },
  ]);
  assert.equal(replies.length, 2);
  assert.equal(replies[0].speakerId, 'ai-tue-minh');
  assert.equal(replies[0].role, 'Trà Chủ');
  assert.equal(replies[0].action, 'pour_tea');
  assert.equal(replies[1].speakerId, 'ai-lam-an');
  assert.equal(replies[1].speakerName, 'KTS. Lâm An');
});

test('normalizeMemoirPayload and date formatting produce valid outputs', () => {
  const memoir = normalizeMemoirPayload({}, 'Hải');
  assert.equal(memoir.author, 'Hải');
  assert.ok(memoir.best_quote.length > 0);
  assert.ok(memoir.tea_master_note.length > 0);

  const sampleDate = new Date(2026, 10, 23, 9, 5);
  assert.equal(formatCurrentTimeLabel(sampleDate), '09:05');
  assert.equal(formatVietnameseDate(sampleDate), 'Ngày 23 tháng 11, 2026');
});

test('hourglass formatting, progress ratios, and tick completion work cleanly', () => {
  assert.deepEqual([...HOURGLASS_PRESET_MINUTES], [15, 20]);
  assert.equal(DEFAULT_HOURGLASS_MINUTES, 15);

  assert.equal(formatHourglassTime(900), '15:00');
  assert.equal(formatHourglassTime(1200), '20:00');
  assert.equal(formatHourglassTime(65), '01:05');
  assert.equal(formatHourglassTime(0), '00:00');
  assert.equal(formatHourglassTime(-12), '00:00');

  assert.deepEqual(computeHourglassProgress(900, 900), { remainingRatio: 1, elapsedRatio: 0 });
  assert.deepEqual(computeHourglassProgress(450, 900), { remainingRatio: 0.5, elapsedRatio: 0.5 });
  assert.deepEqual(computeHourglassProgress(0, 900), { remainingRatio: 0, elapsedRatio: 1 });
  assert.deepEqual(computeHourglassProgress(10, 0), { remainingRatio: 0, elapsedRatio: 1 });

  assert.deepEqual(stepHourglassTick(10), { nextRemaining: 9, justFinished: false });
  assert.deepEqual(stepHourglassTick(1), { nextRemaining: 0, justFinished: true });
  assert.deepEqual(stepHourglassTick(0), { nextRemaining: 0, justFinished: false });
});

test('emotional wheel covers all 4 teas and maps each emotion cleanly', () => {
  assert.equal(EMOTION_WHEEL_NODES.length, 8);
  TEA_OPTIONS.forEach((tea) => {
    const mapped = getEmotionsForTea(tea.id);
    assert.ok(mapped.length >= 2, `Tea ${tea.id} should have at least 2 emotional cues`);
  });

  const tired = recommendTeaByEmotion('met-nhoai');
  assert.equal(tired.tea.id, 'bach-tra');
  assert.equal(tired.emotion.label, 'Mệt nhoài');
  assert.ok(tired.reason.length > 10);

  const reflective = recommendTeaByEmotion('tram-tu');
  assert.equal(reflective.tea.id, 'pho-nhi');

  const clearMind = recommendTeaByEmotion('minh-man');
  assert.equal(clearMind.tea.id, 'o-long');

  const peaceful = recommendTeaByEmotion('binh-yen');
  assert.equal(peaceful.tea.id, 'sen-tay-ho');
});


