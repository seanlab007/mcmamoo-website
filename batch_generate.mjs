/**
 * 批量生成 LA CELLE PARIS 1802 推广文案
 * 直接调用 DeepSeek 官方 API
 */
import { createConnection } from 'mysql2/promise';

const DB_URL = process.env.DATABASE_URL;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || 'sk-981846fa644848c8a41aeff541c4184b';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callDeepSeek(systemPrompt, userPrompt) {
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1800,
      temperature: 0.85,
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

const BRAND_SYSTEM = `你是法国奈尊香水世家 LA CELLE PARIS 1802 的首席品牌营销官。
品牌背景：
- 创立于1802年，是法国最古老的奈尊香水世家之一
- 曾获拿破仑皇帝御用认可，为皇室贵族定制香水
- 香水原料来自法国格拉斯（Grasse）的顶级花田
- 品牌理念：将法式奈尊美学与现代生活方式融合
- 官方网站：la-celle1802.com
你的任务是创作高转化率、有情感共鸣的社交媒体营销文案。`;

const tasks = [
  {
    platform: '小红书',
    contentType: '图文笔记',
    style: '情绪共鸣',
    keywords: ['法式奈尊', '皇室香水', '1802', '历史传承'],
    userPrompt: `请为「LA CELLE PARIS 1802」创作一篇高爆款小红书图文笔记。

【要求】
- 风格：情绪共鸣，让读者感受到香水背后的故事和情感
- 字数：正文400-500字
- 结构：
  ① 爆款标题（3个备选，含emoji，突出"皇室"/"1802"/"法式"等关键词）
  ② 开篇情绪钩子（50字内，制造共鸣）
  ③ 品牌故事段落（150字，拿破仑皇室认可、1802年历史）
  ④ 香水体验描述（150字，前中后调、使用场景）
  ⑤ 购买引导（含 la-celle1802.com，30字内）
  ⑥ 话题标签（15个，#法式香水 #奈尊 #小众香 等）
- 语气：真实种草，不过度营销`
  },
  {
    platform: '小红书',
    contentType: '种草长文',
    style: '场景化描写',
    keywords: ['巴黎香水', '奈尊气质', '香水测评', '法式生活'],
    userPrompt: `请为「LA CELLE PARIS 1802」创作一篇小红书种草长文。

【要求】
- 风格：场景化描写，代入感强
- 字数：正文450-550字
- 结构：
  ① 标题（3个备选，以"测评"/"发现"/"安利"开头）
  ② 场景开篇（100字，描述一个使用香水的具体生活场景）
  ③ 香水详细测评（200字，包含：外观包装、前调/中调/后调、持香时间、适合场合）
  ④ 与其他大牌对比（100字，突出LA CELLE的独特性）
  ⑤ 购买建议（含 la-celle1802.com 官网链接）
  ⑥ 话题标签（15个）`
  },
  {
    platform: 'Instagram',
    contentType: 'Caption',
    style: 'Luxury Storytelling',
    keywords: ['French perfume', 'heritage', 'Napoleon', 'luxury', '1802'],
    userPrompt: `Create a premium Instagram Caption for LA CELLE PARIS 1802.

Requirements:
- Style: Luxury Storytelling — evoke emotion, history, and exclusivity
- Length: 200-250 words
- Structure:
  1. Opening hook (2-3 lines, poetic and compelling)
  2. Brand heritage story (100 words — Napoleon's court, 1802 founding, Grasse flowers)
  3. Sensory description (50 words — describe the fragrance experience)
  4. Call-to-action (include la-celle1802.com naturally)
  5. Hashtags (20 tags: #LaCelleParis1802 #FrenchPerfume #LuxuryFragrance #Napoleon #Grasse etc.)
- Tone: Elevated, romantic, aspirational`
  },
  {
    platform: 'Instagram',
    contentType: 'Story Script',
    style: 'Behind the Scenes',
    keywords: ['Grasse', 'artisan', 'fragrance crafting', '1802', 'Paris'],
    userPrompt: `Create a 7-slide Instagram Story Script for LA CELLE PARIS 1802.

Requirements:
- Style: Behind the Scenes — authentic, intimate, educational
- Format for each slide:
  Slide [N]:
  Visual: [describe the visual/video]
  Text: [exact text to display]
  CTA: [if applicable]

Story arc:
- Slide 1: Hook — mysterious opening about a 220-year-old secret
- Slide 2: History — Napoleon's court, 1802 founding
- Slide 3: Grasse flower fields — where ingredients come from
- Slide 4: Master perfumer at work
- Slide 5: The bottling process
- Slide 6: Final product reveal
- Slide 7: Swipe up / Link to la-celle1802.com`
  },
  {
    platform: 'X (Twitter)',
    contentType: 'Thread',
    style: 'Historical Facts',
    keywords: ['Napoleon', 'Josephine', 'Paris 1802', 'luxury perfume history'],
    userPrompt: `Create a 10-tweet Twitter/X Thread for LA CELLE PARIS 1802.

Requirements:
- Style: Historical Facts — educational, engaging, shareable
- Each tweet: max 280 characters
- Format: "1/" through "10/"
- Thread arc:
  1/: Hook — surprising fact about Napoleon and perfume
  2/: Napoleon's obsession with fragrance (used 60 bottles/month)
  3/: Josephine's rose garden and perfume culture
  4/: The founding of LA CELLE PARIS in 1802
  5/: The imperial court perfumery tradition
  6/: Grasse — the perfume capital of the world
  7/: The art of perfume making in the 19th century
  8/: How LA CELLE survived 220+ years
  9/: Modern luxury revival — same recipes, same excellence
  10/: CTA — Discover the legacy at la-celle1802.com`
  },
  {
    platform: '微信朋友圈',
    contentType: '种草文',
    style: '高端礼品推荐',
    keywords: ['法式香水', '高端礼品', '奈尊局', '送礼首选'],
    userPrompt: `请为「LA CELLE PARIS 1802」创作一篇微信朋友圈种草文。

【要求】
- 风格：高端礼品推荐，适合转发分享
- 字数：200-250字
- 结构：
  ① 开篇钩子（25字内，制造好奇心）
  ② 礼品场景（80字，描述送礼场景：生日/商务/节日）
  ③ 品牌背书（60字，1802年历史+拿破仑皇室认可）
  ④ 产品价值（50字，为什么值得送/值得拥有）
  ⑤ 结尾引导（含 la-celle1802.com，20字内）
- 语气：真诚推荐
- 配图建议：3张（香水瓶特写/礼盒包装/法式场景）`
  },
];

async function main() {
  if (!DB_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  console.log('🚀 开始批量生成 LA CELLE PARIS 1802 推广文案...\n');
  console.log(`📡 DeepSeek API: ${DEEPSEEK_URL}`);
  console.log(`🔑 Key: ${DEEPSEEK_KEY.slice(0, 8)}...${DEEPSEEK_KEY.slice(-4)}\n`);

  const conn = await createConnection(DB_URL);

  const [users] = await conn.execute('SELECT id FROM users LIMIT 1');
  const userId = users[0]?.id || 1;
  console.log(`👤 userId: ${userId}\n`);

  let successCount = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`[${i + 1}/${tasks.length}] 🔄 ${task.platform} - ${task.contentType}...`);

    try {
      const content = await callDeepSeek(BRAND_SYSTEM, task.userPrompt);

      if (!content || content.length < 100) {
        console.log(`  ❌ 内容太短 (${content?.length || 0} 字符)`);
        continue;
      }

      await conn.execute(
        `INSERT INTO content_copies (userId, brand, platform, contentType, style, keywords, content, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'published')`,
        [userId, 'LA CELLE PARIS 1802', task.platform, task.contentType, task.style, JSON.stringify(task.keywords), content]
      );

      console.log(`  ✅ 成功！(${content.length} 字符)`);
      console.log(`     预览: ${content.slice(0, 80).replace(/\n/g, ' ')}...`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`);
    }

    if (i < tasks.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ 完成！成功 ${successCount}/${tasks.length} 篇`);

  const [rows] = await conn.execute(
    'SELECT id, platform, contentType, status, LENGTH(content) as len FROM content_copies ORDER BY id DESC LIMIT 10'
  );
  console.log('\n📚 文案库（最近10篇）：');
  rows.forEach(r => console.log(`  [ID:${r.id}] ${r.platform} - ${r.contentType} (${r.len}字) [${r.status}]`));

  await conn.end();
  console.log('\n🎉 所有文案已保存，状态：已发布');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
