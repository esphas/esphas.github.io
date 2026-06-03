import type { LiveFeedItem } from '../../src/bookmarks/adapters/types';
import type { HumbleBundleCategory } from '../../src/bookmarks/adapters/humblebundle-parse';
import { HUMBLE_BUNDLE_CATEGORY_LABELS } from '../../src/bookmarks/adapters/humblebundle';

type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

const SYSTEM_PROMPT =
  '你是书签页摘要助手。输出 1–2 句中文，说明资源对谁有用、类型与价值亮点。禁止复述标题、禁止套话（如「不容错过」「丰富多样」）、禁止 markdown、禁止列表。上限 80 字。';

const HB_CATEGORY_FOCUS: Record<HumbleBundleCategory, string> = {
  books: '书籍、漫画',
  games: '游戏',
  software: '软件、游戏开发资产与教程',
};

function readLlmConfig(): LlmConfig | null {
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (
    process.env.LLM_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    'https://api.openai.com/v1'
  ).replace(/\/$/, '');

  const model = process.env.LLM_MODEL ?? 'gpt-4o-mini';

  return { apiKey, baseUrl, model };
}

function formatItemLines(items: LiveFeedItem[]): string {
  return items
    .slice(0, 40)
    .map((item, index) => {
      const meta = item.shop ? ` · ${item.shop}` : '';
      return `${index + 1}. ${item.title}${meta}`;
    })
    .join('\n');
}

async function requestSummary(userPrompt: string): Promise<string | null> {
  const config = readLlmConfig();
  if (!config) {
    console.warn('[llm] skipped: LLM_API_KEY / OPENAI_API_KEY not set');
    return null;
  }

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      console.warn('[llm] request failed', res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (error) {
    console.warn('[llm] error', error);
    return null;
  }
}

export async function summarizeCreativeMarketItems(
  items: LiveFeedItem[],
): Promise<string | null> {
  if (items.length === 0) return null;

  const prompt = [
    `Creative Market 本期免费资源，共 ${items.length} 项：`,
    '',
    formatItemLines(items),
    '',
    '概括：这批资源主要是什么类型、适合什么用途、有哪些代表性方向。',
  ].join('\n');

  return requestSummary(prompt);
}

export async function summarizeHumbleBundleCategory(
  category: HumbleBundleCategory,
  items: LiveFeedItem[],
): Promise<string | null> {
  if (items.length === 0) return null;

  const label = HUMBLE_BUNDLE_CATEGORY_LABELS[category];
  const focus = HB_CATEGORY_FOCUS[category];

  const prompt = [
    `Humble Bundle 当前「${label}」类 bundle，共 ${items.length} 个（${focus}）：`,
    '',
    formatItemLines(items),
    '',
    `概括：这一分类当前值得关注的主题、出版社/品牌或玩法类型，点出 1–2 个方向即可。`,
  ].join('\n');

  return requestSummary(prompt);
}

export function fallbackCreativeMarketSummary(items: LiveFeedItem[]): string {
  const shops = [
    ...new Set(items.map((item) => item.shop?.split(' · ')[0]).filter(Boolean)),
  ];
  const typeHint =
    shops.length > 0 ? shops.slice(0, 3).join('、') : '字体与平面设计素材';
  return `本期 ${items.length} 项免费资源，以 ${typeHint} 为主。`;
}

export function fallbackHumbleBundleCategorySummary(
  category: HumbleBundleCategory,
  items: LiveFeedItem[],
): string {
  const label = HUMBLE_BUNDLE_CATEGORY_LABELS[category];
  const publishers = [
    ...new Set(items.map((item) => item.shop?.split(' · ')[1]).filter(Boolean)),
  ];
  const publisherHint =
    publishers.length > 0 ? `，含 ${publishers.slice(0, 2).join('、')} 等` : '';
  return `当前 ${items.length} 个${label} bundle 在售${publisherHint}。`;
}
