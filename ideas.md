# Mc&Mamoo 官网设计方案

## 设计背景
对标麦肯锡、君智咨询、华与华、欧赛斯、特劳特咨询等顶级同行，
打造专业、权威、前沿的战略咨询公司官网。

---

<response>
<probability>0.07</probability>
<text>

## Idea A — 暗夜金融极简主义（Dark Financial Minimalism）

**Design Movement:** 极简主义 × 金融科技美学 × 日本负空间哲学

**Core Principles:**
1. 深黑底色 + 金色点缀，营造奢侈品级别的高端感
2. 大量留白，让内容呼吸，体现"洞察"的深度
3. 极细线条分割，拒绝色块堆砌
4. 文字即设计，排版即视觉

**Color Philosophy:**
- 主色：深夜黑 #0A0A0A（权威、深度）
- 辅色：猫眼金 #C9A84C（洞察、价值）
- 背景：深蓝黑 #0D1B2A（前沿、科技）
- 文字：纯白 #FFFFFF / 浅金 #E8D5A0

**Layout Paradigm:**
- 全屏英雄区：大字标题斜向排版，金色线条切割
- 左重右轻的不对称布局
- 数字案例用超大字体做视觉锚点
- 竖向滚动触发横向内容展开

**Signature Elements:**
1. 猫眼符号：细线圆圈 + 竖向菱形瞳孔（金色）
2. 斜向金色分割线，贯穿全站
3. 数字超大化处理（如"8个10亿级大单品"中的"8"放大至200px）

**Interaction Philosophy:**
- 滚动视差：文字层与背景层速度不同
- 悬停时金色线条从左向右展开
- 数字计数动画（从0到目标值）

**Animation:**
- 入场：文字从下向上淡入（stagger 0.1s）
- 滚动：section 进入视口时从透明度0.3渐变到1
- 金线：hover 时宽度从0扩展到100%（0.3s ease）

**Typography System:**
- 标题：Noto Serif SC Bold（中文）/ Playfair Display（英文）
- 正文：Noto Sans SC Regular
- 数字：GT Walsheim / Bebas Neue（超大数字）
- 层级：72px / 48px / 32px / 18px / 14px

</text>
</response>

<response>
<probability>0.06</probability>
<text>

## Idea B — 新中式商业美学（Neo-Chinese Business Aesthetic）

**Design Movement:** 新中式极简 × 水墨数字化 × 商业权威

**Core Principles:**
1. 东方美学与西方商业逻辑的融合
2. 水墨质感背景，数字内容前置
3. 汉字排版的视觉张力
4. 红金配色体现中国商业文化

**Color Philosophy:**
- 主色：宣纸白 #F5F0E8
- 辅色：朱砂红 #C0392B
- 金色：#C9A84C
- 墨色：#1A1A1A

**Layout Paradigm:**
- 卷轴式横向展开
- 汉字大字作为视觉背景层
- 双栏布局：左侧中文，右侧英文

**Signature Elements:**
1. 水墨晕染背景纹理
2. 印章式标志处理
3. 竹简式内容列表

**Interaction Philosophy:**
- 毛笔划过效果的下划线
- 印章盖章动画

**Animation:**
- 水墨扩散入场动画
- 文字书写效果

**Typography System:**
- 标题：方正大黑体 / 思源宋体
- 正文：思源黑体

</text>
</response>

<response>
<probability>0.08</probability>
<text>

## Idea C — 战略咨询精英主义（Strategic Elite Modernism）

**Design Movement:** 高端咨询公司美学 × 包豪斯网格 × 当代极简

**Core Principles:**
1. 白底黑字的麦肯锡式权威感，金色作为唯一点缀
2. 严格的网格系统，体现战略思维的精确性
3. 大量数据可视化，用数字说话
4. 克制的动效，体现专业稳重

**Color Philosophy:**
- 主色：纯白 #FFFFFF（清晰、专业）
- 文字：深黑 #0A0A0A（权威）
- 强调：猫眼金 #C9A84C（价值、卓越）
- 辅助：深蓝 #0D1B2A（深度、信任）
- 浅灰：#F5F5F5（区块分隔）

**Layout Paradigm:**
- 顶部固定导航（细线条，半透明）
- 英雄区：全屏深色背景 + 大字标题 + 金色线条
- 内容区：白底，12列网格，严格对齐
- 案例区：横向滑动卡片
- 数据区：超大数字 + 简短描述

**Signature Elements:**
1. 金色左边框竖线（贯穿内容卡片）
2. 超大数字作为视觉锚点
3. 极细分割线（0.5px）

**Interaction Philosophy:**
- 悬停时卡片微微上浮（translateY -4px）
- 导航项悬停时金色下划线从左展开
- 滚动时数字计数动画

**Animation:**
- 入场：opacity 0→1 + translateY 20px→0（0.6s ease-out）
- 数字：useInView 触发计数动画
- 卡片：hover transform scale(1.02) + shadow 加深

**Typography System:**
- 中文标题：Noto Serif SC Bold（权威、典雅）
- 英文标题：Cormorant Garamond Bold（高端、国际）
- 正文：Noto Sans SC Regular（清晰易读）
- 数字强调：Bebas Neue / DM Mono（力量感）
- 层级：64px / 40px / 28px / 18px / 14px

</text>
</response>

---

## 选择方案

**选择方案 A：暗夜金融极简主义**

理由：
- 深黑+金色是顶级咨询/金融公司的标准配色（麦肯锡深蓝、高盛黑金）
- 与猫眼咨询的品牌色（深蓝黑+猫眼金）完美契合
- 在中国咨询公司中具有强烈的差异化视觉识别
- 能够体现"洞察商业本质"的深度感和神秘感
