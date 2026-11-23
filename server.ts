import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const errObj = err as { status?: number; message?: string };
  const raw = `${errObj?.status ?? ''} ${errObj?.message ?? String(err)}`;
  console.error('[Trà Đàm Gemini Error]', raw);

  if (raw.includes('MISSING_GEMINI_API_KEY') || raw.includes('API key should be set')) {
    return {
      status: 503,
      message:
        'Chưa tìm thấy khóa kết nối AI (GEMINI_API_KEY). Vui lòng kiểm tra cấu hình Secrets để Trà Chủ có thể đàm đạo.',
    };
  }
  if (
    errObj?.status === 403 ||
    errObj?.status === 401 ||
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('API_KEY_INVALID') ||
    raw.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
  ) {
    return {
      status: 403,
      message:
        'Khóa GEMINI_API_KEY chưa được cấu hình hoặc thiếu quyền truy cập. Vui lòng kiểm tra trong Settings > Secrets.',
    };
  }
  if (errObj?.status === 429 || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Trà thất đang đón quá nhiều lượt đàm đạo cùng lúc. Xin chậm lại một nhịp rồi thử lại.',
    };
  }
  if (errObj?.status === 404 || raw.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: 'Mô hình AI được yêu cầu chưa khả dụng. Xin vui lòng thử lại sau.',
    };
  }
  if (err instanceof SyntaxError) {
    return {
      status: 502,
      message: 'Phản hồi từ Trà Chủ chưa đúng định dạng. Xin thử lại một nhịp.',
    };
  }
  return {
    status: 500,
    message: `Kết nối với Trà Chủ tạm gián đoạn (${errObj?.status ?? 'err'}). Xin hãy thử lại sau giây lát.`,
  };
}

function parseModelJson<T>(rawText: string | undefined, fallback: T): T {
  const cleaned = (rawText ?? '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  if (!cleaned) return fallback;
  return JSON.parse(cleaned) as T;
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (attempt < maxAttempts && (status === 503 || status === 500 || status === 429)) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/tea/prompt-card', async (req, res) => {
  try {
    const { roomName, topic, userTea, previousQuestion } = req.body ?? {};
    if (!roomName || !topic) {
      res.status(400).json({ error: 'Thiếu thông tin phòng trà hoặc chủ đề.' });
      return;
    }

    const ai = getAiClient();
    const prompt = [
      `Phòng trà: "${roomName}"`,
      `Chủ đề đàm đạo: "${topic}"`,
      userTea ? `Loại trà khách đang thưởng thức: "${userTea}"` : '',
      previousQuestion ? `Tránh lặp lại câu hỏi trước đó: "${previousQuestion}"` : '',
      'Hãy tạo một Thẻ Đàm Đạo mới sâu sắc, giàu chất thơ, gợi mở chiêm nghiệm nội tâm cho cả bàn trà.',
    ]
      .filter(Boolean)
      .join('\n');

    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'Bạn là Thầy Tuệ Minh — Trà Chủ của không gian Trà Đàm mang mỹ học Thiền và Wabi-sabi. ' +
          'Phong cách điềm tĩnh, không phán xét, biết lắng nghe và đặt câu hỏi mở sâu sắc. ' +
          'Hãy viết bằng tiếng Việt tinh tế, chậm rãi, tự nhiên, không sáo rỗng, không lên lớp. ' +
          'Tạo một thẻ đàm đạo gồm tiêu đề ngắn (3-7 chữ), một câu hỏi mở gợi suy tư sâu (1-2 câu), và một lời gợi ý tĩnh lặng ngắn (tối đa 12 chữ).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Tiêu đề ngắn gọn, giàu chất thơ cho thẻ đàm đạo (3-7 từ).',
            },
            question: {
              type: Type.STRING,
              description: 'Câu hỏi mở sâu sắc gợi chiêm nghiệm (1-2 câu).',
            },
            hint: {
              type: Type.STRING,
              description: 'Lời dẫn ngắn nhẹ nhàng mời gọi chia sẻ.',
            },
          },
          required: ['title', 'question', 'hint'],
        },
      },
    })
    );

    const parsed = parseModelJson(response.text, {});
    res.json(parsed);
  } catch (error) {
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

app.post('/api/tea/respond', async (req, res) => {
  try {
    const {
      roomName,
      topic,
      userName,
      userTea,
      promptQuestion,
      messages,
      userMessage,
      interactionType,
    } = req.body ?? {};

    if (!roomName || !topic || !userName) {
      res.status(400).json({ error: 'Thiếu thông tin bàn trà.' });
      return;
    }

    const ai = getAiClient();
    const recentHistory = Array.isArray(messages)
      ? messages
          .slice(-12)
          .map((m: { speakerName?: string; role?: string; content?: string }) =>
            `${m.speakerName || 'Khách'} (${m.role || 'Trà khách'}): ${m.content || ''}`
          )
          .join('\n')
      : '';

    const actionContext =
      interactionType === 'raise_cup'
        ? `${userName} vừa khẽ nâng chén trà tỏ lòng đồng cảm với bầu không khí hiện tại.`
        : interactionType === 'pour_tea'
          ? `${userName} vừa nhẹ nhàng châm thêm trà ấm vào chén để khích lệ câu chuyện.`
          : `${userName} vừa chia sẻ: "${userMessage}"`;

    const contents = [
      `Không gian: ${roomName} (Chủ đề: ${topic})`,
      `Trà khách chính: ${userName} đang uống ${userTea || 'Trà Sen Tây Hồ'}`,
      promptQuestion ? `Thẻ Đàm Đạo trên bàn: "${promptQuestion}"` : '',
      recentHistory ? `Mạch đàm đạo gần đây:\n${recentHistory}` : 'Đây là mở đầu của cuộc trà.',
      `Diễn biến vừa xảy ra: ${actionContext}`,
      'Hãy điều phối tự nhiên 1 hoặc 2 lượt đáp lời (mỗi lượt đúng 2-4 câu) từ Thầy Tuệ Minh, Sư Giác Không, KTS. Lâm An hoặc Nhã Vy.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'Bạn là trí tuệ điều phối bàn trà trong ứng dụng Trà Đàm (Slow Social phong cách Thiền & Wabi-sabi).\n' +
          'Trên bàn có đúng 4 nhân vật AI cố định với hồ sơ tính cách riêng biệt:\n' +
          '1. "Thầy Tuệ Minh" (role: "Trà Chủ"): Điềm tĩnh, điều phối nhẹ nhàng, giữ nhịp lắng nghe, không phán xét, hay đặt câu hỏi mở sâu sắc.\n' +
          '2. "Sư Giác Không" (role: "Trà Khách", Thiền sư hiện đại): Nói ngắn gọn, trực diện, soi chiếu sự bám chấp, vô thường và khoảng lặng qua hình ảnh đời thường giản dị (chén nước nguội, chiếc lá, hơi thở, vệt nắng).\n' +
          '3. "KTS. Lâm An" (role: "Trà Khách", Kiến trúc sư tĩnh lặng): Nhạy cảm với không gian, khoảng trống, ánh sáng, nhịp điệu và giới hạn của đời sống.\n' +
          '4. "Nhã Vy" (role: "Trà Khách", Người làm sáng tạo): Giàu liên tưởng, tinh tế, chạm vào cảm xúc thật và những chi tiết nhỏ bé của trải nghiệm sống.\n\n' +
          'Quy tắc bắt buộc:\n' +
          '- Chọn 1 nhân vật phù hợp nhất (nếu người dùng vừa làm cử chỉ nâng chén/châm trà) hoặc 1–2 nhân vật đối đáp tự nhiên (nếu người dùng chia sẻ suy tư).\n' +
          '- Mỗi lượt phản hồi phải giữ đúng giọng điệu riêng biệt của nhân vật đó.\n' +
          '- Mỗi message dài từ 2 đến 4 câu, tự nhiên như đang ngồi quanh bàn trà. Tuyệt đối KHÔNG dùng gạch đầu dòng, KHÔNG liệt kê, KHÔNG giáo điều hay văn phong chatbot máy móc.\n' +
          '- Trường action chỉ nhận một trong ba giá trị: "none", "pour_tea", "raise_cup".',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker_name: {
                    type: Type.STRING,
                    description: 'Phải là một trong 4 tên chính xác: "Thầy Tuệ Minh", "Sư Giác Không", "KTS. Lâm An", hoặc "Nhã Vy".',
                  },
                  role: {
                    type: Type.STRING,
                    description: '"Trà Chủ" (nếu là Thầy Tuệ Minh) hoặc "Trà Khách".',
                  },
                  message: {
                    type: Type.STRING,
                    description: 'Lời đàm đạo 2-4 câu bằng tiếng Việt, đúng giọng điệu nhân vật.',
                  },
                  action: {
                    type: Type.STRING,
                    description: 'Một trong: "none", "pour_tea", "raise_cup".',
                  },
                },
                required: ['speaker_name', 'role', 'message', 'action'],
              },
            },
          },
          required: ['replies'],
        },
      },
    })
    );

    const parsed = parseModelJson(response.text, { replies: [] });
    res.json(parsed);
  } catch (error) {
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

app.post('/api/tea/memoir', async (req, res) => {
  try {
    const { roomName, topic, userName, userTea, messages } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Chưa có nội dung đàm đạo để lưu Trà Ký.' });
      return;
    }

    const ai = getAiClient();
    const transcript = messages
      .map((m: { speakerName?: string; content?: string }) => `${m.speakerName || 'Khách'}: ${m.content || ''}`)
      .join('\n');

    const response = await generateWithRetry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          `Buổi trà tại "${roomName}" (Chủ đề: ${topic}), trà khách ${userName} thưởng thức ${userTea}.`,
          `Toàn bộ cuộc đàm đạo:\n${transcript}`,
          'Hãy chọn câu nói đắt giá nhất (ưu tiên câu của người dùng nếu có chiều sâu, hoặc câu tạo sự đồng cảm sâu sắc nhất) và viết lời bình ngắn của Trà Chủ.',
        ].join('\n\n'),
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'Bạn là Thầy Tuệ Minh — Trà Chủ tổng kết buổi Trà Đàm để khắc lên tấm thiệp Trà Ký.\n' +
          'Hãy trích chọn nguyên văn (hoặc chắt lọc sát nghĩa nhất) câu nói sâu sắc nhất từ cuộc trò chuyện làm best_quote (dưới 35 từ để trình bày đẹp trên thiệp 4:5), ghi rõ tên người nói ở author, và viết tea_master_note (1-2 câu điềm tĩnh, lắng đọng của Thầy Tuệ Minh đúc kết tinh thần buổi trà).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            best_quote: {
              type: Type.STRING,
              description: 'Câu trích dẫn sâu sắc nhất trong buổi trà.',
            },
            author: {
              type: Type.STRING,
              description: 'Tên người đã nói câu đó.',
            },
            tea_master_note: {
              type: Type.STRING,
              description: 'Lời bình ngắn gọn 1-2 câu của Trà Chủ.',
            },
          },
          required: ['best_quote', 'author', 'tea_master_note'],
        },
      },
    })
    );

    const parsed = parseModelJson(response.text, {});
    res.json(parsed);
  } catch (error) {
    const mapped = mapGeminiError(error);
    res.status(mapped.status).json({ error: mapped.message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trà Đàm server listening on http://localhost:${PORT}`);
  });
}

startServer();
