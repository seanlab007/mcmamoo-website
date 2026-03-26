import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";

// Sales Lead Router
export const salesRouter = router({
  // List all leads
  listLeads: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    
    // This would query from a sales_leads table
    // For now, return mock data
    return [
      {
        id: "1",
        name: "张伟",
        company: "科技创新有限公司",
        title: "市场总监",
        email: "zhangwei@tech-innovation.com",
        phone: "+86 138-0000-0001",
        linkedin: "linkedin.com/in/zhangwei",
        status: "qualified",
        source: "website",
        score: 85,
        notes: "对AI营销解决方案表现出浓厚兴趣，预算充足",
        lastContact: "2026-03-20",
        nextFollowUp: "2026-03-27",
        createdAt: "2026-03-15",
        aiInsights: ["高意向客户，建议优先跟进", "预算周期即将开始"],
        suggestedActions: ["发送案例研究", "安排产品演示"]
      },
      {
        id: "2",
        name: "李芳",
        company: "数字营销集团",
        title: "CEO",
        email: "lifang@digital-marketing.com",
        status: "proposal",
        source: "linkedin",
        score: 92,
        notes: "已发送提案，等待反馈",
        lastContact: "2026-03-22",
        nextFollowUp: "2026-03-26",
        createdAt: "2026-03-10",
        aiInsights: ["决策周期短，预计2周内成交", "对价格敏感度中等"],
        suggestedActions: ["跟进提案反馈", "准备合同模板"]
      }
    ];
  }),

  // Get lead by ID
  getLead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Return mock lead
      return {
        id: input.id,
        name: "张伟",
        company: "科技创新有限公司",
        title: "市场总监",
        email: "zhangwei@tech-innovation.com",
        status: "qualified",
        score: 85,
        aiInsights: ["高意向客户", "预算充足"]
      };
    }),

  // Create new lead
  createLead: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      company: z.string().min(1),
      title: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      linkedin: z.string().optional(),
      source: z.enum(["website", "linkedin", "referral", "cold_outreach", "event", "other"]),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      
      // TODO: Insert into database
      return { success: true, id: "new-lead-id" };
    }),

  // Update lead status
  updateLeadStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"])
    }))
    .mutation(async ({ input }) => {
      // TODO: Update in database
      return { success: true };
    }),

  // Delete lead
  deleteLead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Delete from database
      return { success: true };
    }),

  // Get sales pipeline stats
  getPipelineStats: protectedProcedure.query(async () => {
    return {
      total: 24,
      new: 8,
      contacted: 6,
      qualified: 4,
      proposal: 3,
      negotiation: 2,
      closedWon: 1,
      closedLost: 0,
      totalValue: 1500000,
      avgDealSize: 62500,
      conversionRate: 25
    };
  }),

  // AI: Generate outreach email
  generateEmail: protectedProcedure
    .input(z.object({
      leadId: z.string(),
      template: z.enum(["cold", "followup", "proposal", "linkedin"]),
      tone: z.enum(["professional", "friendly", "formal"]).optional(),
      customInstructions: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // This would call an AI service to generate personalized email
      const templates: Record<string, { subject: string; body: string }> = {
        cold: {
          subject: "{{company}}的AI营销转型机会",
          body: `您好{{name}}，

我注意到{{company}}在数字营销领域的出色表现。我是MaoAI的销售顾问，专门帮助像您这样的企业利用AI技术提升营销效果。

我们最近帮助一家类似规模的公司实现了：
• 营销转化率提升40%
• 客户获取成本降低35%
• 销售周期缩短50%

我想了解{{company}}目前的营销挑战，看看我们是否能提供帮助。您是否有15分钟时间进行简短交流？

期待您的回复。

此致，
MaoAI销售团队`
        },
        followup: {
          subject: "关于{{company}}的AI解决方案 - 下一步",
          body: `您好{{name}}，

希望您一切都好。我想跟进我们上周关于{{company}}AI营销转型的讨论。

基于我们的对话，我整理了一些针对性的建议：

{{ai_insights}}

如果您有任何问题或想进一步探讨，请随时联系我。

此致，
MaoAI销售团队`
        },
        proposal: {
          subject: "{{company}}专属AI解决方案提案",
          body: `您好{{name}}，

感谢您抽出时间了解MaoAI。根据我们之前的讨论，我为{{company}}准备了一份定制化的AI营销解决方案提案。

提案亮点：
• 定制AI销售助手
• 智能线索评分系统
• 自动化外联工具
• 实时销售洞察

请查收附件中的详细提案。我期待与您讨论如何帮助{{company}}实现销售增长。

此致，
MaoAI销售团队`
        },
        linkedin: {
          subject: "",
          body: `您好{{name}}，我是MaoAI的销售顾问。看到您在{{company}}担任{{title}}，想与您建立联系。我们专注于AI驱动的销售自动化，可能对您的工作有所帮助。期待交流！`
        }
      };

      return {
        success: true,
        content: templates[input.template]
      };
    }),

  // AI: Analyze lead score
  analyzeLead: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(async ({ input }) => {
      // This would use AI to analyze lead quality
      return {
        score: 85,
        factors: [
          { name: "职位匹配度", score: 90, weight: 0.3 },
          { name: "公司规模", score: 80, weight: 0.25 },
          { name: "互动历史", score: 85, weight: 0.25 },
          { name: "预算信号", score: 85, weight: 0.2 }
        ],
        insights: [
          "高意向客户，建议优先跟进",
          "预算周期即将开始",
          "对AI解决方案表现出浓厚兴趣"
        ],
        suggestedActions: [
          "发送案例研究",
          "安排产品演示",
          "提供ROI计算器"
        ],
        predictedConversion: 78
      };
    }),

  // AI: Get sales insights
  getInsights: protectedProcedure.query(async () => {
    return [
      {
        id: "1",
        type: "opportunity",
        title: "高价值线索识别",
        description: "检测到3个高意向客户，预计总价值¥150万，建议本周内优先跟进",
        confidence: 87
      },
      {
        id: "2",
        type: "risk",
        title: "流失风险预警",
        description: "客户\"数字营销集团\"已3天未回复，建议立即跟进",
        confidence: 72
      },
      {
        id: "3",
        type: "action",
        title: "最佳联系时间",
        description: "根据历史数据分析，工作日下午2-4点是联系客户的最佳时段",
        confidence: 91
      }
    ];
  }),

  // AI: Chat with sales assistant
  chatWithAssistant: protectedProcedure
    .input(z.object({
      message: z.string(),
      context: z.object({
        leadId: z.string().optional(),
        previousMessages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      // This would integrate with an AI chat service
      const responses: Record<string, string> = {
        "分析": "基于我的分析，这个线索的成交概率约为78%。建议优先跟进，因为他们已经表现出强烈的购买意向。",
        "邮件": "我可以为你生成一封针对性的跟进邮件。请告诉我你希望强调哪些价值点？",
        "预测": "根据当前管道数据，预计本月可成交3-4个客户，总价值约¥80万。",
        "最佳": "工作日下午2-4点是联系客户的最佳时段，回复率比平均高出35%。"
      };

      const response = Object.entries(responses).find(([key]) => input.message.includes(key));
      
      return {
        response: response ? response[1] : "我是MaoAI销售助手，可以帮你分析线索、生成邮件、预测成交概率等。有什么可以帮你的吗？"
      };
    })
});
