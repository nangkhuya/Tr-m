import type { MemoirData, PostcardTheme } from '../types/tea';

interface ThemePalette {
  bg: string;
  innerBorder: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  sealBg: string;
  sealText: string;
}

const THEME_PALETTES: Record<PostcardTheme, ThemePalette> = {
  'ivory-paper': {
    bg: '#FDFBF7',
    innerBorder: 'rgba(140, 109, 83, 0.28)',
    textPrimary: '#2C2C2C',
    textMuted: '#6E6A63',
    accent: '#4A5D4E',
    sealBg: '#A63A3A',
    sealText: '#FDFBF7',
  },
  'moss-silk': {
    bg: '#38463B',
    innerBorder: 'rgba(244, 239, 230, 0.26)',
    textPrimary: '#F7F3EA',
    textMuted: '#D6D0C4',
    accent: '#D8C89B',
    sealBg: '#A63A3A',
    sealText: '#FDFBF7',
  },
  'ink-moon': {
    bg: '#1E1D1B',
    innerBorder: 'rgba(234, 228, 217, 0.22)',
    textPrimary: '#EAE4D9',
    textMuted: '#A8A298',
    accent: '#C9A882',
    sealBg: '#A63A3A',
    sealText: '#FDFBF7',
  },
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderMemoirPostcardToPng(params: {
  memoir: MemoirData;
  teaName: string;
  roomName: string;
  dateLabel: string;
  theme: PostcardTheme;
}): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  // 4:5 aspect ratio at 2x Retina resolution (800 x 1000 logical, 1600 x 2000 physical)
  const scale = 2;
  const width = 800;
  const height = 1000;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo khung vẽ Trà Ký.');
  }

  ctx.scale(scale, scale);
  const palette = THEME_PALETTES[params.theme];

  // Background fill
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle organic paper grain specks
  ctx.save();
  ctx.globalAlpha = params.theme === 'ivory-paper' ? 0.035 : 0.04;
  ctx.fillStyle = params.theme === 'ivory-paper' ? '#8C6D53' : '#FFFFFF';
  for (let i = 0; i < 650; i++) {
    const x = ((i * 197) % width) + ((i % 7) * 0.5);
    const y = ((i * 313) % height) + ((i % 5) * 0.5);
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.restore();

  // Outer & inner hairline frame
  ctx.strokeStyle = palette.innerBorder;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(36, 36, width - 72, height - 72);
  ctx.lineWidth = 0.7;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Minimalist tea branch illustration in top-right corner
  ctx.save();
  ctx.strokeStyle = palette.accent;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(690, 88);
  ctx.quadraticCurveTo(640, 128, 566, 146);
  ctx.stroke();

  // Delicate leaves
  const drawLeaf = (cx: number, cy: number, angle: number, len: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -len * 0.28, len, 0);
    ctx.quadraticCurveTo(len * 0.45, len * 0.28, 0, 0);
    ctx.stroke();
    ctx.restore();
  };
  drawLeaf(640, 122, -2.55, 42);
  drawLeaf(606, 134, 2.35, 36);
  drawLeaf(572, 145, -2.9, 34);
  ctx.restore();

  // Top metadata header
  ctx.fillStyle = palette.textMuted;
  ctx.font = '500 16px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`TRÀ KÝ  ·  ${params.roomName.toUpperCase()}`, 76, 102);

  ctx.font = '400 16px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`${params.teaName}  ·  ${params.dateLabel}`, 76, 130);

  // Thin divider
  ctx.strokeStyle = palette.innerBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(76, 162);
  ctx.lineTo(280, 162);
  ctx.stroke();

  // Quote mark & main quote
  ctx.fillStyle = palette.accent;
  ctx.font = 'italic 400 54px "Playfair Display", Georgia, serif';
  ctx.fillText('“', 72, 260);

  ctx.fillStyle = palette.textPrimary;
  ctx.font = 'italic 500 32px "Playfair Display", Georgia, serif';
  const quoteLines = wrapCanvasText(ctx, params.memoir.best_quote, width - 160);
  let y = 310;
  for (const line of quoteLines.slice(0, 7)) {
    ctx.fillText(line, 76, y);
    y += 48;
  }

  // Author line
  y += 18;
  ctx.fillStyle = palette.textMuted;
  ctx.font = '500 19px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`— ${params.memoir.author}`, 76, y);

  // Bottom section divider
  const bottomStart = 735;
  ctx.strokeStyle = palette.innerBorder;
  ctx.beginPath();
  ctx.moveTo(76, bottomStart);
  ctx.lineTo(width - 76, bottomStart);
  ctx.stroke();

  // Tea Master Note
  ctx.fillStyle = palette.textMuted;
  ctx.font = '600 14px "Be Vietnam Pro", sans-serif';
  ctx.fillText('LỜI TRÀ CHỦ', 76, bottomStart + 42);

  ctx.fillStyle = palette.textPrimary;
  ctx.font = '400 18px "Be Vietnam Pro", sans-serif';
  const noteLines = wrapCanvasText(ctx, params.memoir.tea_master_note, width - 250);
  let noteY = bottomStart + 74;
  for (const line of noteLines.slice(0, 4)) {
    ctx.fillText(line, 76, noteY);
    noteY += 28;
  }

  // Red square seal stamp "TRÀ ĐÀM"
  const sealSize = 78;
  const sealX = width - 76 - sealSize;
  const sealY = height - 88 - sealSize;

  ctx.save();
  ctx.fillStyle = palette.sealBg;
  ctx.fillRect(sealX, sealY, sealSize, sealSize);
  ctx.strokeStyle = palette.sealText;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(sealX + 5, sealY + 5, sealSize - 10, sealSize - 10);

  ctx.fillStyle = palette.sealText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 17px "Playfair Display", Georgia, serif';
  ctx.fillText('TRÀ', sealX + sealSize / 2, sealY + sealSize / 2 - 11);
  ctx.fillText('ĐÀM', sealX + sealSize / 2, sealY + sealSize / 2 + 12);
  ctx.restore();

  return canvas.toDataURL('image/png');
}
