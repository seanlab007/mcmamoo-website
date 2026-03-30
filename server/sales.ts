import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { supabaseAdmin, getSalesLeads, getSalesLeadById, createSalesLead, updateSalesLead, deleteSalesLead, getOutreachTemplates, getOutreachActivities, createOutreachActivity, getPipelineStats, getAIInsights } from "../supabase/sales-client";

// Sales Lead Router - Using Supabase
export const salesRouter = router({
  // List all leads
  listLeads: protectedProcedure.query(async ({ ctx }) => {
    try {
      const leads = await getSalesLeads();
      return leads.map(lead => ({
        id: lead.id.toString(),
        name: lead.name,
        company: lead.company,
        title: lead.title || "",
        email: lead.email,
        phone: lead.phone || "",
        linkedin: lead.linkedin || "",
        status: lead.status,
        source: lead.source,
        score: lead.score,
        notes: lead.notes || "",
        lastContact: lead.last_contact,
        nextFollowUp: lead.next_follow_up,
        assignedTo: lead.assigned_to,
        aiInsights: lead.ai_insights || [],
        suggestedActions: lead.suggested_actions || [],
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      }));
    } catch (error) {
      console.error("Error fetching leads:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch leads" });
    }
  }),

  // Get lead by ID
  getLead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const lead = await getSalesLeadById(parseInt(input.id));
        return {
          id: lead.id.toString(),
          name: lead.name,
          company: lead.company,
          title: lead.title || "",
          email: lead.email,
          phone: lead.phone || "",
          linkedin: lead.linkedin || "",
          status: lead.status,
          source: lead.source,
          score: lead.score,
          notes: lead.notes || "",
          lastContact: lead.last_contact,
          nextFollowUp: lead.next_follow_up,
          aiInsights: lead.ai_insights || [],
          suggestedActions: lead.suggested_actions || [],
        };
      } catch (error) {
        console.error("Error fetching lead:", error);
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }
    }),

  // Create new lead
  createLead: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      company: z.string().min(1),
      title: z.string().optional(),
      email: z.string().email(),
      phone: z.string().optional(),
      linkedin: z.string().optional(),
      website: z.string().optional(),
      source: z.enum(["website", "linkedin", "referral", "cold_outreach", "event", "other"]),
      notes: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const lead = await createSalesLead({
          name: input.name,
          company: input.company,
          title: input.title || null,
          email: input.email,
          phone: input.phone || null,
          linkedin: input.linkedin || null,
          website: input.website || null,
          source: input.source,
          notes: input.notes || null,
          status: "new",
          score: 0,
          assigned_to: null,
          ai_insights: [],
          suggested_actions: [],
          last_contact: null,
          next_follow_up: null,
        });
        return { success: true, id: lead.id.toString() };
      } catch (error) {
        console.error("Error creating lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create lead" });
      }
    }),

  // Update lead status
  updateLeadStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"])
    }))
    .mutation(async ({ input }) => {
      try {
        await updateSalesLead(parseInt(input.id), { status: input.status });
        return { success: true };
      } catch (error) {
        console.error("Error updating lead status:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update lead status" });
      }
    }),

  // Update lead
  updateLead: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(1).optional(),
        company: z.string().min(1).optional(),
        title: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
        status: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).optional(),
        score: z.number().optional(),
        notes: z.string().optional(),
      })
    }))
    .mutation(async ({ input }) => {
      try {
        await updateSalesLead(parseInt(input.id), input.data);
        return { success: true };
      } catch (error) {
        console.error("Error updating lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update lead" });
      }
    }),

  // Delete lead
  deleteLead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteSalesLead(parseInt(input.id));
        return { success: true };
      } catch (error) {
        console.error("Error deleting lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete lead" });
      }
    }),

  // Get sales pipeline stats
  getPipelineStats: protectedProcedure.query(async () => {
    try {
      const stats = await getPipelineStats();
      return {
        ...stats,
        totalValue: stats.closedWon * 50000 + stats.negotiation * 30000 + stats.proposal * 20000,
        avgDealSize: stats.closedWon > 0 ? Math.round((stats.closedWon * 50000) / stats.closedWon) : 0,
        conversionRate: stats.total > 0 ? Math.round((stats.closedWon / stats.total) * 100) : 0,
      };
    } catch (error) {
      console.error("Error fetching pipeline stats:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch pipeline stats" });
    }
  }),

  // Get outreach templates
  getTemplates: protectedProcedure
    .input(z.object({ type: z.enum(["email", "linkedin"]).optional() }).optional())
    .query(async ({ input }) => {
      try {
        const templates = await getOutreachTemplates(input?.type);
        return templates.map(t => ({
          id: t.id.toString(),
          name: t.name,
          subject: t.subject || "",
          body: t.body,
          type: t.type,
          category: t.category || "",
          aiOptimized: t.ai_optimized,
        }));
      } catch (error) {
        console.error("Error fetching templates:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch templates" });
      }
    }),

  // Get outreach activities
  getActivities: protectedProcedure
    .input(z.object({ leadId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      try {
        const activities = await getOutreachActivities(input?.leadId ? parseInt(input.leadId) : undefined);
        return activities.map(a => ({
          id: a.id.toString(),
          leadId: a.lead_id.toString(),
          type: a.type,
          subject: a.subject || "",
          content: a.content || "",
          status: a.status,
          sentAt: a.sent_at,
          openedAt: a.opened_at,
          repliedAt: a.replied_at,
          createdAt: a.created_at,
        }));
      } catch (error) {
        console.error("Error fetching activities:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch activities" });
      }
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
      try {
        // Get lead data
        const lead = await getSalesLeadById(parseInt(input.leadId));
        
        // Get template from Supabase
        const templates = await getOutreachTemplates(input.template === "linkedin" ? "linkedin" : "email");
        const template = templates.find(t => {
          if (input.template === "cold") return t.category === "cold_outreach";
          if (input.template === "followup") return t.category === "follow_up";
          if (input.template === "proposal") return t.category === "proposal";
          if (input.template === "linkedin") return t.category === "networking";
          return false;
        }) || templates[0];

        if (!template) {
          throw new Error("Template not found");
        }

        // Replace placeholders
        let subject = template.subject || "";
        let body = template.body;

        const replacements: Record<string, string> = {
          "{{name}}": lead.name,
          "{{company}}": lead.company,
          "{{title}}": lead.title || "",
          "{{ai_insights}}": (lead.ai_insights || []).join("\n"),
        };

        Object.entries(replacements).forEach(([key, value]) => {
          subject = subject.replace(new RegExp(key, "g"), value);
          body = body.replace(new RegExp(key, "g"), value);
        });

        // Record activity
        await createOutreachActivity({
          lead_id: lead.id,
          type: input.template === "linkedin" ? "linkedin" : "email",
          subject: subject,
          content: body,
          status: "draft",
          sent_at: null,
          opened_at: null,
          replied_at: null,
          created_by: null,
        });

        return {
          success: true,
          content: { subject, body }
        };
      } catch (error) {
        console.error("Error generating email:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate email" });
      }
    }),

  // AI: Analyze lead score
  analyzeLead: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const lead = await getSalesLeadById(parseInt(input.leadId));
        
        // Simple scoring algorithm based on available data
        let score = 50;
        const factors = [];

        // Title score
        const titleScore = lead.title?.toLowerCase().includes("director") || 
                          lead.title?.toLowerCase().includes("vp") || 
                          lead.title?.toLowerCase().includes("ceo") ? 90 : 60;
        score += titleScore * 0.3;
        factors.push({ name: "职位匹配度", score: titleScore, weight: 0.3 });

        // Source score
        const sourceScore = lead.source === "referral" ? 95 : 
                           lead.source === "website" ? 80 : 60;
        score += sourceScore * 0.25;
        factors.push({ name: "来源质量", score: sourceScore, weight: 0.25 });

        // Contact info score
        const contactScore = lead.linkedin && lead.phone ? 90 : lead.linkedin || lead.phone ? 70 : 50;
        score += contactScore * 0.25;
        factors.push({ name: "联系信息完整度", score: contactScore, weight: 0.25 });

        // Notes score
        const notesScore = lead.notes && lead.notes.length > 20 ? 85 : 50;
        score += notesScore * 0.2;
        factors.push({ name: "互动深度", score: notesScore, weight: 0.2 });

        const finalScore = Math.round(score);

        // Update lead score in database
        await updateSalesLead(lead.id, { 
          score: finalScore,
          ai_insights: [
            finalScore >= 80 ? "高意向客户，建议优先跟进" : "中等意向，需要培养",
            lead.source === "referral" ? "推荐来源，信任度高" : null,
          ].filter(Boolean) as string[],
          suggested_actions: [
            finalScore >= 80 ? "安排产品演示" : "发送案例研究",
            "发送个性化邮件",
            lead.linkedin ? "LinkedIn互动" : null,
          ].filter(Boolean) as string[],
        });

        return {
          score: finalScore,
          factors,
          insights: [
            finalScore >= 80 ? "高意向客户，建议优先跟进" : "中等意向客户，需要持续培养",
            lead.source === "referral" ? "推荐来源，信任度较高" : null,
          ].filter(Boolean),
          suggestedActions: [
            finalScore >= 80 ? "安排产品演示" : "发送案例研究",
            "发送个性化邮件",
          ],
          predictedConversion: Math.min(finalScore + 10, 95),
        };
      } catch (error) {
        console.error("Error analyzing lead:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to analyze lead" });
      }
    }),

  // AI: Get sales insights
  getInsights: protectedProcedure.query(async () => {
    try {
      const insights = await getAIInsights();
      return insights;
    } catch (error) {
      console.error("Error fetching insights:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch insights" });
    }
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
      try {
        const message = input.message.toLowerCase();
        
        // Get lead context if provided
        let leadContext = "";
        if (input.context?.leadId) {
          try {
            const lead = await getSalesLeadById(parseInt(input.context.leadId));
            leadContext = `客户: ${lead.name}, 公司: ${lead.company}, 状态: ${lead.status}, 评分: ${lead.score}`;
          } catch (e) {
            // Lead not found, continue without context
          }
        }

        // Simple keyword-based responses
        if (message.includes("分析") || message.includes("评分")) {
          return {
            response: leadContext 
              ? `基于${leadContext}，这是一个高价值线索，建议优先跟进。`
              : "请提供一个线索ID，我可以帮你分析该线索的成交概率和关键特征。"
          };
        }
        
        if (message.includes("邮件") || message.includes("生成")) {
          return {
            response: "我可以为你生成个性化的外联邮件。请告诉我：\n1. 目标客户的线索ID\n2. 邮件类型（初次接触/跟进/提案）\n3. 希望强调的价值点"
          };
        }
        
        if (message.includes("预测") || message.includes("成交")) {
          const stats = await getPipelineStats();
          return {
            response: `根据当前销售管道数据：\n• 总线索: ${stats.total}\n• 提案中: ${stats.proposal}\n• 谈判中: ${stats.negotiation}\n• 已成交: ${stats.closedWon}\n\n预计本月可成交 ${stats.negotiation + Math.ceil(stats.proposal * 0.3)} 个客户。`
          };
        }
        
        if (message.includes("最佳") || message.includes("时间")) {
          return {
            response: "根据历史数据分析：\n• 最佳联系时间：工作日下午 2-4 点\n• 回复率最高的日子：周二、周三\n• 避免时间：周一上午、周五下午\n\n建议在这些时段安排重要的客户沟通。"
          };
        }

        return {
          response: "我是MaoAI销售助手，可以帮你：\n• 分析线索质量和成交概率\n• 生成个性化外联邮件\n• 预测销售业绩\n• 提供联系时间建议\n\n请告诉我你需要什么帮助？"
        };
      } catch (error) {
        console.error("Error in chat:", error);
        return {
          response: "抱歉，处理请求时出错，请稍后再试。"
        };
      }
    })
});
