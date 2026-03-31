import { MODEL_CONFIGS } from "./server/models";

async function testMaoAI() {
  console.log("🚀 开始测试 MaoAI API 调用...");
  
  const modelKey = "gemini-2.5-flash";
  const config = MODEL_CONFIGS[modelKey];
  
  if (!config) {
    console.error("❌ 找不到模型配置:", modelKey);
    return;
  }
  
  console.log("📝 使用模型:", config.name, "Provider:", config.provider);
  
  const testApiKey = process.env.GEMINI_API_KEY || "dummy_key";
  const baseUrl = config.baseUrl;
  
  console.log("🔗 请求地址:", baseUrl);
  
  try {
    const payload = {
      model: config.model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, who are you?" }
      ],
      max_tokens: 100
    };
    
    console.log("📦 请求载荷:", JSON.stringify(payload, null, 2));
    
    if (process.env.GEMINI_API_KEY) {
      console.log("📡 正在尝试实际调用 Gemini API...");
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${testApiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ 调用成功! 回复:", (data as any).choices[0].message.content);
      } else {
        const err = await response.text();
        console.log("❌ 调用失败 (预期内，如果 Key 不正确):", response.status, err);
      }
    } else {
      console.log("⚠️ 未检测到 GEMINI_API_KEY，跳过实际网络请求测试。");
    }
    
  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error);
  }
}

testMaoAI();
