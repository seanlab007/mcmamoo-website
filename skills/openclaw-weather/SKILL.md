---
name: openclaw-weather
description: "查询任意城市的天气和预报（基于 wttr.in，无需 API Key）。当用户询问天气、温度、降雨时使用。"
metadata:
  maoai:
    emoji: "🌤️"
    toolName: "openclaw_weather"
    category: "specialized"
---

# 天气查询 Skill

通过 wttr.in 获取实时天气信息，无需 API Key。

## 触发条件

✅ 当用户询问：
- "今天天气怎么样"
- "[城市] 的温度"
- "明天会下雨吗"
- 旅行前的天气确认

## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string | ✅ | 城市名（英文/中文均可）或机场代码 |
| format | string | ❌ | current（默认）/ forecast / json |

## 使用示例

```
// 当前天气
openclaw_weather("Shanghai", "current")
→ Shanghai: ⛅ +18°C (feels like +16°C), ↙ 12km/h wind, 65% humidity

// 3天预报
openclaw_weather("Beijing", "forecast")

// JSON 格式（供程序处理）
openclaw_weather("Tokyo", "json")
```

## 注意事项
- 城市名支持中文，但英文更准确
- 使用机场代码如 PVG（上海浦东）效果更好
- 无速率限制担忧，可频繁调用
